import express, { Request, Response, NextFunction } from 'express';
import { ChatController } from '../controller/chat.controller';
import { protect } from '../middleware/auth.middleware';

const chatRouter = express.Router();

// All routes below this middleware are protected
chatRouter.use((req: Request, res: Response, next: NextFunction) => {
  protect(req, res, next);
});

// @desc    Get messages for a group
// @route   GET /api/chat/:groupId/messages
chatRouter.get('/:groupId/messages', (req: Request, res: Response) => {
  ChatController.getGroupMessages(req, res);
});

// @desc    Send a message to a group
// @route   POST /api/chat/:groupId/message
chatRouter.post('/:groupId/message', (req: Request, res: Response) => {
  ChatController.sendMessage(req, res);
});

// @desc    Create a poll in a group
// @route   POST /api/chat/:groupId/poll
chatRouter.post('/:groupId/poll', (req: Request, res: Response) => {
  ChatController.createPoll(req, res);
});

// @desc    Vote on a poll
// @route   POST /api/chat/:groupId/poll/:messageId/vote
chatRouter.post('/:groupId/poll/:messageId/vote', (req: Request, res: Response) => {
  ChatController.voteOnPoll(req, res);
});

// @desc    Delete a message
// @route   DELETE /api/chat/:groupId/message/:messageId
chatRouter.delete('/:groupId/message/:messageId', (req: Request, res: Response) => {
  ChatController.deleteMessage(req, res);
});

// @desc    Report a message for moderation
// @route   POST /api/chat/:groupId/message/:messageId/report
chatRouter.post('/:groupId/message/:messageId/report', (req: Request, res: Response) => {
  ChatController.reportMessage(req, res);
});

export default chatRouter;