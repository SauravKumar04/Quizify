const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Result = require('../models/Result');

const SUBJECT_FILTERS = [
  'all',
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

const toAttemptSections = (quiz) => {
  if (Array.isArray(quiz.sections) && quiz.sections.length > 0) {
    return quiz.sections.map((section, index) => ({
      sectionIndex: index,
      title: section.title,
      timeLimit: section.timeLimit,
      questions: section.questions,
    }));
  }

  return [{
    sectionIndex: 0,
    title: 'Section 1',
    timeLimit: quiz.duration || 30,
    questions: quiz.questions || [],
  }];
};

const normalizeSectionSubmissions = (payload, sections) => {
  if (Array.isArray(payload.sectionSubmissions) && payload.sectionSubmissions.length > 0) {
    return payload.sectionSubmissions;
  }

  const legacyAnswers = Array.isArray(payload.answers) ? payload.answers : [];
  return [{
    sectionIndex: 0,
    timeTaken: payload.totalTimeTaken || 0,
    answers: legacyAnswers,
  }].filter(() => sections.length > 0);
};

exports.getAllQuizzes = async (req, res) => {
  try {
    const requestedSubjectRaw = String(req.query.subject || 'all').trim().toLowerCase();
    const requestedSubject = SUBJECT_FILTERS.includes(requestedSubjectRaw) ? requestedSubjectRaw : 'all';
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(30, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const baseFilter = { isPublic: true };
    let subjectFilter = {};

    if (requestedSubject && requestedSubject !== 'all') {
      if (requestedSubject === 'full-test') {
        subjectFilter = {
          $or: [
            { subject: 'full-test' },
            { tags: 'full-test' },
            { title: { $regex: /full\s*test/i } },
          ],
        };
      } else {
        subjectFilter = {
          $or: [
            { subject: requestedSubject },
            { tags: requestedSubject },
          ],
        };
      }
    }

    const queryFilter = { ...baseFilter, ...subjectFilter };

    const [quizzes, total] = await Promise.all([
      Quiz.find(queryFilter)
      .populate('createdBy', 'name email')
      .populate('questions', '_id')
      .populate({ path: 'sections.questions', select: '_id' })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
      Quiz.countDocuments(queryFilter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.status(200).json({
      quizzes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
      availableSubjects: SUBJECT_FILTERS,
      selectedSubject: requestedSubject,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quizzes', error: error.message });
  }
};

exports.getQuizForAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId)
      .populate({
        path: 'questions',
        select: 'questionText options questionImage sectionIndex',
      })
      .populate({
        path: 'sections.questions',
        select: 'questionText options questionImage sectionIndex',
      })
      .populate('createdBy', 'name');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (!quiz.isPublic && quiz.createdBy._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied to this quiz' });
    }

    const quizObject = quiz.toObject();
    quizObject.sections = toAttemptSections(quizObject);

    res.status(200).json({ quiz: quizObject });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quiz', error: error.message });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const payload = req.body || {};

    const quiz = await Quiz.findById(quizId)
      .populate('questions')
      .populate({ path: 'sections.questions' });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const sections = toAttemptSections(quiz.toObject());
    const sectionSubmissions = normalizeSectionSubmissions(payload, sections);

    let score = 0;
    let totalQuestions = 0;
    const resultAnswers = [];
    const sectionResults = [];

    sections.forEach((section, sectionIndex) => {
      const sectionSubmission = sectionSubmissions.find((entry) => entry.sectionIndex === sectionIndex)
        || sectionSubmissions[sectionIndex]
        || { answers: [], timeTaken: 0 };

      let sectionScore = 0;
      const sectionQuestions = section.questions || [];
      totalQuestions += sectionQuestions.length;

      sectionQuestions.forEach((question) => {
        const submittedAnswer = (sectionSubmission.answers || []).find((answer) => String(answer.questionId) === String(question._id));
        const selectedOption = submittedAnswer && Number.isInteger(submittedAnswer.selectedOption)
          ? submittedAnswer.selectedOption
          : -1;

        const isCorrect = selectedOption !== -1 && question.correctOption === selectedOption;

        if (isCorrect) {
          score += 1;
          sectionScore += 1;
        }

        resultAnswers.push({
          questionId: question._id,
          sectionIndex,
          selectedOption,
          isCorrect,
          timeSpent: submittedAnswer?.timeSpent || 0,
        });
      });

      sectionResults.push({
        sectionIndex,
        sectionTitle: section.title,
        score: sectionScore,
        totalQuestions: sectionQuestions.length,
        timeLimit: section.timeLimit || 0,
        timeTaken: sectionSubmission.timeTaken || 0,
      });
    });

    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    const result = await Result.create({
      userId: req.userId,
      quizId: quiz._id,
      answers: resultAnswers,
      sectionResults,
      score,
      totalQuestions,
      percentage: percentage.toFixed(2),
      totalTimeTaken: payload.totalTimeTaken || sectionResults.reduce((sum, section) => sum + (section.timeTaken || 0), 0),
    });

    const populatedResult = await Result.findById(result._id)
      .populate('userId', 'name email')
      .populate('quizId', 'title description duration');

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

exports.getResultDetails = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId)
      .populate('userId', 'name email')
      .populate('quizId', 'title description duration');

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    if (result.userId._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const questionIds = result.answers.map((answer) => answer.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map(questions.map((question) => [String(question._id), question]));

    const detailedAnswers = result.answers.map((answer) => {
      const question = questionMap.get(String(answer.questionId));
      return {
        sectionIndex: answer.sectionIndex || 0,
        sectionTitle: question?.sectionTitle || `Section ${(answer.sectionIndex || 0) + 1}`,
        questionText: question?.questionText || '',
        questionImage: question?.questionImage || '',
        options: question?.options || [],
        selectedOption: answer.selectedOption,
        correctOption: question?.correctOption ?? -1,
        isCorrect: answer.isCorrect,
        explanation: question?.explanation || '',
        explanationImage: question?.explanationImage || '',
        timeSpent: answer.timeSpent || 0,
      };
    });

    const sectionResults = (result.sectionResults && result.sectionResults.length > 0)
      ? result.sectionResults
      : [];

    const avgTimePerQuestion = result.totalQuestions > 0
      ? Math.round((result.totalTimeTaken || 0) / result.totalQuestions)
      : 0;

    res.status(200).json({
      result: {
        ...result.toObject(),
        detailedAnswers,
        sectionResults,
        avgTimePerQuestion,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch result details', error: error.message });
  }
};

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

exports.deleteResult = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId);

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    if (result.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this result' });
    }

    await Result.findByIdAndDelete(resultId);

    res.status(200).json({ message: 'Result deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete result', error: error.message });
  }
};
