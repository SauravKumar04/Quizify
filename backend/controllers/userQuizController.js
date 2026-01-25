const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Result = require('../models/Result');

// Get all public quizzes (available to users)
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isPublic: true })
      .populate('createdBy', 'name email')
      .populate('questions', '_id') // Only get IDs to count questions
      .sort({ createdAt: -1 });

    res.status(200).json({ quizzes });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quizzes', error: error.message });
  }
};

// Get quiz by ID with questions (for attempting)
exports.getQuizForAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId)
      .populate({
        path: 'questions',
        select: 'questionText options questionImage', // Include questionImage, but don't send correct answers yet
      })
      .populate('createdBy', 'name');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if user can access this quiz
    if (!quiz.isPublic && quiz.createdBy._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied to this quiz' });
    }

    res.status(200).json({ quiz });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quiz', error: error.message });
  }
};

// Submit quiz answers and calculate score
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, totalTimeTaken } = req.body; // answers: [{ questionId, selectedOption, timeSpent }]

    const quiz = await Quiz.findById(quizId).populate('questions');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Calculate score
    let score = 0;
    const resultAnswers = [];

    for (const answer of answers) {
      const question = await Question.findById(answer.questionId);
      if (!question) continue;

      const isCorrect = question.correctOption === answer.selectedOption;
      if (isCorrect) score++;

      resultAnswers.push({
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect,
        timeSpent: answer.timeSpent || 0,
      });
    }

    const totalQuestions = quiz.questions.length;
    const percentage = (score / totalQuestions) * 100;

    // Save result
    const result = await Result.create({
      userId: req.userId,
      quizId: quiz._id,
      answers: resultAnswers,
      score,
      totalQuestions,
      percentage: percentage.toFixed(2),
      totalTimeTaken: totalTimeTaken || 0,
    });

    // Populate result with full details
    const populatedResult = await Result.findById(result._id)
      .populate('userId', 'name email')
      .populate('quizId', 'title description');

    res.status(201).json({
      message: 'Quiz submitted successfully',
      result: populatedResult,
      score,
      totalQuestions,
      percentage: percentage.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit quiz', error: error.message });
  }
};

// Get result details with correct answers and explanations
exports.getResultDetails = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId)
      .populate('userId', 'name email')
      .populate('quizId', 'title description');

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    // Check authorization
    if (result.userId._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Get full question details with correct answers
    const detailedAnswers = await Promise.all(
      result.answers.map(async (answer) => {
        const question = await Question.findById(answer.questionId);
        return {
          questionText: question.questionText,
          questionImage: question.questionImage || '',
          options: question.options,
          selectedOption: answer.selectedOption,
          correctOption: question.correctOption,
          isCorrect: answer.isCorrect,
          explanation: question.explanation,
          explanationImage: question.explanationImage || '',
          timeSpent: answer.timeSpent || 0,
        };
      })
    );

    // Calculate average time per question based on quiz duration
    const quizDurationInSeconds = result.quizId.duration * 60;
    const avgTimePerQuestion = result.totalQuestions > 0 ? Math.round(quizDurationInSeconds / result.totalQuestions) : 0;

    res.status(200).json({
      result: {
        ...result.toObject(),
        detailedAnswers,
        avgTimePerQuestion,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch result details', error: error.message });
  }
};

// Get user's quiz history
exports.getUserQuizHistory = async (req, res) => {
  try {
    const results = await Result.find({ userId: req.userId })
      .populate('quizId', 'title description quizType')
      .sort({ submittedAt: -1 });

    res.status(200).json({ results });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quiz history', error: error.message });
  }
};

// Delete result from history
exports.deleteResult = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId);

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    // Check authorization - only the user who created the result can delete it
    if (result.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this result' });
    }

    await Result.findByIdAndDelete(resultId);

    res.status(200).json({ message: 'Result deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete result', error: error.message });
  }
};
