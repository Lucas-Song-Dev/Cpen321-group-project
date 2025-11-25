import Group from '../models/group.models';
import { UserModel } from '../models/user.models';
import mongoose from 'mongoose';

export class GroupService {
  /**
   * Create a new group
   */
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

  /**
   * Join an existing group by code
   */
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

  /**
   * Get user's current group
   */
  async getUserGroup(userId: string) {
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
        await this.transferOwnershipToOldestMember(group);
        await group.populate('owner', 'name email bio averageRating');
      }
    } catch (populateError) {
      console.error('Error populating owner:', populateError);
      await this.transferOwnershipToOldestMember(group);
      
      try {
        await group.populate('owner', 'name email bio averageRating');
      } catch (retryError) {
        console.error('Retry populate also failed:', retryError);
        this.setPlaceholderOwner(group);
      }
    }

    // Populate member data with error handling
    try {
      await group.populate('members.userId', 'name email bio averageRating');
    } catch (populateError) {
      console.error('Error populating members:', populateError);
      // Filter out any members that failed to populate
      group.members = group.members.filter(member => {
        if (!member.userId || typeof member.userId === 'string') {
          return false;
        }
        return true;
      });
    }

    return group;
  }

  /**
   * Transfer ownership to another member
   */
  async transferOwnership(userId: string, newOwnerId: string) {
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

  /**
   * Remove a member from group
   */
  async removeMember(userId: string, memberId: string) {
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
    if (memberId === group.owner.toString()) {
      throw new Error('CANNOT_REMOVE_OWNER');
    }

    // Remove member from group
    const initialMemberCount = group.members.length;
    group.members = group.members.filter(member => 
      member.userId.toString() !== memberId
    );

    if (group.members.length === initialMemberCount) {
      throw new Error('MEMBER_NOT_FOUND');
    }

    await group.save();

    // Update user's groupName to null
    await UserModel.findByIdAndUpdate(memberId, { 
      groupName: null 
    });

    // Populate group with updated member information
    await group.populate('owner', 'name email bio averageRating');
    await group.populate('members.userId', 'name email bio averageRating');

    return group;
  }

  /**
   * Leave current group
   */
  async leaveGroup(userId: string) {
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
        // No members left; delete the group
        await group.deleteOne();
        await UserModel.findByIdAndUpdate(userId, { groupName: "" });
        return { groupDeleted: true };
      }
    } else {
      await group.save();
    }

    // Update user's groupName
    await UserModel.findByIdAndUpdate(userId, { groupName: "" });

    return { groupDeleted: false };
  }

  /**
   * Helper: Transfer ownership to oldest valid member
   */
  private async transferOwnershipToOldestMember(group: any) {
    const validMembers = group.members.filter((member: any) => 
      typeof member.userId === 'object' && (member.userId as { name?: string }).name
    );
    
    if (validMembers.length > 0) {
      const oldestMember = validMembers.reduce((oldest: any, current: any) => {
        const oldestDate = new Date(oldest.joinDate);
        const currentDate = new Date(current.joinDate);
        return currentDate < oldestDate ? current : oldest;
      });
      
      group.owner = oldestMember.userId;
      await group.save();
    } else {
      this.setPlaceholderOwner(group);
    }
  }

  /**
   * Helper: Set placeholder owner
   */
  private setPlaceholderOwner(group: any) {
    (group as unknown as { owner: { _id: string; name: string; email: string; bio: string; averageRating: number } }).owner = {
      _id: 'deleted-owner',
      name: 'Deleted User',
      email: '',
      bio: '',
      averageRating: 0
    };
  }
}

export default new GroupService();