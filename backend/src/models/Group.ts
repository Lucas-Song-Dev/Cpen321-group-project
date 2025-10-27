import mongoose, { Schema, Document } from 'mongoose';
import { IGroup } from '../types';

const GroupSchema = new Schema<IGroup>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  groupCode: {
    type: String,
    required: false, // Will be generated in pre-save hook
    unique: true,
    uppercase: true,
    length: 4 //generated 4-character codes
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinDate: {
      type: Date,
      default: Date.now
    },
    moveInDate: {
      type: Date
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for member count
GroupSchema.virtual('memberCount').get(function() {
  return this.members?.length || 0;
});

// Virtual to check if group is full (max 8 members)
GroupSchema.virtual('isFull').get(function() {
  return (this.members?.length || 0) >= 8;
});

//I DON'T THINK WE NEED THIS- it creates an warning when: npm run dev
// // Index for faster queries
// GroupSchema.index({ groupCode: 1 });
// GroupSchema.index({ owner: 1 });
// GroupSchema.index({ 'members.userId': 1 });

// Ensure maximum 8 members
GroupSchema.pre('save', function(next) {
  if (this.members.length > 8) {
    return next(new Error('Group cannot have more than 8 members'));
  }
  next();
});

// Generate unique group code before saving
GroupSchema.pre('save', async function(next) {
  if (!this.groupCode) {
    let code: string;
    let isUnique = false;
    
    while (!isUnique) {
      // Generate 4-character alphanumeric code
      code = Math.random().toString(36).substring(2, 6).toUpperCase();
      const existingGroup = await mongoose.model('Group').findOne({ groupCode: code });
      isUnique = !existingGroup;
    }
    
    this.groupCode = code!;
  }
  next();
});

const Group = mongoose.model<IGroup>('Group', GroupSchema);

export default Group;
