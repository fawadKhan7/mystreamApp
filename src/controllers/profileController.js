const ProfileService = require('../services/profileService');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ChannelService = require('../services/channelService');
const { ApiError } = require('../utils/errorHandler');
class ProfileController {
    static signup = asyncHandler(async (req, res) => {
        const profile = await ProfileService.signup(req.body);
        res.status(201).send(profile);
    })

    static login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        console.log(email, password)
        const { profile, token } = await ProfileService.login(email, password);
        res.send({ profile, token });
    })


    static fetchProfile = asyncHandler(async (req, res) => {
        const profile = await ProfileService.fetchProfile(req.params.id);
        res.send(profile);
    })

    static updateProfile = asyncHandler(async (req, res) => {
        const profile = await ProfileService.updateProfile(req.params.id, req.body);
        res.send(profile);
    })

    static googleAuth = asyncHandler(async (req, res) => {
        const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET);
        res.redirect(`/?token=${token}`);
    })

    static setup2FA = asyncHandler(async (req, res) => {
        const qrCodeUrl = await ProfileService.setup2FA(req.user.id);
        res.send({ qrCodeUrl });
    })

    static verify2FA = asyncHandler(async (req, res) => {
        await ProfileService.verify2FA(req.user.id, req.body.token);
        res.send({ message: '2FA verified' });
    }
    )
    static followProfile = asyncHandler(async (req, res) => {
        const profile = await ProfileService.followProfile(req.user.id, req.body.followId);
        console.log(profile)
        res.send(profile);
    })

    static unfollowProfile = asyncHandler(async (req, res) => {
        const profile = await ProfileService.unfollowProfile(req.user.id, req.body.unfollowId);
        res.send(profile);
    })

    static saveSubscription = asyncHandler(async (req, res) => {
        const profile = await ProfileService.saveSubscription(req.user.id, req.body.subscription);
        res.send(profile);
    })

    static notifyFollowers = asyncHandler(async (req, res) => {
        await ProfileService.notifyFollowers(req.user.id, req.body.message);
        res.send({ message: 'Notifications sent' });

    })


    static muteUser = asyncHandler(async (req, res) => {
        const { id } = req.params
        const channel = await ChannelService.fetchChannel(req.body.channelId)
        if (req.user.role == "superadmin" || req.user.role == "host" || req.user.id == channel.adminId) {

            if (channel.mutedUsers.includes(id)) {
                throw new ApiError("This user is already muted")
            }
            channel.mutedUsers = [...channel.mutedUsers, id]
            channel.save()
            res.send({ success: true, message: `User ${id} muted successfully` })
        } else {
            throw new ApiError("Unauthorized")
        }
    })

    static unmuteUser = asyncHandler(async (req, res) => {
        const { id } = req.params
        const channel = await ChannelService.fetchChannel(req.body.channelId)
        if (req.user.role == "superadmin" || req.user.role == "host" || req.user.id == channel.adminId) {

            if (!channel.mutedUsers.includes(id)) {
                throw new ApiError("This user is already unmuted")
            }
            channel.mutedUsers = channel.mutedUsers.filter(userId => userId !== id);
            channel.save()
            res.send({ success: true, message: `User ${id} unmuted successfully` });
        } else {
            throw new ApiError("Unauthorized")
        }
    })

    static banUser = asyncHandler(async (req, res) => {
        const { id } = req.params
        const channel = await ChannelService.fetchChannel(req.body.channelId)
        if (req.user.role == "superadmin" || req.user.role == "host" || req.user.id == channel.adminId) {
            if (channel.bannedUsers.includes(id)) {
                throw new ApiError("This user is already banned")
            }
            channel.bannedUsers = [...channel.bannedUsers, id]
            channel.save()
            res.send({ success: true, message: `User ${id} banned successfully` })
        } else {
            throw new ApiError("Unauthorized")
        }
    })

    static unbanUser = asyncHandler(async (req, res) => {
        const { id } = req.params
        const channel = await ChannelService.fetchChannel(req.body.channelId)

        if (req.user.role == "superadmin" || req.user.role == "host" || req.user.id == channel.adminId) {

            if (!channel.bannedUsers.includes(id)) {
                throw new ApiError("This user is already unbanned")
            }
            channel.bannedUsers = channel.bannedUsers.filter(userId => userId !== id);
            channel.save()
            res.send({ success: true, message: `User ${id} unbanned successfully` })
        } else {
            throw new ApiError("Unauthorized")
        }
    })

}

module.exports = ProfileController;
