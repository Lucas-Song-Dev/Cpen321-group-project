import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import Group from '../models/group.models';
import { UserModel } from '../models/user.models';
import mongoose from 'mongoose';

const router = express.Router();

// All routes below this middleware are protected
router.use((req, res, next) => { protect(req, res, next).catch(next); });

// @desc    Create a new group
// @route   POST /api/group
// @access  Private
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
      return res.status(400).json({
      success: false,
      message: 'Group name is required'
    });
  }

  // Check if user is already in a group
  const existingGroup = await Group.findOne({ 
    'members.userId': new mongoose.Types.ObjectId(req.user?._id) 
  });

  if (existingGroup) {
      return res.status(400).json({
      success: false,
      message: 'User is already a member of a group'
    });
  }

  // Create new group
  const group = await Group.create({
    name: name.trim(),
    owner: new mongoose.Types.ObjectId(req.user?._id),
    members: [{
      userId: new mongoose.Types.ObjectId(req.user?._id),
      joinDate: new Date()
    }]
  });

  // Update user's groupName
  await UserModel.findByIdAndUpdate(req.user?._id, { 
    groupName: group.name 
  });

  // Populate owner information
  await group.populate('owner', 'name email');
  await group.populate('members.userId', 'name email');

  res.status(201).json({
    success: true,
    message: 'Group created successfully',
    data: group
  });
}));

// @desc    Join an existing group
// @route   POST /api/group/join
// @access  Private
router.post('/join', asyncHandler(async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  
  const { groupCode } = req.body;

  if (!groupCode || groupCode.trim().length === 0) {
      return res.status(400).json({
      success: false,
      message: 'Group code is required'
    });
  }

  // Find group by code
  const group = await Group.findOne({ groupCode: groupCode.toUpperCase() });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found'
    });
  }

  // Check if user is already a member of this group
  const isAlreadyMember = group.members.some(member => 
    member.userId.toString() === req.user?._id.toString()
  );

  if (isAlreadyMember) {
    return res.status(400).json({
      success: false,
      message: 'User is already a member of this group'
    });
  }

  // Check if user is already in a different group
  const existingGroup = await Group.findOne({ 
    'members.userId': req.user?._id 
  });

  if (existingGroup) {
    return res.status(400).json({
      success: false,
      message: 'User is already a member of a group'
    });
  }

  // Check if group is full
  if (group.members.length >= 8) {
    return res.status(400).json({
      success: false,
      message: 'Group is full (maximum 8 members)'
    });
  }

  // Add user to group
  group.members.push({
    userId: new mongoose.Types.ObjectId(req.user?._id),
    joinDate: new Date()
  });

  await group.save();

  // Update user's groupName
  await UserModel.findByIdAndUpdate(req.user?._id, { 
    groupName: group.name 
  });

  // Populate member information
  await group.populate('owner', 'name email');
  await group.populate('members.userId', 'name email');

  res.status(200).json({
    success: true,
    message: 'Joined group successfully',
    data: group
  });
}));

