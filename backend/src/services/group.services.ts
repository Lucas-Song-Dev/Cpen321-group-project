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

  async updateGroupName(userId: string, newName: string) {
    const group = await Group.findOne({
      'members.userId': new mongoose.Types.ObjectId(userId)
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    if (group.owner.toString() !== userId) {
      throw new Error('NOT_GROUP_OWNER');
    }

    // Update name only if it has changed
    if (group.name !== newName) {
      group.name = newName;
      await group.save();

      // Update all members' cached groupName fields
      const memberIds = group.members
        .map(member => {
          if (!member.userId) {
            return null;
          }
          return new mongoose.Types.ObjectId(member.userId as mongoose.Types.ObjectId);
        })
        .filter((id): id is mongoose.Types.ObjectId => id !== null);

      if (memberIds.length > 0) {
        await UserModel.updateMany(
          { _id: { $in: memberIds } },
          { $set: { groupName: newName } }
        );
      }
    }

    await group.populate('owner', 'name email bio averageRating');
    await group.populate('members.userId', 'name email bio averageRating');

    return group;
  }
}

export default new GroupService();