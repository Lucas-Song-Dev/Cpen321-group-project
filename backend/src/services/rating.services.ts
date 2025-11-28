import Rating from '../models/rating.models';
import { UserModel } from '../models/user.models';
import Group from '../models/group.models';
import mongoose from 'mongoose';

class RatingService {
  async rateRoommate(raterUserId: string, ratedUserId: string, groupId: string, rating: number, testimonial?: string) {
    // Validate rating is 1-5
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('RATING_INVALID');
    }

    // Validate testimonial length if provided
    if (testimonial && testimonial.length > 500) {
      throw new Error('TESTIMONIAL_TOO_LONG');
    }

    // Cannot rate yourself
    if (ratedUserId === raterUserId) {
      throw new Error('SELF_RATING_NOT_ALLOWED');
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

    const MINIMUM_GROUP_DURATION_DAYS = 30; // 1 month

    if (ratedUserDays < MINIMUM_GROUP_DURATION_DAYS) {
      throw new Error(`RATED_USER_INSUFFICIENT_TIME:${ratedUserDays}`);
    }

    if (raterDays < MINIMUM_GROUP_DURATION_DAYS) {
      throw new Error(`RATER_INSUFFICIENT_TIME:${raterDays}`);
    }

    // Calculate time spent together (minimum of both users' durations)
    const timeSpentDays = Math.min(ratedUserDays, raterDays);
    const timeSpentMinutes = timeSpentDays * 24 * 60; // Convert to minutes

    // Create or update rating (upsert ensures one rating per user pair per group)
    const newRating = await Rating.findOneAndUpdate(
      {
        ratedUserId: new mongoose.Types.ObjectId(ratedUserId),
        raterUserId: new mongoose.Types.ObjectId(raterUserId),
        groupId: new mongoose.Types.ObjectId(groupId)
      },
      {
        rating,
        testimonial: testimonial ?? '',
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

    return newRating;
  }

  async getRatingsForUser(userId: string) {
    // Get all ratings for the user
    const ratings = await Rating.find({ ratedUserId: userId })
      .populate('raterUserId', 'name email')
      .populate('groupId', 'name');

    // Get average rating
    const ratingStats = await Rating.getAverageRating(userId);

    return {
      ratings,
      averageRating: ratingStats.averageRating,
      totalRatings: ratingStats.totalRatings
    };
  }
}

export default new RatingService();
