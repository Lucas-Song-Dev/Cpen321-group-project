/**
 * Chat API Tests - With Mocking
 * 
 * These tests verify chat endpoints using mocks to simulate external component failures.
 * Each exposed interface has a describe group with tests that require mocking.
 */

import request from 'supertest';
import express from 'express';
import { UserModel } from '../../models/User';
import Group from '../../models/Group';
import Message from '../../models/Message';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import mongoose from 'mongoose';

// Mock socketHandler
const mockEmit = jest.fn();
const mockTo = jest.fn(() => ({ emit: mockEmit }));
const mockGetIO = jest.fn(() => ({
  to: mockTo,
  in: jest.fn(() => ({
    fetchSockets: jest.fn().mockResolvedValue([])
  }))
}));

jest.mock('../../index', () => ({
  socketHandler: {
    getIO: mockGetIO
  }
}));

import chatRouter from '../../routes/chat';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/chat', chatRouter);
app.use(errorHandler);

describe('Chat API Tests - With Mocking', () => {
  let testUser: any;
  let testGroup: any;
  let authToken: string;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    mockEmit.mockClear();
    mockTo.mockClear();
    mockGetIO.mockClear();

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
  // GET /api/chat/:groupId/messages - with mocking
  // ===================================================================
  describe('GET /api/chat/:groupId/messages - with mocking', () => {
    /**
     * Test: GET /api/chat/:groupId/messages
     * Input: Valid groupId, but database query fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors gracefully
     * Mock Behavior: Group.findById throws an error
     */
    test('should handle database error when fetching group', async () => {
      // Mock Group.findById to throw an error
      const originalFindById = Group.findById;
      Group.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get(`/api/chat/${testGroup._id}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findById = originalFindById;
    });

    /**
     * Test: GET /api/chat/:groupId/messages
     * Input: Valid groupId, but message query fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when fetching messages
     * Mock Behavior: Message.find throws an error
     */
    test('should handle database error when fetching messages', async () => {
      // Mock Message.find to throw an error
      const originalFind = Message.find;
      Message.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockRejectedValue(new Error('Database query failed'))
            })
          })
        })
      });

      const response = await request(app)
        .get(`/api/chat/${testGroup._id}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Message.find = originalFind;
    });

    /**
     * Test: GET /api/chat/:groupId/messages
     * Input: Valid groupId, but countDocuments fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when counting messages
     * Mock Behavior: Message.countDocuments throws an error
     */
    test('should handle database error when counting messages', async () => {
      await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Test message',
        type: 'text'
      });

      // Mock Message.countDocuments to throw an error
      const originalCountDocuments = Message.countDocuments;
      Message.countDocuments = jest.fn().mockRejectedValue(new Error('Count query failed'));

      const response = await request(app)
        .get(`/api/chat/${testGroup._id}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Message.countDocuments = originalCountDocuments;
    });
  });

  // ===================================================================
  // POST /api/chat/:groupId/message - with mocking
  // ===================================================================
  describe('POST /api/chat/:groupId/message - with mocking', () => {
    /**
     * Test: POST /api/chat/:groupId/message
     * Input: Valid message, but database save fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database save errors
     * Mock Behavior: Message.create throws an error
     */
    test('should handle database error when creating message', async () => {
      // Mock Message.create to throw an error
      const originalCreate = Message.create;
      Message.create = jest.fn().mockRejectedValue(new Error('Database save failed'));

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/message`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Test message' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Message.create = originalCreate;
    });

    /**
     * Test: POST /api/chat/:groupId/message
     * Input: Valid message, but socket emit fails
     * Expected Status: 201
     * Expected Output: { success: true, data: { message: {...} } }
     * Expected Behavior: Should succeed even if socket emit fails
     * Mock Behavior: socketHandler.getIO().to().emit throws an error
     */
    test('should handle socket error gracefully', async () => {
      // Mock socket emit to throw an error
      mockEmit.mockImplementation(() => {
        throw new Error('Socket emit failed');
      });

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/message`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Test message' });

      // Should still succeed even if socket fails
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message.content).toBe('Test message');
    });

    /**
     * Test: POST /api/chat/:groupId/message
     * Input: Valid message, but Group.findById fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when fetching group
     * Mock Behavior: Group.findById throws an error
     */
    test('should handle database error when fetching group', async () => {
      // Mock Group.findById to throw an error
      const originalFindById = Group.findById;
      Group.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/message`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Test message' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findById = originalFindById;
    });
  });

  // ===================================================================
  // POST /api/chat/:groupId/poll - with mocking
  // ===================================================================
  describe('POST /api/chat/:groupId/poll - with mocking', () => {
    /**
     * Test: POST /api/chat/:groupId/poll
     * Input: Valid poll data, but database save fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database save errors
     * Mock Behavior: Message.create throws an error
     */
    test('should handle database error when creating poll', async () => {
      // Mock Message.create to throw an error
      const originalCreate = Message.create;
      Message.create = jest.fn().mockRejectedValue(new Error('Database save failed'));

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          question: 'Test Question?',
          options: ['Yes', 'No']
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Message.create = originalCreate;
    });

    /**
     * Test: POST /api/chat/:groupId/poll
     * Input: Valid poll data, but socket emit fails
     * Expected Status: 201
     * Expected Output: { success: true, data: { message: {...} } }
     * Expected Behavior: Should succeed even if socket emit fails
     * Mock Behavior: socketHandler.getIO().to().emit throws an error
     */
    test('should handle socket error gracefully', async () => {
      // Mock socket emit to throw an error
      mockEmit.mockImplementation(() => {
        throw new Error('Socket emit failed');
      });

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          question: 'Test Question?',
          options: ['Yes', 'No']
        });

      // Should still succeed even if socket fails
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message.type).toBe('poll');
    });

    /**
     * Test: POST /api/chat/:groupId/poll
     * Input: Valid poll data, but Group.findById fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when fetching group
     * Mock Behavior: Group.findById throws an error
     */
    test('should handle database error when fetching group', async () => {
      // Mock Group.findById to throw an error
      const originalFindById = Group.findById;
      Group.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          question: 'Test Question?',
          options: ['Yes', 'No']
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findById = originalFindById;
    });
  });

  // ===================================================================
  // POST /api/chat/:groupId/poll/:messageId/vote - with mocking
  // ===================================================================
  describe('POST /api/chat/:groupId/poll/:messageId/vote - with mocking', () => {
    let poll: any;

    beforeEach(async () => {
      poll = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Test Question?',
        type: 'poll',
        pollData: {
          question: 'Test Question?',
          options: ['Yes', 'No'],
          votes: [],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
    });

    /**
     * Test: POST /api/chat/:groupId/poll/:messageId/vote
     * Input: Valid vote, but Message.findById fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when fetching poll
     * Mock Behavior: Message.findById throws an error
     */
    test('should handle database error when fetching poll', async () => {
      // Mock Message.findById to throw an error
      const originalFindById = Message.findById;
      Message.findById = jest.fn().mockRejectedValue(new Error('Database query failed'));

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll/${poll._id}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ option: 'Yes' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Message.findById = originalFindById;
    });

    /**
     * Test: POST /api/chat/:groupId/poll/:messageId/vote
     * Input: Valid vote, but save fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when saving vote
     * Mock Behavior: message.save() throws an error
     */
    test('should handle database error when saving vote', async () => {
      // Mock the poll's save method to throw an error
      const mockPoll = await Message.findById(poll._id);
      if (mockPoll) {
        const originalSave = mockPoll.save;
        mockPoll.save = jest.fn().mockRejectedValue(new Error('Database save failed'));

        // We need to mock Message.findById to return our mock poll
        const originalFindById = Message.findById;
        Message.findById = jest.fn().mockResolvedValue(mockPoll);

        const response = await request(app)
          .post(`/api/chat/${testGroup._id}/poll/${poll._id}/vote`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ option: 'Yes' });

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);

        // Restore original
        Message.findById = originalFindById;
        mockPoll.save = originalSave;
      }
    });

    /**
     * Test: POST /api/chat/:groupId/poll/:messageId/vote
     * Input: Valid vote, but Group.findById fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when fetching group
     * Mock Behavior: Group.findById throws an error
     */
    test('should handle database error when fetching group', async () => {
      // Mock Group.findById to throw an error
      const originalFindById = Group.findById;
      Group.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll/${poll._id}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ option: 'Yes' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findById = originalFindById;
    });

    /**
     * Test: POST /api/chat/:groupId/poll/:messageId/vote
     * Input: Valid vote, but socket emit fails
     * Expected Status: 200
     * Expected Output: { success: true, data: { message: {...} } }
     * Expected Behavior: Should succeed even if socket emit fails
     * Mock Behavior: socketHandler.getIO().to().emit throws an error
     */
    test('should handle socket error gracefully', async () => {
      // Mock socket emit to throw an error
      mockEmit.mockImplementation(() => {
        throw new Error('Socket emit failed');
      });

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll/${poll._id}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ option: 'Yes' });

      // Should still succeed even if socket fails
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ===================================================================
  // DELETE /api/chat/:groupId/message/:messageId - with mocking
  // ===================================================================
  describe('DELETE /api/chat/:groupId/message/:messageId - with mocking', () => {
    /**
     * Test: DELETE /api/chat/:groupId/message/:messageId
     * Input: Valid messageId, but Message.findById fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when fetching message
     * Mock Behavior: Message.findById throws an error
     */
    test('should handle database error when fetching message', async () => {
      // Mock Message.findById to throw an error
      const originalFindById = Message.findById;
      Message.findById = jest.fn().mockRejectedValue(new Error('Database query failed'));

      const messageId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/chat/${testGroup._id}/message/${messageId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Message.findById = originalFindById;
    });

    /**
     * Test: DELETE /api/chat/:groupId/message/:messageId
     * Input: Valid messageId, but delete fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when deleting message
     * Mock Behavior: Message.findByIdAndDelete throws an error
     */
    test('should handle database error when deleting message', async () => {
      const message = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Message to delete',
        type: 'text'
      });

      // Mock Message.findByIdAndDelete to throw an error
      const originalFindByIdAndDelete = Message.findByIdAndDelete;
      Message.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Database delete failed'));

      const response = await request(app)
        .delete(`/api/chat/${testGroup._id}/message/${message._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Message.findByIdAndDelete = originalFindByIdAndDelete;
    });

    /**
     * Test: DELETE /api/chat/:groupId/message/:messageId
     * Input: Valid messageId, but Message.findById fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when fetching message
     * Mock Behavior: Message.findById throws an error
     */
    test('should handle database error when fetching message (delete)', async () => {
      const originalFindById = Message.findById;
      Message.findById = jest.fn().mockRejectedValue(new Error('Database query failed'));

      const response = await request(app)
        .delete(`/api/chat/${testGroup._id}/message/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Message.findById = originalFindById;
    });

    /**
     * Test: DELETE /api/chat/:groupId/message/:messageId
     * Input: Valid messageId, but socket emit fails
     * Expected Status: 200
     * Expected Output: { success: true, message: "Message deleted successfully" }
     * Expected Behavior: Should succeed even if socket emit fails
     * Mock Behavior: socketHandler.getIO().to().emit throws an error
     */
    test('should handle socket error gracefully', async () => {
      const message = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Message to delete',
        type: 'text'
      });

      // Mock socket emit to throw an error
      mockEmit.mockImplementation(() => {
        throw new Error('Socket emit failed');
      });

      const response = await request(app)
        .delete(`/api/chat/${testGroup._id}/message/${message._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should still succeed even if socket fails
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

