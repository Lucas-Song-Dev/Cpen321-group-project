import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { RatingController } from '../controller/rating.controller';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// @desc    Rate a roommate (1-5 stars, requires >= 5 minutes time spent)
// @route   POST /api/rating
router.post('/', (req, res) => RatingController.rateRoommate(req, res));

// @desc    Get ratings for a user
// @route   GET /api/rating/:userId
router.get('/:userId', (req, res) => RatingController.getRatingsForUser(req, res));

// @desc    Get ratings for a user in a specific group
// @route   GET /api/rating/user/:userId/group/:groupId
router.get('/user/:userId/group/:groupId', (req, res) => RatingController.getRatingsForUserInGroup(req, res));

export default router;
