import { Request, Response } from 'express';
import groupService from '../services/group.services';

class GroupController {
  async createGroup(req: Request, res: Response) {
    try {
      const { name } = req.body;

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
}

export default new GroupController();