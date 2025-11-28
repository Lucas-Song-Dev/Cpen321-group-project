import { Request, Response } from 'express';
import taskService from '../services/task.services';

export const TaskController = {
  createTask: async (req: Request, res: Response) => {
    try {
      const { name, description, difficulty, recurrence, requiredPeople, deadline, assignedUserIds } = req.body;

      // Validate required fields
      if (!name || !difficulty || !recurrence || !requiredPeople) {
        return res.status(400).json({
          success: false,
          message: 'Task name, difficulty, recurrence, and required people are required'
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

      const task = await taskService.createTask(userId, {
        name,
        description,
        difficulty,
        recurrence,
        requiredPeople,
        deadline,
        assignedUserIds
      });

      res.status(201).json({
        success: true,
        data: {
          task
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'DIFFICULTY_INVALID':
            return res.status(400).json({
              success: false,
              message: 'Difficulty must be between 1 and 5'
            });
          case 'REQUIRED_PEOPLE_INVALID':
            return res.status(400).json({
              success: false,
              message: 'Required people must be between 1 and 10'
            });
          case 'DEADLINE_REQUIRED':
            return res.status(400).json({
              success: false,
              message: 'Deadline is required for one-time tasks'
            });
          case 'DEADLINE_INVALID_FORMAT':
            return res.status(400).json({
              success: false,
              message: 'Invalid deadline date format'
            });
          case 'DEADLINE_PAST':
            return res.status(400).json({
              success: false,
              message: 'Deadline must be in the future'
            });
          case 'USER_NOT_IN_GROUP':
            return res.status(404).json({
              success: false,
              message: 'User is not a member of any group'
            });
        }
      }

      throw error;
    }
  }
};
