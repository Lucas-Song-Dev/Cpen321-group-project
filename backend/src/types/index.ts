import { Document } from 'mongoose';

// User related types
export interface IUser extends Document {
  _id: string;
  googleId: string;
  email: string;
  name: {
    firstName: string;
    lastName: string;
  };
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  nickname?: string;
  bio?: string;
  profilePicture?: string;
  livingPreferences?: {
    schedule: 'morning' | 'night' | 'flexible';
    drinking: 'never' | 'occasionally' | 'regularly';
    partying: 'never' | 'occasionally' | 'regularly';
    noise: 'quiet' | 'moderate' | 'loud';
    profession: 'student' | 'professional' | 'other';
  };
  createdAt: Date;
  updatedAt: Date;
}

// Group related types
export interface IGroup extends Document {
  _id: string;
  name: string;
  groupCode: string;
  owner: string; // User ID
  members: Array<{
    userId: string;
    joinDate: Date;
    moveInDate?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Task related types
export interface ITask extends Document {
  _id: string;
  name: string;
  description?: string;
  groupId: string;
  createdBy: string; // User ID
  difficulty: 1 | 2 | 3 | 4 | 5; // Weight of task
  recurrence: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'one-time';
  assignments: Array<{
    userId: string;
    weekStart: Date;
    status: 'incomplete' | 'in-progress' | 'completed';
    completedAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Message related types
export interface IMessage extends Document {
  _id: string;
  groupId: string;
  senderId: string;
  content: string;
  type: 'text' | 'poll';
  pollData?: {
    question: string;
    options: string[];
    votes: Array<{
      userId: string;
      option: string;
      timestamp: Date;
    }>;
    expiresAt: Date;
  };
  createdAt: Date;
}

// Rating related types
export interface IRating extends Document {
  _id: string;
  ratedUserId: string; // User being rated
  raterUserId: string; // User giving the rating
  groupId: string;
  objectiveRating: {
    taskCompletionRate: number; // 0-100%
    punctualityScore: number; // 1-5
    cleanlinessScore: number; // 1-5
  };
  subjectiveRating: {
    overallScore: number; // 1-5
    testimonial?: string;
  };
  cohabitationPeriod: {
    startDate: Date;
    endDate?: Date;
    durationInDays: number;
  };
  createdAt: Date;
}

// Request/Response types
export interface AuthRequest extends Request {
  user?: IUser;
}

export interface CreateGroupRequest {
  name: string;
}

export interface JoinGroupRequest {
  groupCode: string;
}

export interface CreateTaskRequest {
  name: string;
  description?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  recurrence: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'one-time';
}

export interface CreateRatingRequest {
  ratedUserId: string;
  objectiveRating: {
    taskCompletionRate: number;
    punctualityScore: number;
    cleanlinessScore: number;
  };
  subjectiveRating: {
    overallScore: number;
    testimonial?: string;
  };
}

// Socket.IO event types
export interface SocketEvents {
  'join-group': (groupId: string) => void;
  'leave-group': (groupId: string) => void;
  'send-message': (data: {
    groupId: string;
    content: string;
    type: 'text' | 'poll';
    pollData?: any;
  }) => void;
  'new-message': (data: IMessage) => void;
  'send-poll': (data: any) => void;
  'new-poll': (data: any) => void;
}
