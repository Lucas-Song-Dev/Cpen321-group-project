import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Task from '../models/Task';
import Group from '../models/Group';
import User from '../models/User';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// @desc    Create a new task
// @route   POST /api/task
// @access  Private
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, description, difficulty, recurrence, assignedUserIds } = req.body;

  if (!name || !difficulty || !recurrence) {
    return res.status(400).json({
      success: false,
      message: 'Task name, difficulty, and recurrence are required'
    });
  }

  if (difficulty < 1 || difficulty > 5) {
    return res.status(400).json({
      success: false,
      message: 'Difficulty must be between 1 and 5'
    });
  }

  // Get user's current group
  const group = await Group.findOne({ 
    'members.userId': req.user!._id 
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  // Create task
  const task = await Task.create({
    name: name.trim(),
    description: description?.trim(),
    groupId: group._id,
    createdBy: req.user!._id,
    difficulty,
    recurrence,
    assignments: []
  });

  // If assignedUserIds provided, assign task to users for current week
  if (assignedUserIds && assignedUserIds.length > 0) {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Remove existing assignment for this week
    task.assignments = task.assignments.filter((assignment: any) => 
      assignment.weekStart.getTime() !== startOfWeek.getTime()
    );
    
    // Add new assignments
    assignedUserIds.forEach((userId: string) => {
      task.assignments.push({
        userId: userId as any,
        weekStart: startOfWeek,
        status: 'incomplete'
      });
    });
    
    await task.save();
  }

  // Populate references
  await task.populate('createdBy', 'fullname nickname');
  await task.populate('assignments.userId', 'fullname nickname');

  res.status(201).json({
    success: true,
    data: {
      task
    }
  });
}));

// @desc    Get tasks for current group
// @route   GET /api/task
// @access  Private
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  // Get user's current group
  const group = await Group.findOne({ 
    'members.userId': req.user!._id 
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  // Get tasks for the group
  const tasks = await Task.find({ groupId: group._id })
    .populate('createdBy', 'fullname nickname')
    .populate('assignments.userId', 'fullname nickname')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      tasks
    }
  });
}));

// @desc    Get tasks assigned to current user
// @route   GET /api/task/my-tasks
// @access  Private
router.get('/my-tasks', asyncHandler(async (req: Request, res: Response) => {
  // Get user's current group
  const group = await Group.findOne({ 
    'members.userId': req.user!._id 
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  // Get current week start
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Get tasks assigned to current user for current week
  const tasks = await Task.find({ 
    groupId: group._id,
    'assignments.userId': req.user!._id,
    'assignments.weekStart': startOfWeek
  })
    .populate('createdBy', 'fullname nickname')
    .populate('assignments.userId', 'fullname nickname')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      tasks
    }
  });
}));

// @desc    Update task status
// @route   PUT /api/task/:id/status
// @access  Private
router.put('/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['incomplete', 'in-progress', 'completed'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required (incomplete, in-progress, completed)'
    });
  }

  // Get current week start
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Find task and update assignment
  const task = await Task.findOne({
    _id: id,
    'assignments.userId': req.user!._id,
    'assignments.weekStart': startOfWeek
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found or not assigned to you'
    });
  }

  // Update assignment status
  const assignment = task.assignments.find((assignment: any) => 
    assignment.userId.toString() === req.user!._id.toString() &&
    assignment.weekStart.getTime() === startOfWeek.getTime()
  );

  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: 'Assignment not found'
    });
  }

  assignment.status = status;
  if (status === 'completed') {
    assignment.completedAt = new Date();
  } else {
    assignment.completedAt = undefined;
  }

  await task.save();

  // Populate references
  await task.populate('createdBy', 'fullname nickname');
  await task.populate('assignments.userId', 'fullname nickname');

  res.status(200).json({
    success: true,
    data: {
      task
    }
  });
}));

// @desc    Assign task to users for current week
// @route   POST /api/task/:id/assign
// @access  Private
router.post('/:id/assign', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'User IDs array is required'
    });
  }

  // Verify user has permission to assign tasks (only task creator or group owner)
  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Get user's group
  const group = await Group.findOne({ 
    'members.userId': req.user!._id 
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  // Check if user can assign tasks (task creator or group owner)
  const canAssign = task.createdBy.toString() === req.user!._id.toString() || 
                   group.owner.toString() === req.user!._id.toString();

  if (!canAssign) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to assign this task'
    });
  }

  // Get current week start
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Remove existing assignment for this week
  task.assignments = task.assignments.filter((assignment: any) => 
    assignment.weekStart.getTime() !== startOfWeek.getTime()
  );
  
  // Add new assignments
  userIds.forEach((userId: string) => {
    task.assignments.push({
      userId: userId as any,
      weekStart: startOfWeek,
      status: 'incomplete'
    });
  });
  
  await task.save();

  // Populate references
  await task.populate('createdBy', 'fullname nickname');
  await task.populate('assignments.userId', 'fullname nickname');

  res.status(200).json({
    success: true,
    data: {
      task
    }
  });
}));

// @desc    Delete task
// @route   DELETE /api/task/:id
// @access  Private
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Only task creator or group owner can delete
  const group = await Group.findOne({ 
    'members.userId': req.user!._id 
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  const canDelete = task.createdBy.toString() === req.user!._id.toString() || 
                   group.owner.toString() === req.user!._id.toString();

  if (!canDelete) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to delete this task'
    });
  }

  await Task.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully'
  });
}));

export default router;