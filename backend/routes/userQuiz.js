const express = require('express');
const router = express.Router();
const userQuizController = require('../controllers/userQuizController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Quiz routes for users
router.get('/all', userQuizController.getAllQuizzes);
router.get('/:quizId/attempt', userQuizController.getQuizForAttempt);
router.post('/:quizId/submit', userQuizController.submitQuiz);
router.get('/result/:resultId', userQuizController.getResultDetails);
router.get('/history', userQuizController.getUserQuizHistory);
router.delete('/result/:resultId', userQuizController.deleteResult);

module.exports = router;
