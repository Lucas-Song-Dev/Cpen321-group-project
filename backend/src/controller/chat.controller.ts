import { Request, Response } from 'express';
import mongoose from 'mongoose';
import chatService from '../services/chat.services';

export const ChatController = {
  getGroupMessages: async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const { page = '1', limit = '50' } = req.query;

      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid page number'
        });
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid limit (1-100 allowed)'
        });
      }

      const result = await chatService.getGroupMessages(userId, groupId, pageNum, limitNum);

      return res.status(200).json({
        success: true,
        data: {
          messages: result.messages,
          pagination: {
            page: result.pagination.currentPage,
            limit: limitNum,
            totalPages: result.pagination.totalPages,
            totalMessages: result.pagination.totalMessages,
            hasNext: result.pagination.hasNext,
            hasPrev: result.pagination.hasPrev
          }
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'INVALID_GROUP_ID':
            return res.status(400).json({
              success: false,
              message: 'Invalid group ID format'
            });
          case 'GROUP_NOT_FOUND':
            return res.status(404).json({
              success: false,
              message: 'Group not found'
            });
          case 'ACCESS_DENIED':
            return res.status(403).json({
              success: false,
              message: 'Access denied. You are not a member of this group.'
            });
        }
      }

      throw error;
    }
  },

  sendMessage: async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const { content } = req.body;

      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);

      // Validate groupId format
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid group ID format'
        });
      }

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
      }

      const message = await chatService.sendMessage(userId, groupId, String(content));

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message }
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'MESSAGE_CONTENT_REQUIRED':
            return res.status(400).json({
              success: false,
              message: 'Message content is required'
            });
          case 'MESSAGE_TOO_LONG':
            return res.status(400).json({
              success: false,
              message: 'Message is too long (max 1000 characters)'
            });
          case 'GROUP_NOT_FOUND':
            return res.status(404).json({
              success: false,
              message: 'Group not found'
            });
          case 'ACCESS_DENIED':
            return res.status(403).json({
              success: false,
              message: 'Access denied. You are not a member of this group.'
            });
        }
      }

      throw error;
    }
  },

  createPoll: async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const { question, options } = req.body;

      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);

      if (!question) {
        return res.status(400).json({
          success: false,
          message: 'Poll question is required'
        });
      }

      if (!options || !Array.isArray(options)) {
        return res.status(400).json({
          success: false,
          message: 'Poll options must be an array'
        });
      }

      // Validate and convert inputs
      const validatedQuestion = String(question);
      const validatedOptions = Array.isArray(options) ? options.map(opt => String(opt)) : [];

      const message = await chatService.createPoll(userId, groupId, validatedQuestion, validatedOptions);

      return res.status(201).json({
        success: true,
        message: 'Poll created successfully',
        data: { message }
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'POLL_QUESTION_REQUIRED':
            return res.status(400).json({
              success: false,
              message: 'Poll question is required'
            });
          case 'QUESTION_TOO_LONG':
            return res.status(400).json({
              success: false,
              message: 'Question must be 200 characters or less'
            });
          case 'INVALID_POLL_OPTIONS':
            return res.status(400).json({
              success: false,
              message: 'Poll must have 2-10 options (Maximum 10)'
            });
          case 'EMPTY_POLL_OPTION':
            return res.status(400).json({
              success: false,
              message: 'Poll options cannot be empty'
            });
          case 'POLL_OPTION_TOO_LONG':
            return res.status(400).json({
              success: false,
              message: 'Poll options must be 100 characters or less'
            });
          case 'GROUP_NOT_FOUND':
            return res.status(404).json({
              success: false,
              message: 'Group not found'
            });
          case 'ACCESS_DENIED':
            return res.status(403).json({
              success: false,
              message: 'Access denied. You are not a member of this group.'
            });
        }
      }

      throw error;
    }
  },

  voteOnPoll: async (req: Request, res: Response) => {
    try {
      const { groupId, messageId } = req.params;
      const { option } = req.body;

      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);

      // Validate groupId format
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid group ID format'
        });
      }

      if (!option) {
        return res.status(400).json({
          success: false,
          message: 'Poll option is required'
        });
      }

      const message = await chatService.voteOnPoll(userId, groupId, messageId, String(option));

      return res.status(200).json({
        success: true,
        message: 'Vote recorded successfully',
        data: { message }
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'POLL_OPTION_REQUIRED':
            return res.status(400).json({
              success: false,
              message: 'Poll option is required'
            });
          case 'GROUP_NOT_FOUND':
            return res.status(404).json({
              success: false,
              message: 'Group not found'
            });
          case 'ACCESS_DENIED':
            return res.status(403).json({
              success: false,
              message: 'Access denied. You are not a member of this group.'
            });
          case 'MESSAGE_NOT_FOUND':
            return res.status(404).json({
              success: false,
              message: 'Poll not found'
            });
          case 'NOT_A_POLL':
            return res.status(400).json({
              success: false,
              message: 'This message is not a poll'
            });
          case 'POLL_DATA_MISSING':
            return res.status(500).json({
              success: false,
              message: 'Poll data is missing'
            });
          case 'POLL_EXPIRED':
            return res.status(400).json({
              success: false,
              message: 'Poll has expired'
            });
          case 'INVALID_POLL_OPTION':
            return res.status(400).json({
              success: false,
              message: 'Invalid poll option'
            });
          case 'POLL_NOT_IN_GROUP':
            return res.status(400).json({
              success: false,
              message: 'Poll does not belong to this group'
            });
        }
      }

      throw error;
    }
  },

  deleteMessage: async (req: Request, res: Response) => {
    try {
      const { groupId, messageId } = req.params;

      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);

      const result = await chatService.deleteMessage(userId, groupId, messageId);

      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'GROUP_NOT_FOUND':
            return res.status(404).json({
              success: false,
              message: 'Group not found'
            });
          case 'ACCESS_DENIED':
            return res.status(403).json({
              success: false,
              message: 'Access denied. You are not a member of this group.'
            });
          case 'MESSAGE_NOT_FOUND':
            return res.status(404).json({
              success: false,
              message: 'Message not found'
            });
          case 'DELETE_PERMISSION_DENIED':
            return res.status(403).json({
              success: false,
              message: 'You can only delete your own messages'
            });
          case 'MESSAGE_NOT_IN_GROUP':
            return res.status(400).json({
              success: false,
              message: 'Message does not belong to this group'
            });
        }
      }

      throw error;
    }
  }
};
