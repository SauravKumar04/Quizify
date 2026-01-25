const express = require('express');
const router = express.Router();
const contestController = require('../controllers/contestController');
const authenticate = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const isAdmin = roleMiddleware('admin');

// ==================== ADMIN ROUTES ====================
router.post('/admin/create', authenticate, isAdmin, contestController.createContest);
router.post('/admin/upload-image', authenticate, isAdmin, upload.single('image'), contestController.uploadQuestionImage);
router.get('/admin/my-contests', authenticate, isAdmin, contestController.getMyContests);
router.get('/admin/:contestId', authenticate, isAdmin, contestController.getContestById);
router.put('/admin/:contestId', authenticate, isAdmin, contestController.updateContest);
router.delete('/admin/:contestId', authenticate, isAdmin, contestController.deleteContest);
router.get('/admin/:contestId/leaderboard', authenticate, isAdmin, contestController.getContestLeaderboard);

// ==================== USER ROUTES ====================
router.get('/all', authenticate, contestController.getAllContests);
router.get('/history', authenticate, contestController.getMyContestHistory);
router.get('/result/:resultId', authenticate, contestController.getContestResultDetails);
router.get('/:contestId/attempt', authenticate, contestController.getContestForAttempt);
router.post('/:contestId/submit', authenticate, contestController.submitContest);
router.get('/:contestId/leaderboard', authenticate, contestController.getPublicLeaderboard);

module.exports = router;
