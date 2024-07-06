const Channel = require("../models/channel");
const Profile = require("../models/profile");
const { onlineUsers, startStream } = require("../onlineUsers");
const ChannelService = require("../services/channelService");
const globals = require("../global");
const sendMail = require("../config/sendEmail");
const ProfileService = require("../services/profileService");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/errorHandler");


class ChannelController {

    static getAllChanels = asyncHandler(async (req, res) => {
        const channels = await ChannelService.getAllChannel();
        res.status(200).send(channels);
    })

    static createChannel = asyncHandler(async (req, res) => {
        const { name, description } = req.body;
        const channel = await ChannelService.createChannel(req.user.id, name, description);
        res.status(201).send(channel);
    })

    static updateChannel = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { name, description } = req.body;
        const channel = await ChannelService.fetchChannel(id)
        if (req.user.role == "host" || req.user.id == channel.adminId) {
            const updatedChannel = await ChannelService.updateChannel(id, name, description);
            res.send(updatedChannel)
        } else {
            throw new ApiError("Unauthorized")
        }
    })

    static followChannel = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const channel = await ChannelService.followChannel(req.user.id, id);
        res.send(channel);
    })

    static unfollowChannel = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const channel = await ChannelService.unfollowChannel(req.user.id, id);
        res.send(channel);
    })

    // Delete a channel
    static deleteChannel = asyncHandler(async (req, res) => {
        const { id } = req.params;
        await ChannelService.deleteChannel(id)
        res.send({ message: 'Channel deleted successfully' });
    })

    static startStream = asyncHandler(async (req, res) => {
        const channel = await ChannelService.fetchChannel(req.body.channelId);
        const user = await ProfileService.fetchProfile(req.body.userId)
        if (!channel) {
            throw new ApiError('Channel not found');
        }
        if (channel?.ownerId !== user.id) {
            throw new ApiError('Owner not matched');
        }
        if (user.role !== "host") {
            throw new ApiError('Only host can start a stream');
        }
        if (!channel.isSuspended) {
            const io = globals.getSocketIo(); // Get io from the global variable
            startStream(channel.id)
            // Notify online followers using WebSockets and Push Notifications
            channel.followers.forEach(async (followerId) => {
                const isOnline = onlineUsers.has(followerId) && onlineUsers.get(followerId).has(channel.id);
                const isOffline = !isOnline;
                // console.log(`Follower ID: ${followerId}, isOnline: ${isOnline}, isOffline: ${isOffline}`);
                if (isOnline) {
                    const follower = await Profile.findByPk(followerId);

                    io.to(channel.id).emit('newStream', {
                        message: `The channel ${channel.name} has started streaming.`,
                        channelId: channel.id,
                        channelName: channel.name,
                        channelDescription: channel.description,
                    });

                    // Send Push Notification
                    const subscription = follower.pushSubscription;
                    if (subscription) {
                        const payload = JSON.stringify({
                            title: `Stream started on ${channel.name}`,
                            body: `The channel ${channel.name} has started streaming. Join now!`
                            // ,
                            // icon: '/path/to/icon.png',
                            // url: `/channels/${channel.id}`
                        });
                        sendPushNotification(subscription, payload);
                    }

                } else if (isOffline) {
                    const follower = await Profile.findByPk(followerId);
                    const email = follower.email;
                    const subject = `Stream started on ${channel.name}`;
                    const text = `Hello ${follower.username},\n\nThe channel ${channel.name} has started streaming. Join now at /channels/${channel.id}\n\nBest regards,\nYour Team`;
                    await sendMail(email, subject, text);
                }
            });

            res.status(200).send('Stream started and followers notified')
        } else {
            throw new ApiError('This channel is suspended')
        }
    })


    static promoteUserToAdmin = asyncHandler(async (req, res) => {
        const { channelId, targetUserId } = req.body;
        const channel = await Channel.findByPk(channelId);
        const targetUser = await Profile.findByPk(targetUserId);

        if (!channel) {
            throw new ApiError('Channel not found');
        }
        if (!targetUser) {
            throw new ApiError('User not found');
        }

        if (channel.ownerId !== req.user.id) {
            return res.status(403).send('Only the host can promote a user to admin');
        }

        if (channel.adminId) {
            return res.status(400).send('There is already an admin for this channel');
        }

        channel.adminId = targetUserId;
        await channel.save();

        res.status(200).send(`User ${targetUser.username} promoted to admin`);
    })

    static demoteUserFromAdmin = asyncHandler(async (req, res) => {
        const { channelId, targetUserId } = req.body;
        const channel = await Channel.findByPk(channelId);
        const targetUser = await Profile.findByPk(targetUserId);

        if (!channel) {
            throw new ApiError('Channel not found');
        }
        if (!targetUser) {
            throw new ApiError('User not found');
        }

        if (channel.ownerId !== req.user.id) {
            return res.status(403).send('Only the host can demote a user from admin');
        }

        if (channel.adminId !== targetUserId) {
            return res.status(400).send('The target user is not an admin of this channel');
        }

        channel.adminId = null;
        await channel.save();

        res.status(200).send(`User ${targetUser.username} demoted from admin`);
    })

    static suspendChannel = asyncHandler(async (req, res) => {
        const { id } = req.params
        const channel = await ChannelService.fetchChannel(id)
        channel.isSuspended = true
        channel.save()
        return res.status(200).send("Channel suspended")
    })

    static unsuspendChannel = asyncHandler(async (req, res) => {
        const { id } = req.params
        const channel = await ChannelService.fetchChannel(id)
        channel.isSuspended = false
        channel.save()
        return res.status(200).send("Channel unsuspended")
    })

}
module.exports = ChannelController
