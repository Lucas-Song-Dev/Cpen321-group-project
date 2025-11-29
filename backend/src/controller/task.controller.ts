import { Request, Response } from 'express';
import taskService from '../services/task.services';

export const TaskController = {
  createTask: async (req: Request, res: Response) => {
    try {
      const { name, description, difficulty, recurrence, requiredPeople, deadline, assignedUserIds } = req.body;

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

      return res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: { task }
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'MISSING_REQUIRED_FIELDS':
            return res.status(400).json({
              success: false,
              message: 'Task name, difficulty, recurrence, and required people are required'
            });
          case 'INVALID_DIFFICULTY':
            return res.status(400).json({
              success: false,
              message: 'Difficulty must be between 1 and 5'
            });
          case 'INVALID_REQUIRED_PEOPLE':
            return res.status(400).json({
              success: false,
              message: 'Required people must be between 1 and 10'
            });
          case 'DEADLINE_REQUIRED_FOR_ONE_TIME':
            return res.status(400).json({
              success: false,
              message: 'Deadline is required for one-time tasks'
            });
          case 'DEADLINE_MUST_BE_FUTURE':
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
  },

  getTasksForGroup: async (req: Request, res: Response) => {
    try {
      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);

      const tasks = await taskService.getTasksForGroup(userId);

      return res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_NOT_IN_GROUP') {
        return res.status(404).json({
          success: false,
          message: 'User is not a member of any group'
        });
      }

      throw error;
    }
  },

  getMyTasks: async (req: Request, res: Response) => {
      try {
        // Check if user exists first
        if (!req.user?._id) {
          return res.status(401).json({
            success: false,
            message: 'User not authenticated'
          });
        }

        const userId = String(req.user._id);

        const tasks = await taskService.getMyTasks(userId);

        return res.status(200).json({
          success: true,
          data: tasks
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'USER_NOT_IN_GROUP') {
          return res.status(404).json({
            success: false,
            message: 'User is not a member of any group'
          });
        }

        throw error;
      }
  },

  updateTaskStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const task = await taskService.updateTaskStatus(id, userId, status as 'incomplete' | 'in-progress' | 'completed');

      return res.status(200).json({
        success: true,
        message: 'Task status updated successfully',
        data: { task }
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'INVALID_STATUS':
            return res.status(400).json({
              success: false,
              message: 'Invalid status. Must be one of: pending, in-progress, completed, cancelled'
            });
          case 'TASK_NOT_FOUND':
            return res.status(404).json({
              success: false,
              message: 'Task not found'
            });
          case 'USER_NOT_ASSIGNED_TO_TASK':
            return res.status(404).json({
              success: false,
              message: 'Assignment not found'
            });
        }
      }

      throw error;
    }
  },

  assignTask: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { assignedUserIds, userIds } = req.body;

      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);

      // Support both assignedUserIds (service) and userIds (tests/client)
      const ids = Array.isArray(assignedUserIds) ? assignedUserIds : userIds;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'assignedUserIds must be a non-empty array'
        });
      }

      // Validate and convert to string array
      const validatedUserIds: string[] = ids.map((id: unknown) => String(id));

      const task = await taskService.assignTask(id, userId, validatedUserIds);

      return res.status(200).json({
        success: true,
        message: 'Task assigned successfully',
        data: { task }
      });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'TASK_NOT_FOUND':
            return res.status(404).json({
              success: false,
              message: 'Task not found'
            });
          case 'GROUP_NOT_FOUND':
            return res.status(404).json({
              success: false,
              message: 'Group not found'
            });
          case 'USER_NOT_IN_GROUP':
            return res.status(404).json({
              success: false,
              message: 'User is not a member of any group'
            });
          case 'INSUFFICIENT_PERMISSIONS':
            return res.status(403).json({
              success: false,
              message: 'You do not have permission to assign this task'
            });
          case 'ASSIGNED_USER_NOT_IN_GROUP':
            return res.status(400).json({
              success: false,
              message: 'One or more assigned users are not in the group'
            });
          case 'TOO_MANY_ASSIGNEES':
            return res.status(400).json({
              success: false,
              message: 'Cannot assign more users than required'
            });
        }
      }

      throw error;
    }
  },

  assignWeeklyTasks: async (req: Request, res: Response) => {
    try {
      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);

      const assignments = await taskService.assignWeeklyTasks(userId);

      const message =
        assignments.length === 0
          ? 'No tasks to assign for this week'
          : `Assigned ${assignments.length} tasks for this week`;

      return res.status(200).json({
        success: true,
        message,
        data: assignments
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_NOT_IN_GROUP') {
        return res.status(404).json({
          success: false,
          message: 'User is not a member of any group'
        });
      }

      throw error;
    }
  },

  getTasksForWeek: async (req: Request, res: Response) => {
    try {
      const { weekStart } = req.params;

      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);

      if (!weekStart) {
        return res.status(400).json({
          success: false,
          message: 'weekStart parameter is required'
        });
      }

      const tasks = await taskService.getTasksForWeek(userId, weekStart);

      return res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'USER_NOT_IN_GROUP') {
          return res.status(404).json({
            success: false,
            message: 'User is not a member of any group'
          });
        }
        if (error.message === 'INVALID_WEEK_START') {
          return res.status(400).json({
            success: false,
            message: 'Invalid week start'
          });
        }
      }

      throw error;
    }
  },

  deleteTask: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);

      const result = await taskService.deleteTask(id, userId);

      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      if (error instanceof Error) {
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
          case 'INSUFFICIENT_PERMISSIONS':
            return res.status(403).json({
              success: false,
              message: 'You do not have permission to delete this task'
            });
        }
      }

      throw error;
    }
  },

  getTasksForDate: async (req: Request, res: Response) => {
    try {
      const { date } = req.params;

      // Check if user exists first
      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userId = String(req.user._id);

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'date parameter is required'
        });
      }

      const tasks = await taskService.getTasksForDate(userId, date);

      return res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'USER_NOT_IN_GROUP') {
          return res.status(404).json({
            success: false,
            message: 'User is not a member of any group'
          });
        }
        if (error.message === 'INVALID_DATE') {
          return res.status(400).json({
            success: false,
            message: 'Invalid date'
          });
        }
      }

      throw error;
    }
  }
};
