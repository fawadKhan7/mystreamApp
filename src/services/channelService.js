const Channel = require("../models/channel");
const Profile = require("../models/profile");
const { ApiError } = require("../utils/errorHandler");
const ProfileService = require("./profileService");

class ChannelService {

    static async getAllChannel() {
        const channels = await Channel.findAll();
        return channels;
    }

    static async fetchChannel(id) {
        const channel = await Channel.findByPk(id);
        if (!channel) throw new ApiError('Channel not found');
        return channel;
    }


    static async createChannel(userId, name, description) {
        const channel = await Channel.create({ ownerId: userId, name, description });
        const user = await ProfileService.fetchProfile(userId)
        if (!user) {
            throw new ApiError("User not fount")
        }
        user.role = "host"
        user.save()
        return channel;
    }

    static async updateChannel(id, name, description) {
        const channel = await Channel.findByPk(id);
        if (!channel) throw new ApiError('Channel not found');

        channel.name = name;
        channel.description = description;
        await channel.save();
        return channel;
    }

    // Delete a channel
    static async deleteChannel(id) {
        const channel = await Channel.findByPk(id);
        if (!channel) throw new ApiError('Channel not found');

        await channel.destroy();
        return { message: 'Channel deleted successfully' };
    }

    static async followChannel(userId, id) {
        const channel = await Channel.findByPk(id);
        const user = await ProfileService.fetchProfile(userId);
        if (!channel) throw new ApiError('Channel not found');
        if (!userId) throw new ApiError('User not found');
        if (channel.followers.includes(userId)) throw new ApiError('Already following');
        channel.followers = [...channel.followers, userId]
        await channel.save();
        return { message: `${user.fullName} is following ${channel.name}` };
    }

    static async unfollowChannel(userId, id) {
        const channel = await Channel.findByPk(id);
        const user = await ProfileService.fetchProfile(id);
        if (!channel) throw new ApiError('Channel not found');
        if (!userId) throw new ApiError('User not found');
        channel.followers = channel.followers.filter(id => id !== userId);
        await channel.save();
        return { message: `${user.dataValues.fullName} has unfollowed ${channel.dataValues.name}` };
    }
}



module.exports = ChannelService