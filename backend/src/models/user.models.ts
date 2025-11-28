import { Schema, model, Document } from "mongoose";


export interface User extends Document {
  //mandatory fields
  email: string;
  name: string;
  googleId?: string;

  dob?: Date;
  gender?: string;
  profileComplete: boolean;


  //optional fields
  groupName?: string; //chanage this later to group field
  bio?: string;
  profilePicture?: string;
  averageRating?: number; // Average rating from other users
  livingPreferences?: {
    schedule?: 'Morning' | 'Night' | 'Flexible';
    drinking?: 'None' | 'Occasional' | 'Regular';
    partying?: 'None' | 'Occasional' | 'Regular';
    noise?: 'Quiet' | 'Moderate' | 'Loud';
    profession?: 'Student' | 'Worker' | 'Unemployed';
  };

  isOffensive?: boolean;
}

const userSchema = new Schema<User>({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true
  },
  googleId: {
    type: String, 
    unique: true, 
    sparse: true 
  },
  dob: { 
    type: Date, 
  },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Prefer-not-to-say']
  },
  profileComplete: {
    type: Boolean,
    default: false
  },

  //optional fields
  bio: {
    type: String,
    maxlength: 500,
  },
  profilePicture: {
    type: String, // URL to image
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  livingPreferences: {
    schedule: {
      type: String,
      enum: ['Morning', 'Night', 'Flexible']
    },
    drinking: {
      type: String,
      enum: ['None', 'Occasional', 'Regular']
    },
    partying: {
      type: String,
      enum: ['None', 'Occasional', 'Regular']
    },
    noise: {
      type: String,
      enum: ['Quiet', 'Moderate', 'Loud']
    },
    profession: {
      type: String,
      enum: ['Student', 'Worker', 'Unemployed']
    }
  },
  groupName: { 
    type: String
  },
  isOffensive: {
    type: Boolean,
    default: false
  },

});

export const UserModel = model<User>("User", userSchema);

// Default export for compatibility
export default UserModel;