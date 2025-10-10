import express from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// @desc    Rate a roommate
// @route   POST /api/rating
// @access  Private
router.post('/', asyncHandler(async (req, res) => {
  // TODO: Implement rate roommate
  res.status(200).json({
    success: true,
    message: 'Rate roommate endpoint - to be implemented'
  });
}));

// @desc    Get ratings for a user
// @route   GET /api/rating/:userId
// @access  Public
router.get('/:userId', asyncHandler(async (req, res) => {
  // TODO: Implement get user ratings
  res.status(200).json({
    success: true,
    message: 'Get user ratings endpoint - to be implemented'
  });
}));

export default router;
