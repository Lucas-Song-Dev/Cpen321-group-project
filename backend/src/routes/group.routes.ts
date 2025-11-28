import express from 'express';
import GroupController from '../controller/group.controller';
import { protect } from '../middleware/auth.middleware';

const groupRouter = express.Router();

// All routes below this middleware are protected
groupRouter.use((req, res, next) => { 
  protect(req, res, next).catch((err: unknown) => {
    next(err);
  });
});

// @desc    Create a new group
// @route   POST /api/group
groupRouter.post('/', GroupController.createGroup);

// @desc    Join an existing group
// @route   POST /api/group/join
groupRouter.post('/join', GroupController.joinGroup);

// @desc    Get user's current group
// @route   GET /api/group
groupRouter.get('/', GroupController.getCurrentGroup);

// @desc    Update group name (owner only)
// @route   PUT /api/group/name
groupRouter.put('/name', GroupController.updateGroupName);

// @desc    Transfer ownership to another member (owner only)
// @route   PUT /api/group/transfer-ownership/:newOwnerId
groupRouter.put('/transfer-ownership/:newOwnerId', GroupController.transferOwnership);

// @desc    Remove a member from group (owner only)
// @route   DELETE /api/group/member/:memberId
groupRouter.delete('/member/:memberId', GroupController.removeMember);

// @desc    Leave current group
// @route   DELETE /api/group/leave
groupRouter.delete('/leave', GroupController.leaveGroup);


export default groupRouter;