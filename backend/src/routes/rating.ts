import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Rating from '../models/Rating';
import { UserModel } from '../models/User';
import Group from '../models/Group';
import mongoose from 'mongoose';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// @desc    Rate a roommate (1-5 stars, requires >= 5 minutes time spent)
// @route   POST /api/rating
// @access  Private
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { ratedUserId, groupId, rating, testimonial } = req.body;
  
  // Validate required fields (timeSpentMinutes no longer required from client)
  if (!ratedUserId || !groupId || !rating) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: ratedUserId, groupId, rating'
    });
  }
  
  // Validate rating is 1-5
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be an integer between 1 and 5'
    });
  }
  
  // Validate testimonial length if provided
  if (testimonial && testimonial.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Testimonial must be 500 characters or less'
    });
  }
  
  // Cannot rate yourself
  if (ratedUserId === req.user!._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot rate yourself'
    });
  }
  
  // Verify both users are in the same group and check their join duration
  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found'
    });
  }
  
  const ratedUserMember = group.members.find(m => m.userId.toString() === ratedUserId);
  const raterMember = group.members.find(m => m.userId.toString() === req.user!._id.toString());
  
  if (!ratedUserMember || !raterMember) {
    return res.status(403).json({
      success: false,
      message: 'Both users must be members of the same group'
    });
  }
  
  // Check that both users have been in the group for at least 1 month (30 days)
  const now = new Date();
  const ratedUserDurationMs = now.getTime() - new Date(ratedUserMember.joinDate).getTime();
  const raterDurationMs = now.getTime() - new Date(raterMember.joinDate).getTime();
  const ratedUserDays = Math.floor(ratedUserDurationMs / (1000 * 60 * 60 * 24));
  const raterDays = Math.floor(raterDurationMs / (1000 * 60 * 60 * 24));
  
  const MINIMUM_GROUP_DURATION_DAYS = 30; // 1 month
  
  if (ratedUserDays < MINIMUM_GROUP_DURATION_DAYS) {
    return res.status(400).json({
      success: false,
      message: `Cannot rate user who has been in group for less than ${MINIMUM_GROUP_DURATION_DAYS} days (current: ${ratedUserDays} days)`
    });
  }
  
  if (raterDays < MINIMUM_GROUP_DURATION_DAYS) {
    return res.status(400).json({
      success: false,
      message: `You must be in the group for at least ${MINIMUM_GROUP_DURATION_DAYS} days before rating (current: ${raterDays} days)`
    });
  }
  
  console.log(`Rating validation: Rated user in group for ${ratedUserDays} days, Rater in group for ${raterDays} days`);

  // Calculate time spent together (minimum of both users' durations)
  const timeSpentDays = Math.min(ratedUserDays, raterDays);
  const timeSpentMinutes = timeSpentDays * 24 * 60; // Convert to minutes
  
  console.log(`Auto-calculated time spent together: ${timeSpentDays} days (${timeSpentMinutes} minutes)`);

  // Check if rating already exists (for logging purposes)
  const existingRating = await Rating.findOne({
    ratedUserId: new mongoose.Types.ObjectId(ratedUserId),
    raterUserId: new mongoose.Types.ObjectId(req.user!._id),
    groupId: new mongoose.Types.ObjectId(groupId)
  });
  
  if (existingRating) {
    console.log(`Updating existing rating: ${existingRating._id} (old rating: ${existingRating.rating}, new rating: ${rating})`);
  } else {
    console.log(`Creating new rating for user ${ratedUserId} by ${req.user!._id} in group ${groupId}`);
  }
  
  // Create or update rating (upsert ensures one rating per user pair per group)
  const newRating = await Rating.findOneAndUpdate(
    {
      ratedUserId: new mongoose.Types.ObjectId(ratedUserId),
      raterUserId: new mongoose.Types.ObjectId(req.user!._id),
      groupId: new mongoose.Types.ObjectId(groupId)
    },
    {
      rating,
      testimonial: testimonial || '',
      timeSpentMinutes
    },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  );
  
  // Update the rated user's average rating
  const ratingStats = await Rating.getAverageRating(ratedUserId);
  await UserModel.findByIdAndUpdate(
    ratedUserId,
    { averageRating: Math.round(ratingStats.averageRating * 10) / 10 }
  );
  
  res.status(201).json({
    success: true,
    message: 'Rating submitted successfully',
    data: newRating
  });
}));

// @desc    Get ratings for a user
// @route   GET /api/rating/:userId
// @access  Public
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
// @access  Private
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
