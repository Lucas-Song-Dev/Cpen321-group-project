import express from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import ratingController from '../controller/rating.controller';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// @desc    Rate a roommate (1-5 stars, requires >= 30 days in group)
// @route   POST /api/rating
// @access  Private
router.post('/', asyncHandler(ratingController.createOrUpdateRating.bind(ratingController)));

// @desc    Get ratings for a user
// @route   GET /api/rating/:userId
// @access  Public (but protected by middleware above)
router.get('/:userId', asyncHandler(ratingController.getUserRatings.bind(ratingController)));

// @desc    Get ratings for a user in a specific group
// @route   GET /api/rating/user/:userId/group/:groupId
// @access  Private
router.get('/user/:userId/group/:groupId', asyncHandler(ratingController.getUserRatingsInGroup.bind(ratingController)));

export default router;