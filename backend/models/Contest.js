const mongoose = require('mongoose');

// Contest Question Schema (embedded)
const contestQuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
  },
  questionImage: {
    type: String,
    default: '',
  },
  options: [{
    type: String,
    required: true,
  }],
  correctOption: {
    type: Number,
    required: [true, 'Correct option index is required'],
    min: 0,
    max: 3,
  },
  explanation: {
    type: String,
    default: '',
  },
  explanationImage: {
    type: String,
    default: '',
  },
});

const contestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Contest title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Contest description is required'],
  },
  questions: [contestQuestionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required'],
  },
  duration: {
    type: Number, // Duration in minutes for the contest attempt
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  maxParticipants: {
    type: Number,
    default: null, // null means unlimited
  },
  rules: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Virtual to check if contest is live
contestSchema.virtual('isLive').get(function() {
  const now = new Date();
  return this.isActive && now >= this.startTime && now <= this.endTime;
});

// Virtual to check if contest has ended
contestSchema.virtual('hasEnded').get(function() {
  return new Date() > this.endTime;
});

// Virtual to check if contest is upcoming
contestSchema.virtual('isUpcoming').get(function() {
  return new Date() < this.startTime;
});

contestSchema.set('toJSON', { virtuals: true });
contestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Contest', contestSchema);
