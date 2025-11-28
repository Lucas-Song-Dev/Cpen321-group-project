// import { Document } from 'mongoose';
import { Document, Types } from 'mongoose';


// User related types - matches the actual User model
export interface IUser extends Document {
  _id: string;
  email: string;
  name: string;
  googleId?: string;
  dob?: Date;
  gender?: 'Male' | 'Female' | 'Prefer-not-to-say';
  profileComplete: boolean;
  groupName?: string;
  bio?: string;
  profilePicture?: string;
  averageRating?: number;
  livingPreferences?: {
    schedule?: 'Morning' | 'Night' | 'Flexible';
    drinking?: 'None' | 'Occasional' | 'Regular';
    partying?: 'None' | 'Occasional' | 'Regular';
    noise?: 'Quiet' | 'Moderate' | 'Loud';
    profession?: 'Student' | 'Worker' | 'Unemployed';
  };
  isOffensive?: boolean;
}

// Group related types
export interface IGroup extends Document {
  _id: string;
  name: string;
  groupCode: string;
  owner: Types.ObjectId; //USER ID - fixed
  members: Array<{
    userId: Types.ObjectId;
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
  groupId: Types.ObjectId; 
  createdBy: Types.ObjectId;  // User ID
  difficulty: 1 | 2 | 3 | 4 | 5; // Weight of task
  recurrence: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'one-time';
  requiredPeople: number; // Number of people needed to complete the task
  deadline?: Date; // Optional deadline for one-time tasks
  assignments: Array<{
    userId: Types.ObjectId; 
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
  groupId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  type: 'text' | 'poll';
  pollData?: {
    question: string;
    options: string[];
    votes: Array<{
      userId: Types.ObjectId;
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
  ratedUserId: Types.ObjectId; // User being rated
  raterUserId: Types.ObjectId; // User giving the rating
  groupId: Types.ObjectId;
  rating: number; // 1-5 star rating
  testimonial?: string; // Optional text review (max 500 chars)
  timeSpentMinutes: number; // Time spent together in minutes (auto-calculated from join dates)
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
  requiredPeople: number;
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
