import express from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import chatController from '../controller/chat.controller';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// @desc    Get messages for a group
// @route   GET /api/chat/:groupId/messages
// @access  Private
router.get('/:groupId/messages', asyncHandler(chatController.getGroupMessages.bind(chatController)));

// @desc    Send a text message
// @route   POST /api/chat/:groupId/message
// @access  Private
router.post('/:groupId/message', asyncHandler(chatController.sendTextMessage.bind(chatController)));

// @desc    Send a poll
// @route   POST /api/chat/:groupId/poll
// @access  Private
router.post('/:groupId/poll', asyncHandler(chatController.createPoll.bind(chatController)));

// @desc    Vote on a poll
// @route   POST /api/chat/:groupId/poll/:messageId/vote
// @access  Private
router.post('/:groupId/poll/:messageId/vote', asyncHandler(chatController.voteOnPoll.bind(chatController)));

// @desc    Delete a message (only by sender)
// @route   DELETE /api/chat/:groupId/message/:messageId
// @access  Private
router.delete('/:groupId/message/:messageId', asyncHandler(chatController.deleteMessage.bind(chatController)));

export default router;