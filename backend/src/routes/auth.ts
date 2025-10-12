import express, { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { verifyGoogleToken, findOrCreateUser, generateTokens } from '../services/authService';

const router = express.Router();

// @desc    Google OAuth login
// @route   POST /api/auth/google
// @access  Public
router.post('/google', asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new AppError('Google ID token is required', 400);
  }

  try {
    // Verify the Google ID token
    const payload = await verifyGoogleToken(idToken);

    // Find or create user
    const user = await findOrCreateUser(payload);

    // Generate JWT tokens
    const tokens = generateTokens(user);

    // Check if user needs to complete profile
    const needsProfileCompletion = user.dateOfBirth.getFullYear() === 1900 || 
                                   user.gender === 'prefer-not-to-say';

    res.status(200).json({
      success: true,
      message: needsProfileCompletion ? 'User created, profile completion required' : 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.fullname,
          nickname: user.nickname,
          profilePicture: user.profilePicture,
          needsProfileCompletion
        },
        tokens
      }
    });
  } catch (error) {
    throw new AppError('Authentication failed', 401);
  }
}));

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  // TODO: Implement refresh token logic
  // For now, we'll just return an error since we're not using refresh tokens yet
  res.status(200).json({
    success: false,
    message: 'Refresh token not implemented yet'
  });
}));

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement logout logic (token blacklisting)
  // For now, just return success
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
}));

// @desc    Get current user info
// @route   GET /api/auth/me
// @access  Private
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  // This will be protected by middleware that sets req.user
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
        name: user.fullname,
        nickname: user.nickname,
        bio: user.bio,
        profilePicture: user.profilePicture,
        livingPreferences: user.livingPreferences,
        needsProfileCompletion: user.dateOfBirth.getFullYear() === 1900 || 
                               user.gender === 'prefer-not-to-say'
      }
    }
  });
}));

export default router;
