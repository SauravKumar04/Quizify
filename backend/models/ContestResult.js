const mongoose = require('mongoose');

const contestResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  correctAnswers: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  timeTaken: {
    type: Number, // in seconds
    required: true,
  },
  startedAt: {
    type: Date,
    required: true,
  },
  submittedAt: {
    type: Date,
    required: true,
  },
  rank: {
    type: Number,
    default: null,
  },
  answers: [{
    questionIndex: Number,
    selectedOption: Number,
    isCorrect: Boolean,
    timeSpent: {
      type: Number, // in seconds
      default: 0,
    },
  }],
}, { timestamps: true });

// Compound index to ensure one submission per user per contest
contestResultSchema.index({ user: 1, contest: 1 }, { unique: true });

module.exports = mongoose.model('ContestResult', contestResultSchema);
