const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { profileUpload } = require('../middleware/uploadMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/profile/upload-picture', authMiddleware, profileUpload.single('image'), authController.uploadProfilePicture);
router.get('/stats', authMiddleware, authController.getUserStats);

module.exports = router;
