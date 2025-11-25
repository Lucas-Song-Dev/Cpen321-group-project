import { Request, Response } from 'express';
import ratingService from '../services/rating.service';

const MINIMUM_GROUP_DURATION_DAYS = 30; // 1 month

export class RatingController {
  /**
   * Create or update a rating
   */
  async createOrUpdateRating(req: Request, res: Response) {
    try {
      const { ratedUserId, groupId, rating, testimonial } = req.body;

      // Validate required fields
      if (!ratedUserId || !groupId || !rating) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: ratedUserId, groupId, rating'
        });
        return;
      }

      // Validate rating is 1-5
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5'
        });
        return;
      }

      // Validate testimonial length if provided
      if (testimonial && testimonial.length > 500) {
        res.status(400).json({
          success: false,
          message: 'Testimonial must be 500 characters or less'
        });
        return;
      }

      const result = await ratingService.createOrUpdateRating(
        req.user!._id,
        ratedUserId,
        groupId,
        rating,
        testimonial
      );

      const statusCode = result.isUpdate ? 200 : 201;
      res.status(statusCode).json({
        success: true,
        message: result.isUpdate ? 'Rating updated successfully' : 'Rating submitted successfully',
        data: result.rating
      });
    } catch (error: any) {
      if (error.message === 'CANNOT_RATE_SELF') {
        res.status(400).json({
          success: false,
          message: 'You cannot rate yourself'
        });
        return;
      }

      if (error.message === 'GROUP_NOT_FOUND') {
        res.status(404).json({
          success: false,
          message: 'Group not found'
        });
        return;
      }

      if (error.message === 'USERS_NOT_IN_SAME_GROUP') {
        res.status(403).json({
          success: false,
          message: 'Both users must be members of the same group'
        });
        return;
      }

      if (error.message.startsWith('RATED_USER_INSUFFICIENT_DURATION:')) {
        const days = error.message.split(':')[1];
        res.status(400).json({
          success: false,
          message: `Cannot rate user who has been in group for less than ${MINIMUM_GROUP_DURATION_DAYS} days (current: ${days} days)`
        });
        return;
      }

      if (error.message.startsWith('RATER_INSUFFICIENT_DURATION:')) {
        const days = error.message.split(':')[1];
        res.status(400).json({
          success: false,
          message: `You must be in the group for at least ${MINIMUM_GROUP_DURATION_DAYS} days before rating (current: ${days} days)`
        });
        return;
      }

      throw error;
    }
  }

  /**
   * Get all ratings for a user
   */
  async getUserRatings(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const result = await ratingService.getUserRatings(userId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get ratings for a user in a specific group
   */
  async getUserRatingsInGroup(req: Request, res: Response) {
    try {
      const { userId, groupId } = req.params;

      const result = await ratingService.getUserRatingsInGroup(userId, groupId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      throw error;
    }
  }
}

export default new RatingController();