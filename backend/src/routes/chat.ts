import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Message from '../models/Message';
import Group from '../models/Group';
import { UserModel } from '../models/User';
import mongoose from 'mongoose';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// @desc    Get messages for a group
// @route   GET /api/chat/:groupId/messages
// @access  Private
router.get('/:groupId/messages', asyncHandler(async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] CHAT GET MESSAGES: Starting get messages for group`);
  console.log(`[${timestamp}] CHAT GET MESSAGES: User:`, req.user);
  console.log(`[${timestamp}] CHAT GET MESSAGES: Group ID:`, req.params.groupId);
  console.log(`[${timestamp}] CHAT GET MESSAGES: Query params:`, req.query);
  
  const { groupId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  console.log(`[${timestamp}] CHAT GET MESSAGES: Looking for group with ID:`, groupId);
  
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    console.log(`[${timestamp}] CHAT GET MESSAGES: Invalid ObjectId format:`, groupId);
    return res.status(400).json({
      success: false,
      message: 'Invalid group ID format'
    });
  }
  
  // Verify user is member of the group
  const group = await Group.findById(groupId);
  if (!group) {
    console.log(`[${timestamp}] CHAT GET MESSAGES: Group not found:`, groupId);
    return res.status(404).json({
      success: false,
      message: 'Group not found'
    });
  }

  console.log(`[${timestamp}] CHAT GET MESSAGES: Group found, checking membership`);
  const isMember = group.members.some(member => 
    member.userId.toString() === req.user!._id.toString()
  );

  if (!isMember) {
    console.log(`[${timestamp}] CHAT GET MESSAGES: User is not a member of group:`, groupId);
    return res.status(403).json({
      success: false,
      message: 'Access denied. You are not a member of this group.'
    });
  }

  console.log(`[${timestamp}] CHAT GET MESSAGES: User is member, fetching messages`);
  // Get messages with pagination
  const messages = await Message.find({ groupId })
    .populate('senderId', 'fullname nickname')
    .sort({ createdAt: -1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));

  console.log(`[${timestamp}] CHAT GET MESSAGES: Found ${messages.length} messages`);
  res.status(200).json({
    success: true,
    data: {
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: await Message.countDocuments({ groupId })
      }
    }
  });
}));

// @desc    Send a text message
// @route   POST /api/chat/:groupId/message
// @access  Private
router.post('/:groupId/message', asyncHandler(async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] CHAT SEND MESSAGE: Starting send message`);
  console.log(`[${timestamp}] CHAT SEND MESSAGE: User:`, req.user);
  console.log(`[${timestamp}] CHAT SEND MESSAGE: Group ID:`, req.params.groupId);
  console.log(`[${timestamp}] CHAT SEND MESSAGE: Request body:`, req.body);
  
  const { groupId } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    console.log(`[${timestamp}] CHAT SEND MESSAGE: Message content is required`);
    return res.status(400).json({
      success: false,
      message: 'Message content is required'
    });
  }

  if (content.length > 1000) {
    console.log(`[${timestamp}] CHAT SEND MESSAGE: Message content too long:`, content.length);
    return res.status(400).json({
      success: false,
      message: 'Message content too long (max 1000 characters)'
    });
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    console.log(`[${timestamp}] CHAT SEND MESSAGE: Invalid ObjectId format:`, groupId);
    return res.status(400).json({
      success: false,
      message: 'Invalid group ID format'
    });
  }

  console.log(`[${timestamp}] CHAT SEND MESSAGE: Looking for group with ID:`, groupId);
  // Verify user is member of the group
  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found'
    });
  }

  const isMember = group.members.some(member => 
    member.userId.toString() === req.user!._id.toString()
  );

  if (!isMember) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You are not a member of this group.'
    });
  }

  // Create message
  const message = await Message.create({
    groupId,
    senderId: req.user!._id,
    content: content.trim(),
    type: 'text'
  });

  // Populate sender information
  await message.populate('senderId', 'fullname nickname');

  res.status(201).json({
    success: true,
    data: {
      message
    }
  });
}));

// @desc    Send a poll
// @route   POST /api/chat/:groupId/poll
// @access  Private
router.post('/:groupId/poll', asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { question, options, expiresInDays = 7 } = req.body;

  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Poll question and at least 2 options are required'
    });
  }

  if (options.length > 10) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 10 poll options allowed'
    });
  }

  // Verify user is member of the group
  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found'
    });
  }

  const isMember = group.members.some(member => 
    member.userId.toString() === req.user!._id.toString()
  );

  if (!isMember) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You are not a member of this group.'
    });
  }

  // Create poll message
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const message = await Message.create({
    groupId,
    senderId: req.user!._id,
    content: question.trim(),
    type: 'poll',
    pollData: {
      question: question.trim(),
      options: options.map((option: string) => option.trim()),
      votes: [],
      expiresAt
    }
  });

  // Populate sender information
  await message.populate('senderId', 'fullname nickname');

  res.status(201).json({
    success: true,
    data: {
      message
    }
  });
}));

// @desc    Vote on a poll
// @route   POST /api/chat/:groupId/poll/:messageId/vote
// @access  Private
router.post('/:groupId/poll/:messageId/vote', asyncHandler(async (req: Request, res: Response) => {
  const { groupId, messageId } = req.params;
  const { option } = req.body;

  if (!option) {
    return res.status(400).json({
      success: false,
      message: 'Vote option is required'
    });
  }

  // Find the message
  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Poll not found'
    });
  }

  if (message.groupId.toString() !== groupId) {
    return res.status(400).json({
      success: false,
      message: 'Poll does not belong to this group'
    });
  }

  if (message.type !== 'poll' || !message.pollData) {
    return res.status(400).json({
      success: false,
      message: 'Message is not a poll'
    });
  }

  // Verify user is member of the group
  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found'
    });
  }

  const isMember = group.members.some(member => 
    member.userId.toString() === req.user!._id.toString()
  );

  if (!isMember) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You are not a member of this group.'
    });
  }

  // Check if poll is expired
  if (message.pollData && new Date() > message.pollData.expiresAt) {
    return res.status(400).json({
      success: false,
      message: 'Poll has expired'
    });
  }

  // Check if option is valid
  if (!message.pollData.options.includes(option)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid poll option'
    });
  }

  // Add vote - remove existing vote from this user first
  message.pollData.votes = message.pollData.votes.filter((vote: any) => 
    vote.userId.toString() !== req.user!._id.toString()
  );
  
  // Add new vote
  message.pollData.votes.push({
    userId: req.user!._id as any,
    option,
    timestamp: new Date()
  });
  
  await message.save();

  // Populate sender information
  await message.populate('senderId', 'fullname nickname');

  res.status(200).json({
    success: true,
    data: {
      message
    }
  });
}));

// @desc    Delete a message (only by sender)
// @route   DELETE /api/chat/:groupId/message/:messageId
// @access  Private
router.delete('/:groupId/message/:messageId', asyncHandler(async (req: Request, res: Response) => {
  const { groupId, messageId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  if (message.groupId.toString() !== groupId) {
    return res.status(400).json({
      success: false,
      message: 'Message does not belong to this group'
    });
  }

  // Only the sender can delete their message
  if (message.senderId.toString() !== req.user!._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only delete your own messages.'
    });
  }

  await Message.findByIdAndDelete(messageId);

  res.status(200).json({
    success: true,
    message: 'Message deleted successfully'
  });
}));

export default router;