// @desc    Get user's current group
// @route   GET /api/group
// @access  Private
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  
  try {
    const group = await Group.findOne({ 
      'members.userId': new mongoose.Types.ObjectId(req.user?._id) 
    });

    if (!group) {
          return res.status(404).json({
        success: false,
        message: 'User is not a member of any group'
      });
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
    
    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error(`[${timestamp}] GROUP GET: Unexpected error:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to load group data'
    });
  }
}));

// @desc    Update group name (owner only)
// @route   PUT /api/group/name
// @access  Private
router.put('/name', asyncHandler(async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  const { name } = req.body;

  const trimmedName = name?.trim();

  if (!trimmedName) {
    return res.status(400).json({
      success: false,
      message: 'Group name is required'
    });
  }

  if (trimmedName.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Group name must be 100 characters or fewer'
    });
  }

  const group = await Group.findOne({
    'members.userId': new mongoose.Types.ObjectId(req.user?._id)
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  if (group.owner.toString() !== req.user?._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only the group owner can update the name'
    });
  }

  // Update name only if it has changed
  if (group.name !== trimmedName) {
    group.name = trimmedName;
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
        { $set: { groupName: trimmedName } }
      );
    }
  }

  await group.populate('owner', 'name email bio averageRating');
  await group.populate('members.userId', 'name email bio averageRating');

  res.status(200).json({
    success: true,
    message: 'Group name updated successfully',
    data: group
  });
}));

// @desc    Transfer ownership to another member (owner only)
// @route   PUT /api/group/transfer-ownership/:newOwnerId
// @access  Private
router.put('/transfer-ownership/:newOwnerId', asyncHandler(async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  const { newOwnerId } = req.params;

  // Get user's current group
  const group = await Group.findOne({ 
    'members.userId': new mongoose.Types.ObjectId(req.user?._id) 
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  // Check if user is the owner
  if (group.owner.toString() !== req.user?._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only the group owner can transfer ownership'
    });
  }

  // Check if trying to transfer to the same person
  if (newOwnerId === group.owner.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You are already the owner of this group'
    });
  }

  // Check if new owner is a member of the group
  const newOwnerIsMember = group.members.some(member => 
    member.userId.toString() === newOwnerId
  );

  if (!newOwnerIsMember) {
    return res.status(400).json({
      success: false,
      message: 'The specified user is not a member of this group'
    });
  }

  // Transfer ownership
  group.owner = new mongoose.Types.ObjectId(newOwnerId);
  await group.save();


  // Populate group with updated member information
  await group.populate('owner', 'name email bio averageRating');
  await group.populate('members.userId', 'name email bio averageRating');

  res.status(200).json({
    success: true,
    message: 'Ownership transferred successfully',
    data: group
  });
}));

// @desc    Remove a member from group (owner only)
// @route   DELETE /api/group/member/:memberId
// @access  Private
router.delete('/member/:memberId', asyncHandler(async (req: Request, res: Response) => {
  const { memberId } = req.params;
  const timestamp = new Date().toISOString();

  // Get user's current group
  const group = await Group.findOne({ 
    'members.userId': new mongoose.Types.ObjectId(req.user?._id) 
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  // Check if user is the owner
  if (group.owner.toString() !== req.user?._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only the group owner can remove members'
    });
  }

  // Check if trying to remove the owner
  if (memberId === group.owner.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot remove the group owner'
    });
  }

  // Remove member from group
  const initialMemberCount = group.members.length;
  group.members = group.members.filter(member => 
    member.userId.toString() !== memberId
  );

  if (group.members.length === initialMemberCount) {
    return res.status(404).json({
      success: false,
      message: 'Member not found in group'
    });
  }

  await group.save();

  // Update user's groupName to null
  await UserModel.findByIdAndUpdate(memberId, { 
    groupName: null 
  });

  // Populate group with updated member information
  await group.populate('owner', 'name email bio averageRating');
  await group.populate('members.userId', 'name email bio averageRating');

  
  res.status(200).json({
    success: true,
    message: 'Member removed successfully',
    data: group
  });
}));

// @desc    Leave current group
// @route   DELETE /api/group/leave
// @access  Private
router.delete('/leave', asyncHandler(async (req: Request, res: Response) => {
  const group = await Group.findOne({ 
    'members.userId': new mongoose.Types.ObjectId(req.user?._id) 
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  const isOwner = group.owner.toString() === req.user?._id.toString();

  // Remove user from group members
  group.members = group.members.filter(member => 
    member.userId.toString() !== req.user?._id.toString()
  );

  if (isOwner) {
    if (group.members.length > 0) {
      // Transfer ownership to the first remaining member
      group.owner = group.members[0].userId;
    } else {
      // No members left; delete the group and clear user groupName
      await group.deleteOne();
      await UserModel.findByIdAndUpdate(req.user?._id, { groupName: "" });
      return res.status(200).json({
        success: true,
        message: 'Successfully left the group and deleted empty group'
      });
    }
  }

  await group.save();

  // Update user's groupName
  await UserModel.findByIdAndUpdate(req.user?._id, { groupName: "" });

  res.status(200).json({
    success: true,
    message: 'Successfully left the group'
  });
}));

export default router;
