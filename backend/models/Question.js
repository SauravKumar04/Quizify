const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
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
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
