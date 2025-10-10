import express from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// @desc    Get current user profile
// @route   GET /api/user/profile
// @access  Private
router.get('/profile', asyncHandler(async (req, res) => {
  // TODO: Implement get user profile
  res.status(200).json({
    success: true,
    message: 'Get user profile endpoint - to be implemented'
  });
}));

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
router.put('/profile', asyncHandler(async (req, res) => {
  // TODO: Implement update user profile
  res.status(200).json({
    success: true,
    message: 'Update user profile endpoint - to be implemented'
  });
}));

export default router;
