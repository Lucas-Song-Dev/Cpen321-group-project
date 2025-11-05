import mongoose, { Schema, Document, Model } from 'mongoose';
import { IRating } from '../types';

// Interface for static methods
interface IRatingModel extends Model<IRating> {
  getAverageRating(userId: string): Promise<{
    averageRating: number;
    totalRatings: number;
  }>;
}

const RatingSchema = new Schema<IRating, IRatingModel>({
  ratedUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  raterUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  testimonial: {
    type: String,
    maxlength: 500,
    trim: true,
    default: ''
  },
  timeSpentMinutes: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
RatingSchema.index({ ratedUserId: 1 });
RatingSchema.index({ raterUserId: 1 });
RatingSchema.index({ groupId: 1 });

// Compound index to prevent duplicate ratings for the same group
RatingSchema.index({ 
  ratedUserId: 1, 
  raterUserId: 1,
  groupId: 1
}, { unique: true });

// Pre-save middleware to validate minimum time spent
// Note: Time validation is now done in the route handler based on join dates
RatingSchema.pre('save', function(next) {
  if (this.timeSpentMinutes < 0) {
    next(new Error('Time spent cannot be negative')); return;
  }
  next();
});

// Static method to get average rating for a user
RatingSchema.statics.getAverageRating = async function(userId: string) {
  const result = await this.aggregate([
    { $match: { ratedUserId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || {
    averageRating: 0,
    totalRatings: 0
  };
};

const Rating = mongoose.model<IRating, IRatingModel>('Rating', RatingSchema);

export default Rating;
