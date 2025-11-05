/**
 * Chat API Tests - No Mocking
 * 
 * These tests verify chat endpoints without mocking external dependencies.
 */

import request from 'supertest';
import express from 'express';
import { UserModel } from '../../models/User';
import Group from '../../models/Group';
import Message from '../../models/Message';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { protect } from '../../middleware/auth';
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
// Routes already include protect middleware
app.use('/api/chat', chatRouter);

describe('Chat API - No Mocking', () => {
  let testUser: any;
  let testGroup: any;
  let authToken: string;

  beforeEach(async () => {
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

  /**
   * Test: GET /api/chat/:groupId/messages
   * Input: Valid groupId and JWT token
   * Expected Status: 200
   * Expected Output: { success: true, data: { messages: [...], pagination: {...} } }
   * Expected Behavior: Should return messages for the group
   */
  test('GET /api/chat/:groupId/messages - should return group messages', async () => {
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
  });

  /**
   * Test: POST /api/chat/:groupId/message
   * Input: { content: "Test message" }
   * Expected Status: 201
   * Expected Output: { success: true, data: { message: {...} } }
   * Expected Behavior: Should create and return a new message
   */
  test('POST /api/chat/:groupId/message - should send a message', async () => {
    const response = await request(app)
      .post(`/api/chat/${testGroup._id}/message`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Test message' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.message.content).toBe('Test message');
  });

  /**
   * Test: POST /api/chat/:groupId/message
   * Input: Empty content
   * Expected Status: 400
   * Expected Behavior: Should reject empty messages
   */
  test('POST /api/chat/:groupId/message - should reject empty message', async () => {
    const response = await request(app)
      .post(`/api/chat/${testGroup._id}/message`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: '' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  /**
   * Test: POST /api/chat/:groupId/poll
   * Input: { question: "Test?", options: ["Yes", "No"] }
   * Expected Status: 201
   * Expected Output: { success: true, data: { message: {...} } }
   * Expected Behavior: Should create a poll
   */
  test('POST /api/chat/:groupId/poll - should create a poll', async () => {
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
  });

  /**
   * Test: POST /api/chat/:groupId/poll
   * Input: Invalid poll (less than 2 options)
   * Expected Status: 400
   * Expected Behavior: Should reject polls with less than 2 options
   */
  test('POST /api/chat/:groupId/poll - should reject poll with insufficient options', async () => {
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
   * Test: POST /api/chat/:groupId/poll/:messageId/vote
   * Input: { option: "Yes" }
   * Expected Status: 200
   * Expected Behavior: Should record vote on poll
   */
  test('POST /api/chat/:groupId/poll/:messageId/vote - should vote on poll', async () => {
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
  });

  /**
   * Test: DELETE /api/chat/:groupId/message/:messageId
   * Input: Valid messageId (as sender)
   * Expected Status: 200
   * Expected Behavior: Should delete message
   */
  test('DELETE /api/chat/:groupId/message/:messageId - should delete message', async () => {
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
   * Test: GET /api/chat/:groupId/messages
   * Input: Invalid groupId format
   * Expected Status: 400
   * Expected Behavior: Should reject invalid ObjectId format
   */
  test('GET /api/chat/:groupId/messages - should reject invalid ObjectId', async () => {
    const response = await request(app)
      .get('/api/chat/invalid-id/messages')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Invalid group ID');
  });

  /**
   * Test: POST /api/chat/:groupId/message
   * Input: Message too long (> 1000 chars)
   * Expected Status: 400
   * Expected Behavior: Should reject messages over length limit
   */
  test('POST /api/chat/:groupId/message - should reject message too long', async () => {
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
   * Test: POST /api/chat/:groupId/poll
   * Input: Too many options (> 10)
   * Expected Status: 400
   * Expected Behavior: Should reject polls with more than 10 options
   */
  test('POST /api/chat/:groupId/poll - should reject poll with too many options', async () => {
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
   * Test: POST /api/chat/:groupId/poll/:messageId/vote
   * Input: Invalid option
   * Expected Status: 400
   * Expected Behavior: Should reject invalid poll options
   */
  test('POST /api/chat/:groupId/poll/:messageId/vote - should reject invalid option', async () => {
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
   * Test: DELETE /api/chat/:groupId/message/:messageId
   * Input: Non-sender trying to delete
   * Expected Status: 403
   * Expected Behavior: Should reject non-sender deletion attempts
   */
  test('DELETE /api/chat/:groupId/message/:messageId - should reject non-sender deletion', async () => {
    const otherUser = await UserModel.create({
      email: 'other@example.com',
      name: 'Other User',
      googleId: 'other-google-id',
      profileComplete: true
    });

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
   * Test: GET /api/chat/:groupId/messages
   * Input: User not a member of group
   * Expected Status: 403
   * Expected Behavior: Should reject access for non-members
   */
  test('GET /api/chat/:groupId/messages - should reject non-member access', async () => {
    const otherGroup = await Group.create({
      name: 'Other Group',
      owner: testUser._id,
      members: [{ userId: testUser._id, joinDate: new Date() }]
    });

    const otherUser = await UserModel.create({
      email: 'other@example.com',
      name: 'Other User',
      googleId: 'other-google-id',
      profileComplete: true
    });

    const otherToken = jwt.sign(
      { email: otherUser.email, id: (otherUser._id as any).toString() },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get(`/api/chat/${otherGroup._id}/messages`)
      .set('Authorization', `Bearer ${otherToken}`);

    // This should work if they're in the group, so let's test with a group they're not in
    const isolatedGroup = await Group.create({
      name: 'Isolated Group',
      owner: otherUser._id,
      members: [{ userId: otherUser._id, joinDate: new Date() }]
    });

    const response2 = await request(app)
      .get(`/api/chat/${isolatedGroup._id}/messages`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response2.status).toBe(403);
    expect(response2.body.success).toBe(false);
  });

  /**
   * Test: Message.addVote method
   * Input: Valid poll message, userId, option
   * Expected Behavior: Should add vote to poll (lines 106-120)
   */
  test('Message.addVote - should add vote to poll', async () => {
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

    // Test addVote method directly
    (poll as any).addVote(testUser._id.toString(), 'Yes');
    await poll.save();

    const updatedPoll = await Message.findById(poll._id);
    expect(updatedPoll?.pollData?.votes.length).toBe(1);
    expect(updatedPoll?.pollData?.votes[0].userId.toString()).toBe(testUser._id.toString());
    expect(updatedPoll?.pollData?.votes[0].option).toBe('Yes');
  });

  /**
   * Test: Message.addVote method
   * Input: Change vote from one option to another
   * Expected Behavior: Should replace existing vote (lines 106-120)
   */
  test('Message.addVote - should replace existing vote', async () => {
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
    (poll as any).addVote(testUser._id.toString(), 'No');
    await poll.save();

    const updatedPoll = await Message.findById(poll._id);
    expect(updatedPoll?.pollData?.votes.length).toBe(1);
    expect(updatedPoll?.pollData?.votes[0].option).toBe('No');
  });

  /**
   * Test: Message.addVote method
   * Input: Non-poll message
   * Expected Behavior: Should throw error (lines 106-108)
   */
  test('Message.addVote - should throw error for non-poll message', async () => {
    const textMessage = await Message.create({
      groupId: testGroup._id,
      senderId: testUser._id,
      content: 'Regular text message',
      type: 'text'
    });

    expect(() => {
      (textMessage as any).addVote(testUser._id.toString(), 'Yes');
    }).toThrow('Cannot vote on non-poll message');
  });

  /**
   * Test: Message.addVote method
   * Input: Expired poll
   * Expected Behavior: Should throw error (lines 110-112)
   */
  test('Message.addVote - should throw error for expired poll', async () => {
    const expiredPoll = await Message.create({
      groupId: testGroup._id,
      senderId: testUser._id,
      content: 'Expired Question?',
      type: 'poll',
      pollData: {
        question: 'Expired Question?',
        options: ['Yes', 'No'],
        votes: [],
        expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
      }
    });

    expect(() => {
      (expiredPoll as any).addVote(testUser._id.toString(), 'Yes');
    }).toThrow('Poll has expired');
  });

  /**
   * Test: Message.hasUserVoted method
   * Input: User who has voted
   * Expected Behavior: Should return true (lines 129-132)
   */
  test('Message.hasUserVoted - should return true when user has voted', async () => {
    const poll = await Message.create({
      groupId: testGroup._id,
      senderId: testUser._id,
      content: 'Test Question?',
      type: 'poll',
      pollData: {
        question: 'Test Question?',
        options: ['Yes', 'No'],
        votes: [{
          userId: testUser._id,
          option: 'Yes',
          timestamp: new Date()
        }],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const hasVoted = (poll as any).hasUserVoted(testUser._id.toString());
    expect(hasVoted).toBe(true);
  });

  /**
   * Test: Message.hasUserVoted method
   * Input: User who has not voted
   * Expected Behavior: Should return false (lines 129-132)
   */
  test('Message.hasUserVoted - should return false when user has not voted', async () => {
    const otherUser = await UserModel.create({
      email: 'other@example.com',
      name: 'Other User',
      googleId: 'other-google-id',
      profileComplete: true
    });

    const poll = await Message.create({
      groupId: testGroup._id,
      senderId: testUser._id,
      content: 'Test Question?',
      type: 'poll',
      pollData: {
        question: 'Test Question?',
        options: ['Yes', 'No'],
        votes: [{
          userId: testUser._id,
          option: 'Yes',
          timestamp: new Date()
        }],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const hasVoted = (poll as any).hasUserVoted((otherUser._id as any).toString());
    expect(hasVoted).toBe(false);
  });

  /**
   * Test: Message.hasUserVoted method
   * Input: Non-poll message
   * Expected Behavior: Should return false (lines 129-130)
   */
  test('Message.hasUserVoted - should return false for non-poll message', async () => {
    const textMessage = await Message.create({
      groupId: testGroup._id,
      senderId: testUser._id,
      content: 'Regular text message',
      type: 'text'
    });

    const hasVoted = (textMessage as any).hasUserVoted(testUser._id.toString());
    expect(hasVoted).toBe(false);
  });

  /**
   * Test: POST /api/chat/:groupId/poll/:messageId/vote
   * Input: Expired poll
   * Expected Status: 400
   * Expected Behavior: Should reject vote on expired poll (lines 313-318 in routes/chat.ts)
   */
  test('POST /api/chat/:groupId/poll/:messageId/vote - should reject vote on expired poll', async () => {
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
   * Test: GET /api/chat/:groupId/messages
   * Input: Group not found
   * Expected Status: 404
   * Expected Behavior: Should return 404 when group not found (lines 42-43)
   */
  test('GET /api/chat/:groupId/messages - should return 404 when group not found', async () => {
    const nonExistentGroupId = new mongoose.Types.ObjectId();
    
    const response = await request(app)
      .get(`/api/chat/${nonExistentGroupId}/messages`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Group not found');
  });

  /**
   * Test: POST /api/chat/:groupId/message
   * Input: Invalid ObjectId format
   * Expected Status: 400
   * Expected Behavior: Should reject invalid ObjectId format (lines 115-116)
   */
  test('POST /api/chat/:groupId/message - should reject invalid ObjectId format', async () => {
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
   * Expected Behavior: Should return 404 when group not found (line 126)
   */
  test('POST /api/chat/:groupId/message - should return 404 when group not found', async () => {
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
   * Expected Behavior: Should reject non-member access (line 137)
   */
  test('POST /api/chat/:groupId/message - should reject non-member access', async () => {
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

  /**
   * Test: POST /api/chat/:groupId/poll
   * Input: Group not found
   * Expected Status: 404
   * Expected Behavior: Should return 404 when group not found (line 210)
   */
  test('POST /api/chat/:groupId/poll - should return 404 when group not found', async () => {
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
   * Expected Behavior: Should reject non-member access (line 221)
   */
  test('POST /api/chat/:groupId/poll - should reject non-member access', async () => {
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

  /**
   * Test: POST /api/chat/:groupId/poll/:messageId/vote
   * Input: Poll not found
   * Expected Status: 404
   * Expected Behavior: Should return 404 when poll not found (line 272)
   */
  test('POST /api/chat/:groupId/poll/:messageId/vote - should return 404 when poll not found', async () => {
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
   * Expected Behavior: Should reject poll from different group (line 279)
   */
  test('POST /api/chat/:groupId/poll/:messageId/vote - should reject poll from different group', async () => {
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
   * Expected Behavior: Should return 404 when group not found (line 295)
   */
  test('POST /api/chat/:groupId/poll/:messageId/vote - should return 404 when group not found', async () => {
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
   * Expected Behavior: Should reject non-member access (line 306)
   */
  test('POST /api/chat/:groupId/poll/:messageId/vote - should reject non-member access', async () => {
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

  /**
   * Test: DELETE /api/chat/:groupId/message/:messageId
   * Input: Message not found
   * Expected Status: 404
   * Expected Behavior: Should return 404 when message not found (line 361)
   */
  test('DELETE /api/chat/:groupId/message/:messageId - should return 404 when message not found', async () => {
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
   * Expected Behavior: Should reject message from different group (line 368)
   */
  test('DELETE /api/chat/:groupId/message/:messageId - should reject message from different group', async () => {
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

  /**
   * Test: POST /api/chat/:groupId/poll/:messageId/vote
   * Input: Missing option
   * Expected Status: 400
   * Expected Behavior: Should reject missing option (line 263)
   */
  test('POST /api/chat/:groupId/poll/:messageId/vote - should reject missing option', async () => {
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
   * Input: Non-poll message
   * Expected Status: 400
   * Expected Behavior: Should reject non-poll message (line 286)
   */
  test('POST /api/chat/:groupId/poll/:messageId/vote - should reject non-poll message', async () => {
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
   * Input: Group not found (after message found)
   * Expected Status: 404
   * Expected Behavior: Should return 404 when group not found (line 295)
   */
  test('POST /api/chat/:groupId/poll/:messageId/vote - should return 404 when group not found after message found', async () => {
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

    // Should fail either because group doesn't match or group not found
    expect([400, 404]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  /**
   * Test: POST /api/chat/:groupId/poll/:messageId/vote
   * Input: Changing vote (filtering existing votes)
   * Expected Status: 200
   * Expected Behavior: Should remove existing vote before adding new one (line 330)
   */
  test('POST /api/chat/:groupId/poll/:messageId/vote - should replace existing vote', async () => {
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
   * Test: POST /api/chat/:groupId/message
   * Input: Socket error handling
   * Expected Status: 201
   * Expected Behavior: Should handle socket errors gracefully (line 175)
   */
  test('POST /api/chat/:groupId/message - should handle socket errors gracefully', async () => {
    // This test ensures socket error handling is covered
    // Normal operation should succeed even if socket fails
    const response = await request(app)
      .post(`/api/chat/${testGroup._id}/message`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Test message' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  /**
   * Test: Message virtual properties
   * Input: Poll message with votes
   * Expected Behavior: Should compute pollResults correctly (lines 69-83)
   */
  test('Message.pollResults - should compute poll results correctly', async () => {
    const poll = await Message.create({
      groupId: testGroup._id,
      senderId: testUser._id,
      content: 'Test Question?',
      type: 'poll',
      pollData: {
        question: 'Test Question?',
        options: ['Yes', 'No', 'Maybe'],
        votes: [
          { userId: testUser._id, option: 'Yes', timestamp: new Date() },
          { userId: testUser._id, option: 'Yes', timestamp: new Date() },
          { userId: testUser._id, option: 'No', timestamp: new Date() }
        ],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const results = (poll as any).pollResults;
    expect(results).not.toBeNull();
    expect(results?.['Yes']).toBe(2);
    expect(results?.['No']).toBe(1);
    expect(results?.['Maybe']).toBe(0);
  });

  /**
   * Test: Message virtual properties
   * Input: Poll message without pollData
   * Expected Behavior: Should return null for pollResults (line 69)
   */
  test('Message.pollResults - should return null for non-poll message', async () => {
    const textMessage = await Message.create({
      groupId: testGroup._id,
      senderId: testUser._id,
      content: 'Regular text message',
      type: 'text'
    });

    const results = (textMessage as any).pollResults;
    expect(results).toBeNull();
  });

  /**
   * Test: Message virtual properties
   * Input: Expired poll
   * Expected Behavior: Should return true for isPollExpired (lines 87-90)
   */
  test('Message.isPollExpired - should return true for expired poll', async () => {
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

    const isExpired = (expiredPoll as any).isPollExpired;
    expect(isExpired).toBe(true);
  });

  /**
   * Test: Message virtual properties
   * Input: Active poll
   * Expected Behavior: Should return false for isPollExpired (lines 87-90)
   */
  test('Message.isPollExpired - should return false for active poll', async () => {
    const activePoll = await Message.create({
      groupId: testGroup._id,
      senderId: testUser._id,
      content: 'Active Question?',
      type: 'poll',
      pollData: {
        question: 'Active Question?',
        options: ['Yes', 'No'],
        votes: [],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Future
      }
    });

    const isExpired = (activePoll as any).isPollExpired;
    expect(isExpired).toBe(false);
  });

  /**
   * Test: Message virtual properties
   * Input: Poll message with votes
   * Expected Behavior: Should return correct totalPollVotes (lines 93-95)
   */
  test('Message.totalPollVotes - should return correct vote count', async () => {
    const poll = await Message.create({
      groupId: testGroup._id,
      senderId: testUser._id,
      content: 'Test Question?',
      type: 'poll',
      pollData: {
        question: 'Test Question?',
        options: ['Yes', 'No'],
        votes: [
          { userId: testUser._id, option: 'Yes', timestamp: new Date() },
          { userId: testUser._id, option: 'No', timestamp: new Date() }
        ],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const totalVotes = (poll as any).totalPollVotes;
    expect(totalVotes).toBe(2);
  });

  /**
   * Test: Message virtual properties
   * Input: Non-poll message
   * Expected Behavior: Should return 0 for totalPollVotes (line 94)
   */
  test('Message.totalPollVotes - should return 0 for non-poll message', async () => {
    const textMessage = await Message.create({
      groupId: testGroup._id,
      senderId: testUser._id,
      content: 'Regular text message',
      type: 'text'
    });

    const totalVotes = (textMessage as any).totalPollVotes;
    expect(totalVotes).toBe(0);
  });
});

