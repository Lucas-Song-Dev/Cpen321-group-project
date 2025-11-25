import { Request, Response } from 'express';
import chatService from '../services/chat.service';
import { socketHandler } from '../index';

export class ChatController {
  /**
   * Get messages for a group
   */
  async getGroupMessages(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const result = await chatService.getGroupMessages(
        groupId,
        req.user!._id,
        Number(page),
        Number(limit)
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
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
        case 'NOT_GROUP_MEMBER':
          return res.status(403).json({
            success: false,
            message: 'Access denied. You are not a member of this group.'
          });
        default:
          throw error;
      }
    }
  }

  /**
   * Send a text message
   */
  async sendTextMessage(req: Request, res: Response) {
    const timestamp = new Date().toISOString();
    
    try {
      const { groupId } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Message content too long (max 1000 characters)'
        });
      }

      const message = await chatService.sendTextMessage(groupId, req.user!._id, content);

      // Broadcast message via Socket.IO
      try {
        const io = socketHandler.getIO();
        const messageData = {
          id: message._id.toString(),
          content: message.content,
          senderId: message.senderId._id.toString(),
          senderName: (message.senderId as { name?: string }).name ?? 'User',
          groupId,
          timestamp: message.createdAt.getTime(),
          type: message.type
        };
        
        // Get all sockets in the room
        await io.in(groupId).fetchSockets();
        
        io.to(groupId).emit('new-message', messageData);
      } catch (socketError) {
        console.error(`[${timestamp}] CHAT SEND MESSAGE: Socket broadcast error:`, socketError);
      }

      res.status(201).json({
        success: true,
        data: {
          message
        }
      });
    } catch (error: any) {
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
        case 'NOT_GROUP_MEMBER':
          return res.status(403).json({
            success: false,
            message: 'Access denied. You are not a member of this group.'
          });
        default:
          throw error;
      }
    }
  }

  /**
   * Create a poll
   */
  async createPoll(req: Request, res: Response) {
    try {
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

      const message = await chatService.createPoll(
        groupId,
        req.user!._id,
        question,
        options,
        expiresInDays
      );

      res.status(201).json({
        success: true,
        data: {
          message
        }
      });
    } catch (error: any) {
      switch (error.message) {
        case 'GROUP_NOT_FOUND':
          return res.status(404).json({
            success: false,
            message: 'Group not found'
          });
        case 'NOT_GROUP_MEMBER':
          return res.status(403).json({
            success: false,
            message: 'Access denied. You are not a member of this group.'
          });
        default:
          throw error;
      }
    }
  }

  /**
   * Vote on a poll
   */
  async voteOnPoll(req: Request, res: Response) {
    try {
      const { groupId, messageId } = req.params;
      const { option } = req.body;

      if (!option) {
        return res.status(400).json({
          success: false,
          message: 'Vote option is required'
        });
      }

      const message = await chatService.voteOnPoll(groupId, messageId, req.user!._id, option);

      res.status(200).json({
        success: true,
        data: {
          message
        }
      });
    } catch (error: any) {
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
        case 'NOT_GROUP_MEMBER':
          return res.status(403).json({
            success: false,
            message: 'Access denied. You are not a member of this group.'
          });
        case 'POLL_NOT_FOUND':
          return res.status(404).json({
            success: false,
            message: 'Poll not found'
          });
        case 'POLL_NOT_IN_GROUP':
          return res.status(400).json({
            success: false,
            message: 'Poll does not belong to this group'
          });
        case 'NOT_A_POLL':
          return res.status(400).json({
            success: false,
            message: 'Message is not a poll'
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
        default:
          throw error;
      }
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(req: Request, res: Response) {
    try {
      const { groupId, messageId } = req.params;

      await chatService.deleteMessage(groupId, messageId, req.user!._id);

      res.status(200).json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error: any) {
      switch (error.message) {
        case 'MESSAGE_NOT_FOUND':
          return res.status(404).json({
            success: false,
            message: 'Message not found'
          });
        case 'MESSAGE_NOT_IN_GROUP':
          return res.status(400).json({
            success: false,
            message: 'Message does not belong to this group'
          });
        case 'NOT_MESSAGE_SENDER':
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only delete your own messages.'
          });
        default:
          throw error;
      }
    }
  }
}

export default new ChatController();