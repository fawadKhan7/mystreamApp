const ChannelService = require("./services/channelService");

const onlineUsers = new Map();
const offlineUsers = new Map();
const streamingChannels = new Set();

function startStream(channelId) {
    streamingChannels.add(channelId);
    console.log({ streamingChannels }, 'from file')
    console.log(`Started streaming on channel ${channelId}`);
}

async function stopStream(channelId) {
    try {
        const channel = await ChannelService.fetchChannel(channelId);

        if (!channel) {
            console.log(`Channel ${channelId} not found`);
            return;
        }

        // Clear the adminId when stopping stream
        channel.adminId = null;
        await channel.save();

        // Remove from streamingChannels (assuming this is a Set or similar)
        streamingChannels.delete(channelId);

        console.log(`Stopped streaming on channel ${channelId}`);
    } catch (error) {
        console.error(`Error stopping stream on channel ${channelId}:`, error);
    }
}
function addOnlineUser(userId, channelId) {
    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(channelId);

    // Remove from offlineUsers if user becomes online
    if (offlineUsers.has(userId)) {
        offlineUsers.get(userId).delete(channelId);
        if (offlineUsers.get(userId).size === 0) {
            offlineUsers.delete(userId);
        }
    }
}

function removeOnlineUser(userId, channelId) {
    if (onlineUsers.has(userId)) {
        const channels = onlineUsers.get(userId);
        channels.delete(channelId);
        if (channels.size === 0) {
            onlineUsers.delete(userId);
        }

        // Add to offlineUsers if user goes offline
        if (!offlineUsers.has(userId)) {
            offlineUsers.set(userId, new Set());
        }
        offlineUsers.get(userId).add(channelId);
    }
}

function getOnlineChannels(userId) {
    return onlineUsers.get(userId) || new Set();
}

function getOfflineChannels(userId) {
    return offlineUsers.get(userId) || new Set();
}

module.exports = {
    addOnlineUser,
    removeOnlineUser,
    getOnlineChannels,
    getOfflineChannels,
    onlineUsers,
    offlineUsers,
    streamingChannels,
    startStream,
    stopStream
};
