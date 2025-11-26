import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import Task from '../models/task.models';
import Group from '../models/group.models';
import { UserModel } from '../models/user.models';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// @desc    Create a new task
// @route   POST /api/task
// @access  Private
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, description, difficulty, recurrence, requiredPeople, deadline, assignedUserIds } = req.body;

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

  // Get user's current group
  const group = await Group.findOne({ 
    'members.userId': req.user?._id 
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
    createdBy: req.user?._id,
    difficulty,
    recurrence,
    requiredPeople,
    deadline: deadline ? new Date(deadline) : undefined,
    assignments: []
  });

  // Only assign task if specific users are provided
  if (assignedUserIds && assignedUserIds.length > 0) {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Remove existing assignment for this week
    task.assignments = task.assignments.filter((assignment: { weekStart: Date }) => 
      assignment.weekStart.getTime() !== startOfWeek.getTime()
    );
    
    // Assign to specified users
    assignedUserIds.forEach((userId: string) => {
      task.assignments.push({
        userId: new mongoose.Types.ObjectId(userId),
        weekStart: startOfWeek,
        status: 'incomplete'
      });
    });
  }
  
  await task.save();

  // Populate references
  await task.populate('createdBy', 'name email');
  await task.populate('assignments.userId', 'name email');

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
    'members.userId': req.user?._id 
  });


  if (!group) {
      return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  // Get tasks for the group
  const tasks = await Task.find({ groupId: group._id })
    .populate('createdBy', 'name email')
    .populate('assignments.userId', 'name email')
    .sort({ createdAt: -1 });


  res.status(200).json({
    success: true,
    data: tasks
  });
}));

