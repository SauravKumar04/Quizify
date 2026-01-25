const Contest = require('../models/Contest');
const ContestResult = require('../models/ContestResult');

// ==================== ADMIN CONTROLLERS ====================

// Create a new contest
exports.createContest = async (req, res) => {
  try {
    const { title, description, questions, startTime, endTime, duration, maxParticipants, rules } = req.body;

    // Validate questions
    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: 'At least one question is required' });
    }

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const contest = await Contest.create({
      title,
      description,
      questions,
      createdBy: req.userId,
      startTime: start,
      endTime: end,
      duration: duration || 30,
      maxParticipants: maxParticipants || null,
      rules: rules || '',
    });

    res.status(201).json({
      message: 'Contest created successfully',
      contest,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload question image for contest
exports.uploadQuestionImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: req.file.path,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all contests created by admin
exports.getMyContests = async (req, res) => {
  try {
    const contests = await Contest.find({ createdBy: req.userId })
      .sort({ createdAt: -1 });

    // Add participant count for each contest
    const contestsWithStats = await Promise.all(
      contests.map(async (contest) => {
        const participantCount = await ContestResult.countDocuments({ contest: contest._id });
        return {
          ...contest.toObject(),
          participantCount,
          questionCount: contest.questions.length,
        };
      })
    );

    res.status(200).json({ contests: contestsWithStats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get contest by ID (admin)
exports.getContestById = async (req, res) => {
  try {
    const contest = await Contest.findOne({ _id: req.params.contestId, createdBy: req.userId });

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    const participantCount = await ContestResult.countDocuments({ contest: contest._id });

    res.status(200).json({ 
      contest: {
        ...contest.toObject(),
        participantCount,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update contest
exports.updateContest = async (req, res) => {
  try {
    const { title, description, questions, startTime, endTime, duration, maxParticipants, rules, isActive } = req.body;

    const contest = await Contest.findOne({ _id: req.params.contestId, createdBy: req.userId });
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Check if contest has already started
    const now = new Date();
    if (now >= new Date(contest.startTime)) {
      return res.status(400).json({ 
        message: 'Cannot edit contest after it has started. You can only edit contests before they begin.' 
      });
    }

    // Update all fields
    if (title) contest.title = title;
    if (description !== undefined) contest.description = description;
    if (questions) contest.questions = questions;
    if (startTime) contest.startTime = new Date(startTime);
    if (endTime) contest.endTime = new Date(endTime);
    if (duration) contest.duration = duration;
    if (maxParticipants !== undefined) contest.maxParticipants = maxParticipants;
    if (rules !== undefined) contest.rules = rules;
    if (isActive !== undefined) contest.isActive = isActive;

    await contest.save();

    res.status(200).json({
      message: 'Contest updated successfully',
      contest,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete contest
exports.deleteContest = async (req, res) => {
  try {
    const contest = await Contest.findOne({ _id: req.params.contestId, createdBy: req.userId });
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Delete all contest results
    await ContestResult.deleteMany({ contest: contest._id });
    await contest.deleteOne();

    res.status(200).json({ message: 'Contest deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get contest leaderboard (admin)
exports.getContestLeaderboard = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    const results = await ContestResult.find({ contest: req.params.contestId })
      .populate('user', 'name email college profilePicture')
      .sort({ percentage: -1, timeTaken: 1 });

    // Assign ranks
    const leaderboard = results.map((result, index) => ({
      rank: index + 1,
      user: result.user,
      score: result.score,
      totalQuestions: result.totalQuestions,
      percentage: result.percentage,
      timeTaken: result.timeTaken,
      submittedAt: result.submittedAt,
    }));

    res.status(200).json({ 
      contest: {
        title: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime,
        hasEnded: contest.hasEnded,
      },
      leaderboard 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==================== USER CONTROLLERS ====================

// Get all available contests
exports.getAllContests = async (req, res) => {
  try {
    const contests = await Contest.find({ isActive: true })
      .select('-questions.correctOption -questions.explanation')
      .populate('createdBy', 'name')
      .sort({ startTime: -1 });

    // Get user's attempted contests
    const attemptedContests = await ContestResult.find({ user: req.userId }).select('contest');
    const attemptedIds = attemptedContests.map(r => r.contest.toString());

    const contestsWithStatus = contests.map(contest => ({
      ...contest.toObject(),
      hasAttempted: attemptedIds.includes(contest._id.toString()),
      questionCount: contest.questions.length,
    }));

    res.status(200).json({ contests: contestsWithStatus });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get contest details for attempt
exports.getContestForAttempt = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId);

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    if (!contest.isActive) {
      return res.status(400).json({ message: 'Contest is not active' });
    }

    // Check if contest is live
    const now = new Date();
    if (now < contest.startTime) {
      return res.status(400).json({ message: 'Contest has not started yet' });
    }
    if (now > contest.endTime) {
      return res.status(400).json({ message: 'Contest has ended' });
    }

    // Check if user has already attempted
    const existingResult = await ContestResult.findOne({ 
      user: req.userId, 
      contest: contest._id 
    });
    if (existingResult) {
      return res.status(400).json({ message: 'You have already attempted this contest' });
    }

    // Check max participants
    if (contest.maxParticipants) {
      const currentParticipants = await ContestResult.countDocuments({ contest: contest._id });
      if (currentParticipants >= contest.maxParticipants) {
        return res.status(400).json({ message: 'Contest has reached maximum participants' });
      }
    }

    // Return questions without correct answers
    const questionsForAttempt = contest.questions.map((q, index) => ({
      _id: q._id,
      index,
      questionText: q.questionText,
      questionImage: q.questionImage,
      options: q.options,
    }));

    // Calculate remaining time
    const contestEndTime = new Date(contest.endTime);
    const maxDurationMs = contest.duration * 60 * 1000;
    const timeUntilEnd = contestEndTime - now;
    const effectiveDuration = Math.min(maxDurationMs, timeUntilEnd);

    res.status(200).json({
      contest: {
        _id: contest._id,
        title: contest.title,
        description: contest.description,
        duration: Math.floor(effectiveDuration / 1000 / 60), // in minutes
        endTime: contest.endTime,
        rules: contest.rules,
      },
      questions: questionsForAttempt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit contest attempt
exports.submitContest = async (req, res) => {
  try {
    const { answers, startedAt } = req.body;
    const contestId = req.params.contestId;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Check if already submitted
    const existingResult = await ContestResult.findOne({ 
      user: req.userId, 
      contest: contestId 
    });
    if (existingResult) {
      return res.status(400).json({ message: 'You have already submitted this contest' });
    }

    // Calculate score
    let correctAnswers = 0;
    const processedAnswers = contest.questions.map((question, index) => {
      const userAnswer = answers.find(a => a.questionIndex === index);
      const isCorrect = userAnswer && userAnswer.selectedOption === question.correctOption;
      if (isCorrect) correctAnswers++;
      
      return {
        questionIndex: index,
        selectedOption: userAnswer?.selectedOption ?? null,
        isCorrect,
        timeSpent: userAnswer?.timeSpent || 0,
      };
    });

    const totalQuestions = contest.questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const submittedAt = new Date();
    const timeTaken = Math.round((submittedAt - new Date(startedAt)) / 1000);

    const contestResult = await ContestResult.create({
      user: req.userId,
      contest: contestId,
      score: correctAnswers,
      totalQuestions,
      correctAnswers,
      percentage,
      timeTaken,
      startedAt: new Date(startedAt),
      submittedAt,
      answers: processedAnswers,
    });

    res.status(200).json({
      message: 'Contest submitted successfully',
      result: {
        _id: contestResult._id,
        score: correctAnswers,
        totalQuestions,
        percentage,
        timeTaken,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get contest leaderboard (public)
exports.getPublicLeaderboard = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    const results = await ContestResult.find({ contest: req.params.contestId })
      .populate('user', 'name college profilePicture')
      .sort({ percentage: -1, timeTaken: 1 });

    // Assign ranks
    const leaderboard = results.map((result, index) => ({
      rank: index + 1,
      user: {
        name: result.user.name,
        college: result.user.college,
        profilePicture: result.user.profilePicture,
      },
      score: result.score,
      totalQuestions: result.totalQuestions,
      percentage: result.percentage,
      timeTaken: result.timeTaken,
    }));

    // Get current user's rank
    const userResult = results.find(r => r.user._id.toString() === req.userId);
    const userRank = userResult ? results.indexOf(userResult) + 1 : null;

    res.status(200).json({ 
      contest: {
        title: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime,
        hasEnded: contest.hasEnded,
        isLive: contest.isLive,
      },
      leaderboard,
      userRank,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's contest history
exports.getMyContestHistory = async (req, res) => {
  try {
    const results = await ContestResult.find({ user: req.userId })
      .populate('contest', 'title startTime endTime')
      .sort({ submittedAt: -1 });

    // Calculate rank for each contest
    const historyWithRanks = await Promise.all(
      results.map(async (result) => {
        const allResults = await ContestResult.find({ contest: result.contest._id })
          .sort({ percentage: -1, timeTaken: 1 });
        const rank = allResults.findIndex(r => r._id.toString() === result._id.toString()) + 1;
        const totalParticipants = allResults.length;

        // Check if contest has ended
        const now = new Date();
        const hasEnded = result.contest.endTime < now;

        return {
          ...result.toObject(),
          rank,
          totalParticipants,
          hasEnded,
        };
      })
    );

    res.status(200).json({ history: historyWithRanks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get contest result details (for viewing after contest ends)
exports.getContestResultDetails = async (req, res) => {
  try {
    const { resultId } = req.params;
    
    const result = await ContestResult.findById(resultId)
      .populate({
        path: 'contest',
        select: 'title questions startTime endTime',
      })
      .populate('user', 'name');
    
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    
    // Ensure user can only view their own result
    if (result.user._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view this result' });
    }
    
    // Check if contest has ended
    const now = new Date();
    if (result.contest.endTime > now) {
      return res.status(403).json({ message: 'Contest has not ended yet. Results will be available after the contest ends.' });
    }
    
    // Build detailed answers with question details
    const detailedAnswers = result.contest.questions.map((question, index) => {
      const userAnswer = result.answers.find(a => a.questionIndex === index);
      return {
        questionText: question.text,
        questionImage: question.imageUrl,
        options: question.options,
        correctOption: question.correctOption,
        selectedOption: userAnswer ? userAnswer.selectedOption : null,
        isCorrect: userAnswer ? userAnswer.isCorrect : false,
        timeSpent: userAnswer ? userAnswer.timeSpent || 0 : 0,
      };
    });
    
    // Calculate average time per question
    const totalTimeSpent = detailedAnswers.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    const avgTimePerQuestion = result.totalQuestions > 0 ? Math.round(totalTimeSpent / result.totalQuestions) : 0;
    
    // Get rank
    const allResults = await ContestResult.find({ contest: result.contest._id })
      .sort({ percentage: -1, timeTaken: 1 });
    const rank = allResults.findIndex(r => r._id.toString() === result._id.toString()) + 1;
    const totalParticipants = allResults.length;
    
    res.status(200).json({
      result: {
        _id: result._id,
        contestId: result.contest._id,
        contestTitle: result.contest.title,
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage: result.percentage,
        timeTaken: result.timeTaken,
        rank,
        totalParticipants,
        submittedAt: result.submittedAt,
        detailedAnswers,
        avgTimePerQuestion,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
