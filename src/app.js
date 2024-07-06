const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const profileRoutes = require('./routes/profileRoutes');
const channelRoutes = require('./routes/channelRoutes');
const sequelize = require('./config/database');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { addOnlineUser, removeOnlineUser, streamingChannels, onlineUsers } = require('./onlineUsers');
const Channel = require('./models/channel');
const globals = require('./global');
const ProfileService = require('./services/profileService');
const Profile = require('./models/profile');

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/api', profileRoutes);
app.use('/api/channel', channelRoutes);

app.use(express.static(path.join(__dirname, 'public')));
const server = http.createServer(app);
const io = socketIo(server);

globals.setSocketIo(io);

io.on('connection', async (socket) => {
    console.log('New client connected');

    // Assuming you have userId available when a client connects
    const userId = socket.handshake.query.userId;

    if (!userId) {
        console.log('User ID not provided');
        return;
    }

    // Fetch user profile from userId
    const profile = await Profile.findByPk(userId);

    if (!profile) {
        console.log(`User ${userId} not found`);
        return;
    }

    // Add user to onlineUsers or perform any other online status logic
    addOnlineUser(userId); // Example: Adding to onlineUsers map

    // Store userId in socket context
    socket.userId = userId;

    // Example: Notify client that user is connected
    socket.emit('userConnected', { userId });

    // console.log(`User ${userId} connected`);

    socket.on('joinChannel', async (data) => {
        const { userId, channelId, pushSubscription } = data;
        const profile = await ProfileService.fetchProfile(userId);
        const channel = await Channel.findByPk(channelId);

        if (!profile || !channel) {
            console.log(`User ${userId} or Channel ${channelId} not found`);
            return;
        }
        if (!streamingChannels.has(channelId)) {
            console.log(`Channel ${channelId} is not streaming, cannot join`);
            return;
        }

        if (channel.bannedUsers.includes(userId)) {
            console.log(`User ${userId} is banned in Channel ${channelId}`);
            return;
        }

        socket.join(channelId);
        // addOnlineUser(userId, channelId); // Add user to onlineUsers

        // Store userId and channelId in the socket's context
        socket.userId = userId;
        socket.channelId = channelId;

        if (pushSubscription) {
            await profile.update({ pushSubscription });
        }

        console.log(`User ${userId} joined channel ${channelId}`);
    });

    socket.on('sendMessage', async (data) => {
        const { userId, channelId, message } = data;
        console.log({ onlineUsers })
        try {
            // Fetch profile and channel
            const profile = await ProfileService.fetchProfile(userId);
            const channel = await Channel.findByPk(channelId);

            // Check if profile and channel exist
            if (!profile || !channel) {
                console.log(`User ${userId} or Channel ${channelId} not found`);
                return;
            }

            // Check if user is muted, banned, or not following the channel
            if (channel.mutedUsers.includes(userId)) {
                console.log(`User ${userId} is muted in Channel ${channelId}`);
                return;
            }

            if (channel.bannedUsers.includes(userId)) {
                console.log(`User ${userId} is banned in Channel ${channelId}`);
                return;
            }

            // if (!channel.followers.includes(userId)) {
            //     console.log(`User ${userId} is not following Channel ${channelId}`);
            //     return;
            // }

            // Emit message event to channel
            io.to(channelId).emit('newMessage', {
                userId: profile.id,
                username: profile.username,
                message,
            });

            console.log(`Message sent by User ${userId} in Channel ${channelId}: ${message}`);
        } catch (error) {
            console.error(`Error in sendMessage event for User ${userId} in Channel ${channelId}:`, error);
        }
    });

    socket.on('promoteUserToAdmin', async (data) => {
        const { userId, channelId, targetUserId } = data;

        const profile = await ProfileService.fetchProfile(userId);
        const channel = await Channel.findByPk(channelId);
        const targetUser = await ProfileService.fetchProfile(targetUserId);

        if (!profile || !channel || !targetUser) {
            console.log('User, channel, or target user not found');
            return;
        }

        if (targetUser) {
            if (channel.adminId) {
                console.log('There is already an admin for this channel');
                return;
            }

            channel.adminId = targetUserId;
            await channel.save();

            io.to(channelId).emit('userPromotedToAdmin', {
                userId: targetUser.id,
                username: targetUser.username,
            });

            console.log(`User ${targetUserId} promoted to admin by ${userId} in Channel ${channelId}`);
        } else {
            console.log(`User ${userId} is not authorized to promote admins in Channel ${channelId}`);
        }
    });

    socket.on('demoteUserFromAdmin', async (data) => {
        const { userId, channelId, targetUserId } = data;
        console.log({ data })

        const profile = await ProfileService.fetchProfile(userId);
        const channel = await Channel.findByPk(channelId);
        const targetUser = await ProfileService.fetchProfile(targetUserId);

        if (!profile || !channel || !targetUser) {
            console.log('User, channel, or target user not found');
            return;
        }
        if (targetUser) {
            if (channel.adminId !== targetUserId) {
                console.log('The target user is not an admin of this channel');
                return;
            }

            channel.adminId = null;
            await channel.save();

            io.to(channelId).emit('userDemotedFromAdmin', { userId: targetUserId });

            console.log(`User ${targetUserId} demoted from admin by ${userId} in Channel ${channelId}`);
        } else {
            console.log(`User ${userId} is not authorized to demote admins in Channel ${channelId}`);
        }
    });


    socket.on('disconnect', () => {
        const userId = socket.userId;
        console.log(socket.handshake.query)
        if (userId) {
            // Remove user from onlineUsers or perform cleanup
            removeOnlineUser(userId); // Example: Removing from onlineUsers map

            console.log(`User ${userId} disconnected`);
        }
        console.log('Client disconnected');
    });
});




// Sync database and start the server
sequelize.sync().then(() => {
    console.log('Database synchronized');
});


module.exports = server;
