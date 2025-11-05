import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import Group from '../models/Group';

export const UserController = {
  setProfile: async (req: Request, res: Response) => {
    const { email, dob, gender } = req.body;

    //validate inputs
    if (!email || !dob || !gender) {
      return res.status(400).json({ success: false, message: 'Email, DOB, and gender are required' });
    }
    
    if (!['Male', 'Female', 'Prefer-not-to-say'].includes(gender)) {
      return res.status(400).json({ success: false, message: 'Invalid gender value' });
    }

    try {
      //find user by email (remove JWT check)
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      //enforce immutability
      if (user.dob ?? user.gender) {
        return res.status(400).json({ success: false, message: 'DOB and gender cannot be changed once set' });
      }

      //validate DOB format (expects 'YYYY-MM-DD')
      //NEED TO LATER ADD to handle other formats and error for invalid date inputs
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid DOB format' });
      }
    // console.log('Parsed DOB:', dobDate);

      // Update user
      user.dob = dobDate;
      user.gender = gender;
      user.profileComplete = true;
      await user.save();

      return res.json({
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
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  //for optional profile settings/updates
  updateProfile: async (req: Request, res: Response) => {
    const { email, bio, profilePicture, livingPreferences } = req.body;

    console.log('calling updateOptionalProfile');
    console.log('Received data:', { email, bio, profilePicture, livingPreferences });

    //validate inputs
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Validate livingPreferences if provided
    if (livingPreferences) {
      const validSchedules = ['Morning', 'Night', 'Flexible'];
      const validFrequencies =  ['None', 'Occasional', 'Regular'];
      const validNoise = ['Quiet', 'Moderate', 'Loud'];
      const validProfessions = ['Student', 'Worker', 'Unemployed'];


      if (livingPreferences.schedule && !validSchedules.includes(livingPreferences.schedule)) {
        return res.status(400).json({ success: false, message: 'Invalid schedule value' });
      }
      if (livingPreferences.drinking && !validFrequencies.includes(livingPreferences.drinking)) {
        return res.status(400).json({ success: false, message: 'Invalid drinking value' });
      }
      if (livingPreferences.partying && !validFrequencies.includes(livingPreferences.partying)) {
        return res.status(400).json({ success: false, message: 'Invalid partying value' });
      }
      if (livingPreferences.noise && !validNoise.includes(livingPreferences.noise)) {
        return res.status(400).json({ success: false, message: 'Invalid noise value' });
      }
      if (livingPreferences.profession && !validProfessions.includes(livingPreferences.profession)) {
        return res.status(400).json({ success: false, message: 'Invalid profession value' });
      }
    }

    // Validate bio length
    if (bio && bio.length > 500) {
      return res.status(400).json({ success: false, message: 'Bio must be 500 characters or less' });
    }

    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Check if mandatory profile is complete
      if (!user.profileComplete) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please complete your basic profile first (DOB and gender)' 
        });
      }

      // Update optional fields (only update fields that are provided)
      if (bio !== undefined) user.bio = bio;
      if (profilePicture !== undefined) user.profilePicture = profilePicture;
      
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

      return res.json({
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
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  deleteUser: async (req: Request, res: Response) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] DELETE USER: Starting user deletion`);
    
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        console.log(`[${timestamp}] DELETE USER: No user ID found in request`);
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      console.log(`[${timestamp}] DELETE USER: Deleting user with ID: ${userId}`);

      // Remove user from any group memberships first
      const group = await Group.findOne({ 'members.userId': userId });
      if (group) {
        console.log(`[${timestamp}] DELETE USER: Removing user from group ${group._id}`);
        // Filter out the user from members
        group.members = group.members.filter((m: unknown) => m.userId.toString() !== userId.toString());

        // If the user was the owner, transfer ownership or handle empty group
        if (group.owner && group.owner.toString() === userId.toString()) {
          if (group.members.length > 0) {
            // Find the oldest member (earliest join date) to transfer ownership to
            const oldestMember = group.members.reduce((oldest: unknown, current: any) => {
              const oldestDate = new Date(oldest.joinDate);
              const currentDate = new Date(current.joinDate);
              return currentDate < oldestDate ? current : oldest;
            });
            
            const newOwner = oldestMember.userId;
            group.owner = newOwner as unknown;
            console.log(`[${timestamp}] DELETE USER: Transferred ownership to oldest member ${newOwner} (joined: ${oldestMember.joinDate})`);
            
            // Update the new owner's groupName to match the group
            await UserModel.findByIdAndUpdate(newOwner, { groupName: group.name });
            console.log(`[${timestamp}] DELETE USER: Updated new owner's groupName to ${group.name}`);
          } else {
            // No members left; delete the group
            await group.deleteOne();
            console.log(`[${timestamp}] DELETE USER: Group ${group._id} deleted as it has no members`);
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
        console.log(`[${timestamp}] DELETE USER: User not found`);
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      console.log(`[${timestamp}] DELETE USER: User deleted successfully`);
      
      return res.json({
        success: true,
        message: 'Account deleted successfully and group membership updated'
      });
    } catch (err) {
      console.error(`[${timestamp}] DELETE USER: Error:`, err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },
};