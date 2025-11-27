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
    const { groupCode } = req.body;

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

}

export default new GroupController();