import Task from '../models/task.models';
import Group from '../models/group.models';
import mongoose from 'mongoose';

class TaskService {
  async createTask(
    userId: string,
    taskData: {
      name: string;
      description?: string;
      difficulty: number;
      recurrence: string;
      requiredPeople: number;
      deadline?: Date;
      assignedUserIds?: string[];
    }
  ) {
    const { name, description, difficulty, recurrence, requiredPeople, deadline, assignedUserIds } = taskData;

    // Validate inputs
    if (!name || !difficulty || !recurrence || !requiredPeople) {
      throw new Error('MISSING_REQUIRED_FIELDS');
    }

    if (difficulty < 1 || difficulty > 5) {
      throw new Error('INVALID_DIFFICULTY');
    }

    if (requiredPeople < 1 || requiredPeople > 10) {
      throw new Error('INVALID_REQUIRED_PEOPLE');
    }

    // Validate deadline for one-time tasks
    if (recurrence === 'one-time' && !deadline) {
      throw new Error('DEADLINE_REQUIRED_FOR_ONE_TIME');
    }

    // Only validate deadline date for one-time tasks
    if (recurrence === 'one-time' && deadline) {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      if (deadlineDate <= now) {
        throw new Error('DEADLINE_MUST_BE_FUTURE');
      }
    }

    // Get user's group
    const group = await Group.findOne({
      'members.userId': new mongoose.Types.ObjectId(userId)
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Prepare initial assignments if assignedUserIds are provided
    const assignments: {
      userId: mongoose.Types.ObjectId;
      weekStart: Date;
      status: 'incomplete' | 'in-progress' | 'completed';
      completedAt?: Date;
    }[] = [];

    if (Array.isArray(assignedUserIds) && assignedUserIds.length > 0) {
      // Validate assignees are in the group
      for (const assignedUserId of assignedUserIds) {
        const isMember = group.members.some(member => member.userId.toString() === String(assignedUserId));
        if (!isMember) {
          throw new Error('ASSIGNED_USER_NOT_IN_GROUP');
        }
      }

      // Check requiredPeople limit
      if (assignedUserIds.length > requiredPeople) {
        throw new Error('TOO_MANY_ASSIGNEES');
      }

      // Current week start (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);

      assignedUserIds.forEach(assignedUserId => {
        assignments.push({
          userId: new mongoose.Types.ObjectId(String(assignedUserId)),
          weekStart: monday,
          status: 'incomplete'
        });
      });
    }

    // Create task document so that save() can be tested/mocked (and Task.create can be mocked in tests)
    const task = await Task.create({
      name,
      description: description ?? '',
      difficulty,
      recurrence,
      requiredPeople,
      deadline: recurrence === 'one-time' ? deadline : undefined,
      createdBy: new mongoose.Types.ObjectId(userId),
      groupId: group._id,
      assignments
    });

    // Explicitly save so tests can mock save() failures separately from create()
    await (task as any).save?.();

    return task;
  }

  async getTasksForGroup(userId: string) {
    // Get user's current group
    const group = await Group.findOne({
      'members.userId': new mongoose.Types.ObjectId(userId)
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    const tasks = await Task.find({ groupId: group._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return tasks;
  }

  async getMyTasks(userId: string) {
    // Ensure user is in a group
    const group = await Group.findOne({
      'members.userId': new mongoose.Types.ObjectId(userId)
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    const tasks = await Task.find({
      groupId: group._id,
      'assignments.userId': new mongoose.Types.ObjectId(userId)
    })
      .populate('createdBy', 'name email')
      .populate('groupId', 'name')
      .sort({ createdAt: -1 });

    return tasks;
  }

  async updateTaskStatus(taskId: string, userId: string, status: string) {
    // Validate status
    const validStatuses = ['incomplete', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error('INVALID_STATUS');
    }

    const task = await Task.findById(taskId);

    if (!task) {
      throw new Error('TASK_NOT_FOUND');
    }

    // Check if user is assigned to this task (has an assignment for current week)
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const userAssignment = task.assignments.find(assignment =>
      assignment.userId.toString() === userId &&
      assignment.weekStart.getTime() === currentWeekStart.getTime()
    );

    if (!userAssignment) {
      throw new Error('USER_NOT_ASSIGNED_TO_TASK');
    }

    // Update the assignment status
    userAssignment.status = status as 'incomplete' | 'in-progress' | 'completed';
    if (status === 'completed') {
      userAssignment.completedAt = new Date();
    } else {
      // Clear completedAt when status is not completed
      userAssignment.completedAt = undefined;
    }

    await task.save();

    return task;
  }

  async assignTask(taskId: string, userId: string, assignedUserIds: string[]) {
    const task = await Task.findById(taskId);

    if (!task) {
      throw new Error('TASK_NOT_FOUND');
    }

    // Check if user is the creator or group owner
    const group = await Group.findById(task.groupId);
    if (!group) {
      throw new Error('GROUP_NOT_FOUND');
    }

    const isCreator = task.createdBy.toString() === userId;
    const isOwner = group.owner && group.owner.toString() === userId;

    // Ensure calling user is a member of the group
    const isMember = group.members.some(member => member.userId.toString() === userId);
    if (!isMember) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    if (!isCreator && !isOwner) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }

    // Validate assigned users are in the group
    for (const assignedUserId of assignedUserIds) {
      const isMember = group.members.some(member => member.userId.toString() === assignedUserId);
      if (!isMember) {
        throw new Error('ASSIGNED_USER_NOT_IN_GROUP');
      }
    }

    // Check if we exceed required people
    if (assignedUserIds.length > task.requiredPeople) {
      throw new Error('TOO_MANY_ASSIGNEES');
    }

    // Get current week start
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    // Remove existing assignments for current week
    task.assignments = task.assignments.filter(assignment =>
      assignment.weekStart.getTime() !== currentWeekStart.getTime()
    );

    // Add new assignments
    assignedUserIds.forEach(assignedUserId => {
      task.assignments.push({
        userId: new mongoose.Types.ObjectId(assignedUserId),
        weekStart: currentWeekStart,
        status: assignedUserIds.length > 0 ? 'in-progress' : 'incomplete'
      });
    });

    await task.save();

    return task;
  }

  async assignWeeklyTasks(userId: string) {
    // Get user's group
    const group = await Group.findOne({
      'members.userId': new mongoose.Types.ObjectId(userId)
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Get current week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Get Monday
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Get all weekly tasks for the group
    const weeklyTasks = await Task.find({
      groupId: group._id,
      recurrence: 'weekly'
    });

    // Fallback for legacy tasks without requiredPeople
    weeklyTasks.forEach(task => {
      if (!task.requiredPeople || task.requiredPeople < 1) {
        (task as any).requiredPeople = 1;
      }
    });

    // Get all group members
    const groupMembers = group.members.map(member => member.userId.toString());

    // Algorithm to assign tasks
    const assignments = [];

    for (const task of weeklyTasks) {
      // Fallback for tasks without requiredPeople (old data)
      if (!task.requiredPeople || task.requiredPeople < 1) {
        // Set in-memory; caller tests rely on this even if save fails
        (task as any).requiredPeople = 1;
      }

      const requiredPeople = task.requiredPeople;
      // Check if already assigned this week
      const currentWeekAssignments = task.assignments.filter(assignment =>
        assignment.weekStart.getTime() === monday.getTime()
      );

      const assignedUserIds = currentWeekAssignments.map(assignment => assignment.userId.toString());

      if (assignedUserIds.length >= requiredPeople) {
        // Already fully assigned, skip
        continue;
      }

      const availableUsers = groupMembers.filter(userId =>
        !assignedUserIds.includes(userId)
      );

      const needed = requiredPeople - assignedUserIds.length;
      if (availableUsers.length >= needed) {
        const selectedUsers = availableUsers.slice(0, needed);

        // Add new assignments
        selectedUsers.forEach(userId => {
          task.assignments.push({
            userId: new mongoose.Types.ObjectId(userId),
            weekStart: monday,
            status: 'incomplete'
          });
        });

        await task.save();
        assignments.push(task);
      }
    }

    return assignments;
  }

  async getTasksForWeek(userId: string, weekStart: string) {
    // Get user's group
    const group = await Group.findOne({
      'members.userId': new mongoose.Types.ObjectId(userId)
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    const startDate = new Date(weekStart);
    if (isNaN(startDate.getTime())) {
      throw new Error('INVALID_WEEK_START');
    }
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      groupId: group._id,
      $or: [
        // One-time tasks within the week
        {
          recurrence: 'one-time',
          deadline: { $gte: startDate, $lte: endDate }
        },
        // Weekly tasks
        { recurrence: 'weekly' }
      ]
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return tasks;
  }

  async deleteTask(taskId: string, userId: string) {
    const task = await Task.findById(taskId);

    if (!task) {
      throw new Error('TASK_NOT_FOUND');
    }

    // Load group to verify membership
    const group = await Group.findById(task.groupId);
    if (!group) {
      throw new Error('GROUP_NOT_FOUND');
    }

    const isMember = group.members.some(member => member.userId.toString() === userId);
    if (!isMember) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    // Check if user is the creator
    if (task.createdBy.toString() !== userId) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }

    await Task.findByIdAndDelete(taskId);

    return { message: 'Task deleted successfully' };
  }

  async getTasksForDate(userId: string, date: string) {
    // Get user's group
    const group = await Group.findOne({
      'members.userId': new mongoose.Types.ObjectId(userId)
    });

    if (!group) {
      throw new Error('USER_NOT_IN_GROUP');
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      throw new Error('INVALID_DATE');
    }
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      groupId: group._id,
      $or: [
        // One-time tasks for this date
        {
          recurrence: 'one-time',
          deadline: { $gte: startOfDay, $lte: endOfDay }
        },
        // Weekly tasks (always shown for current week)
        { recurrence: 'weekly' }
      ]
    })
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name email')
      .sort({ createdAt: -1 });

    return tasks;
  }
}

export default new TaskService();
