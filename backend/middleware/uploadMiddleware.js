const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configure Cloudinary storage for question images
const questionStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'quizify/questions',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    resource_type: 'image',
  },
});

// Configure Cloudinary storage for profile pictures
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'quizify/profiles',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    resource_type: 'image',
    transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }],
  },
});

// Create multer upload instances
const upload = multer({
  storage: questionStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;
module.exports.profileUpload = profileUpload;
