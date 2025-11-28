import { Request, Response } from 'express';
import groupService from '../services/group.services';

class GroupController {
  async createGroup(req: Request, res: Response) {
    try {
      const name = String(req.body.name);

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Group name is required'
        });
      }

      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);
      const group = await groupService.createGroup(userId, name);

      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        data: group
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_ALREADY_IN_GROUP') {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of a group'
        });
      }
      
      throw error;
    }
  }

  async joinGroup(req: Request, res: Response) {
    try {
      const groupCode = String(req.body.groupCode);

      if (!groupCode || groupCode.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Group code is required'
        });
      }

      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);
      
      if (typeof userId !== 'string') {
        return res.status(401).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      const group = await groupService.joinGroup(userId, groupCode);

      res.status(200).json({
        success: true,
        message: 'Joined group successfully',
        data: group
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'GROUP_NOT_FOUND':
            return res.status(404).json({
              success: false,
              message: 'Group not found'
            });
          case 'ALREADY_MEMBER_OF_THIS_GROUP':
            return res.status(400).json({
              success: false,
              message: 'User is already a member of this group'
            });
          case 'USER_ALREADY_IN_GROUP':
            return res.status(400).json({
              success: false,
              message: 'User is already a member of a group'
            });
          case 'GROUP_FULL':
            return res.status(400).json({
              success: false,
              message: 'Group is full (maximum 8 members)'
            });
        }
      }
      
      throw error;
    }
  }

  async getCurrentGroup(req: Request, res: Response) {
    try {
      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);

      if (typeof userId !== 'string') {
        return res.status(401).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      const group = await groupService.getCurrentGroup(userId);

      res.status(200).json({
        success: true,
        data: group
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_NOT_IN_GROUP') {
        return res.status(404).json({
          success: false,
          message: 'User is not a member of any group'
        });
      }

      console.error(`[${new Date().toISOString()}] GROUP GET: Unexpected error:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to load group data'
      });
    }
  }

  async updateGroupName(req: Request, res: Response) {
    try {
      const name = String(req.body.name);

      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);

      if (typeof userId !== 'string') {
        return res.status(401).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      const group = await groupService.updateGroupName(userId, name);

      res.status(200).json({
        success: true,
        message: 'Group name updated successfully',
        data: group
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'GROUP_NAME_REQUIRED':
            return res.status(400).json({
              success: false,
              message: 'Group name is required'
            });
          case 'GROUP_NAME_TOO_LONG':
            return res.status(400).json({
              success: false,
              message: 'Group name must be 100 characters or fewer'
            });
          case 'USER_NOT_IN_GROUP':
            return res.status(404).json({
              success: false,
              message: 'User is not a member of any group'
            });
          case 'NOT_GROUP_OWNER':
            return res.status(403).json({
              success: false,
              message: 'Only the group owner can update the name'
            });
        }
      }

      throw error;
    }
  }

}

export default new GroupController();