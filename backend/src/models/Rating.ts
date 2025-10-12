import mongoose, { Schema, Document } from 'mongoose';
import { IRating } from '../types';

const RatingSchema = new Schema<IRating>({
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
  objectiveRating: {
    taskCompletionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      validate: {
        validator: (value: number) => value >= 0 && value <= 100,
        message: 'Task completion rate must be between 0 and 100'
      }
    },
    punctualityScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Punctuality score must be an integer between 1 and 5'
      }
    },
    cleanlinessScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Cleanliness score must be an integer between 1 and 5'
      }
    }
  },
  subjectiveRating: {
    overallScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Overall score must be an integer between 1 and 5'
      }
    },
    testimonial: {
      type: String,
      maxlength: 300,
      trim: true
    }
  },
  cohabitationPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    durationInDays: {
      type: Number,
      required: true,
      min: 30 // Minimum 30 days to rate someone
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for overall objective score
RatingSchema.virtual('overallObjectiveScore').get(function() {
  const { taskCompletionRate, punctualityScore, cleanlinessScore } = this.objectiveRating;
  
  // Convert task completion rate to 1-5 scale
  const taskScore = Math.round((taskCompletionRate / 100) * 4) + 1;
  
  // Calculate average
  return Math.round((taskScore + punctualityScore + cleanlinessScore) / 3);
});

// Virtual for combined score (objective + subjective)
RatingSchema.virtual('combinedScore').get(function() {
  return Math.round((this.objectiveRating.overallScore + this.subjectiveRating.overallScore) / 2);
});

// Index for faster queries
RatingSchema.index({ ratedUserId: 1 });
RatingSchema.index({ raterUserId: 1 });
RatingSchema.index({ groupId: 1 });

// Compound index to prevent duplicate ratings
RatingSchema.index({ 
  ratedUserId: 1, 
  raterUserId: 1 
}, { unique: true });

// Index for sorting by score
RatingSchema.index({ 'subjectiveRating.overallScore': -1 });
RatingSchema.index({ 'objectiveRating.taskCompletionRate': -1 });

// Pre-save middleware to calculate duration
RatingSchema.pre('save', function(next) {
  const endDate = this.cohabitationPeriod.endDate || new Date();
  const startDate = this.cohabitationPeriod.startDate;
  
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  this.cohabitationPeriod.durationInDays = diffDays;
  
  // Validate minimum cohabitation period
  if (diffDays < 30) {
    return next(new Error('Minimum cohabitation period of 30 days required to rate someone'));
  }
  
  next();
});

// Static method to get average ratings for a user
RatingSchema.statics.getAverageRatings = async function(userId: string) {
  const result = await this.aggregate([
    { $match: { ratedUserId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        averageOverallScore: { $avg: '$subjectiveRating.overallScore' },
        averageTaskCompletion: { $avg: '$objectiveRating.taskCompletionRate' },
        averagePunctuality: { $avg: '$objectiveRating.punctualityScore' },
        averageCleanliness: { $avg: '$objectiveRating.cleanlinessScore' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || {
    averageOverallScore: 0,
    averageTaskCompletion: 0,
    averagePunctuality: 0,
    averageCleanliness: 0,
    totalRatings: 0
  };
};

const Rating = mongoose.model<IRating>('Rating', RatingSchema);

export default Rating;
