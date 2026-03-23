const mongoose = require('mongoose');

const SUBJECT_OPTIONS = [
  'full-test',
  'aptitude',
  'logical-reasoning',
  'verbal-ability',
  'coding',
  'web-development',
  'dsa',
  'databases',
  'operating-system',
  'computer-networks',
  'oops',
  'data-interpretation',
];

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  timeLimit: {
    type: Number,
    required: true,
    min: 1,
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  }],
}, { _id: false });

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
  sections: {
    type: [sectionSchema],
    default: [],
  },
  duration: {
    type: Number, // in minutes
    default: 30,
  },
  subject: {
    type: String,
    enum: SUBJECT_OPTIONS,
    default: 'full-test',
  },
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
