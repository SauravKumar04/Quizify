const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Quiz description is required'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quizType: {
    type: String,
    enum: ['manual', 'ai'],
    default: 'manual',
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  }],
  duration: {
    type: Number, // in minutes
    default: 30,
  },
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
