import express from 'express';
import { RatingController } from '../controller/rating.controller';
import { protect } from '../middleware/auth.middleware';

const rateRouter = express.Router();

// All routes below this middleware are protected
rateRouter.use(protect);

// @desc    Rate a roommate (1-5 stars, requires >= 5 minutes time spent)
// @route   POST /api/rating
rateRouter.post('/', RatingController.rateRoommate);

// @desc    Get ratings for a user
// @route   GET /api/rating/:userId
rateRouter.get('/:userId', RatingController.getRatingsForUser);

// @desc    Get ratings for a user in a specific group
// @route   GET /api/rating/user/:userId/group/:groupId
rateRouter.get('/user/:userId/group/:groupId', RatingController.getRatingsForUserInGroup);

export default rateRouter;
