import mongoose from 'mongoose';
import Group from '../models/group.models';
import { UserModel } from '../models/user.models';

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
      if (!(group.owner as { name?: string }).name) {

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
        return typeof member.userId === 'object' && (member.userId as { name?: string }).name;
      });
    }


    return group;
  }
  
  async updateGroupName(userId: string, newName: string) {
    // Validate name
    const trimmedName = newName.trim();
    if (!trimmedName) {
      throw new Error('GROUP_NAME_REQUIRED');
    }

    if (trimmedName.length > 100) {
      throw new Error('GROUP_NAME_TOO_LONG');
    }

    // Find user's group
    const group = await Group.findOne({
      'members.userId': new mongoose.Types.ObjectId(userId)
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Check if user is the owner
    if (group.owner.toString() !== userId) {
      throw new Error('NOT_GROUP_OWNER');
    }

    // Update name only if it has changed
    if (group.name !== trimmedName) {
      group.name = trimmedName;
      await group.save();

      // Update all members' cached groupName fields
      const memberIds = group.members.map(member => {
        return new mongoose.Types.ObjectId(member.userId.toString());
      });

      if (memberIds.length > 0) {
        await UserModel.updateMany(
          { _id: { $in: memberIds } },
          { $set: { groupName: trimmedName } }
        );
      }
    }

    // Populate owner and members information
    await group.populate('owner', 'name email bio averageRating');
    await group.populate('members.userId', 'name email bio averageRating');

    return group;
  }

  async transferOwnership(userId: string, newOwnerId: string) {
    // Find user's current group
    const group = await Group.findOne({
      'members.userId': new mongoose.Types.ObjectId(userId)
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Check if user is the owner
    if (group.owner.toString() !== userId) {
      throw new Error('NOT_GROUP_OWNER');
    }

    // Check if trying to transfer to the same person
    if (newOwnerId === group.owner.toString()) {
      throw new Error('ALREADY_OWNER');
    }

    // Check if new owner is a member of the group
    const newOwnerIsMember = group.members.some(member =>
      member.userId.toString() === newOwnerId
    );

    if (!newOwnerIsMember) {
      throw new Error('NEW_OWNER_NOT_MEMBER');
    }

    // Transfer ownership
    group.owner = new mongoose.Types.ObjectId(newOwnerId);
    await group.save();

    // Populate group with updated member information
    await group.populate('owner', 'name email bio averageRating');
    await group.populate('members.userId', 'name email bio averageRating');

    return group;
  }

  async removeMember(userId: string, memberIdToRemove: string) {
    // Get user's current group
    const group = await Group.findOne({
      'members.userId': new mongoose.Types.ObjectId(userId)
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Check if user is the owner
    if (group.owner.toString() !== userId) {
      throw new Error('NOT_GROUP_OWNER');
    }

    // Check if trying to remove the owner
    if (memberIdToRemove === group.owner.toString()) {
      throw new Error('CANNOT_REMOVE_OWNER');
    }

    // Remove member from group
    const initialMemberCount = group.members.length;
    group.members = group.members.filter(member =>
      member.userId.toString() !== memberIdToRemove
    );

    if (group.members.length === initialMemberCount) {
      throw new Error('MEMBER_NOT_FOUND');
    }

    await group.save();

    // Update user's groupName to null
    await UserModel.findByIdAndUpdate(memberIdToRemove, {
      groupName: null
    });

    // Populate group with updated member information
    await group.populate('owner', 'name email bio averageRating');
    await group.populate('members.userId', 'name email bio averageRating');

    return group;
  }

  async leaveGroup(userId: string): Promise<{ message: string; deletedGroup?: boolean }> {
    const group = await Group.findOne({
      'members.userId': new mongoose.Types.ObjectId(userId)
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    const isOwner = group.owner.toString() === userId;

    // Remove user from group members
    group.members = group.members.filter(member =>
      member.userId.toString() !== userId
    );

    if (isOwner) {
      if (group.members.length > 0) {
        // Transfer ownership to the first remaining member
        group.owner = group.members[0].userId;
        await group.save();
      } else {
        // No members left; delete the group and clear user groupName
        await group.deleteOne();
        await UserModel.findByIdAndUpdate(userId, { groupName: "" });
        return { message: 'Successfully left the group and deleted empty group', deletedGroup: true };
      }
    } else {
      await group.save();
    }

    // Update user's groupName
    await UserModel.findByIdAndUpdate(userId, { groupName: "" });

    return { message: 'Successfully left the group' };
  }
}

export default new GroupService();