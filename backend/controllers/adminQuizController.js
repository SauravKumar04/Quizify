const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Result = require('../models/Result');

const SUBJECT_OPTIONS = new Set([
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
]);

const normalizeSubject = (subject) => {
  const normalized = String(subject || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (!normalized || !SUBJECT_OPTIONS.has(normalized)) return 'full-test';
  return normalized;
};

const normalizeIncomingSections = ({ sections, questions, duration }) => {
  if (Array.isArray(sections) && sections.length > 0) {
    return sections.map((section, sectionIndex) => ({
      title: section.title?.trim() || `Section ${sectionIndex + 1}`,
      timeLimit: Number(section.timeLimit) > 0 ? Number(section.timeLimit) : 1,
      questions: (section.questions || []).map((question) => ({
        questionText: question.questionText,
        questionImage: question.questionImage || '',
        options: question.options || ['', '', '', ''],
        correctOption: Number.isInteger(question.correctOption)
          ? question.correctOption
          : (Number.isInteger(question.correctAnswer) ? question.correctAnswer : 0),
        explanation: question.explanation || '',
        explanationImage: question.explanationImage || '',
      })),
    }));
  }

  const fallbackDuration = Number(duration) > 0 ? Number(duration) : 30;
  return [{
    title: 'Section 1',
    timeLimit: fallbackDuration,
    questions: (questions || []).map((question) => ({
      questionText: question.questionText,
      questionImage: question.questionImage || '',
      options: question.options || ['', '', '', ''],
      correctOption: Number.isInteger(question.correctOption)
        ? question.correctOption
        : (Number.isInteger(question.correctAnswer) ? question.correctAnswer : 0),
      explanation: question.explanation || '',
      explanationImage: question.explanationImage || '',
    })),
  }];
};

const buildQuestionDocsFromSections = (quizId, sections) => {
  const sectionQuestionCounts = [];
  const docs = [];

  sections.forEach((section, sectionIndex) => {
    const normalizedQuestions = section.questions || [];
    sectionQuestionCounts.push(normalizedQuestions.length);

    normalizedQuestions.forEach((question) => {
      docs.push({
        quizId,
        questionText: question.questionText,
        questionImage: question.questionImage || '',
        options: question.options,
        correctOption: question.correctOption,
        explanation: question.explanation || '',
        explanationImage: question.explanationImage || '',
        sectionIndex,
        sectionTitle: section.title,
      });
    });
  });

  return { docs, sectionQuestionCounts };
};

const buildQuizSectionsFromQuestionDocs = (sections, questionDocs, sectionQuestionCounts) => {
  let cursor = 0;

  return sections.map((section, sectionIndex) => {
    const count = sectionQuestionCounts[sectionIndex] || 0;
    const questionIds = questionDocs.slice(cursor, cursor + count).map((questionDoc) => questionDoc._id);
    cursor += count;

    return {
      title: section.title,
      timeLimit: section.timeLimit,
      questions: questionIds,
    };
  });
};

const populateQuiz = (quizId) => Quiz.findById(quizId)
  .populate('questions')
  .populate({ path: 'sections.questions' });

exports.createQuiz = async (req, res) => {
  try {
    const { title, description, duration, sections, questions, subject } = req.body;
    const normalizedSections = normalizeIncomingSections({ sections, questions, duration });
    const normalizedSubject = normalizeSubject(subject);

    const totalDuration = normalizedSections.reduce((sum, section) => sum + section.timeLimit, 0);

    const quiz = await Quiz.create({
      title,
      description,
      createdBy: req.userId,
      quizType: 'manual',
      isPublic: true,
      duration: totalDuration,
      subject: normalizedSubject,
      sections: [],
      questions: [],
    });

    const { docs, sectionQuestionCounts } = buildQuestionDocsFromSections(quiz._id, normalizedSections);
    const questionDocs = await Question.insertMany(docs);

    quiz.questions = questionDocs.map((question) => question._id);
    quiz.sections = buildQuizSectionsFromQuestionDocs(normalizedSections, questionDocs, sectionQuestionCounts);
    await quiz.save();

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz: await populateQuiz(quiz._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create quiz', error: error.message });
  }
};

exports.getAdminQuizzes = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const skip = (page - 1) * limit;
    const quizFilter = {
      createdBy: req.userId,
      quizType: 'manual',
    };

    const [quizzes, totalQuizzes, allQuizIds] = await Promise.all([
      Quiz.find(quizFilter)
        .populate('questions')
        .populate({ path: 'sections.questions' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Quiz.countDocuments(quizFilter),
      Quiz.find(quizFilter).distinct('_id'),
    ]);

    const pageQuizIds = quizzes.map((quiz) => quiz._id);

    const attemptAgg = pageQuizIds.length > 0
      ? await Result.aggregate([
          { $match: { quizId: { $in: pageQuizIds } } },
          { $group: { _id: '$quizId', count: { $sum: 1 } } },
        ])
      : [];

    const attemptCountMap = new Map(attemptAgg.map((item) => [String(item._id), item.count]));

    const totalQuizAttempts = allQuizIds.length > 0
      ? await Result.countDocuments({ quizId: { $in: allQuizIds } })
      : 0;

    const quizzesWithStats = quizzes.map((quiz) => ({
      ...quiz.toObject(),
      attemptCount: attemptCountMap.get(String(quiz._id)) || 0,
    }));

    res.status(200).json({
      quizzes: quizzesWithStats,
      pagination: {
        page,
        limit,
        total: totalQuizzes,
        hasMore: skip + quizzesWithStats.length < totalQuizzes,
      },
      stats: {
        totalQuizzes,
        totalQuizAttempts,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quizzes', error: error.message });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { title, description, duration, sections, questions, subject } = req.body;

    const quiz = await Quiz.findOne({ _id: quizId, createdBy: req.userId });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or unauthorized' });
    }

    if (title) quiz.title = title;
    if (description) quiz.description = description;
    if (subject !== undefined) {
      quiz.subject = normalizeSubject(subject);
    }

    const shouldReplaceQuestions = (Array.isArray(sections) && sections.length > 0) || (Array.isArray(questions) && questions.length > 0);

    if (shouldReplaceQuestions) {
      const normalizedSections = normalizeIncomingSections({ sections, questions, duration });

      await Question.deleteMany({ quizId: quiz._id });

      const { docs, sectionQuestionCounts } = buildQuestionDocsFromSections(quiz._id, normalizedSections);
      const questionDocs = await Question.insertMany(docs);

      quiz.questions = questionDocs.map((question) => question._id);
      quiz.sections = buildQuizSectionsFromQuestionDocs(normalizedSections, questionDocs, sectionQuestionCounts);
      quiz.duration = normalizedSections.reduce((sum, section) => sum + section.timeLimit, 0);
    } else if (duration) {
      quiz.duration = duration;
    }

    await quiz.save();

    res.status(200).json({
      message: 'Quiz updated successfully',
      quiz: await populateQuiz(quiz._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update quiz', error: error.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findOne({ _id: quizId, createdBy: req.userId });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or unauthorized' });
    }

    await Question.deleteMany({ quizId: quiz._id });
    await Quiz.findByIdAndDelete(quiz._id);

    res.status(200).json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete quiz', error: error.message });
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findOne({ _id: quizId, createdBy: req.userId })
      .populate('questions')
      .populate({ path: 'sections.questions' });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or unauthorized' });
    }

    res.status(200).json({ quiz });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quiz', error: error.message });
  }
};

exports.uploadQuestionImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const imageUrl = req.file.path;

    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
};
