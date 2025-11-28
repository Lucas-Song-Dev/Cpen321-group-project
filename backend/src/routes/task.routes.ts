import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { TaskController } from '../controller/task.controller';

const taskRouter = express.Router();

// All routes below this middleware are protected
taskRouter.use(protect);

// @desc    Create a new task
// @route   POST /api/task
taskRouter.post('/', (req, res) => TaskController.createTask(req, res));

// @desc    Get tasks for current group
// @route   GET /api/task
taskRouter.get('/', (req, res) => TaskController.getTasksForGroup(req, res));

// @desc    Get tasks assigned to current user
// @route   GET /api/task/my-tasks
taskRouter.get('/my-tasks', (req, res) => TaskController.getMyTasks(req, res));

// @desc    Update task status
// @route   PUT /api/task/:id/status
taskRouter.put('/:id/status', (req, res) => TaskController.updateTaskStatus(req, res));

// @desc    Assign task to users for current week
// @route   POST /api/task/:id/assign
taskRouter.post('/:id/assign', (req, res) => TaskController.assignTask(req, res));

// @desc    Algorithmically assign all tasks for current week
// @route   POST /api/task/assign-weekly
taskRouter.post('/assign-weekly', (req, res) => TaskController.assignWeeklyTasks(req, res));

// @desc    Get tasks for a specific week
// @route   GET /api/task/week/:weekStart
taskRouter.get('/week/:weekStart', (req, res) => TaskController.getTasksForWeek(req, res));

// @desc    Delete task
// @route   DELETE /api/task/:id
taskRouter.delete('/:id', (req, res) => TaskController.deleteTask(req, res));

// @desc    Get tasks for a specific date
// @route   GET /api/task/date/:date
taskRouter.get('/date/:date', (req, res) => TaskController.getTasksForDate(req, res));

export default taskRouter;