import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { GroupController } from '../controller/group.controller';

const groupRouter = express.Router();

// All routes below this middleware are protected
groupRouter.use((req, res, next) => { 
  protect(req, res, next).catch((err: unknown) => {
    next(err);
  });
});

// @desc    Create a new group
// @route   POST /api/group
groupRouter.post('/', (req, res) => GroupController.createGroup(req, res));

// @desc    Join an existing group
// @route   POST /api/group/join
groupRouter.post('/join', (req, res) => GroupController.joinGroup(req, res));

// @desc    Get user's current group
// @route   GET /api/group
groupRouter.get('/', (req, res) => GroupController.getCurrentGroup(req, res));

// @desc    Update group name (owner only)
// @route   PUT /api/group/name
groupRouter.put('/name', (req, res) => GroupController.updateGroupName(req, res));

// @desc    Transfer ownership to another member (owner only)
// @route   PUT /api/group/transfer-ownership/:newOwnerId
groupRouter.put('/transfer-ownership/:newOwnerId', (req, res) => GroupController.transferOwnership(req, res));

// @desc    Remove a member from group (owner only)
// @route   DELETE /api/group/member/:memberId
groupRouter.delete('/member/:memberId', (req, res) => GroupController.removeMember(req, res));

// @desc    Leave current group
// @route   DELETE /api/group/leave
groupRouter.delete('/leave', (req, res) => GroupController.leaveGroup(req, res));


export default groupRouter;