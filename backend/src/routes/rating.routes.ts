import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import ratingController from '../controller/rating.controller';
import Rating from '../models/rating.models';
import mongoose from 'mongoose';


const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// @desc    Rate a roommate (1-5 stars, requires >= 5 minutes time spent)
// @route   POST /api/rating
// router.post('/', asyncHandler(ratingController.rateRoommate.bind(ratingController)));
router.post('/', asyncHandler(ratingController.rateRoommate.bind(ratingController)));







// @desc    Get ratings for a user
// @route   GET /api/rating/:userId
router.get('/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  // Get all ratings for the user
  const ratings = await Rating.find({ ratedUserId: userId })
    .populate('raterUserId', 'name email')
    .populate('groupId', 'name');
  
  // Get average rating
  const ratingStats = await Rating.getAverageRating(userId);
  
  res.status(200).json({
    success: true,
    data: {
      ratings,
      averageRating: ratingStats.averageRating,
      totalRatings: ratingStats.totalRatings
    }
  });
}));

// @desc    Get ratings for a user in a specific group
// @route   GET /api/rating/user/:userId/group/:groupId
router.get('/user/:userId/group/:groupId', asyncHandler(async (req: Request, res: Response) => {
  const { userId, groupId } = req.params;
  
  // Get ratings for the user in the group
  const ratings = await Rating.find({ 
    ratedUserId: userId,
    groupId 
  })
    .populate('raterUserId', 'name email')
    .sort({ createdAt: -1 });
  
  // Get average rating in this group
  const ratingStats = await Rating.aggregate([
    { 
      $match: { 
        ratedUserId: new mongoose.Types.ObjectId(userId),
        groupId: new mongoose.Types.ObjectId(groupId)
      } 
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      ratings,
      averageRating: ratingStats[0]?.averageRating || 0,
      totalRatings: ratingStats[0]?.totalRatings || 0
    }
  });
}));

export default router;
