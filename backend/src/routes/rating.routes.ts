import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { RatingController } from '../controller/rating.controller';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// @desc    Rate a roommate (1-5 stars, requires >= 5 minutes time spent)
// @route   POST /api/rating
router.post('/', RatingController.rateRoommate);

// @desc    Get ratings for a user
// @route   GET /api/rating/:userId
router.get('/:userId', RatingController.getRatingsForUser);

// @desc    Get ratings for a user in a specific group
// @route   GET /api/rating/user/:userId/group/:groupId
router.get('/user/:userId/group/:groupId', RatingController.getRatingsForUserInGroup);

export default router;
