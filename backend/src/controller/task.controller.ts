import { Request, Response } from 'express';
import taskService from '../services/task.service';

export class TaskController {
  /**
   * Create a new task
   */
  async createTask(req: Request, res: Response) {
    try {
      const { name, description, difficulty, recurrence, requiredPeople, deadline, assignedUserIds } = req.body;

      // Validate required fields
      if (!name || !difficulty || !recurrence || !requiredPeople) {
        return res.status(400).json({
          success: false,
          message: 'Task name, difficulty, recurrence, and required people are required'
        });
      }

      if (difficulty < 1 || difficulty > 5) {
        return res.status(400).json({
          success: false,
          message: 'Difficulty must be between 1 and 5'
        });
      }

      if (requiredPeople < 1 || requiredPeople > 10) {
        return res.status(400).json({
          success: false,
          message: 'Required people must be between 1 and 10'
        });
      }

      // Validate deadline for one-time tasks
      if (recurrence === 'one-time' && !deadline) {
        return res.status(400).json({
          success: false,
          message: 'Deadline is required for one-time tasks'
        });
      }

      if (deadline && new Date(deadline) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Deadline must be in the future'
        });
      }

      const task = await taskService.createTask(
        req.user!._id,
        name,
        difficulty,
        recurrence,
        requiredPeople,
        description,
        deadline,
        assignedUserIds
      );

      res.status(201).json({
        success: true,
        data: {
          task
        }
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

  /**
   * Get tasks for current group
   */
  async getGroupTasks(req: Request, res: Response) {
    try {
      const tasks = await taskService.getGroupTasks(req.user!._id);

      res.status(200).json({
        success: true,
        data: tasks
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

  /**
   * Get tasks assigned to current user
   */
  async getUserTasks(req: Request, res: Response) {
    try {
      const tasks = await taskService.getUserTasks(req.user!._id);

      res.status(200).json({
        success: true,
        data: tasks
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

  /**
   * Update task status
   */
  async updateTaskStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['incomplete', 'in-progress', 'completed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required (incomplete, in-progress, completed)'
        });
      }

      const task = await taskService.updateTaskStatus(req.user!._id, id, status);

      res.status(200).json({
        success: true,
        data: {
          task
        }
      });
    } catch (error: any) {
      switch (error.message) {
        case 'TASK_NOT_FOUND':
          return res.status(404).json({
            success: false,
            message: 'Task not found'
          });
        case 'ASSIGNMENT_NOT_FOUND':
          return res.status(404).json({
            success: false,
            message: 'Assignment not found'
          });
        default:
          throw error;
      }
    }
  }

  /**
   * Assign task to users for current week
   */
  async assignTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
      }

      const task = await taskService.assignTask(req.user!._id, id, userIds);

      res.status(200).json({
        success: true,
        data: {
          task
        }
      });
    } catch (error: any) {
      switch (error.message) {
        case 'TASK_NOT_FOUND':
          return res.status(404).json({
            success: false,
            message: 'Task not found'
          });
        case 'USER_NOT_IN_GROUP':
          return res.status(404).json({
            success: false,
            message: 'User is not a member of any group'
          });
        case 'NO_PERMISSION_TO_ASSIGN':
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to assign this task'
          });
        default:
          throw error;
      }
    }
  }

  /**
   * Algorithmically assign all tasks for current week
   */
  async assignWeeklyTasks(req: Request, res: Response) {
    try {
      const result = await taskService.assignWeeklyTasks(req.user!._id);

      res.status(200).json({
        success: true,
        message: `Successfully assigned ${result.assignedTasks} tasks for the week`,
        data: result
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

  /**
   * Get tasks for a specific week
   */
  async getTasksForWeek(req: Request, res: Response) {
    try {
      const { weekStart } = req.params;

      const tasks = await taskService.getTasksForWeek(req.user!._id, weekStart);

      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error: any) {
      switch (error.message) {
        case 'INVALID_WEEK_START_DATE':
          return res.status(400).json({
            success: false,
            message: 'Invalid week start date'
          });
        case 'USER_NOT_IN_GROUP':
          return res.status(404).json({
            success: false,
            message: 'User is not a member of any group'
          });
        default:
          throw error;
      }
    }
  }

  /**
   * Get tasks for a specific date
   */
  async getTasksForDate(req: Request, res: Response) {
    try {
      const { date } = req.params;

      const tasks = await taskService.getTasksForDate(req.user!._id, date);

      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error: any) {
      switch (error.message) {
        case 'INVALID_DATE_FORMAT':
          return res.status(400).json({
            success: false,
            message: 'Invalid date format'
          });
        case 'USER_NOT_IN_GROUP':
          return res.status(404).json({
            success: false,
            message: 'User is not a member of any group'
          });
        default:
          throw error;
      }
    }
  }

  /**
   * Delete task
   */
  async deleteTask(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await taskService.deleteTask(req.user!._id, id);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error: any) {
      switch (error.message) {
        case 'TASK_NOT_FOUND':
          return res.status(404).json({
            success: false,
            message: 'Task not found'
          });
        case 'USER_NOT_IN_GROUP':
          return res.status(404).json({
            success: false,
            message: 'User is not a member of any group'
          });
        case 'NO_PERMISSION_TO_DELETE':
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to delete this task'
          });
        default:
          throw error;
      }
    }
  }
}

export default new TaskController();