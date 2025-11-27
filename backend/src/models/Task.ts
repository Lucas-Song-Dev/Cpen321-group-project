import mongoose, { Schema, Document } from 'mongoose';
import { ITask } from '../types';

const TaskSchema = new Schema<ITask>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Difficulty must be an integer between 1 and 5'
    }
  },
  recurrence: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'one-time']
  },
  requiredPeople: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 1,
    validate: {
      validator: Number.isInteger,
      message: 'Required people must be an integer between 1 and 10'
    }
  },
  deadline: {
    type: Date,
    required: function(this: any) {
      return this.recurrence === 'one-time';
    },
    validate: {
      validator: function(this: any, value: Date) {
        if (this.recurrence === 'one-time' && value) {
          return value > new Date();
        }
        return true;
      },
      message: 'Deadline must be in the future for one-time tasks'
    }
  },
  assignments: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    weekStart: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['incomplete', 'in-progress', 'completed'],
      default: 'incomplete'
    },
    completedAt: {
      type: Date
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for completion rate
TaskSchema.virtual('completionRate').get(function(this: any) {
  if (this.assignments.length === 0) return 0;
  const completed = this.assignments.filter((assignment: any) => 
    assignment.status === 'completed'
  ).length;
  return Math.round((completed / this.assignments.length) * 100);
});

// Virtual for current week assignment
TaskSchema.virtual('currentWeekAssignment').get(function(this: any) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  return this.assignments.find((assignment: any) => 
    assignment.weekStart.getTime() === startOfWeek.getTime()
  );
});

// Index for faster queries
TaskSchema.index({ groupId: 1 });
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ 'assignments.userId': 1 });
TaskSchema.index({ 'assignments.weekStart': 1 });

// Method to assign task to users for a specific week
TaskSchema.methods.assignToWeek = function(weekStart: Date, userIds: string[]) {
  // Remove existing assignment for this week
  this.assignments = this.assignments.filter((assignment: any) => 
    assignment.weekStart.getTime() !== weekStart.getTime()
  );
  
  // Add new assignments
  userIds.forEach(userId => {
    this.assignments.push({
      userId,
      weekStart,
      status: 'incomplete'
    });
  });
};

const Task = mongoose.model<ITask>('Task', TaskSchema);

export default Task;
