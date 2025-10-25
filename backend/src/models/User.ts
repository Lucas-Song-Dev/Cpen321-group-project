import { Schema, model, Document } from "mongoose";

export interface User extends Document {
  //mandatory fields
  email: string;
  name: string;
  googleId?: string;

  dob?: Date;
  gender?: string;
  profileComplete: boolean;


  //optional fields for future use
  groupName?: string;
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
  groupName: { 
    type: String
  },
});

export const UserModel = model<User>("User", userSchema);

// const UserSchema = new Schema<IUser>({
//   googleId: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true
//   },
//   fullname: {
//     firstName: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 50
//     },
//     lastName: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 50
//     }
//   },
//   dateOfBirth: {
//     type: Date,
//     required: true
//   },
//   gender: {
//     type: String,
//     required: true,
//     enum: ['male', 'female', 'other', 'prefer-not-to-say']
//   },
//   nickname: {
//     type: String,
//     trim: true,
//     maxlength: 50,
//     sparse: true // Allows multiple null values
//   },
//   bio: {
//     type: String,
//     maxlength: 500,
//     trim: true
//   },
//   profilePicture: {
//     type: String, // URL to image
//     trim: true
//   },
//   livingPreferences: {
//     schedule: {
//       type: String,
//       enum: ['morning', 'night', 'flexible']
//     },
//     drinking: {
//       type: String,
//       enum: ['never', 'occasionally', 'regularly']
//     },
//     partying: {
//       type: String,
//       enum: ['never', 'occasionally', 'regularly']
//     },
//     noise: {
//       type: String,
//       enum: ['quiet', 'moderate', 'loud']
//     },
//     profession: {
//       type: String,
//       enum: ['student', 'professional', 'other']
//     }
//   }
// }, {
//   timestamps: true,
//   toJSON: { virtuals: true },
//   toObject: { virtuals: true }
// });

// // Virtual for full name
// UserSchema.virtual('fullName').get(function() {
//   return `${this.fullname.firstName} ${this.fullname.lastName}`;
// });

// // Virtual for display name (nickname or full name)
// UserSchema.virtual('displayName').get(function() {
//   return this.nickname || this.fullname;
// });

// //I DON'T THINK WE NEED THIS- it creates an warning when: npm run dev
// // // Index for faster queries
// // UserSchema.index({ email: 1 });
// // UserSchema.index({ googleId: 1 });
// //
// // // Prevent duplicate nicknames
// // UserSchema.index({ nickname: 1 }, { unique: true, sparse: true });

// const User = mongoose.model<IUser>('User', UserSchema);

// export default User;
