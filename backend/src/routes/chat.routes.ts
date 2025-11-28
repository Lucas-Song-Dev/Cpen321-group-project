import express from 'express';
import { ChatController } from '../controller/chat.controller';
import { protect } from '../middleware/auth.middleware';

const chatRouter = express.Router();

// All routes below this middleware are protected
chatRouter.use((req, res, next) => {
  protect(req, res, next).catch((err: unknown) => {
    next(err);
  });
});

// @desc    Get messages for a group
// @route   GET /api/chat/:groupId/messages
chatRouter.get('/:groupId/messages', (req, res) => ChatController.getGroupMessages(req, res) as Promise<any>);

// @desc    Send a message to a group
// @route   POST /api/chat/:groupId/message
chatRouter.post('/:groupId/message', (req, res) => ChatController.sendMessage(req, res) as Promise<any>);

// @desc    Create a poll in a group
// @route   POST /api/chat/:groupId/poll
chatRouter.post('/:groupId/poll', (req, res) => ChatController.createPoll(req, res) as Promise<any>);

// @desc    Vote on a poll
// @route   POST /api/chat/:groupId/poll/:messageId/vote
chatRouter.post('/:groupId/poll/:messageId/vote', (req, res) => ChatController.voteOnPoll(req, res) as Promise<any>);

// @desc    Delete a message
// @route   DELETE /api/chat/:groupId/message/:messageId
chatRouter.delete('/:groupId/message/:messageId', (req, res) => ChatController.deleteMessage(req, res) as Promise<any>);

export default chatRouter;
