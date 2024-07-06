const express = require('express');
const router = express.Router();

const { authMiddleware, isSuperAdmin, isHost } = require('../middleware/authMiddleware');
const channelController = require('../controllers/channelController');

router.get('/all', authMiddleware, channelController.getAllChanels);
router.post('/create', authMiddleware, channelController.createChannel);
router.put('/update/:id', authMiddleware, channelController.updateChannel);
router.put('/follow/:id', authMiddleware, channelController.followChannel);
router.put('/unfollow/:id', authMiddleware, channelController.unfollowChannel);


//HOST ROUTES
router.put('/promote', authMiddleware, channelController.promoteUserToAdmin);
router.put('/demote', authMiddleware, channelController.demoteUserFromAdmin);
// router.post('/start-stream', authMiddleware, channelController.startStream);
router.post('/start-stream', channelController.startStream);


//SUPER ADMIN ROUTES
router.delete('/delete/:id', authMiddleware, isSuperAdmin, channelController.deleteChannel);
router.put('/suspend/:id', authMiddleware, isSuperAdmin, channelController.suspendChannel);
router.put('/unsuspend/:id', authMiddleware, isSuperAdmin, channelController.unsuspendChannel);

module.exports = router