import Task from '../models/task.models';
import Group from '../models/group.models';
import mongoose from 'mongoose';

export class TaskService {
  /**
   * Create a new task
   */
  async createTask(
    userId: string,
    name: string,
    difficulty: number,
    recurrence: string,
    requiredPeople: number,
    description?: string,
    deadline?: Date,
    assignedUserIds?: string[]
  ) {
    // Get user's current group
    const group = await Group.findOne({ 
      'members.userId': userId 
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Create task
    const task = await Task.create({
      name: name.trim(),
      description: description?.trim(),
      groupId: group._id,
      createdBy: userId,
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

      // Assign to specified users
      assignedUserIds.forEach((assignedUserId: string) => {
        task.assignments.push({
          userId: new mongoose.Types.ObjectId(assignedUserId),
          weekStart: startOfWeek,
          status: 'incomplete'
        });
      });
      
      await task.save();
    }

    // Populate references
    await task.populate('createdBy', 'name email');
    await task.populate('assignments.userId', 'name email');

    return task;
  }

  /**
   * Get all tasks for user's group
   */
  async getGroupTasks(userId: string) {
    // Get user's current group
    const group = await Group.findOne({ 
      'members.userId': userId 
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Get tasks for the group
    const tasks = await Task.find({ groupId: group._id })
      .populate('createdBy', 'name email')
      .populate('assignments.userId', 'name email')
      .sort({ createdAt: -1 });

    return tasks;
  }

  /**
   * Get tasks assigned to current user for current week
   */
  async getUserTasks(userId: string) {
    // Get user's current group
    const group = await Group.findOne({ 
      'members.userId': userId 
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Get current week start
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get tasks assigned to current user for current week
    const tasks = await Task.find({ 
      groupId: group._id,
      'assignments.userId': userId,
      'assignments.weekStart': startOfWeek
    })
      .populate('createdBy', 'name email')
      .populate('assignments.userId', 'name email')
      .sort({ createdAt: -1 });

    return tasks;
  }
  
  /**
   * Update task status
   */
  async updateTaskStatus(userId: string, taskId: string, status: "incomplete" | "in-progress" | "completed") {
    // Get current week start
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Find task
    const task = await Task.findById(taskId);

    if (!task) {
      throw new Error('TASK_NOT_FOUND');
    }

    // Update assignment status
    const assignment = task.assignments.find((assignment: { userId: mongoose.Types.ObjectId; weekStart: Date }) => 
      assignment.userId.toString() === userId &&
      assignment.weekStart.getTime() === startOfWeek.getTime()
    );

    if (!assignment) {
      throw new Error('ASSIGNMENT_NOT_FOUND');
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

    return task;
  }

  /**
   * Assign task to users for current week
   */
  async assignTask(userId: string, taskId: string, userIds: string[]) {
    // Verify user has permission to assign tasks
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('TASK_NOT_FOUND');
    }

    // Get user's group
    const group = await Group.findOne({ 
      'members.userId': userId 
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Check if user can assign tasks (task creator or group owner)
    const canAssign = task.createdBy.toString() === userId || 
                     group.owner.toString() === userId;

    if (!canAssign) {
      throw new Error('NO_PERMISSION_TO_ASSIGN');
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
    userIds.forEach((assignUserId: string) => {
      task.assignments.push({
        userId: new mongoose.Types.ObjectId(assignUserId),
        weekStart: startOfWeek,
        status: 'incomplete'
      });
    });
    
    await task.save();

    // Populate references
    await task.populate('createdBy', 'name email');
    await task.populate('assignments.userId', 'name email');

    return task;
  }

  /**
   * Algorithmically assign all tasks for current week
   */
  async assignWeeklyTasks(userId: string) {
    // Get user's current group
    const group = await Group.findOne({ 
      'members.userId': userId 
    }).populate('members.userId', 'name email');

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Get current week start
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get all tasks for the group
    const tasks = await Task.find({ groupId: group._id });
    
    if (tasks.length === 0) {
      return { assignedTasks: 0 };
    }

    // Get all group members
    const allMembers = group.members.map(member => ({ 
      userId: member.userId, 
      isOwner: member.userId.toString() === group.owner.toString() 
    }));

    let assignedTasksCount = 0;

    // Algorithm: Assign tasks based on required people count
    for (const task of tasks) {
      // Skip one-time tasks that already have assignments
      if (task.recurrence === 'one-time' && task.assignments.length > 0) {
        continue;
      }

      // Check if task already has assignments for this week
      const hasAssignmentForThisWeek = task.assignments.some((assignment: { weekStart: Date }) => 
        assignment.weekStart.getTime() === startOfWeek.getTime()
      );
      
      if (hasAssignmentForThisWeek) {
        continue;
      }

      // Use the requiredPeople field to determine how many people to assign
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

    return { assignedTasks: assignedTasksCount };
  }

  /**
   * Get tasks for a specific week
   */
  async getTasksForWeek(userId: string, weekStart: string) {
    // Parse week start date
    const weekStartDate = new Date(weekStart);
    if (isNaN(weekStartDate.getTime())) {
      throw new Error('INVALID_WEEK_START_DATE');
    }

    // Normalize week start to start of day
    const normalizedWeekStart = new Date(weekStartDate);
    normalizedWeekStart.setHours(0, 0, 0, 0);

    // Get user's current group
    const group = await Group.findOne({ 
      'members.userId': userId 
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Calculate week end
    const weekEndDate = new Date(normalizedWeekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    // Get tasks for the week
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
        // All recurring tasks
        {
          recurrence: { $ne: 'one-time' }
        }
      ]
    })
    .populate('createdBy', 'name email')
    .populate('assignments.userId', 'name email')
    .sort({ createdAt: -1 });

    return tasks;
  }

  /**
   * Get tasks for a specific date
   */
  async getTasksForDate(userId: string, date: string) {
    const targetDate = new Date(date);
    
    if (isNaN(targetDate.getTime())) {
      throw new Error('INVALID_DATE_FORMAT');
    }

    // Get user's current group
    const group = await Group.findOne({ 
      'members.userId': userId 
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Get start and end of the target date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Calculate week boundaries
    const weekStartDate = new Date(startOfDay);
    const dayOfWeek = weekStartDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStartDate.setDate(weekStartDate.getDate() - daysToMonday);
    weekStartDate.setHours(0, 0, 0, 0);

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
        // All recurring tasks
        {
          recurrence: { $ne: 'one-time' }
        }
      ]
    })
    .populate('createdBy', 'name email')
    .populate('assignments.userId', 'name email')
    .sort({ createdAt: -1 });

    return tasks;
  }

  /**
   * Delete a task
   */
  async deleteTask(userId: string, taskId: string) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('TASK_NOT_FOUND');
    }

    // Get user's group
    const group = await Group.findOne({ 
      'members.userId': userId 
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Only task creator or group owner can delete
    const canDelete = task.createdBy.toString() === userId || 
                     group.owner.toString() === userId;

    if (!canDelete) {
      throw new Error('NO_PERMISSION_TO_DELETE');
    }

    await Task.findByIdAndDelete(taskId);

    return { deleted: true };
  }
}

export default new TaskService();