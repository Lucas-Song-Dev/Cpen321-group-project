import { Request, Response } from 'express';
import ratingService from '../services/rating.services';

export const RatingController = {
  rateRoommate: async (req: Request, res: Response) => {
    try {
        const ratedUserId = String(req.body.ratedUserId);
        const groupId = String(req.body.groupId);
        const rating = Number(req.body.rating);
        const testimonial = req.body.testimonial ? String(req.body.testimonial) : undefined;

      // Validate required fields
      if (!ratedUserId || !groupId || !rating) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: ratedUserId, groupId, rating'
        });
      }

      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const raterUserId = String(req.user._id);

      if (typeof raterUserId !== 'string') {
        return res.status(401).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      const newRating = await ratingService.rateRoommate(raterUserId, ratedUserId, groupId, rating, testimonial);

      return res.status(201).json({
        success: true,
        message: 'Rating submitted successfully',
        data: newRating
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'RATING_INVALID':
            return res.status(400).json({
              success: false,
              message: 'Rating must be an integer between 1 and 5'
            });
          case 'TESTIMONIAL_TOO_LONG':
            return res.status(400).json({
              success: false,
              message: 'Testimonial must be 500 characters or less'
            });
          case 'SELF_RATING_NOT_ALLOWED':
            return res.status(400).json({
              success: false,
              message: 'You cannot rate yourself'
            });
          case 'GROUP_NOT_FOUND':
            return res.status(404).json({
              success: false,
              message: 'Group not found'
            });
          case 'USERS_NOT_IN_SAME_GROUP':
            return res.status(403).json({
              success: false,
              message: 'Both users must be members of the same group'
            });
        }

        // Handle dynamic error messages for insufficient time
        if (error.message.startsWith('RATED_USER_INSUFFICIENT_TIME:')) {
          const days = error.message.split(':')[1];
          return res.status(400).json({
            success: false,
            message: `Cannot rate user who has been in group for less than 30 days (current: ${days} days)`
          });
        }

        if (error.message.startsWith('RATER_INSUFFICIENT_TIME:')) {
          const days = error.message.split(':')[1];
          return res.status(400).json({
            success: false,
            message: `You must be in the group for at least 30 days before rating (current: ${days} days)`
          });
        }
      }

      throw error;
    }
  },

  getRatingsForUser: async (req: Request, res: Response) => {
      const { userId } = req.params;

      const data = await ratingService.getRatingsForUser(userId);

      return res.status(200).json({
        success: true,
        data
      });
  },

  getRatingsForUserInGroup: async (req: Request, res: Response) => {
      const { userId, groupId } = req.params;

      const data = await ratingService.getRatingsForUserInGroup(userId, groupId);

      return res.status(200).json({
        success: true,
        data
      });
  }
};
