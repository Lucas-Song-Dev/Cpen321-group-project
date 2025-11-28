import { UserModel } from "../models/user.models";
import jwt from "jsonwebtoken";
import { config } from "../config";


export const AuthService = {
  signup: async (email: string, name: string, googleId: string) => {
    try {
      let user = await UserModel.findOne({ email });
      if (user) {
        return { success: false, message: "User already exists. Please log in instead." };
      }

      user = new UserModel({email, name, googleId, profileComplete: false});
      await user.save();

      const token = jwt.sign({ email: user.email, id: user._id }, config.JWT_SECRET, { expiresIn: "1h" });
      return {
        success: true,
        message: "Signup successful!",
        user: { 
          _id: String(user._id),
          email: user.email, 
          name: user.name,
          dob: user.dob || null,
          gender: user.gender || null,
          profileComplete: user.profileComplete,
          bio: user.bio || null,
          profilePicture: user.profilePicture || null,
          livingPreferences: user.livingPreferences || null,
          groupName: user.groupName || null
        },
        token,
      };
    } catch (err) {
      console.error(err);
      return { success: false, message: "Signup failed due to server error" };
    }
  },

  login: async (email: string) => {
    try {
      console.log('Logging in user with email:', email);
      const user = await UserModel.findOne({ email });
      if (!user) {
        return { success: false, message: "User does not exist. Please sign up first." };
      }

      const token = jwt.sign({ email: user.email, id: user._id }, config.JWT_SECRET, { expiresIn: "1h" });
      return {
        success: true,
        message: "Login successful!",
        user: { 
          _id: String(user._id),
          email: user.email, 
          name: user.name,
          dob: user.dob || null,
          gender: user.gender || null,
          profileComplete: user.profileComplete,
          bio: user.bio || null,
          profilePicture: user.profilePicture || null,
          livingPreferences: user.livingPreferences || null,
          groupName: user.groupName || null
        },
        token,
      };
    } catch (err) {
      console.error(err);
      return { success: false, message: "Login failed due to server error" };
    }
  },
};