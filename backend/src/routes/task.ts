import express from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// @desc    Create a new task
// @route   POST /api/task
// @access  Private
router.post('/', asyncHandler(async (req, res) => {
  // TODO: Implement create task
  res.status(200).json({
    success: true,
    message: 'Create task endpoint - to be implemented'
  });
}));

// @desc    Get tasks for current group
// @route   GET /api/task
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  // TODO: Implement get tasks
  res.status(200).json({
    success: true,
    message: 'Get tasks endpoint - to be implemented'
  });
}));

// @desc    Update task status
// @route   PUT /api/task/:id/status
// @access  Private
router.put('/:id/status', asyncHandler(async (req, res) => {
  // TODO: Implement update task status
  res.status(200).json({
    success: true,
    message: 'Update task status endpoint - to be implemented'
  });
}));

export default router;
