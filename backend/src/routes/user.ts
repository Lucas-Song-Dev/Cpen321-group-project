import express from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { User } from '../models';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// @desc    Get current user profile
// @route   GET /api/user/profile
// @access  Private
router.get('/profile', asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        nickname: user.nickname,
        bio: user.bio,
        profilePicture: user.profilePicture,
        livingPreferences: user.livingPreferences,
        needsProfileCompletion: user.dateOfBirth.getFullYear() === 1900 || 
                               user.gender === 'prefer-not-to-say',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
}));

// @desc    Complete user profile (mandatory fields)
// @route   POST /api/user/profile/complete
// @access  Private
router.post('/profile/complete', asyncHandler(async (req, res) => {
  const { dateOfBirth, gender } = req.body;
  const user = req.user;

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if profile is already completed
  if (user.dateOfBirth.getFullYear() !== 1900 && user.gender !== 'prefer-not-to-say') {
    throw new AppError('Profile is already completed', 400);
  }

  // Validate required fields
  if (!dateOfBirth || !gender) {
    throw new AppError('Date of birth and gender are required', 400);
  }

  // Validate date of birth
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  
  if (age < 13 || age > 120) {
    throw new AppError('Invalid date of birth', 400);
  }

  // Validate gender
  const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
  if (!validGenders.includes(gender)) {
    throw new AppError('Invalid gender selection', 400);
  }

  // Update user profile
  user.dateOfBirth = birthDate;
  user.gender = gender;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile completed successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        nickname: user.nickname,
        bio: user.bio,
        profilePicture: user.profilePicture,
        livingPreferences: user.livingPreferences,
        needsProfileCompletion: false
      }
    }
  });
}));

// @desc    Update user profile (optional fields)
// @route   PUT /api/user/profile
// @access  Private
router.put('/profile', asyncHandler(async (req, res) => {
  const { nickname, bio, profilePicture, livingPreferences } = req.body;
  const user = req.user;

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Validate nickname
  if (nickname !== undefined) {
    if (nickname.length > 50) {
      throw new AppError('Nickname must be less than 50 characters', 400);
    }
    user.nickname = nickname.trim() || undefined;
  }

  // Validate bio
  if (bio !== undefined) {
    if (bio.length > 500) {
      throw new AppError('Bio must be less than 500 characters', 400);
    }
    user.bio = bio.trim() || undefined;
  }

  // Validate profile picture URL
  if (profilePicture !== undefined) {
    if (profilePicture && !isValidUrl(profilePicture)) {
      throw new AppError('Invalid profile picture URL', 400);
    }
    user.profilePicture = profilePicture || undefined;
  }

  // Validate living preferences
  if (livingPreferences !== undefined) {
    const validSchedules = ['morning', 'night', 'flexible'];
    const validFrequencies = ['never', 'occasionally', 'regularly'];
    const validNoiseLevels = ['quiet', 'moderate', 'loud'];
    const validProfessions = ['student', 'professional', 'other'];

    if (livingPreferences.schedule && !validSchedules.includes(livingPreferences.schedule)) {
      throw new AppError('Invalid schedule preference', 400);
    }
    if (livingPreferences.drinking && !validFrequencies.includes(livingPreferences.drinking)) {
      throw new AppError('Invalid drinking preference', 400);
    }
    if (livingPreferences.partying && !validFrequencies.includes(livingPreferences.partying)) {
      throw new AppError('Invalid partying preference', 400);
    }
    if (livingPreferences.noise && !validNoiseLevels.includes(livingPreferences.noise)) {
      throw new AppError('Invalid noise preference', 400);
    }
    if (livingPreferences.profession && !validProfessions.includes(livingPreferences.profession)) {
      throw new AppError('Invalid profession preference', 400);
    }

    user.livingPreferences = livingPreferences;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        nickname: user.nickname,
        bio: user.bio,
        profilePicture: user.profilePicture,
        livingPreferences: user.livingPreferences,
        needsProfileCompletion: user.dateOfBirth.getFullYear() === 1900 || 
                               user.gender === 'prefer-not-to-say',
        updatedAt: user.updatedAt
      }
    }
  });
}));

// @desc    Get user profile by ID (for viewing other users)
// @route   GET /api/user/profile/:userId
// @access  Private
router.get('/profile/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select('-googleId -email');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        nickname: user.nickname,
        bio: user.bio,
        profilePicture: user.profilePicture,
        livingPreferences: user.livingPreferences,
        // Don't expose sensitive information like email, DOB, gender
      }
    }
  });
}));

// Helper function to validate URLs
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export default router;
