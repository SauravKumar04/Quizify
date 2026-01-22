const express = require('express');
const router = express.Router();
const adminQuizController = require('../controllers/adminQuizController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Admin quiz routes
router.post('/create', adminQuizController.createQuiz);
router.post('/upload-image', upload.single('image'), adminQuizController.uploadQuestionImage);
router.get('/my-quizzes', adminQuizController.getAdminQuizzes);
router.put('/:quizId', adminQuizController.updateQuiz);
router.delete('/:quizId', adminQuizController.deleteQuiz);
router.get('/:quizId', adminQuizController.getQuizById);

module.exports = router;
