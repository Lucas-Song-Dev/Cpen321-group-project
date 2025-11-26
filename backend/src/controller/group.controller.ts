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

      const group = await groupService.createGroup(req.user!._id, name);

      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        data: group
      });
    } catch (error: any) {
      if (error.message === 'USER_ALREADY_IN_GROUP') {
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