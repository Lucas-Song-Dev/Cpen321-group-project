/**
 * Group API Tests - With Mocking
 * 
 * These tests verify group endpoints using mocks to simulate external component failures.
 * Each exposed interface has a describe group with tests that require mocking.
 */

import request from 'supertest';
import express from 'express';
import groupRouter from '../../routes/group';
import { errorHandler } from '../../middleware/errorHandler';
import { UserModel } from '../../models/User';
import Group from '../../models/Group';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());
app.use('/api/group', groupRouter);
app.use(errorHandler);

// Silence error/warn logs during this test suite to avoid noisy output from intentional mocks
// Use lightweight overrides (not jest spies) to avoid accumulating large mock call histories
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = () => {};
  console.warn = () => {};
  console.log = () => {};
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Group API Tests - With Mocking', () => {
  let testUser: any;
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

    authToken = jwt.sign(
      { email: testUser.email, id: testUser._id.toString() },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  // ===================================================================
  // POST /api/group - with mocking
  // ===================================================================
  describe('POST /api/group - with mocking', () => {
    /**
     * Test: POST /api/group
     * Input: Valid group name, but Group.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when checking existing group
     * Mock Behavior: Group.findOne throws an error
     */
    test('should handle database error when checking existing group', async () => {
      // Mock Group.findOne to throw an error
      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/group')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Group' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findOne = originalFindOne;
    });

    /**
     * Test: POST /api/group
     * Input: Valid group name, but Group.create fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when creating group
     * Mock Behavior: Group.create throws an error
     */
    test('should handle database error when creating group', async () => {
      // Mock Group.create to throw an error
      const originalCreate = Group.create;
      Group.create = jest.fn().mockRejectedValue(new Error('Database save failed'));

      const response = await request(app)
        .post('/api/group')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Group' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.create = originalCreate;
    });

    /**
     * Test: POST /api/group
     * Input: Valid group name, but UserModel.findByIdAndUpdate fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when updating user
     * Mock Behavior: UserModel.findByIdAndUpdate throws an error
     */
    test('should handle database error when updating user', async () => {
      // Mock UserModel.findByIdAndUpdate to throw an error
      const originalFindByIdAndUpdate = UserModel.findByIdAndUpdate;
      UserModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Database update failed'));

      const response = await request(app)
        .post('/api/group')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Group' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      UserModel.findByIdAndUpdate = originalFindByIdAndUpdate;
    });

    /**
     * Test: POST /api/group
     * Input: Valid group name, but group.populate fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle errors when populating group data
     * Mock Behavior: group.populate throws an error
     */
    test('should handle error when populating group data', async () => {
      // Create a group first
      const group = await Group.create({
        name: 'Test Group',
        owner: testUser._id,
        members: [{ userId: testUser._id, joinDate: new Date() }]
      });

      // Mock group.populate to throw an error
      const mockGroup = await Group.findById(group._id);
      if (mockGroup) {
        const originalPopulate = mockGroup.populate;
        mockGroup.populate = jest.fn().mockRejectedValue(new Error('Populate failed'));

        // We need to mock Group.create to return our mock group
        const originalCreate = Group.create;
        Group.create = jest.fn().mockResolvedValue(mockGroup);

        const response = await request(app)
          .post('/api/group')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Test Group' });

        // Should fail during populate
        expect(response.status).toBeGreaterThanOrEqual(400);

        // Restore original
        Group.create = originalCreate;
        mockGroup.populate = originalPopulate;
      }

      // Cleanup
      await Group.findByIdAndDelete(group._id);
    });
  });

  // ===================================================================
  // POST /api/group/join - with mocking
  // ===================================================================
  describe('POST /api/group/join - with mocking', () => {
    /**
     * Test: POST /api/group/join
     * Input: Valid group code, but Group.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding group by code
     * Mock Behavior: Group.findOne throws an error
     */
    test('should handle database error when finding group by code', async () => {
      // Mock Group.findOne to throw an error
      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockRejectedValue(new Error('Database query failed'));

      const response = await request(app)
        .post('/api/group/join')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ groupCode: 'ABCD' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findOne = originalFindOne;
    });

    /**
     * Test: POST /api/group/join
     * Input: Valid group code, but group.save fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when saving group
     * Mock Behavior: group.save throws an error
     */
    test('should handle database error when saving group after join', async () => {
      const ownerUser = await UserModel.create({
        email: 'owner@example.com',
        name: 'Owner User',
        googleId: 'owner-google-id',
        profileComplete: true
      });

      const group = await Group.create({
        name: 'Test Group',
        owner: ownerUser._id,
        groupCode: 'ABCD',
        members: [{ userId: ownerUser._id, joinDate: new Date() }]
      });

      // Mock group.save to throw an error
      const mockGroup = await Group.findById(group._id);
      if (mockGroup) {
        const originalSave = mockGroup.save;
        mockGroup.save = jest.fn().mockRejectedValue(new Error('Database save failed'));

        // Mock Group.findOne to return our mock group
        const originalFindOne = Group.findOne;
        Group.findOne = jest.fn().mockResolvedValue(mockGroup);

        const response = await request(app)
          .post('/api/group/join')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ groupCode: 'ABCD' });

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);

        // Restore original
        Group.findOne = originalFindOne;
        mockGroup.save = originalSave;
      }

      // Cleanup
      await Group.findByIdAndDelete(group._id);
      await UserModel.findByIdAndDelete(ownerUser._id);
    });

    /**
     * Test: POST /api/group/join
     * Input: Valid group code, but UserModel.findByIdAndUpdate fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when updating user
     * Mock Behavior: UserModel.findByIdAndUpdate throws an error
     */
    test('should handle database error when updating user after join', async () => {
      const ownerUser = await UserModel.create({
        email: 'owner@example.com',
        name: 'Owner User',
        googleId: 'owner-google-id',
        profileComplete: true
      });

      const group = await Group.create({
        name: 'Test Group',
        owner: ownerUser._id,
        groupCode: 'ABCD',
        members: [{ userId: ownerUser._id, joinDate: new Date() }]
      });

      // Mock UserModel.findByIdAndUpdate to throw an error
      const originalFindByIdAndUpdate = UserModel.findByIdAndUpdate;
      UserModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Database update failed'));

      const response = await request(app)
        .post('/api/group/join')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ groupCode: 'ABCD' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      UserModel.findByIdAndUpdate = originalFindByIdAndUpdate;

      // Cleanup
      await Group.findByIdAndDelete(group._id);
      await UserModel.findByIdAndDelete(ownerUser._id);
    });
  });

  // ===================================================================
  // GET /api/group - with mocking
  // ===================================================================
  describe('GET /api/group - with mocking', () => {
    /**
     * Test: GET /api/group
     * Input: Valid JWT token, but Group.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Failed to load group data" }
     * Expected Behavior: Should handle database errors when finding user's group
     * Mock Behavior: Group.findOne throws an error
     */
    test('should handle database error when finding user group', async () => {
      // Mock Group.findOne to throw an error
      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/group')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to load group data');

      // Restore original
      Group.findOne = originalFindOne;
    });

    /**
     * Test: GET /api/group
     * Input: Valid JWT token, but group.populate fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Failed to load group data" }
     * Expected Behavior: Should handle errors when populating owner data
     * Mock Behavior: group.populate throws an error
     */
    test('should handle error when populating owner data', async () => {
      const group = await Group.create({
        name: 'Test Group',
        owner: testUser._id,
        members: [{ userId: testUser._id, joinDate: new Date() }]
      });

      // Mock group.populate to throw an error
      const mockGroup = await Group.findById(group._id);
      if (mockGroup) {
        const originalPopulate = mockGroup.populate;
        mockGroup.populate = jest.fn().mockRejectedValue(new Error('Populate failed'));

        // Mock Group.findOne to return our mock group
        const originalFindOne = Group.findOne;
        Group.findOne = jest.fn().mockResolvedValue(mockGroup);

        const response = await request(app)
          .get('/api/group')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Failed to load group data');

        // Restore original
        Group.findOne = originalFindOne;
        mockGroup.populate = originalPopulate;
      }

      // Cleanup
      await Group.findByIdAndDelete(group._id);
    });

    /**
     * Test: GET /api/group
     * Input: Valid JWT token, but group.save fails during ownership transfer
     * Expected Status: 500
     * Expected Output: { success: false, message: "Failed to load group data" }
     * Expected Behavior: Should handle errors when saving group during ownership transfer
     * Mock Behavior: group.save throws an error during ownership transfer
     */
    test('should handle error when saving group during ownership transfer', async () => {
      const memberUser = await UserModel.create({
        email: 'member@example.com',
        name: 'Member User',
        googleId: 'member-google-id',
        profileComplete: true
      });

      // Create group with invalid owner
      const group = await Group.create({
        name: 'Test Group',
        owner: new mongoose.Types.ObjectId(), // Invalid owner
        members: [{ userId: memberUser._id, joinDate: new Date('2024-01-01') }]
      });

      // Mock group.save to throw an error during ownership transfer
      const mockGroup = await Group.findById(group._id);
      if (mockGroup) {
        const originalSave = mockGroup.save;
        mockGroup.save = jest.fn().mockRejectedValue(new Error('Save failed during transfer'));

        // Mock Group.findOne to return our mock group
        const originalFindOne = Group.findOne;
        Group.findOne = jest.fn().mockResolvedValue(mockGroup);

        const response = await request(app)
          .get('/api/group')
          .set('Authorization', `Bearer ${authToken}`);

        // Should handle error gracefully
        expect(response.status).toBeGreaterThanOrEqual(400);

        // Restore original
        Group.findOne = originalFindOne;
        mockGroup.save = originalSave;
      }

      // Cleanup
      await Group.findByIdAndDelete(group._id);
      await UserModel.findByIdAndDelete(memberUser._id);
    });
  });

  // ===================================================================
  // PUT /api/group/transfer-ownership/:newOwnerId - with mocking
  // ===================================================================
  describe('PUT /api/group/transfer-ownership/:newOwnerId - with mocking', () => {
    /**
     * Test: PUT /api/group/transfer-ownership/:newOwnerId
     * Input: Valid newOwnerId, but Group.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding user's group
     * Mock Behavior: Group.findOne throws an error
     */
    test('should handle database error when finding user group', async () => {
      const memberUser = await UserModel.create({
        email: 'member@example.com',
        name: 'Member User',
        googleId: 'member-google-id',
        profileComplete: true
      });

      // Mock Group.findOne to throw an error
      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .put(`/api/group/transfer-ownership/${memberUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findOne = originalFindOne;

      // Cleanup
      await UserModel.findByIdAndDelete(memberUser._id);
    });

    /**
     * Test: PUT /api/group/transfer-ownership/:newOwnerId
     * Input: Valid newOwnerId, but group.save fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when saving group
     * Mock Behavior: group.save throws an error
     */
    test('should handle database error when saving group after transfer', async () => {
      const memberUser = await UserModel.create({
        email: 'member@example.com',
        name: 'Member User',
        googleId: 'member-google-id',
        profileComplete: true
      });

      const group = await Group.create({
        name: 'Test Group',
        owner: testUser._id,
        members: [
          { userId: testUser._id, joinDate: new Date() },
          { userId: memberUser._id, joinDate: new Date() }
        ]
      });

      // Mock group.save to throw an error
      const mockGroup = await Group.findById(group._id);
      if (mockGroup) {
        const originalSave = mockGroup.save;
        mockGroup.save = jest.fn().mockRejectedValue(new Error('Database save failed'));

        // Mock Group.findOne to return our mock group
        const originalFindOne = Group.findOne;
        Group.findOne = jest.fn().mockResolvedValue(mockGroup);

        const response = await request(app)
          .put(`/api/group/transfer-ownership/${memberUser._id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);

        // Restore original
        Group.findOne = originalFindOne;
        mockGroup.save = originalSave;
      }

      // Cleanup
      await Group.findByIdAndDelete(group._id);
      await UserModel.findByIdAndDelete(memberUser._id);
    });

    /**
     * Test: PUT /api/group/transfer-ownership/:newOwnerId
     * Input: Valid newOwnerId, but group.populate fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle errors when populating group data
     * Mock Behavior: group.populate throws an error
     */
    test('should handle error when populating group data after transfer', async () => {
      const memberUser = await UserModel.create({
        email: 'member@example.com',
        name: 'Member User',
        googleId: 'member-google-id',
        profileComplete: true
      });

      const group = await Group.create({
        name: 'Test Group',
        owner: testUser._id,
        members: [
          { userId: testUser._id, joinDate: new Date() },
          { userId: memberUser._id, joinDate: new Date() }
        ]
      });

      // Mock group.populate to throw an error
      const mockGroup = await Group.findById(group._id);
      if (mockGroup) {
        const originalPopulate = mockGroup.populate;
        mockGroup.populate = jest.fn().mockRejectedValue(new Error('Populate failed'));

        // Mock Group.findOne to return our mock group
        const originalFindOne = Group.findOne;
        Group.findOne = jest.fn().mockResolvedValue(mockGroup);

        const response = await request(app)
          .put(`/api/group/transfer-ownership/${memberUser._id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);

        // Restore original
        Group.findOne = originalFindOne;
        mockGroup.populate = originalPopulate;
      }

      // Cleanup
      await Group.findByIdAndDelete(group._id);
      await UserModel.findByIdAndDelete(memberUser._id);
    });
  });

  // ===================================================================
  // DELETE /api/group/member/:memberId - with mocking
  // ===================================================================
  describe('DELETE /api/group/member/:memberId - with mocking', () => {
    /**
     * Test: DELETE /api/group/member/:memberId
     * Input: Valid memberId, but Group.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding user's group
     * Mock Behavior: Group.findOne throws an error
     */
    test('should handle database error when finding user group', async () => {
      const memberUser = await UserModel.create({
        email: 'member@example.com',
        name: 'Member User',
        googleId: 'member-google-id',
        profileComplete: true
      });

      // Mock Group.findOne to throw an error
      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .delete(`/api/group/member/${memberUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findOne = originalFindOne;

      // Cleanup
      await UserModel.findByIdAndDelete(memberUser._id);
    });

    /**
     * Test: DELETE /api/group/member/:memberId
     * Input: Valid memberId, but group.save fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when saving group
     * Mock Behavior: group.save throws an error
     */
    test('should handle database error when saving group after removal', async () => {
      const memberUser = await UserModel.create({
        email: 'member@example.com',
        name: 'Member User',
        googleId: 'member-google-id',
        profileComplete: true
      });

      const group = await Group.create({
        name: 'Test Group',
        owner: testUser._id,
        members: [
          { userId: testUser._id, joinDate: new Date() },
          { userId: memberUser._id, joinDate: new Date() }
        ]
      });

      // Mock group.save to throw an error
      const mockGroup = await Group.findById(group._id);
      if (mockGroup) {
        const originalSave = mockGroup.save;
        mockGroup.save = jest.fn().mockRejectedValue(new Error('Database save failed'));

        // Mock Group.findOne to return our mock group
        const originalFindOne = Group.findOne;
        Group.findOne = jest.fn().mockResolvedValue(mockGroup);

        const response = await request(app)
          .delete(`/api/group/member/${memberUser._id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);

        // Restore original
        Group.findOne = originalFindOne;
        mockGroup.save = originalSave;
      }

      // Cleanup
      await Group.findByIdAndDelete(group._id);
      await UserModel.findByIdAndDelete(memberUser._id);
    });

    /**
     * Test: DELETE /api/group/member/:memberId
     * Input: Valid memberId, but UserModel.findByIdAndUpdate fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when updating removed member
     * Mock Behavior: UserModel.findByIdAndUpdate throws an error
     */
    test('should handle database error when updating removed member', async () => {
      const memberUser = await UserModel.create({
        email: 'member@example.com',
        name: 'Member User',
        googleId: 'member-google-id',
        profileComplete: true
      });

      const group = await Group.create({
        name: 'Test Group',
        owner: testUser._id,
        members: [
          { userId: testUser._id, joinDate: new Date() },
          { userId: memberUser._id, joinDate: new Date() }
        ]
      });

      // Mock UserModel.findByIdAndUpdate to throw an error
      const originalFindByIdAndUpdate = UserModel.findByIdAndUpdate;
      UserModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Database update failed'));

      const response = await request(app)
        .delete(`/api/group/member/${memberUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      UserModel.findByIdAndUpdate = originalFindByIdAndUpdate;

      // Cleanup
      await Group.findByIdAndDelete(group._id);
      await UserModel.findByIdAndDelete(memberUser._id);
    });

    /**
     * Test: DELETE /api/group/member/:memberId
     * Input: Valid memberId, but group.populate fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle errors when populating group data
     * Mock Behavior: group.populate throws an error
     */
    test('should handle error when populating group data after removal', async () => {
      const memberUser = await UserModel.create({
        email: 'member@example.com',
        name: 'Member User',
        googleId: 'member-google-id',
        profileComplete: true
      });

      const group = await Group.create({
        name: 'Test Group',
        owner: testUser._id,
        members: [
          { userId: testUser._id, joinDate: new Date() },
          { userId: memberUser._id, joinDate: new Date() }
        ]
      });

      // Mock group.populate to throw an error
      const mockGroup = await Group.findById(group._id);
      if (mockGroup) {
        const originalPopulate = mockGroup.populate;
        mockGroup.populate = jest.fn().mockRejectedValue(new Error('Populate failed'));

        // Mock Group.findOne to return our mock group
        const originalFindOne = Group.findOne;
        Group.findOne = jest.fn().mockResolvedValue(mockGroup);

        const response = await request(app)
          .delete(`/api/group/member/${memberUser._id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);

        // Restore original
        Group.findOne = originalFindOne;
        mockGroup.populate = originalPopulate;
      }

      // Cleanup
      await Group.findByIdAndDelete(group._id);
      await UserModel.findByIdAndDelete(memberUser._id);
    });
  });

  // ===================================================================
  // DELETE /api/group/leave - with mocking
  // ===================================================================
  describe('DELETE /api/group/leave - with mocking', () => {
    /**
     * Test: DELETE /api/group/leave
     * Input: Valid JWT token, but Group.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding user's group
     * Mock Behavior: Group.findOne throws an error
     */
    test('should handle database error when finding user group', async () => {
      // Mock Group.findOne to throw an error
      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .delete('/api/group/leave')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findOne = originalFindOne;
    });

    /**
     * Test: DELETE /api/group/leave
     * Input: Valid JWT token, but group.save fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when saving group
     * Mock Behavior: group.save throws an error
     */
    test('should handle database error when saving group after leave', async () => {
      const group = await Group.create({
        name: 'Test Group',
        owner: testUser._id,
        members: [{ userId: testUser._id, joinDate: new Date() }]
      });

      // Mock group.save to throw an error
      const mockGroup = await Group.findById(group._id);
      if (mockGroup) {
        const originalSave = mockGroup.save;
        mockGroup.save = jest.fn().mockRejectedValue(new Error('Database save failed'));

        // Mock Group.findOne to return our mock group
        const originalFindOne = Group.findOne;
        Group.findOne = jest.fn().mockResolvedValue(mockGroup);

        const response = await request(app)
          .delete('/api/group/leave')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);

        // Restore original
        Group.findOne = originalFindOne;
        mockGroup.save = originalSave;
      }

      // Cleanup
      await Group.findByIdAndDelete(group._id);
    });

    /**
     * Test: DELETE /api/group/leave
     * Input: Valid JWT token, but group.deleteOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when deleting empty group
     * Mock Behavior: group.deleteOne throws an error
     */
    test('should handle database error when deleting empty group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        owner: testUser._id,
        members: [{ userId: testUser._id, joinDate: new Date() }]
      });

      // Mock group.deleteOne to throw an error
      const mockGroup = await Group.findById(group._id);
      if (mockGroup) {
        const originalDeleteOne = mockGroup.deleteOne;
        mockGroup.deleteOne = jest.fn().mockRejectedValue(new Error('Database delete failed'));

        // Mock Group.findOne to return our mock group
        const originalFindOne = Group.findOne;
        Group.findOne = jest.fn().mockResolvedValue(mockGroup);

        const response = await request(app)
          .delete('/api/group/leave')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);

        // Restore original
        Group.findOne = originalFindOne;
        mockGroup.deleteOne = originalDeleteOne;
      }

      // Cleanup
      await Group.findByIdAndDelete(group._id);
    });

    /**
     * Test: DELETE /api/group/leave
     * Input: Valid JWT token, but UserModel.findByIdAndUpdate fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when updating user
     * Mock Behavior: UserModel.findByIdAndUpdate throws an error
     */
    test('should handle database error when updating user after leave', async () => {
      const group = await Group.create({
        name: 'Test Group',
        owner: testUser._id,
        members: [{ userId: testUser._id, joinDate: new Date() }]
      });

      // Mock UserModel.findByIdAndUpdate to throw an error
      const originalFindByIdAndUpdate = UserModel.findByIdAndUpdate;
      UserModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Database update failed'));

      const response = await request(app)
        .delete('/api/group/leave')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      UserModel.findByIdAndUpdate = originalFindByIdAndUpdate;

      // Cleanup
      await Group.findByIdAndDelete(group._id);
    });
  });
});

