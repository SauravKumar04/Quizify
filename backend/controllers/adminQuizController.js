const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

// Create a new manual quiz (Admin only)
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, duration, questions } = req.body;

    // Create quiz
    const quiz = await Quiz.create({
      title,
      description,
      createdBy: req.userId,
      quizType: 'manual',
      isPublic: true,
      duration: duration || 30,
    });

    // Create questions
    const questionDocs = await Question.insertMany(
      questions.map(q => ({
        quizId: quiz._id,
        questionText: q.questionText,
        questionImage: q.questionImage || '',
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation || '',
      }))
    );

    // Update quiz with question IDs
    quiz.questions = questionDocs.map(q => q._id);
    await quiz.save();

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz: await Quiz.findById(quiz._id).populate('questions'),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create quiz', error: error.message });
  }
};

// Get all manual quizzes created by admin
exports.getAdminQuizzes = async (req, res) => {
  try {
    const Result = require('../models/Result');
    
    const quizzes = await Quiz.find({
      createdBy: req.userId,
      quizType: 'manual',
    })
      .populate('questions')
      .sort({ createdAt: -1 });

    // Add attempt count for each quiz
    const quizzesWithStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const attemptCount = await Result.countDocuments({ quiz: quiz._id });
        return {
          ...quiz.toObject(),
          attemptCount,
        };
      })
    );

    res.status(200).json({ quizzes: quizzesWithStats });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quizzes', error: error.message });
  }
};

// Update a quiz (Admin only)
exports.updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { title, description, duration, questions } = req.body;

    const quiz = await Quiz.findOne({ _id: quizId, createdBy: req.userId });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or unauthorized' });
    }

    // Update quiz fields
    if (title) quiz.title = title;
    if (description) quiz.description = description;
    if (duration) quiz.duration = duration;

    // Update questions if provided
    if (questions) {
      // Delete old questions
      await Question.deleteMany({ quizId: quiz._id });

      // Create new questions
      const questionDocs = await Question.insertMany(
        questions.map(q => ({
          quizId: quiz._id,
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation || '',
        }))
      );

      quiz.questions = questionDocs.map(q => q._id);
    }

    await quiz.save();

    res.status(200).json({
      message: 'Quiz updated successfully',
      quiz: await Quiz.findById(quiz._id).populate('questions'),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update quiz', error: error.message });
  }
};

// Delete a quiz (Admin only)
exports.deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findOne({ _id: quizId, createdBy: req.userId });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or unauthorized' });
    }

    // Delete all questions
    await Question.deleteMany({ quizId: quiz._id });

    // Delete quiz
    await Quiz.findByIdAndDelete(quiz._id);

    res.status(200).json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete quiz', error: error.message });
  }
};

// Get quiz details by ID
exports.getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).populate('questions');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.status(200).json({ quiz });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quiz', error: error.message });
  }
};

// Upload question image
exports.uploadQuestionImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // Cloudinary provides the secure_url directly
    const imageUrl = req.file.path; // Cloudinary URL
    
    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
};
