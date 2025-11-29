import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { UserModel } from '../models/user.models';
import { uploadProfilePicture } from '../services/storageService';
import Group from '../models/group.models';

export const UserController = {
  setProfile: async (req: Request, res: Response): Promise<void> => {
    const { email, dob, gender } = req.body;

    //validate inputs
    if (!email || !dob || !gender) {
      res.status(400).json({ success: false, message: 'Email, DOB, and gender are required' });
      return;
    }
    
    if (!['Male', 'Female', 'Prefer-not-to-say'].includes(gender)) {
      res.status(400).json({ success: false, message: 'Invalid gender value' });
      return;
    }

    try {
      //find user by email (remove JWT check)
      const user = await UserModel.findOne({ email });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      //enforce immutability
      if (user.dob ?? user.gender) {
        res.status(400).json({ success: false, message: 'DOB and gender cannot be changed once set' });
        return;
      }

      //validate DOB format (expects 'YYYY-MM-DD')
      //NEED TO LATER ADD to handle other formats and error for invalid date inputs
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime())) {
        res.status(400).json({ success: false, message: 'Invalid DOB format' });
        return;
      }
    // console.log('Parsed DOB:', dobDate);

      // Update user
      user.dob = dobDate;
      user.gender = gender;
      user.profileComplete = true;
      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          email: user.email,
          name: user.name,
          dob: user.dob,
          gender: user.gender,
          profileComplete: user.profileComplete,
          groupName: user.groupName ?? null,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  //for optional profile settings/updates
  updateProfile: async (req: Request, res: Response): Promise<void> => {
    const { email, bio, profilePicture, livingPreferences } = req.body;

    console.log('calling updateOptionalProfile');
  
    //validate inputs
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    // Validate livingPreferences if provided
    if (livingPreferences) {
      const validSchedules = ['Morning', 'Night', 'Flexible'];
      const validFrequencies =  ['None', 'Occasional', 'Regular'];
      const validNoise = ['Quiet', 'Moderate', 'Loud'];
      const validProfessions = ['Student', 'Worker', 'Unemployed'];


      if (typeof livingPreferences.schedule === 'string' && !validSchedules.includes(livingPreferences.schedule)) {
        res.status(400).json({ success: false, message: 'Invalid schedule value' });
        return;
      }
      if (typeof livingPreferences.drinking === 'string' && !validFrequencies.includes(livingPreferences.drinking)) {
        res.status(400).json({ success: false, message: 'Invalid drinking value' });
        return;
      }
      if (typeof livingPreferences.partying === 'string' && !validFrequencies.includes(livingPreferences.partying)) {
        res.status(400).json({ success: false, message: 'Invalid partying value' });
        return;
      }
      if (typeof livingPreferences.noise === 'string' && !validNoise.includes(livingPreferences.noise)) {
        res.status(400).json({ success: false, message: 'Invalid noise value' });
        return;
      }
      if (typeof livingPreferences.profession === 'string' && !validProfessions.includes(livingPreferences.profession)) {
        res.status(400).json({ success: false, message: 'Invalid profession value' });
        return;
      }
    }

    // Validate bio length
    if (bio && bio.length > 500) {
      res.status(400).json({ success: false, message: 'Bio must be 500 characters or less' });
      return;
    }

    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Check if mandatory profile is complete
      if (!user.profileComplete) {
        res.status(400).json({ 
          success: false, 
          message: 'Please complete your basic profile first (DOB and gender)' 
        });
        return;
      }

      // Update optional fields (only update fields that are provided)
      if (bio !== undefined) user.bio = bio;

      // Handle profile picture updates:
      // - If profilePicture is undefined, leave existing value unchanged
      // - If it's an empty string, treat it as a request to remove the picture
      // - If it's a data URI, upload to GCS and store the public URL
      // - Otherwise, store the provided value (assumed to be a URL)
      if (profilePicture !== undefined) {
        const trimmed = profilePicture.trim();

        if (trimmed === '') {
          // Explicit remove
          user.profilePicture = undefined;
        } else if (trimmed.startsWith('data:')) {
          // Upload base64-encoded image and store public URL
          const uploadedUrl = await uploadProfilePicture(
            trimmed,
            (user._id as unknown as string)  // cast to string for Storage path
          );
          user.profilePicture = uploadedUrl;
        } else {
          // Assume this is already a URL
          user.profilePicture = trimmed;
        }
      }
      
      if (livingPreferences) {
        if (!user.livingPreferences) {
          user.livingPreferences = {};
        }
        if (livingPreferences.schedule !== undefined) {
          user.livingPreferences.schedule = livingPreferences.schedule;
        }
        if (livingPreferences.drinking !== undefined) {
          user.livingPreferences.drinking = livingPreferences.drinking;
        }
        if (livingPreferences.partying !== undefined) {
          user.livingPreferences.partying = livingPreferences.partying;
        }
        if (livingPreferences.noise !== undefined) {
          user.livingPreferences.noise = livingPreferences.noise;
        }
        if (livingPreferences.profession !== undefined) {
          user.livingPreferences.profession = livingPreferences.profession;
        }
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Optional profile updated successfully',
        user: {
          email: user.email,
          name: user.name,
          dob: user.dob,
          gender: user.gender,
          profileComplete: user.profileComplete,
          bio: user.bio,
          profilePicture: user.profilePicture,
          livingPreferences: user.livingPreferences,
          groupName: user.groupName || null,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  deleteUser: async (req: Request, res: Response): Promise<void> => {
    const timestamp = new Date().toISOString();
      
    try {
      const userId = req.user?._id;
      
      if (!userId) {
              res.status(401).json({ success: false, message: 'Unauthorized' });
              return;
      }

    
      // Remove user from any group memberships first
      const group = await Group.findOne({ 'members.userId': userId });
      if (group) {
              // Filter out the user from members
        group.members = group.members.filter((m: { userId: mongoose.Types.ObjectId }) => m.userId.toString() !== userId.toString());

        // If the user was the owner, transfer ownership or handle empty group
        if (group.owner && group.owner.toString() === userId.toString()) {
          if (group.members.length > 0) {
            // Find the oldest member (earliest join date) to transfer ownership to
            const oldestMember = group.members.reduce((oldest: { userId: mongoose.Types.ObjectId; joinDate: Date }, current: { userId: mongoose.Types.ObjectId; joinDate: Date }) => {
              const oldestDate = new Date(oldest.joinDate);
              const currentDate = new Date(current.joinDate);
              return currentDate < oldestDate ? current : oldest;
            });
            
            const newOwner = oldestMember.userId;
            group.owner = newOwner;
                      
            // Update the new owner's groupName to match the group
            await UserModel.findByIdAndUpdate(newOwner, { groupName: group.name });
                    } else {
            // No members left; delete the group
            await group.deleteOne();
                    }
        }

        // Save group if it still exists and has members
        if (group.members && group.members.length > 0) {
          await group.save();
        }
      }

      // Delete the user
      const deletedUser = await UserModel.findByIdAndDelete(userId);
      
      if (!deletedUser) {
              res.status(404).json({ success: false, message: 'User not found' });
              return;
      }

          
      res.json({
        success: true,
        message: 'Account deleted successfully and group membership updated'
      });
    } catch (err) {
      console.error(`[${timestamp}] DELETE USER: Error:`, err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
};