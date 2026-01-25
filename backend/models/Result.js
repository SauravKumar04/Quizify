const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
    selectedOption: {
      type: Number,
      min: -1,  // -1 indicates unattempted
      max: 3,
    },
    isCorrect: {
      type: Boolean,
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0,
    },
  }],
  totalTimeTaken: {
    type: Number, // in seconds
    default: 0,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
