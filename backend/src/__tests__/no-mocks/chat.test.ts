/**
 * Chat API Tests - No Mocking
 * 
 * These tests verify chat endpoints without mocking external dependencies.
 * Each exposed interface has a describe group with tests that can run without mocks.
 */

import request from 'supertest';
import express from 'express';
import { UserModel } from '../../models/User';
import Group from '../../models/Group';
import Message from '../../models/Message';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import mongoose from 'mongoose';

// Mock socketHandler before importing chat router
jest.mock('../../index', () => ({
  socketHandler: {
    getIO: jest.fn(() => ({
      to: jest.fn(() => ({
        emit: jest.fn()
      })),
      in: jest.fn(() => ({
        fetchSockets: jest.fn().mockResolvedValue([])
      }))
    }))
  }
}));

import chatRouter from '../../routes/chat';

const app = express();
app.use(express.json());
app.use('/api/chat', chatRouter);

describe('Chat API Tests', () => {
  let testUser: any;
  let testGroup: any;
  let authToken: string;

  beforeEach(async () => {
    // Ensure mongoose connection is ready before creating records
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
  // GET /api/chat/:groupId/messages - no mocking
  // ===================================================================
  describe('GET /api/chat/:groupId/messages - no mocking', () => {
    /**
     * Test: GET /api/chat/:groupId/messages
     * Input: Valid groupId and JWT token
     * Expected Status: 200
     * Expected Output: { success: true, data: { messages: [...], pagination: {...} } }
     * Expected Behavior: Should return messages for the group
     */
    test('should return group messages', async () => {
      await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Hello world',
        type: 'text'
      });

      const response = await request(app)
        .get(`/api/chat/${testGroup._id}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.messages)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    /**
     * Test: GET /api/chat/:groupId/messages
     * Input: Valid groupId with pagination query params
     * Expected Status: 200
     * Expected Output: { success: true, data: { messages: [...], pagination: {...} } }
     * Expected Behavior: Should return paginated messages
     */
    test('should return paginated messages', async () => {
      // Create multiple messages
      for (let i = 0; i < 5; i++) {
        await Message.create({
          groupId: testGroup._id,
          senderId: testUser._id,
          content: `Message ${i}`,
          type: 'text'
        });
      }

      const response = await request(app)
        .get(`/api/chat/${testGroup._id}/messages?page=1&limit=2`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messages.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    /**
     * Test: GET /api/chat/:groupId/messages
     * Input: Invalid groupId format
     * Expected Status: 400
     * Expected Output: { success: false, message: "Invalid group ID format" }
     * Expected Behavior: Should reject invalid ObjectId format
     */
    test('should reject invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/chat/invalid-id/messages')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid group ID');
    });

    /**
     * Test: GET /api/chat/:groupId/messages
     * Input: Valid groupId but user not a member
     * Expected Status: 403
     * Expected Output: { success: false, message: "Access denied..." }
     * Expected Behavior: Should reject access for non-members
     */
    test('should reject non-member access', async () => {
      const otherUser = await UserModel.create({
        email: 'other@example.com',
        name: 'Other User',
        googleId: 'other-google-id',
        profileComplete: true
      });

      const isolatedGroup = await Group.create({
        name: 'Isolated Group',
        owner: otherUser._id,
        members: [{ userId: otherUser._id, joinDate: new Date() }]
      });

      const response = await request(app)
        .get(`/api/chat/${isolatedGroup._id}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });

    /**
     * Test: GET /api/chat/:groupId/messages
     * Input: Non-existent groupId
     * Expected Status: 404
     * Expected Output: { success: false, message: "Group not found" }
     * Expected Behavior: Should return 404 when group not found
     */
    test('should return 404 when group not found', async () => {
      const nonExistentGroupId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/chat/${nonExistentGroupId}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Group not found');
    });
  });

  // ===================================================================
  // POST /api/chat/:groupId/message - no mocking
  // ===================================================================
  describe('POST /api/chat/:groupId/message - no mocking', () => {
    /**
     * Test: POST /api/chat/:groupId/message
     * Input: { content: "Test message" }
     * Expected Status: 201
     * Expected Output: { success: true, data: { message: {...} } }
     * Expected Behavior: Should create and return a new message
     */
    test('should send a message', async () => {
      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/message`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Test message' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message.content).toBe('Test message');
      expect(response.body.data.message.senderId).toBeDefined();
    });

    /**
     * Test: POST /api/chat/:groupId/message
     * Input: Empty content
     * Expected Status: 400
     * Expected Output: { success: false, message: "Message content is required" }
     * Expected Behavior: Should reject empty messages
     */
    test('should reject empty message', async () => {
      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/message`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * Test: POST /api/chat/:groupId/message
     * Input: Message too long (> 1000 chars)
     * Expected Status: 400
     * Expected Output: { success: false, message: "Message is too long" }
     * Expected Behavior: Should reject messages over length limit
     */
    test('should reject message too long', async () => {
      const longMessage = 'a'.repeat(1001);
      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/message`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: longMessage });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('too long');
    });

    /**
     * Test: POST /api/chat/:groupId/message
     * Input: Invalid ObjectId format
     * Expected Status: 400
     * Expected Output: { success: false, message: "Invalid group ID format" }
     * Expected Behavior: Should reject invalid ObjectId format
     */
    test('should reject invalid ObjectId format', async () => {
      const response = await request(app)
        .post('/api/chat/invalid-id/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Test message' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid group ID');
    });

    /**
     * Test: POST /api/chat/:groupId/message
     * Input: Group not found
     * Expected Status: 404
     * Expected Output: { success: false, message: "Group not found" }
     * Expected Behavior: Should return 404 when group not found
     */
    test('should return 404 when group not found', async () => {
      const nonExistentGroupId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post(`/api/chat/${nonExistentGroupId}/message`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Test message' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Group not found');
    });

    /**
     * Test: POST /api/chat/:groupId/message
     * Input: User not a member of group
     * Expected Status: 403
     * Expected Output: { success: false, message: "You are not a member..." }
     * Expected Behavior: Should reject non-member access
     */
    test('should reject non-member access', async () => {
      const otherUser = await UserModel.create({
        email: 'other@example.com',
        name: 'Other User',
        googleId: 'other-google-id',
        profileComplete: true
      });

      const otherGroup = await Group.create({
        name: 'Other Group',
        owner: otherUser._id,
        members: [{ userId: otherUser._id, joinDate: new Date() }]
      });

      const response = await request(app)
        .post(`/api/chat/${otherGroup._id}/message`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Test message' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });
  });

  // ===================================================================
  // POST /api/chat/:groupId/poll - no mocking
  // ===================================================================
  describe('POST /api/chat/:groupId/poll - no mocking', () => {
    /**
     * Test: POST /api/chat/:groupId/poll
     * Input: { question: "Test?", options: ["Yes", "No"] }
     * Expected Status: 201
     * Expected Output: { success: true, data: { message: {...} } }
     * Expected Behavior: Should create a poll
     */
    test('should create a poll', async () => {
      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          question: 'Test Question?',
          options: ['Yes', 'No']
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message.type).toBe('poll');
      expect(response.body.data.message.pollData).toBeDefined();
      expect(response.body.data.message.pollData.question).toBe('Test Question?');
      expect(response.body.data.message.pollData.options).toEqual(['Yes', 'No']);
    });

    /**
     * Test: POST /api/chat/:groupId/poll
     * Input: Invalid poll (less than 2 options)
     * Expected Status: 400
     * Expected Output: { success: false, message: "Poll must have at least 2 options" }
     * Expected Behavior: Should reject polls with less than 2 options
     */
    test('should reject poll with insufficient options', async () => {
      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          question: 'Test Question?',
          options: ['Only One Option']
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * Test: POST /api/chat/:groupId/poll
     * Input: Too many options (> 10)
     * Expected Status: 400
     * Expected Output: { success: false, message: "Maximum 10 options allowed" }
     * Expected Behavior: Should reject polls with more than 10 options
     */
    test('should reject poll with too many options', async () => {
      const manyOptions = Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`);
      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          question: 'Test Question?',
          options: manyOptions
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Maximum 10');
    });

    /**
     * Test: POST /api/chat/:groupId/poll
     * Input: Group not found
     * Expected Status: 404
     * Expected Output: { success: false, message: "Group not found" }
     * Expected Behavior: Should return 404 when group not found
     */
    test('should return 404 when group not found', async () => {
      const nonExistentGroupId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post(`/api/chat/${nonExistentGroupId}/poll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          question: 'Test Question?',
          options: ['Yes', 'No']
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Group not found');
    });

    /**
     * Test: POST /api/chat/:groupId/poll
     * Input: User not a member of group
     * Expected Status: 403
     * Expected Output: { success: false, message: "You are not a member..." }
     * Expected Behavior: Should reject non-member access
     */
    test('should reject non-member access', async () => {
      const otherUser = await UserModel.create({
        email: 'other@example.com',
        name: 'Other User',
        googleId: 'other-google-id',
        profileComplete: true
      });

      const otherGroup = await Group.create({
        name: 'Other Group',
        owner: otherUser._id,
        members: [{ userId: otherUser._id, joinDate: new Date() }]
      });

      const response = await request(app)
        .post(`/api/chat/${otherGroup._id}/poll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          question: 'Test Question?',
          options: ['Yes', 'No']
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });
  });

  // ===================================================================
  // POST /api/chat/:groupId/poll/:messageId/vote - no mocking
  // ===================================================================
  describe('POST /api/chat/:groupId/poll/:messageId/vote - no mocking', () => {
    /**
     * Test: POST /api/chat/:groupId/poll/:messageId/vote
     * Input: { option: "Yes" }
     * Expected Status: 200
     * Expected Output: { success: true, data: { message: {...} } }
     * Expected Behavior: Should record vote on poll
     */
    test('should vote on poll', async () => {
      const poll = await Message.create({
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

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll/${poll._id}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ option: 'Yes' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message.pollData.votes.length).toBe(1);
      expect(response.body.data.message.pollData.votes[0].option).toBe('Yes');
    });

    /**
     * Test: POST /api/chat/:groupId/poll/:messageId/vote
     * Input: Changing vote from one option to another
     * Expected Status: 200
     * Expected Output: { success: true, data: { message: {...} } }
     * Expected Behavior: Should replace existing vote before adding new one
     */
    test('should replace existing vote', async () => {
      const poll = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Test Question?',
        type: 'poll',
        pollData: {
          question: 'Test Question?',
          options: ['Yes', 'No', 'Maybe'],
          votes: [{
            userId: testUser._id,
            option: 'Yes',
            timestamp: new Date()
          }],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Change vote from Yes to No
      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll/${poll._id}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ option: 'No' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify only one vote exists (the new one)
      const updatedPoll = await Message.findById(poll._id);
      expect(updatedPoll?.pollData?.votes.length).toBe(1);
      expect(updatedPoll?.pollData?.votes[0].option).toBe('No');
    });

    /**
     * Test: POST /api/chat/:groupId/poll/:messageId/vote
     * Input: Invalid option
     * Expected Status: 400
     * Expected Output: { success: false, message: "Invalid option" }
     * Expected Behavior: Should reject invalid poll options
     */
    test('should reject invalid option', async () => {
      const poll = await Message.create({
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

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll/${poll._id}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ option: 'Invalid Option' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * Test: POST /api/chat/:groupId/poll/:messageId/vote
     * Input: Missing option
     * Expected Status: 400
     * Expected Output: { success: false, message: "Option is required" }
     * Expected Behavior: Should reject missing option
     */
    test('should reject missing option', async () => {
      const poll = await Message.create({
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

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll/${poll._id}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({}); // Missing option

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('option is required');
    });

    /**
     * Test: POST /api/chat/:groupId/poll/:messageId/vote
     * Input: Expired poll
     * Expected Status: 400
     * Expected Output: { success: false, message: "Poll has expired" }
     * Expected Behavior: Should reject vote on expired poll
     */
    test('should reject vote on expired poll', async () => {
      const expiredPoll = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Expired Question?',
        type: 'poll',
        pollData: {
          question: 'Expired Question?',
          options: ['Yes', 'No'],
          votes: [],
          expiresAt: new Date(Date.now() - 1000) // Expired
        }
      });

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll/${expiredPoll._id}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ option: 'Yes' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    /**
     * Test: POST /api/chat/:groupId/poll/:messageId/vote
     * Input: Non-poll message
     * Expected Status: 400
     * Expected Output: { success: false, message: "Message is not a poll" }
     * Expected Behavior: Should reject non-poll message
     */
    test('should reject non-poll message', async () => {
      const textMessage = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Regular text message',
        type: 'text'
      });

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll/${textMessage._id}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ option: 'Yes' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a poll');
    });

    /**
     * Test: POST /api/chat/:groupId/poll/:messageId/vote
     * Input: Poll not found
     * Expected Status: 404
     * Expected Output: { success: false, message: "Poll not found" }
     * Expected Behavior: Should return 404 when poll not found
     */
    test('should return 404 when poll not found', async () => {
      const nonExistentMessageId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll/${nonExistentMessageId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ option: 'Yes' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Poll not found');
    });

    /**
     * Test: POST /api/chat/:groupId/poll/:messageId/vote
     * Input: Poll from different group
     * Expected Status: 400
     * Expected Output: { success: false, message: "Poll does not belong to this group" }
     * Expected Behavior: Should reject poll from different group
     */
    test('should reject poll from different group', async () => {
      const otherGroup = await Group.create({
        name: 'Other Group',
        owner: testUser._id,
        members: [{ userId: testUser._id, joinDate: new Date() }]
      });

      const poll = await Message.create({
        groupId: otherGroup._id,
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

      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/poll/${poll._id}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ option: 'Yes' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('does not belong');
    });

    /**
     * Test: POST /api/chat/:groupId/poll/:messageId/vote
     * Input: Group not found
     * Expected Status: 404
     * Expected Output: { success: false, message: "Group not found" }
     * Expected Behavior: Should return 404 when group not found
     */
    test('should return 404 when group not found', async () => {
      const poll = await Message.create({
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

      const nonExistentGroupId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post(`/api/chat/${nonExistentGroupId}/poll/${poll._id}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ option: 'Yes' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Group not found');
    });

    /**
     * Test: POST /api/chat/:groupId/poll/:messageId/vote
     * Input: User not a member of group
     * Expected Status: 403
     * Expected Output: { success: false, message: "You are not a member..." }
     * Expected Behavior: Should reject non-member access
     */
    test('should reject non-member access', async () => {
      const otherUser = await UserModel.create({
        email: 'other@example.com',
        name: 'Other User',
        googleId: 'other-google-id',
        profileComplete: true
      });

      const otherGroup = await Group.create({
        name: 'Other Group',
        owner: otherUser._id,
        members: [{ userId: otherUser._id, joinDate: new Date() }]
      });

      const poll = await Message.create({
        groupId: otherGroup._id,
        senderId: otherUser._id,
        content: 'Test Question?',
        type: 'poll',
        pollData: {
          question: 'Test Question?',
          options: ['Yes', 'No'],
          votes: [],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      const response = await request(app)
        .post(`/api/chat/${otherGroup._id}/poll/${poll._id}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ option: 'Yes' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });
  });

  // ===================================================================
  // DELETE /api/chat/:groupId/message/:messageId - no mocking
  // ===================================================================
  describe('DELETE /api/chat/:groupId/message/:messageId - no mocking', () => {
    /**
     * Test: DELETE /api/chat/:groupId/message/:messageId
     * Input: Valid messageId (as sender)
     * Expected Status: 200
     * Expected Output: { success: true, message: "Message deleted successfully" }
     * Expected Behavior: Should delete message
     */
    test('should delete message', async () => {
      const message = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Message to delete',
        type: 'text'
      });

      const response = await request(app)
        .delete(`/api/chat/${testGroup._id}/message/${message._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedMessage = await Message.findById(message._id);
      expect(deletedMessage).toBeNull();
    });

    /**
     * Test: DELETE /api/chat/:groupId/message/:messageId
     * Input: Non-sender trying to delete
     * Expected Status: 403
     * Expected Output: { success: false, message: "You can only delete your own messages" }
     * Expected Behavior: Should reject non-sender deletion attempts
     */
    test('should reject non-sender deletion', async () => {
      const otherUser = await UserModel.create({
        email: 'other@example.com',
        name: 'Other User',
        googleId: 'other-google-id',
        profileComplete: true
      });

      // Add other user to group
      testGroup.members.push({ userId: otherUser._id, joinDate: new Date() });
      await testGroup.save();

      const message = await Message.create({
        groupId: testGroup._id,
        senderId: otherUser._id,
        content: 'Other user message',
        type: 'text'
      });

      const response = await request(app)
        .delete(`/api/chat/${testGroup._id}/message/${message._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    /**
     * Test: DELETE /api/chat/:groupId/message/:messageId
     * Input: Message not found
     * Expected Status: 404
     * Expected Output: { success: false, message: "Message not found" }
     * Expected Behavior: Should return 404 when message not found
     */
    test('should return 404 when message not found', async () => {
      const nonExistentMessageId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/chat/${testGroup._id}/message/${nonExistentMessageId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Message not found');
    });

    /**
     * Test: DELETE /api/chat/:groupId/message/:messageId
     * Input: Message from different group
     * Expected Status: 400
     * Expected Output: { success: false, message: "Message does not belong to this group" }
     * Expected Behavior: Should reject message from different group
     */
    test('should reject message from different group', async () => {
      const otherGroup = await Group.create({
        name: 'Other Group',
        owner: testUser._id,
        members: [{ userId: testUser._id, joinDate: new Date() }]
      });

      const message = await Message.create({
        groupId: otherGroup._id,
        senderId: testUser._id,
        content: 'Test message',
        type: 'text'
      });

      const response = await request(app)
        .delete(`/api/chat/${testGroup._id}/message/${message._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('does not belong');
    });
  });
});
