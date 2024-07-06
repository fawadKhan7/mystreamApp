const Profile = require('../models/profile');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const sendPushNotification = require('../utils/pushUtils');
const { ApiError } = require('../utils/errorHandler');
require('dotenv').config();

class ProfileService {
    static async signup(profileData) {
        const hashedPassword = await bcrypt.hash(profileData.password, 10);
        profileData.password = hashedPassword;
        profileData.role = 'user'
        const profile = await Profile.create(profileData);
        return profile;
    }

    static async login(email, password) {
        const profile = await Profile.findOne({ where: { email } });
        if (!profile) throw new ApiError('Invalid email or password');

        const validPassword = await bcrypt.compare(password, profile.password);
        if (!validPassword) throw new ApiError('Invalid email or password');
        const token = jwt.sign({ id: profile.id }, process.env.JWT_SECRET);
        return { profile, token };
    }

    static async fetchProfile(id) {
        console.log(id)
        const profile = await Profile.findByPk(id);
        if (!profile) throw new ApiError('Profile not found');
        return profile;
    }

    static async updateProfile(id, updates) {
        const profile = await Profile.findByPk(id);
        if (!profile) throw new ApiError('Profile not found');
        await profile.update(updates);
        return profile;
    }

    static async setup2FA(userId) {
        const secret = speakeasy.generateSecret();
        await Profile.update({ twoFactorSecret: secret.base32 }, { where: { id: userId } });
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
        return qrCodeUrl;
    }

    static async verify2FA(userId, token) {
        const profile = await Profile.findByPk(userId);
        const secretKey = profile.twoFactorSecret
        if (!profile || !profile.twoFactorSecret) throw new ApiError('2FA is not set up');
        const verified = speakeasy.totp.verify({
            secret: secretKey,
            encoding: 'base32',
            token,
        });
        if (!verified) throw new ApiError('Invalid 2FA token');
        return true;
    }

    static async followProfile(userId, followId) {
        const profile = await Profile.findByPk(userId);
        if (!profile) throw new ApiError('Profile not found');
        profile.following = [...profile.following, followId]
        // profile.following.push(followId);
        await profile.save();
        return profile;
    }

    static async unfollowProfile(userId, unfollowId) {
        const profile = await Profile.findByPk(userId);
        if (!profile) throw new ApiError('Profile not found');

        profile.following = profile.following.filter(id => id !== unfollowId);
        await profile.save();
        return profile;
    }


    static async saveSubscription(userId, subscription) {
        const profile = await Profile.findByPk(userId);
        if (!profile) throw new ApiError('Profile not found');

        profile.pushSubscription = subscription;
        await profile.save();
        return profile;
    }

    static async notifyFollowers(userId, message) {
        const profile = await Profile.findByPk(userId);
        if (!profile) throw new ApiError('Profile not found');

        for (const followerId of profile.following) {
            const follower = await Profile.findByPk(followerId);
            if (follower && follower.pushSubscription) {
                sendPushNotification(follower.pushSubscription, message);
            }
        }
    }
}

module.exports = ProfileService;
