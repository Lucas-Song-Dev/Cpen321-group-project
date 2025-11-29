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
chatRouter.get('/:groupId/messages', ChatController.getGroupMessages);

// @desc    Send a message to a group
// @route   POST /api/chat/:groupId/message
chatRouter.post('/:groupId/message', ChatController.sendMessage);

// @desc    Create a poll in a group
// @route   POST /api/chat/:groupId/poll
chatRouter.post('/:groupId/poll', ChatController.createPoll);

// @desc    Vote on a poll
// @route   POST /api/chat/:groupId/poll/:messageId/vote
chatRouter.post('/:groupId/poll/:messageId/vote', ChatController.voteOnPoll);

// @desc    Delete a message
// @route   DELETE /api/chat/:groupId/message/:messageId
chatRouter.delete('/:groupId/message/:messageId', ChatController.deleteMessage);

// @desc    Report a message for moderation
// @route   POST /api/chat/:groupId/message/:messageId/report
chatRouter.post('/:groupId/message/:messageId/report', (req, res, next) => {
  ChatController.reportMessage(req, res, next).catch(next);
});

export default chatRouter;