import Task from '../models/task.models';
import Group from '../models/group.models';

interface CreateTaskData {
  name: string;
  description?: string;
  difficulty: number;
  recurrence: string;
  requiredPeople: number;
  deadline?: string;
  assignedUserIds?: string[];
}

class TaskService {
  async createTask(userId: string, taskData: CreateTaskData) {
    const { name, description, difficulty, recurrence, requiredPeople, deadline, assignedUserIds } = taskData;

    // Validate inputs
    if (difficulty < 1 || difficulty > 5) {
      throw new Error('DIFFICULTY_INVALID');
    }

    if (requiredPeople < 1 || requiredPeople > 10) {
      throw new Error('REQUIRED_PEOPLE_INVALID');
    }

    // Validate deadline for one-time tasks
    if (recurrence === 'one-time' && !deadline) {
      throw new Error('DEADLINE_REQUIRED');
    }

    // Only validate deadline date for one-time tasks
    if (recurrence === 'one-time' && deadline) {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        throw new Error('DEADLINE_INVALID_FORMAT');
      }
      if (deadlineDate <= new Date()) {
        throw new Error('DEADLINE_PAST');
      }
    }

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

      // Remove existing assignment for this week
      task.assignments = task.assignments.filter((assignment: any) =>
        assignment.weekStart.getTime() !== startOfWeek.getTime()
      );

      // Assign to specified users
      assignedUserIds.forEach((userId: string) => {
        task.assignments.push({
          userId: userId as any,
          weekStart: startOfWeek,
          status: 'incomplete'
        });
      });
    }

    await task.save();

    // Populate references
    await task.populate('createdBy', 'name email');
    await task.populate('assignments.userId', 'name email');

    return task;
  }
}

export default new TaskService();
