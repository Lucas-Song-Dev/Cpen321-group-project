import { Request, Response } from 'express';
import groupService from '../services/group.services';

export class GroupController {
  /**
   * Create a new group
   */
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

  /**
   * Join an existing group
   */
  async joinGroup(req: Request, res: Response) {
    try {
      const { groupCode } = req.body;

      if (!groupCode || groupCode.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Group code is required'
        });
      }

      const group = await groupService.joinGroup(req.user!._id, groupCode);

      res.status(200).json({
        success: true,
        message: 'Joined group successfully',
        data: group
      });
    } catch (error: any) {
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
        default:
          throw error;
      }
    }
  }

  /**
   * Get user's current group
   */
  async getUserGroup(req: Request, res: Response) {
    try {
      const group = await groupService.getUserGroup(req.user!._id);

      res.status(200).json({
        success: true,
        data: group
      });
    } catch (error: any) {
      if (error.message === 'USER_NOT_IN_GROUP') {
        return res.status(404).json({
          success: false,
          message: 'User is not a member of any group'
        });
      }

      console.error('GROUP GET: Unexpected error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load group data'
      });
    }
  }

  /**
   * Transfer ownership to another member
   */
  async transferOwnership(req: Request, res: Response) {
    try {
      const { newOwnerId } = req.params;
      const group = await groupService.transferOwnership(req.user!._id, newOwnerId);

      res.status(200).json({
        success: true,
        message: 'Ownership transferred successfully',
        data: group
      });
    } catch (error: any) {
      switch (error.message) {
        case 'USER_NOT_IN_GROUP':
          return res.status(404).json({
            success: false,
            message: 'User is not a member of any group'
          });
        case 'NOT_GROUP_OWNER':
          return res.status(403).json({
            success: false,
            message: 'Only the group owner can transfer ownership'
          });
        case 'ALREADY_OWNER':
          return res.status(400).json({
            success: false,
            message: 'You are already the owner of this group'
          });
        case 'NEW_OWNER_NOT_MEMBER':
          return res.status(400).json({
            success: false,
            message: 'The specified user is not a member of this group'
          });
        default:
          throw error;
      }
    }
  }

  /**
   * Remove a member from group
   */
  async removeMember(req: Request, res: Response) {
    try {
      const { memberId } = req.params;
      const group = await groupService.removeMember(req.user!._id, memberId);

      res.status(200).json({
        success: true,
        message: 'Member removed successfully',
        data: group
      });
    } catch (error: any) {
      switch (error.message) {
        case 'USER_NOT_IN_GROUP':
          return res.status(404).json({
            success: false,
            message: 'User is not a member of any group'
          });
        case 'NOT_GROUP_OWNER':
          return res.status(403).json({
            success: false,
            message: 'Only the group owner can remove members'
          });
        case 'CANNOT_REMOVE_OWNER':
          return res.status(400).json({
            success: false,
            message: 'Cannot remove the group owner'
          });
        case 'MEMBER_NOT_FOUND':
          return res.status(404).json({
            success: false,
            message: 'Member not found in group'
          });
        default:
          throw error;
      }
    }
  }

  /**
   * Leave current group
   */
  async leaveGroup(req: Request, res: Response) {
    try {
      const result = await groupService.leaveGroup(req.user!._id);

      if (result.groupDeleted) {
        return res.status(200).json({
          success: true,
          message: 'Successfully left the group and deleted empty group'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Successfully left the group'
      });
    } catch (error: any) {
      if (error.message === 'USER_NOT_IN_GROUP') {
        return res.status(404).json({
          success: false,
          message: 'User is not a member of any group'
        });
      }

      throw error;
    }
  }
}

export default new GroupController();