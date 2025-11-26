import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import groupController from '../controller/group.controller';

const router = express.Router();

// All routes below this middleware are protected
router.use((req, res, next) => { 
  protect(req, res, next).catch(next); 
});

// @desc    Create a new group
// @route   POST /api/group
// @access  Private
router.post('/', asyncHandler(groupController.createGroup.bind(groupController)));

// @desc    Join an existing group
// @route   POST /api/group/join
// @access  Private
router.post('/join', asyncHandler(groupController.joinGroup.bind(groupController)));

// @desc    Get user's current group
// @route   GET /api/group
// @access  Private
router.get('/', asyncHandler(groupController.getUserGroup.bind(groupController)));

// @desc    Transfer ownership to another member (owner only)
// @route   PUT /api/group/transfer-ownership/:newOwnerId
// @access  Private
router.put('/transfer-ownership/:newOwnerId', asyncHandler(groupController.transferOwnership.bind(groupController)));

// @desc    Remove a member from group (owner only)
// @route   DELETE /api/group/member/:memberId
// @access  Private
router.delete('/member/:memberId', asyncHandler(groupController.removeMember.bind(groupController)));

// @desc    Leave current group
// @route   DELETE /api/group/leave
// @access  Private
router.delete('/leave', asyncHandler(groupController.leaveGroup.bind(groupController)));

export default router;