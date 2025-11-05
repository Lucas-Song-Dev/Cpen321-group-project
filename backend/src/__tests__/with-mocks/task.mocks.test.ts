/**
 * Task API Tests - With Mocking
 * 
 * These tests verify task endpoints using mocks to simulate external component failures.
 * Each exposed interface has a describe group with tests that require mocking.
 */

import request from 'supertest';
import express from 'express';
import taskRouter from '../../routes/task';
import { errorHandler } from '../../middleware/errorHandler';
import { UserModel } from '../../models/User';
import Group from '../../models/Group';
import Task from '../../models/Task';
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
});