// @desc    Get tasks assigned to current user
// @route   GET /api/task/my-tasks
// @access  Private
router.get('/my-tasks', asyncHandler(async (req: Request, res: Response) => {
  // Get user's current group
  const group = await Group.findOne({ 
    'members.userId': req.user?._id 
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
    'assignments.userId': req.user?._id,
    'assignments.weekStart': startOfWeek
  })
    .populate('createdBy', 'name email')
    .populate('assignments.userId', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: tasks
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

  // Find task first
  const task = await Task.findById(id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Update assignment status
  const assignment = task.assignments.find((assignment: { userId: mongoose.Types.ObjectId; weekStart: Date }) => 
    assignment.userId.toString() === req.user?._id.toString() &&
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
  await task.populate('createdBy', 'name email');
  await task.populate('assignments.userId', 'name email');

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
    'members.userId': req.user?._id 
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  // Check if user can assign tasks (task creator or group owner)
  const canAssign = task.createdBy.toString() === req.user?._id.toString() || 
                   group.owner.toString() === req.user?._id.toString();

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
  task.assignments = task.assignments.filter((assignment: { weekStart: Date }) => 
    assignment.weekStart.getTime() !== startOfWeek.getTime()
  );
  
  // Add new assignments
  userIds.forEach((userId: string) => {
    task.assignments.push({
      userId: new mongoose.Types.ObjectId(userId),
      weekStart: startOfWeek,
      status: 'incomplete'
    });
  });
  
  await task.save();

  // Populate references
  await task.populate('createdBy', 'name email');
  await task.populate('assignments.userId', 'name email');

  res.status(200).json({
    success: true,
    data: {
      task
    }
  });
}));

// @desc    Algorithmically assign all tasks for current week
// @route   POST /api/task/assign-weekly
// @access  Private
router.post('/assign-weekly', asyncHandler(async (req: Request, res: Response) => {
  // Get user's current group
  const group = await Group.findOne({ 
    'members.userId': req.user?._id 
  }).populate('members.userId', 'name email');

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

  // Get all tasks for the group
  const tasks = await Task.find({ groupId: group._id });
  
  if (tasks.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No tasks to assign',
      data: { assignedTasks: 0 }
    });
  }

  // Get all group members (owner is already in members array)
  const allMembers = group.members.map(member => ({ 
    userId: member.userId, 
    isOwner: member.userId.toString() === group.owner.toString() 
  }));

  let assignedTasksCount = 0;

  // Algorithm: Assign tasks based on required people count
  for (const task of tasks) {
    // Skip if task is not recurring (but allow one-time tasks)
    if (task.recurrence === 'one-time') {
      // For one-time tasks, only assign if they haven't been assigned yet
      if (task.assignments.length > 0) continue;
    }

    // Check if task already has assignments for this week
    const hasAssignmentForThisWeek = task.assignments.some((assignment: { weekStart: Date }) => 
      assignment.weekStart.getTime() === startOfWeek.getTime()
    );
    
    // Skip if already assigned for this week
    if (hasAssignmentForThisWeek) {
          continue;
    }

    // Use the requiredPeople field to determine how many people to assign
    // Fallback to 1 if requiredPeople is undefined (for existing tasks created before schema fix)
    const requiredPeople = task.requiredPeople || 1;
    const actualNumAssignees = Math.min(requiredPeople, allMembers.length);

    // Shuffle members for fair distribution
    const shuffledMembers = [...allMembers].sort(() => Math.random() - 0.5);
    const selectedMembers = shuffledMembers.slice(0, actualNumAssignees);

  
    // Ensure requiredPeople is set (fallback for existing tasks)
    if (!task.requiredPeople) {
      task.requiredPeople = 1;
    }

    // Assign task to selected members
    selectedMembers.forEach(member => {
      task.assignments.push({
        userId: member.userId,
        weekStart: startOfWeek,
        status: 'incomplete'
      });
    });

    await task.save();
    assignedTasksCount++;
  }

  // Return summary to avoid issues with mocked Task.find returning arrays
  res.status(200).json({
    success: true,
    message: `Successfully assigned ${assignedTasksCount} tasks for the week`,
    data: { assignedTasks: assignedTasksCount }
  });
}));

// @desc    Get tasks for a specific week
// @route   GET /api/task/week/:weekStart
// @access  Private
router.get('/week/:weekStart', asyncHandler(async (req: Request, res: Response) => {
  const { weekStart } = req.params;
  
  // Parse week start date (expecting format like "2025-11-24")
  // Use same approach as date endpoint to ensure consistency
  const weekStartDate = new Date(weekStart);
  if (isNaN(weekStartDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid week start date'
    });
  }

  // Normalize week start to start of day (local time, same as how tasks are stored)
  const normalizedWeekStart = new Date(weekStartDate);
  normalizedWeekStart.setHours(0, 0, 0, 0);

  // Get user's current group
  const group = await Group.findOne({ 
    'members.userId': req.user?._id 
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  // Calculate week end for date range checking (6 days after week start, at end of day)
  const weekEndDate = new Date(normalizedWeekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  weekEndDate.setHours(23, 59, 59, 999);

  // Get tasks for the group - tasks that belong to this week
  // Similar to date endpoint: return all recurring tasks (they can appear in any week)
  // and one-time tasks with deadlines in this week
  
  // Log for debugging
  console.log(`[Week Query] Week start: ${normalizedWeekStart.toISOString()}, Week end: ${weekEndDate.toISOString()}`);
  
  const tasks = await Task.find({ 
    groupId: group._id,
    $or: [
      // One-time tasks with deadline in this week
      {
        recurrence: 'one-time',
        deadline: {
          $gte: normalizedWeekStart,
          $lte: weekEndDate
        }
      },
      // All recurring tasks - they should appear regardless of assignments
      // The frontend will filter assignments to show only those for this week
      {
        recurrence: { $ne: 'one-time' }
      }
    ]
  })
  .populate('createdBy', 'name email')
  .populate('assignments.userId', 'name email')
  .sort({ createdAt: -1 });

  // Log tasks for debugging
  console.log(`[Week Query] Found ${tasks.length} tasks`);
  tasks.forEach((task, index) => {
    console.log(`[Week Query] Task ${index + 1}: ${task.name}, recurrence: ${task.recurrence}, deadline: ${task.deadline?.toISOString() || 'N/A'}`);
  });

  res.status(200).json({
    success: true,
    data: tasks
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
    'members.userId': req.user?._id 
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  const canDelete = task.createdBy.toString() === req.user?._id.toString() || 
                   group.owner.toString() === req.user?._id.toString();

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

// @desc    Get tasks for a specific date
// @route   GET /api/task/date/:date
// @access  Private
router.get('/date/:date', asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.params;
  const targetDate = new Date(date);
  
  if (isNaN(targetDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format'
    });
  }

  // Get user's current group
  const group = await Group.findOne({ 
    'members.userId': req.user?._id 
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of any group'
    });
  }

  // Get start and end of the target date
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Find tasks that should appear on this date
  // Calculate week start (Monday) for this date
  const weekStartDate = new Date(startOfDay);
  const dayOfWeek = weekStartDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6, others to 0-4
  weekStartDate.setDate(weekStartDate.getDate() - daysToMonday);
  weekStartDate.setHours(0, 0, 0, 0);
  
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  weekEndDate.setHours(23, 59, 59, 999);

  const tasks = await Task.find({
    groupId: group._id,
    $or: [
      // One-time tasks with deadline on this date
      {
        recurrence: 'one-time',
        deadline: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      },
      // All recurring tasks - they should appear regardless of assignments
      {
        recurrence: { $ne: 'one-time' }
      }
    ]
  })
  .populate('createdBy', 'name email')
  .populate('assignments.userId', 'name email')
  .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: tasks
  });
}));

export default router;