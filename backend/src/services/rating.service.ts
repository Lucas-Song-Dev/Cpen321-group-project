import Rating from '../models/rating.models';
import { UserModel } from '../models/user.models';
import Group from '../models/group.models';
import mongoose from 'mongoose';

const MINIMUM_GROUP_DURATION_DAYS = 30; // 1 month

export class RatingService {
  /**
   * Create or update a rating
   */
  async createOrUpdateRating(
    raterUserId: string,
    ratedUserId: string,
    groupId: string,
    rating: number,
    testimonial?: string
  ) {
    // Cannot rate yourself
    if (ratedUserId === raterUserId) {
      throw new Error('CANNOT_RATE_SELF');
    }

    // Verify both users are in the same group and check their join duration
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('GROUP_NOT_FOUND');
    }

    const ratedUserMember = group.members.find(m => m.userId.toString() === ratedUserId);
    const raterMember = group.members.find(m => m.userId.toString() === raterUserId);

    if (!ratedUserMember || !raterMember) {
      throw new Error('USERS_NOT_IN_SAME_GROUP');
    }

    // Check that both users have been in the group for at least 1 month (30 days)
    const now = new Date();
    const ratedUserDurationMs = now.getTime() - new Date(ratedUserMember.joinDate).getTime();
    const raterDurationMs = now.getTime() - new Date(raterMember.joinDate).getTime();
    const ratedUserDays = Math.floor(ratedUserDurationMs / (1000 * 60 * 60 * 24));
    const raterDays = Math.floor(raterDurationMs / (1000 * 60 * 60 * 24));

    if (ratedUserDays < MINIMUM_GROUP_DURATION_DAYS) {
      throw new Error(`RATED_USER_INSUFFICIENT_DURATION:${ratedUserDays}`);
    }

    if (raterDays < MINIMUM_GROUP_DURATION_DAYS) {
      throw new Error(`RATER_INSUFFICIENT_DURATION:${raterDays}`);
    }

    // Calculate time spent together (minimum of both users' durations)
    const timeSpentDays = Math.min(ratedUserDays, raterDays);
    const timeSpentMinutes = timeSpentDays * 24 * 60; // Convert to minutes

    // Check if rating already exists
    const existingRating = await Rating.findOne({
      ratedUserId: new mongoose.Types.ObjectId(ratedUserId),
      raterUserId: new mongoose.Types.ObjectId(raterUserId),
      groupId: new mongoose.Types.ObjectId(groupId)
    });

    // Create or update rating (upsert ensures one rating per user pair per group)
    const newRating = await Rating.findOneAndUpdate(
      {
        ratedUserId: new mongoose.Types.ObjectId(ratedUserId),
        raterUserId: new mongoose.Types.ObjectId(raterUserId),
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

    return {
      rating: newRating,
      isUpdate: !!existingRating
    };
  }

  /**
   * Get all ratings for a user
   */
  async getUserRatings(userId: string) {
    try {
      const ratings = await Rating.find({ ratedUserId: userId })
        .populate('raterUserId', 'name email')
        .populate('groupId', 'name');
      
      const ratingStats = await Rating.getAverageRating(userId);
      
      return {
        ratings,
        averageRating: ratingStats.averageRating,
        totalRatings: ratingStats.totalRatings
      };
    } catch (err) {
      // Gracefully degrade to empty result if aggregation/populate fails
      console.error('Error fetching user ratings:', err);
      return {
        ratings: [],
        averageRating: 0,
        totalRatings: 0
      };
    }
  }

  /**
   * Get ratings for a user in a specific group
   */
  async getUserRatingsInGroup(userId: string, groupId: string) {
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

    return {
      ratings,
      averageRating: ratingStats[0]?.averageRating || 0,
      totalRatings: ratingStats[0]?.totalRatings || 0
    };
  }
}

export default new RatingService();