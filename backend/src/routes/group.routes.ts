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

// @desc    Get user's current group
// @route   GET /api/group
router.get('/', asyncHandler(groupController.getCurrentGroup.bind(groupController)));

// @desc    Update group name (owner only)
// @route   PUT /api/group/name
router.put('/name', asyncHandler(groupController.updateGroupName.bind(groupController)));

// @desc    Transfer ownership to another member (owner only)
// @route   PUT /api/group/transfer-ownership/:newOwnerId
router.put('/transfer-ownership/:newOwnerId', asyncHandler(groupController.transferOwnership.bind(groupController)));

// @desc    Remove a member from group (owner only)
// @route   DELETE /api/group/member/:memberId
router.delete('/member/:memberId', asyncHandler(groupController.removeMember.bind(groupController)));

// @desc    Leave current group
// @route   DELETE /api/group/leave
router.delete('/leave', asyncHandler(groupController.leaveGroup.bind(groupController)));


export default router;