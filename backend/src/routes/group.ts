import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Group from '../models/Group';
import { UserModel } from '../models/User';
import mongoose from 'mongoose';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// @desc    Create a new group
// @route   POST /api/group
// @access  Private
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] GROUP CREATE: Starting group creation`);
  console.log(`[${timestamp}] GROUP CREATE: User:`, req.user);
  console.log(`[${timestamp}] GROUP CREATE: Request body:`, req.body);
  
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    console.log(`[${timestamp}] GROUP CREATE: Validation failed - group name is required`);
    return res.status(400).json({
      success: false,
      message: 'Group name is required'
    });
  }

  console.log(`[${timestamp}] GROUP CREATE: Checking if user is already in a group`);
  // Check if user is already in a group
  const existingGroup = await Group.findOne({ 
    'members.userId': new mongoose.Types.ObjectId(req.user!._id) 
  });

  if (existingGroup) {
    console.log(`[${timestamp}] GROUP CREATE: User already in group:`, existingGroup._id);
    return res.status(400).json({
      success: false,
      message: 'User is already a member of a group'
    });
  }

  console.log(`[${timestamp}] GROUP CREATE: Creating new group with name:`, name.trim());
  // Create new group
  const group = await Group.create({
    name: name.trim(),
    owner: new mongoose.Types.ObjectId(req.user!._id),
    members: [{
      userId: new mongoose.Types.ObjectId(req.user!._id),
      joinDate: new Date()
    }]
  });

  console.log(`[${timestamp}] GROUP CREATE: Group created successfully:`, group._id);
  console.log(`[${timestamp}] GROUP CREATE: Updating user's groupName to:`, group.name);
  // Update user's groupName
  await UserModel.findByIdAndUpdate(req.user!._id, { 
    groupName: group.name 
  });

  console.log(`[${timestamp}] GROUP CREATE: Populating group with owner and member details`);
  // Populate owner information
  await group.populate('owner', 'name email');
  await group.populate('members.userId', 'name email');

  console.log(`[${timestamp}] GROUP CREATE: Group creation completed successfully`);
  console.log(`[${timestamp}] GROUP CREATE: Group code generated:`, group.groupCode);
  console.log(`[${timestamp}] GROUP CREATE: Sending response with group data`);
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
  console.log(`[${timestamp}] GROUP JOIN: Starting group join process`);
  console.log(`[${timestamp}] GROUP JOIN: User:`, req.user);
  console.log(`[${timestamp}] GROUP JOIN: Request body:`, req.body);
  
  const { groupCode } = req.body;

  if (!groupCode || groupCode.trim().length === 0) {
    console.log(`[${timestamp}] GROUP JOIN: Validation failed - group code is required`);
    return res.status(400).json({
      success: false,
      message: 'Group code is required'
    });
  }

  console.log(`[${timestamp}] GROUP JOIN: Checking if user is already in a group`);
  // Check if user is already in a group
  const existingGroup = await Group.findOne({ 
    'members.userId': new mongoose.Types.ObjectId(req.user!._id) 
  });

  if (existingGroup) {
    return res.status(400).json({
      success: false,
      message: 'User is already a member of a group'
    });
  }

  // Find group by code
  const group = await Group.findOne({ groupCode: groupCode.trim().toUpperCase() });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found'
    });
  }

  // Check if group is full
  if (group.members.length >= 8) {
    return res.status(400).json({
      success: false,
      message: 'Group is full (maximum 8 members)'
    });
  }

  // Check if user is already a member
  const isAlreadyMember = group.members.some(member => 
    member.userId.toString() === req.user!._id.toString()
  );

  if (isAlreadyMember) {
    return res.status(400).json({
      success: false,
      message: 'User is already a member of this group'
    });
  }

  // Add user to group
  group.members.push({
    userId: new mongoose.Types.ObjectId(req.user!._id),
    joinDate: new Date()
  });

  await group.save();

  // Update user's groupName
  await UserModel.findByIdAndUpdate(req.user!._id, { 
    groupName: group.name 
  });

  // Populate member information
  await group.populate('owner', 'name email');
  await group.populate('members.userId', 'name email');

  console.log(`[${timestamp}] GROUP JOIN: Join successful, sending response`);
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
  console.log(`[${timestamp}] GROUP GET: Getting group for user:`, req.user?._id);
  
  try {
    const group = await Group.findOne({ 
      'members.userId': new mongoose.Types.ObjectId(req.user!._id) 
    });

    if (!group) {
      console.log(`[${timestamp}] GROUP GET: User is not a member of any group`);
      return res.status(404).json({
        success: false,
        message: 'User is not a member of any group'
      });
    }

    console.log(`[${timestamp}] GROUP GET: Group found:`, group._id);
    
    // Populate owner data with error handling
    try {
      await group.populate('owner', 'name email bio averageRating');
      console.log(`[${timestamp}] GROUP GET: Owner populated successfully`);
      
      // Validate that owner still exists and has valid data
      if (!group.owner || typeof group.owner === 'string' || !(group.owner as any).name) {
        console.log(`[${timestamp}] GROUP GET: Owner data is invalid, attempting to fix ownership`);
        
        // If owner is invalid, transfer to oldest valid member
        const validMembers = group.members.filter((member: any) => 
          member.userId && typeof member.userId === 'object' && member.userId.name
        );
        
        if (validMembers.length > 0) {
          // Find the oldest member (earliest join date) to transfer ownership to
          const oldestMember = validMembers.reduce((oldest: any, current: any) => {
            const oldestDate = new Date(oldest.joinDate);
            const currentDate = new Date(current.joinDate);
            return currentDate < oldestDate ? current : oldest;
          });
          
          group.owner = oldestMember.userId as any;
          await group.save();
          console.log(`[${timestamp}] GROUP GET: Ownership transferred to oldest member ${(oldestMember.userId as any).name} (joined: ${oldestMember.joinDate})`);
          
          // Re-populate the new owner
          await group.populate('owner', 'name email bio averageRating');
        } else {
          console.log(`[${timestamp}] GROUP GET: No valid members found, creating placeholder owner`);
          // Create a placeholder owner if no valid members exist
          (group as any).owner = {
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
      const validMembers = group.members.filter((member: any) => 
        member.userId && typeof member.userId === 'object' && member.userId.name
      );
      
      if (validMembers.length > 0) {
        // Find the oldest member (earliest join date) to transfer ownership to
        const oldestMember = validMembers.reduce((oldest: any, current: any) => {
          const oldestDate = new Date(oldest.joinDate);
          const currentDate = new Date(current.joinDate);
          return currentDate < oldestDate ? current : oldest;
        });
        
        group.owner = oldestMember.userId as any;
        await group.save();
        console.log(`[${timestamp}] GROUP GET: Ownership transferred to oldest member ${(oldestMember.userId as any).name} (joined: ${oldestMember.joinDate}) due to populate error`);
        
        // Try to populate again
        try {
          await group.populate('owner', 'name email bio averageRating');
        } catch (retryError) {
          console.error(`[${timestamp}] GROUP GET: Retry populate also failed:`, retryError);
          // Create placeholder owner
          (group as any).owner = {
            _id: 'deleted-owner',
            name: 'Deleted User',
            email: '',
            bio: '',
            averageRating: 0
          };
        }
      } else {
        // Create placeholder owner if no valid members exist
        (group as any).owner = {
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
      console.log(`[${timestamp}] GROUP GET: Members populated successfully`);
    } catch (populateError) {
      console.error(`[${timestamp}] GROUP GET: Error populating members:`, populateError);
      // Filter out any members that failed to populate
      group.members = group.members.filter((member: any) => {
        if (!member.userId || typeof member.userId === 'string') {
          console.log(`[${timestamp}] GROUP GET: Filtering out invalid member:`, member);
          return false;
        }
        return true;
      });
      console.log(`[${timestamp}] GROUP GET: Filtered members, remaining count: ${group.members.length}`);
    }
    
    // Log how long each user has been in the group
    console.log(`[${timestamp}] GROUP GET: Member join durations:`);
    const now = new Date();
    group.members.forEach((member: any) => {
      if (member.userId && member.userId.name) {
        const joinDate = new Date(member.joinDate);
        const durationMs = now.getTime() - joinDate.getTime();
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        const durationHours = Math.floor(durationMinutes / 60);
        const durationDays = Math.floor(durationHours / 24);
        
        console.log(`[${timestamp}]   - User ${member.userId.name} (${member.userId._id}): ${durationDays} days, ${durationHours % 24} hours, ${durationMinutes % 60} minutes (joined: ${joinDate.toISOString()})`);
      } else {
        console.log(`[${timestamp}]   - Invalid member data:`, member);
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

// @desc    Remove a member from group (owner only)
// @route   DELETE /api/group/member/:memberId
// @access  Private
router.delete('/member/:memberId', asyncHandler(async (req: Request, res: Response) => {
  const { memberId } = req.params;
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] GROUP REMOVE MEMBER: Removing member ${memberId} from group`);

  // Get user's current group
  const group = await Group.findOne({ 
    'members.userId': new mongoose.Types.ObjectId(req.user!._id) 
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  // Check if user is the owner
  if (group.owner.toString() !== req.user!._id.toString()) {
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

  console.log(`[${timestamp}] GROUP REMOVE MEMBER: Successfully removed member ${memberId}`);
  
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
    'members.userId': new mongoose.Types.ObjectId(req.user!._id) 
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  const isOwner = group.owner.toString() === req.user!._id.toString();

  // Remove user from group members
  group.members = group.members.filter(member => 
    member.userId.toString() !== req.user!._id.toString()
  );

  if (isOwner) {
    if (group.members.length > 0) {
      // Transfer ownership to the first remaining member
      group.owner = group.members[0].userId as any;
    } else {
      // No members left; delete the group and clear user groupName
      await group.deleteOne();
      await UserModel.findByIdAndUpdate(req.user!._id, { groupName: "" });
      return res.status(200).json({
        success: true,
        message: 'Successfully left the group and deleted empty group'
      });
    }
  }

  await group.save();

  // Update user's groupName
  await UserModel.findByIdAndUpdate(req.user!._id, { groupName: "" });

  res.status(200).json({
    success: true,
    message: 'Successfully left the group'
  });
}));

export default router;
