const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Profile = require('../models/profile');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await Profile.findOne({ where: { email: profile.emails[0].value } });
        if (!user) {
            user = await Profile.create({
                fullName: profile.displayName,
                username: profile.emails[0].value.split('@')[0],
                email: profile.emails[0].value,
                avatar: profile.photos[0].value,
                active: true,
            });
        }
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await Profile.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
