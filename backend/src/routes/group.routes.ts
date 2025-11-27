// import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import groupController from '../controller/group.controller';

import express, { Request, Response } from 'express';
import Group from '../models/group.models';
import { UserModel } from '../models/user.models';
import mongoose from 'mongoose';

const router = express.Router();

// All routes below this middleware are protected
router.use((req, res, next) => { 
  protect(req, res, next).catch((err: unknown) => {
    next(err);
  });
});



// @desc    Create a new group
// @route   POST /api/group
router.post('/', asyncHandler(groupController.createGroup.bind(groupController)));

// @desc    Join an existing group
// @route   POST /api/group/join
router.post('/join', asyncHandler(groupController.joinGroup.bind(groupController)));

// // @desc    Get user's current group
// // @route   GET /api/group
router.put('/name', asyncHandler(groupController.updateGroupName.bind(groupController)));
















// // @desc    Transfer ownership to another member (owner only)
// // @route   PUT /api/group/transfer-ownership/:newOwnerId
// router.put('/transfer-ownership/:newOwnerId', asyncHandler(groupController.transferOwnership.bind(groupController)));

// // @desc    Remove a member from group (owner only)
// // @route   DELETE /api/group/member/:memberId
// router.delete('/member/:memberId', asyncHandler(groupController.removeMember.bind(groupController)));

// // @desc    Leave current group
// // @route   DELETE /api/group/leave
// router.delete('/leave', asyncHandler(groupController.leaveGroup.bind(groupController)));


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