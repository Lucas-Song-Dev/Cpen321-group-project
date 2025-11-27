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

interface GroupDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  owner: mongoose.Types.ObjectId | {
    _id: string;
    name: string;
    email: string;
    bio: string;
    averageRating: number;
  };
  members: PopulatedMember[];
  save: () => Promise<void>;
  populate: (path: string, select: string) => Promise<void>;
}

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

  async getUserGroup(userId: string) {
    const group = await Group.findOne({ 
      'members.userId': new mongoose.Types.ObjectId(userId) 
    }) as GroupDocument;

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Populate owner data with error handling
    try {
      await group.populate('owner', 'name email bio averageRating');

      const owner = group.owner as any;
      if (!owner || typeof owner === 'string' || !owner.name) {
        // If owner is invalid, transfer to oldest valid member
        await this.transferOwnershipToOldestMember(group as GroupDocument);
        await group.populate('owner', 'name email bio averageRating');
      }
          
      // // Validate that owner still exists and has valid data
      // if (!group.owner || typeof group.owner === 'string' || !('name' in group.owner && group.owner.name)) {
      //   // If owner is invalid, transfer to oldest valid member
      //   await this.transferOwnershipToOldestMember(group);
      //   await group.populate('owner', 'name email bio averageRating');
      // }
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

      group.members = group.members.filter((member: any) => {
        return member.userId && typeof member.userId === 'object';
      });
      // Filter out any members that failed to populate
      // group.members = group.members.filter(member => {
      //   return member.userId && typeof member.userId === 'object';
      // });
    }

    return group;
  }

  /**
   * Helper: Transfer ownership to oldest valid member
   */
  private async transferOwnershipToOldestMember(group: GroupDocument): Promise<void> {
    const validMembers = group.members.filter((member): member is PopulatedMember => 
      typeof member.userId === 'object' && 'name' in member.userId && Boolean(member.userId.name)
    );
    
    if (validMembers.length > 0) {
      const oldestMember = validMembers.reduce((oldest, current) => {
        const oldestDate = new Date(oldest.joinDate).getTime();
        const currentDate = new Date(current.joinDate).getTime();
        return currentDate < oldestDate ? current : oldest;
      });
      
      group.owner = oldestMember.userId._id;
      await group.save();
    } else {
      this.setPlaceholderOwner(group);
    }
  }

  /**
   * Helper: Set placeholder owner
   */
  private setPlaceholderOwner(group: GroupDocument): void {
    group.owner = {
      _id: 'deleted-owner',
      name: 'Deleted User',
      email: '',
      bio: '',
      averageRating: 0
    };
  }
}

export default new GroupService();