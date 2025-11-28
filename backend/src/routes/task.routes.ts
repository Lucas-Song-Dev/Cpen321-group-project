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
taskRouter.post('/', (req, res) => TaskController.createTask(req, res) as Promise<any>);

// @desc    Get tasks for current group
// @route   GET /api/task
taskRouter.get('/', (req, res) => TaskController.getTasksForGroup(req, res) as Promise<any>);

// @desc    Get tasks assigned to current user
// @route   GET /api/task/my-tasks
taskRouter.get('/my-tasks', (req, res) => TaskController.getMyTasks(req, res) as Promise<any>);

// @desc    Update task status
// @route   PUT /api/task/:id/status
taskRouter.put('/:id/status', (req, res) => TaskController.updateTaskStatus(req, res) as Promise<any>);

// @desc    Assign task to users for current week
// @route   POST /api/task/:id/assign
taskRouter.post('/:id/assign', (req, res) => TaskController.assignTask(req, res) as Promise<any>);

// @desc    Algorithmically assign all tasks for current week
// @route   POST /api/task/assign-weekly
taskRouter.post('/assign-weekly', (req, res) => TaskController.assignWeeklyTasks(req, res) as Promise<any>);

// @desc    Get tasks for a specific week
// @route   GET /api/task/week/:weekStart
taskRouter.get('/week/:weekStart', (req, res) => TaskController.getTasksForWeek(req, res) as Promise<any>);

// @desc    Delete task
// @route   DELETE /api/task/:id
taskRouter.delete('/:id', (req, res) => TaskController.deleteTask(req, res) as Promise<any>);

// @desc    Get tasks for a specific date
// @route   GET /api/task/date/:date
taskRouter.get('/date/:date', (req, res) => TaskController.getTasksForDate(req, res) as Promise<any>);

export default taskRouter;