const express = require('express');
const ProfileController = require('../controllers/profileController');
const { authMiddleware } = require('../middleware/authMiddleware');
const passport = require('passport');
const router = express.Router();


router.post('/signup', ProfileController.signup);
router.post('/login', ProfileController.login);
router.get('/profile/:id', authMiddleware, ProfileController.fetchProfile);
router.put('/profile/:id', authMiddleware, ProfileController.updateProfile);
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { session: false }), ProfileController.googleAuth);
router.post('/setup-2fa', authMiddleware, ProfileController.setup2FA);
router.post('/verify-2fa', authMiddleware, ProfileController.verify2FA);
router.put('/follow', authMiddleware, ProfileController.followProfile);
router.put('/unfollow', authMiddleware, ProfileController.unfollowProfile);
router.post('/subscription', authMiddleware, ProfileController.saveSubscription);
router.post('/notify-followers', authMiddleware, ProfileController.notifyFollowers);

//ADMIN ROUTES
router.put('/mute/:id', authMiddleware, ProfileController.muteUser);
router.put('/unmute/:id', authMiddleware, ProfileController.unmuteUser);
router.put('/ban/:id', authMiddleware, ProfileController.banUser);
router.put('/unban/:id', authMiddleware, ProfileController.unbanUser);

module.exports = router;
