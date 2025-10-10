import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types';

const UserSchema = new Schema<IUser>({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    }
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: 50,
    sparse: true // Allows multiple null values
  },
  bio: {
    type: String,
    maxlength: 500,
    trim: true
  },
  profilePicture: {
    type: String, // URL to image
    trim: true
  },
  livingPreferences: {
    schedule: {
      type: String,
      enum: ['morning', 'night', 'flexible']
    },
    drinking: {
      type: String,
      enum: ['never', 'occasionally', 'regularly']
    },
    partying: {
      type: String,
      enum: ['never', 'occasionally', 'regularly']
    },
    noise: {
      type: String,
      enum: ['quiet', 'moderate', 'loud']
    },
    profession: {
      type: String,
      enum: ['student', 'professional', 'other']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.name.firstName} ${this.name.lastName}`;
});

// Virtual for display name (nickname or full name)
UserSchema.virtual('displayName').get(function() {
  return this.nickname || this.fullName;
});

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });

// Prevent duplicate nicknames
UserSchema.index({ nickname: 1 }, { unique: true, sparse: true });

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
