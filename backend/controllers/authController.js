const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user (always as 'user' role, admin cannot be registered)
    const user = await User.create({ name, email, password, role: 'user' });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college || '',
        bio: user.bio || '',
        profilePicture: user.profilePicture || '',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college || '',
        bio: user.bio || '',
        profilePicture: user.profilePicture || '',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, college, bio, profilePicture } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (college !== undefined) user.college = college;
    if (bio !== undefined) user.bio = bio;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        bio: user.bio,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user stats (for profile page)
exports.getUserStats = async (req, res) => {
  try {
    const Result = require('../models/Result');
    const ContestResult = require('../models/ContestResult');

    // Get quiz stats - Note: Result model uses 'userId' not 'user'
    const quizResults = await Result.find({ userId: req.userId });
    const totalQuizzes = quizResults.length;
    const avgQuizScore = quizResults.length > 0
      ? Math.round(quizResults.reduce((acc, r) => acc + r.percentage, 0) / quizResults.length)
      : 0;

    // Get contest stats - ContestResult uses 'user'
    const contestResults = await ContestResult.find({ user: req.userId })
      .populate('contest', 'title');
    
    // Calculate average rank
    let totalRankPercentile = 0;
    const contestsWithRanks = await Promise.all(
      contestResults.map(async (result) => {
        const allResults = await ContestResult.find({ contest: result.contest._id })
          .sort({ percentage: -1, timeTaken: 1 });
        const rank = allResults.findIndex(r => r._id.toString() === result._id.toString()) + 1;
        const totalParticipants = allResults.length;
        const percentile = Math.round(((totalParticipants - rank) / totalParticipants) * 100);
        totalRankPercentile += percentile;
        return { rank, totalParticipants, percentile };
      })
    );

    const avgRankPercentile = contestResults.length > 0
      ? Math.round(totalRankPercentile / contestResults.length)
      : 0;

    res.status(200).json({
      stats: {
        totalQuizzes,
        avgQuizScore,
        totalContests: contestResults.length,
        avgRankPercentile,
        bestContestRank: contestsWithRanks.length > 0 
          ? Math.min(...contestsWithRanks.map(c => c.rank)) 
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profilePicture = req.file.path;
    await user.save();

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicture: req.file.path,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        bio: user.bio,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
