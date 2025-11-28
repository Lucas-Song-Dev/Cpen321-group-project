import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { TaskController } from '../controller/task.controller';

const taskRouter = express.Router();

// All routes below this middleware are protected
taskRouter.use((req, res, next) => {
  protect(req, res, next).catch((err: unknown) => {
    next(err);
  });
});

// @desc    Create a new task
// @route   POST /api/task
taskRouter.post('/', TaskController.createTask);

// @desc    Get tasks for current group
// @route   GET /api/task
taskRouter.get('/', TaskController.getTasksForGroup);

// @desc    Get tasks assigned to current user
// @route   GET /api/task/my-tasks
taskRouter.get('/my-tasks', TaskController.getMyTasks);

// @desc    Update task status
// @route   PUT /api/task/:id/status
taskRouter.put('/:id/status', TaskController.updateTaskStatus);

// @desc    Assign task to users for current week
// @route   POST /api/task/:id/assign
taskRouter.post('/:id/assign', TaskController.assignTask);

// @desc    Algorithmically assign all tasks for current week
// @route   POST /api/task/assign-weekly
taskRouter.post('/assign-weekly', TaskController.assignWeeklyTasks);

// @desc    Get tasks for a specific week
// @route   GET /api/task/week/:weekStart
taskRouter.get('/week/:weekStart', TaskController.getTasksForWeek);

// @desc    Delete task
// @route   DELETE /api/task/:id
taskRouter.delete('/:id', TaskController.deleteTask);

// @desc    Get tasks for a specific date
// @route   GET /api/task/date/:date
taskRouter.get('/date/:date', TaskController.getTasksForDate);

export default taskRouter;