import Group from '../models/group.models';
import { UserModel } from '../models/user.models';
import mongoose from 'mongoose';

interface PopulatedMember {
  userId: {
    _id: mongoose.Types.ObjectId;
    name?: string;
    email?: string;
    bio?: string;
    averageRating?: number;
  };
  joinDate: Date;
}

// interface GroupDocument {
//   _id: mongoose.Types.ObjectId;
//   name: string;
//   owner: mongoose.Types.ObjectId | {
//     _id: string;
//     name: string;
//     email: string;
//     bio: string;
//     averageRating: number;
//   };
//   members: PopulatedMember[];
//   save: () => Promise<void>;
//   populate: (path: string, select: string) => Promise<void>;
// }

class GroupService {
  async createGroup(userId: string, name: string) {
    // Check if user is already in a group
    const existingGroup = await Group.findOne({ 
      'members.userId': new mongoose.Types.ObjectId(userId) 
    });

    if (existingGroup) {
      throw new Error('USER_ALREADY_IN_GROUP');
    }

    // Create new group
    const group = await Group.create({
      name: name.trim(),
      owner: new mongoose.Types.ObjectId(userId),
      members: [{
        userId: new mongoose.Types.ObjectId(userId),
        joinDate: new Date()
      }]
    });

    // Update user's groupName
    await UserModel.findByIdAndUpdate(userId, { 
      groupName: group.name 
    });

    // Populate owner and members information
    await group.populate('owner', 'name email');
    await group.populate('members.userId', 'name email');

    return group;
  }

  async joinGroup(userId: string, groupCode: string) {
    // Find group by code
    const group = await Group.findOne({ groupCode: groupCode.toUpperCase() });

    if (!group) {
      throw new Error('GROUP_NOT_FOUND');
    }

    // Check if user is already a member of this group
    const isAlreadyMember = group.members.some(member => 
      member.userId.toString() === userId
    );

    if (isAlreadyMember) {
      throw new Error('ALREADY_MEMBER_OF_THIS_GROUP');
    }

    // Check if user is already in a different group
    const existingGroup = await Group.findOne({ 
      'members.userId': new mongoose.Types.ObjectId(userId)
    });

    if (existingGroup) {
      throw new Error('USER_ALREADY_IN_GROUP');
    }

    // Check if group is full
    if (group.members.length >= 8) {
      throw new Error('GROUP_FULL');
    }

    // Add user to group
    group.members.push({
      userId: new mongoose.Types.ObjectId(userId),
      joinDate: new Date()
    });

    await group.save();

    // Update user's groupName
    await UserModel.findByIdAndUpdate(userId, { 
      groupName: group.name 
    });

    // Populate member information
    await group.populate('owner', 'name email');
    await group.populate('members.userId', 'name email');

    return group;
  }

  async getCurrentGroup(userId: string) {
    const timestamp = new Date().toISOString();

    const group = await Group.findOne({
      'members.userId': new mongoose.Types.ObjectId(userId)
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Populate owner data with error handling
    try {
      await group.populate('owner', 'name email bio averageRating');

      // Validate that owner still exists and has valid data
      if (!group.owner || typeof group.owner === 'string' || !(group.owner as { name?: string }).name) {

        // If owner is invalid, transfer to oldest valid member
        const validMembers = group.members.filter(member =>
          typeof member.userId === 'object' && (member.userId as { name?: string }).name
        );

        if (validMembers.length > 0) {
          // Find the oldest member (earliest join date) to transfer ownership to
          const oldestMember = validMembers.reduce((oldest, current) => {
            const oldestDate = new Date(oldest.joinDate);
            const currentDate = new Date(current.joinDate);
            return currentDate < oldestDate ? current : oldest;
          });

          group.owner = oldestMember.userId;
          await group.save();

          // Re-populate the new owner
          await group.populate('owner', 'name email bio averageRating');
        } else {
          // Create a placeholder owner if no valid members exist
          (group as unknown as { owner: { _id: string; name: string; email: string; bio: string; averageRating: number } }).owner = {
            _id: 'deleted-owner',
            name: 'Deleted User',
            email: '',
            bio: '',
            averageRating: 0
          };
        }
      }
    } catch (populateError) {
      console.error(`[${timestamp}] GROUP GET: Error populating owner:`, populateError);

      // Try to fix ownership by transferring to oldest valid member
      const validMembers = group.members.filter(member =>
        typeof member.userId === 'object' && (member.userId as { name?: string }).name
      );

      if (validMembers.length > 0) {
        // Find the oldest member (earliest join date) to transfer ownership to
        const oldestMember = validMembers.reduce((oldest, current) => {
          const oldestDate = new Date(oldest.joinDate);
          const currentDate = new Date(current.joinDate);
          return currentDate < oldestDate ? current : oldest;
        });

        group.owner = oldestMember.userId;
        await group.save();

        // Try to populate again
        try {
          await group.populate('owner', 'name email bio averageRating');
        } catch (retryError) {
          console.error(`[${timestamp}] GROUP GET: Retry populate also failed:`, retryError);
          // Create placeholder owner
          (group as unknown as { owner: { _id: string; name: string; email: string; bio: string; averageRating: number } }).owner = {
            _id: 'deleted-owner',
            name: 'Deleted User',
            email: '',
            bio: '',
            averageRating: 0
          };
        }
      } else {
        // Create placeholder owner if no valid members exist
        (group as unknown as { owner: { _id: string; name: string; email: string; bio: string; averageRating: number } }).owner = {
          _id: 'deleted-owner',
          name: 'Deleted User',
          email: '',
          bio: '',
          averageRating: 0
        };
      }
    }

    // Populate member data with error handling
    try {
      await group.populate('members.userId', 'name email bio averageRating');
    } catch (populateError) {
      console.error(`[${timestamp}] GROUP GET: Error populating members:`, populateError);
      // Filter out any members that failed to populate
      group.members = group.members.filter(member => {
        if (!member.userId || typeof member.userId === 'string') {
          return false;
        }
        return true;
      });
    }

    // Log how long each user has been in the group
    const now = new Date();
    group.members.forEach(member => {
      if ((member.userId as { name?: string }).name) {
        const joinDate = new Date(member.joinDate);
        const durationMs = now.getTime() - joinDate.getTime();
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        const durationHours = Math.floor(durationMinutes / 60);
        const durationDays = Math.floor(durationHours / 24);
      }
    });

    return group;
  }

}

export default new GroupService();