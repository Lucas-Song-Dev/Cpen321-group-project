/**
 * Task API Tests - With Mocking
 * 
 * These tests verify task endpoints using mocks to simulate external component failures.
 * Each exposed interface has a describe group with tests that require mocking.
 */

import request from 'supertest';
import express from 'express';
import taskRouter from '../../routes/task.routes';
import { errorHandler } from '../../middleware/errorHandler.middleware';
import { UserModel } from '../../models/user.models';
import Group from '../../models/group.models';
import Task from '../../models/task.models';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());
app.use('/api/task', taskRouter);
app.use(errorHandler);

describe('Task API Tests - With Mocking', () => {
  let testUser: any;
  let testGroup: any;
  let authToken: string;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Ensure mongoose connection is ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    testUser = await UserModel.create({
      email: 'testuser@example.com',
      name: 'Test User',
      googleId: 'test-google-id',
      profileComplete: true
    });

    testGroup = await Group.create({
      name: 'Test Group',
      owner: testUser._id,
      members: [{ userId: testUser._id, joinDate: new Date() }]
    });

    authToken = jwt.sign(
      { email: testUser.email, id: testUser._id.toString() },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  // ===================================================================
  // POST /api/task - with mocking
  // ===================================================================
  describe('POST /api/task - with mocking', () => {
    /**
     * Test: POST /api/task
     * Input: Valid task data, but Group.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding group
     * Mock Behavior: Group.findOne throws an error
     */
    test('should handle database error when finding group', async () => {
      // Mock Group.findOne to throw an error
      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/task')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Clean Kitchen',
          difficulty: 3,
          recurrence: 'weekly',
          requiredPeople: 1
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findOne = originalFindOne;
    });

    /**
     * Test: POST /api/task
     * Input: Valid task data, but Task.create fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when creating task
     * Mock Behavior: Task.create throws an error
     */
    test('should handle database error when creating task', async () => {
      // Mock Task.create to throw an error
      const originalCreate = Task.create;
      Task.create = jest.fn().mockRejectedValue(new Error('Database write failed'));

      const response = await request(app)
        .post('/api/task')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Clean Kitchen',
          difficulty: 3,
          recurrence: 'weekly',
          requiredPeople: 1
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Task.create = originalCreate;
    });

    /**
     * Test: POST /api/task
     * Input: Valid task data, but task.save fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when saving task
     * Mock Behavior: task.save throws an error
     */
    test('should handle database error when saving task', async () => {
      // Create a mock task with save that fails
      const mockTask = {
        assignments: [],
        populate: jest.fn().mockReturnThis(),
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      const originalCreate = Task.create;
      Task.create = jest.fn().mockResolvedValue(mockTask);

      const response = await request(app)
        .post('/api/task')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Clean Kitchen',
          difficulty: 3,
          recurrence: 'weekly',
          requiredPeople: 1,
          assignedUserIds: [testUser._id.toString()]
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Task.create = originalCreate;
    });
  });

  // ===================================================================
  // GET /api/task - with mocking
  // ===================================================================
  describe('GET /api/task - with mocking', () => {
    /**
     * Test: GET /api/task
     * Input: Valid request, but Group.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding group
     * Mock Behavior: Group.findOne throws an error
     */
    test('should handle database error when finding group', async () => {
      // Mock Group.findOne to throw an error
      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/task')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findOne = originalFindOne;
    });

    /**
     * Test: GET /api/task
     * Input: Valid request, but Task.find fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding tasks
     * Mock Behavior: Task.find throws an error
     */
    test('should handle database error when finding tasks', async () => {
      // Mock Task.find to throw an error
      const originalFind = Task.find;
      Task.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Database query failed'))
          })
        })
      });

      const response = await request(app)
        .get('/api/task')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Task.find = originalFind;
    });
  });

  // ===================================================================
  // PUT /api/task/:id/status - with mocking
  // ===================================================================
  describe('PUT /api/task/:id/status - with mocking', () => {
    /**
     * Test: PUT /api/task/:id/status
     * Input: Valid task ID and status, but Task.findById fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding task
     * Mock Behavior: Task.findById throws an error
     */
    test('should handle database error when finding task', async () => {
      // Mock Task.findById to throw an error
      const originalFindById = Task.findById;
      Task.findById = jest.fn().mockRejectedValue(new Error('Database query failed'));

      const response = await request(app)
        .put('/api/task/123456789012345678901234/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Task.findById = originalFindById;
    });

    /**
     * Test: PUT /api/task/:id/status
     * Input: Valid task ID and status, but task.save fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when saving task
     * Mock Behavior: task.save throws an error
     */
    test('should handle database error when saving task status', async () => {
      // Create a mock task with current-week assignment and save that fails
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const mockTask = {
        assignments: [
          {
            userId: testUser._id,
            weekStart: startOfWeek,
            status: 'incomplete'
          }
        ],
        populate: jest.fn().mockReturnThis(),
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      const originalFindById = Task.findById;
      Task.findById = jest.fn().mockResolvedValue(mockTask);

      const response = await request(app)
        .put('/api/task/123456789012345678901234/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Task.findById = originalFindById;
    });
  });

  // ===================================================================
  // POST /api/task/:id/assign - with mocking
  // ===================================================================
  describe('POST /api/task/:id/assign - with mocking', () => {
    /**
     * Test: POST /api/task/:id/assign
     * Input: Valid task ID and userIds, but Task.findById fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding task
     * Mock Behavior: Task.findById throws an error
     */
    test('should handle database error when finding task', async () => {
      // Mock Task.findById to throw an error
      const originalFindById = Task.findById;
      Task.findById = jest.fn().mockRejectedValue(new Error('Database query failed'));

      const response = await request(app)
        .post('/api/task/123456789012345678901234/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userIds: [testUser._id.toString()] });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Task.findById = originalFindById;
    });

    /**
     * Test: POST /api/task/:id/assign
     * Input: Valid task ID and userIds, but Group.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding group
     * Mock Behavior: Group.findOne throws an error
     */
    test('should handle database error when finding group', async () => {
      // Create a mock task
      const mockTask = {
        createdBy: testUser._id,
        assignments: [],
        populate: jest.fn().mockReturnThis(),
        save: jest.fn().mockResolvedValue(null)
      };

      const originalFindById = Task.findById;
      Task.findById = jest.fn().mockResolvedValue(mockTask);

      // Mock Group.findOne to throw an error
      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/task/123456789012345678901234/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userIds: [testUser._id.toString()] });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore originals
      Task.findById = originalFindById;
      Group.findOne = originalFindOne;
    });
  });

  // ===================================================================
  // POST /api/task/assign-weekly - with mocking
  // ===================================================================
  describe('POST /api/task/assign-weekly - with mocking', () => {
    /**
     * Test: POST /api/task/assign-weekly
     * Input: Valid request, but Group.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding group
     * Mock Behavior: Group.findOne throws an error
     */
    test('should handle database error when finding group', async () => {
      // Mock Group.findOne to throw an error
      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      });

      const response = await request(app)
        .post('/api/task/assign-weekly')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findOne = originalFindOne;
    });

    /**
     * Test: POST /api/task/assign-weekly
     * Input: Valid request, but Task.find fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding tasks
     * Mock Behavior: Task.find throws an error
     */
    test('should handle database error when finding tasks', async () => {
      // Mock Group.findOne to return a valid group
      const mockGroup = {
        _id: testGroup._id,
        owner: testUser._id,
        members: [{ userId: testUser._id }]
      };

      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockGroup)
      });

      // Mock Task.find to throw an error
      const originalFind = Task.find;
      Task.find = jest.fn().mockRejectedValue(new Error('Database query failed'));

      const response = await request(app)
        .post('/api/task/assign-weekly')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore originals
      Group.findOne = originalFindOne;
      Task.find = originalFind;
    });
  });

  // ===================================================================
  // DELETE /api/task/:id - with mocking
  // ===================================================================
  describe('DELETE /api/task/:id - with mocking', () => {
    /**
     * Test: DELETE /api/task/:id
     * Input: Valid task ID, but Task.findById fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding task
     * Mock Behavior: Task.findById throws an error
     */
    test('should handle database error when finding task', async () => {
      // Mock Task.findById to throw an error
      const originalFindById = Task.findById;
      Task.findById = jest.fn().mockRejectedValue(new Error('Database query failed'));

      const response = await request(app)
        .delete('/api/task/123456789012345678901234')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Task.findById = originalFindById;
    });

    /**
     * Test: DELETE /api/task/:id
     * Input: Valid task ID, but Task.findByIdAndDelete fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when deleting task
     * Mock Behavior: Task.findByIdAndDelete throws an error
     */
    test('should handle database error when deleting task', async () => {
      // Create a mock task
      const mockTask = {
        createdBy: testUser._id
      };

      const originalFindById = Task.findById;
      Task.findById = jest.fn().mockResolvedValue(mockTask);

      // Mock Task.findByIdAndDelete to throw an error
      const originalFindByIdAndDelete = Task.findByIdAndDelete;
      Task.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .delete('/api/task/123456789012345678901234')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore originals
      Task.findById = originalFindById;
      Task.findByIdAndDelete = originalFindByIdAndDelete;
    });
  });

  // ===================================================================
  // GET /api/task/my-tasks - with mocking
  // ===================================================================
  describe('GET /api/task/my-tasks - with mocking', () => {
    /**
     * Test: GET /api/task/my-tasks
     * Input: Valid request, but Group.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding group
     * Mock Behavior: Group.findOne throws an error
     */
    test('should handle database error when finding group', async () => {
      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockRejectedValue(new Error('Database query failed'));

      const response = await request(app)
        .get('/api/task/my-tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findOne = originalFindOne;
    });

    /**
     * Test: GET /api/task/my-tasks
     * Input: Valid request, but Task.find fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding tasks
     * Mock Behavior: Task.find throws an error
     */
    test('should handle database error when finding tasks', async () => {
      const mockGroup = {
        _id: testGroup._id,
        members: [{ userId: testUser._id }]
      };

      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockResolvedValue(mockGroup);

      const originalFind = Task.find;
      Task.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Query failed'))
          })
        })
      });

      const response = await request(app)
        .get('/api/task/my-tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore originals
      Group.findOne = originalFindOne;
      Task.find = originalFind;
    });
  });

  // ===================================================================
  // GET /api/task/week/:weekStart - with mocking
  // ===================================================================
  describe('GET /api/task/week/:weekStart - with mocking', () => {
    /**
     * Test: GET /api/task/week/:weekStart
     * Input: Valid weekStart date, but Group.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding group
     * Mock Behavior: Group.findOne throws an error
     */
    test('should handle database error when finding group', async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockRejectedValue(new Error('Database query failed'));

      const response = await request(app)
        .get(`/api/task/week/${weekStart.toISOString()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findOne = originalFindOne;
    });

    /**
     * Test: GET /api/task/week/:weekStart
     * Input: Valid weekStart date, but Task.find fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding tasks
     * Mock Behavior: Task.find throws an error
     */
    test('should handle database error when finding tasks', async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const mockGroup = {
        _id: testGroup._id,
        members: [{ userId: testUser._id }]
      };

      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockResolvedValue(mockGroup);

      const originalFind = Task.find;
      Task.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Query failed'))
          })
        })
      });

      const response = await request(app)
        .get(`/api/task/week/${weekStart.toISOString()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore originals
      Group.findOne = originalFindOne;
      Task.find = originalFind;
    });
  });

  // ===================================================================
  // GET /api/task/date/:date - with mocking
  // ===================================================================
  describe('GET /api/task/date/:date - with mocking', () => {
    /**
     * Test: GET /api/task/date/:date
     * Input: Valid date, but Group.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding group
     * Mock Behavior: Group.findOne throws an error
     */
    test('should handle database error when finding group', async () => {
      const targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);

      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockRejectedValue(new Error('Database query failed'));

      const response = await request(app)
        .get(`/api/task/date/${targetDate.toISOString()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findOne = originalFindOne;
    });

    /**
     * Test: GET /api/task/date/:date
     * Input: Valid date, but Task.find fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding tasks
     * Mock Behavior: Task.find throws an error
     */
    test('should handle database error when finding tasks', async () => {
      const targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);

      const mockGroup = {
        _id: testGroup._id,
        members: [{ userId: testUser._id }]
      };

      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockResolvedValue(mockGroup);

      const originalFind = Task.find;
      Task.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Query failed'))
          })
        })
      });

      const response = await request(app)
        .get(`/api/task/date/${targetDate.toISOString()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore originals
      Group.findOne = originalFindOne;
      Task.find = originalFind;
    });
  });

  // ===================================================================
  // POST /api/task - Mock to test line 89 filter callback
  // ===================================================================
  describe('POST /api/task - Mock to test line 89', () => {
    /**
     * Test: POST /api/task - should execute filter callback when task has assignments (line 89)
     * Input: Task creation with assignedUserIds, but task already has assignments
     * Expected Status: 201
     * Expected Behavior: Should execute filter callback on line 89
     * Mock Behavior: Mock Task.create to return task with existing assignments
     */
    test('should execute filter callback when task has assignments (line 89)', async () => {
      const otherUser = await UserModel.create({
        email: 'otheruser89@example.com',
        name: 'Other User',
        googleId: 'otheruser89-google-id',
        profileComplete: true
      });

      testGroup.members.push({ userId: otherUser._id, joinDate: new Date() });
      await testGroup.save();

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Mock Task.create to return a task with existing assignments
      const originalCreate = Task.create;
      Task.create = jest.fn().mockImplementation(async (data: any) => {
        // Create the task normally
        const task = await originalCreate.call(Task, data);
        // Manually add an assignment for current week to trigger filter callback
        task.assignments = [{
          userId: testUser._id,
          weekStart: startOfWeek,
          status: 'incomplete'
        }];
        return task;
      });

      try {
        const response = await request(app)
          .post('/api/task')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Task With Existing Assignment',
            difficulty: 2,
            recurrence: 'weekly',
            requiredPeople: 1,
            assignedUserIds: [otherUser._id.toString()]
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        // Line 89 filter callback should have executed to filter out the existing assignment
      } finally {
        // Restore original
        Task.create = originalCreate;
      }
    });
  });

  // ===================================================================
  // POST /api/task/assign-weekly - Mock to test line 396
  // ===================================================================
  describe('POST /api/task/assign-weekly - Mock to test line 396', () => {
    /**
     * Test: POST /api/task/assign-weekly - should set requiredPeople fallback (line 396)
     * Input: Task without requiredPeople field
     * Expected Status: 200
     * Expected Behavior: Should set requiredPeople to 1 when missing (line 396)
     */
    test('should set requiredPeople fallback for task without requiredPeople (line 396)', async () => {
      // Create a weekly recurring task without requiredPeople (old task format)
      // Must be weekly (not one-time) and have no assignments for this week
      const oldTask = await Task.create({
        name: 'Very Old Weekly Task',
        groupId: testGroup._id,
        createdBy: testUser._id,
        difficulty: 3,
        recurrence: 'weekly',
        assignments: [] // No assignments
        // requiredPeople not set - line 396 will set it to 1
      });

      // Use raw MongoDB to remove requiredPeople field (simulating old task)
      await Task.collection.updateOne(
        { _id: oldTask._id },
        { $unset: { requiredPeople: '' } }
      );

      // Ensure task has no assignments so it gets processed
      await Task.updateOne(
        { _id: oldTask._id },
        { $set: { assignments: [] } }
      );
      
      // Mock Task.find to return task with requiredPeople undefined
      // This ensures line 401-402 executes (Mongoose might apply defaults otherwise)
      const originalFind = Task.find;
      const allTasks = await Task.find({ groupId: testGroup._id });
      const mockTask = allTasks.find(t => t._id.toString() === oldTask._id.toString());
      
      if (mockTask) {
        // Manually set requiredPeople to undefined to trigger line 401-402
        (mockTask as any).requiredPeople = undefined;
        
        // Create a mock that works for both calls:
        // 1. Line 355: Task.find() - returns array directly
        // 2. Line 419: Task.find().populate().populate() - returns populated array
        let callCount = 0;
        Task.find = jest.fn().mockImplementation(() => {
          callCount++;
          // First call (line 355) - return array directly
          if (callCount === 1) {
            return Promise.resolve([mockTask]);
          }
          // Second call (line 419) - return object with populate chain
          return {
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockResolvedValue([mockTask])
            })
          };
        });
      }

      try {
        const response = await request(app)
          .post('/api/task/assign-weekly')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        
        // Verify requiredPeople was set to 1 (line 401-402)
        // The task should have requiredPeople set in memory even if not saved
        expect(mockTask?.requiredPeople).toBe(1);
      } finally {
        // Restore original
        Task.find = originalFind;
      }
    });
  });
});
