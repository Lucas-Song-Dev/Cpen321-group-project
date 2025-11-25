import mongoose, { Schema, Document } from 'mongoose';
import { IMessage } from '../types/index.types';

const MessageSchema = new Schema<IMessage>({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'poll'],
    default: 'text'
  },
  pollData: {
    question: {
      type: String,
      maxlength: 200,
      trim: true
    },
    options: [{
      type: String,
      maxlength: 100,
      trim: true
    }],
    votes: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      option: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    expiresAt: {
      type: Date,
      default: function() {
        // Default expiration: 1 week from now
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for poll results
MessageSchema.virtual('pollResults').get(function() {
  if (this.type !== 'poll' || !this.pollData) return null;
  
  const results: Record<string, number> = {};
  
  // Initialize all options with 0 votes
  this.pollData.options.forEach((option: string) => {
    results[option] = 0;
  });
  
  // Count votes
  this.pollData.votes.forEach((vote: { option: string }) => {
    results[vote.option] = (results[vote.option] || 0) + 1;
  });
  
  return results;
});

// Virtual to check if poll is expired
MessageSchema.virtual('isPollExpired').get(function() {
  if (this.type !== 'poll' || !this.pollData) return false;
  return new Date() > this.pollData.expiresAt;
});

// Virtual for total poll votes
MessageSchema.virtual('totalPollVotes').get(function() {
  if (this.type !== 'poll' || !this.pollData) return 0;
  return this.pollData.votes.length;
});

// Index for faster queries
MessageSchema.index({ groupId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ type: 1 });
MessageSchema.index({ 'pollData.expiresAt': 1 });

// Method to add a vote to a poll
MessageSchema.methods.addVote = function(userId: string, option: string) {
  if (this.type !== 'poll' || !this.pollData) {
    throw new Error('Cannot vote on non-poll message');
  }
  
  if (this.isPollExpired) {
    throw new Error('Poll has expired');
  }
  
  // Remove existing vote from this user
  this.pollData.votes = this.pollData.votes.filter((vote: { userId: mongoose.Types.ObjectId }) => 
    vote.userId.toString() !== userId.toString()
  );
  
  // Add new vote
  this.pollData.votes.push({
    userId,
    option,
    timestamp: new Date()
  });
};

// Method to check if user has voted
MessageSchema.methods.hasUserVoted = function(userId: string) {
  if (this.type !== 'poll' || !this.pollData) return false;
  
  return this.pollData.votes.some((vote: { userId: mongoose.Types.ObjectId }) => 
    vote.userId.toString() === userId.toString()
  );
};

const Message = mongoose.model<IMessage>('Message', MessageSchema);
export default Message;
