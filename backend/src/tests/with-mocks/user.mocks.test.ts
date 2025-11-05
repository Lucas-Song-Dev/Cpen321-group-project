/**
 * User API Tests - With Mocking
 * 
 * These tests verify user endpoints using mocks to simulate external component failures.
 * Each exposed interface has a describe group with tests that require mocking.
 */

import request from 'supertest';
import express from 'express';
import { userRouter } from '../../routes/user';
import { errorHandler } from '../../middleware/errorHandler';
import { UserModel } from '../../models/User';
import Group from '../../models/Group';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());
app.use('/api/user', userRouter);
app.use(errorHandler);

describe('User API Tests - With Mocking', () => {
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
      profileComplete: false
    });

    authToken = jwt.sign(
      { email: testUser.email, id: testUser._id.toString() },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  // ===================================================================
  // PUT /api/user/users/profile - with mocking
  // ===================================================================
  describe('PUT /api/user/users/profile - with mocking', () => {
    /**
     * Test: PUT /api/user/users/profile
     * Input: Valid profile data, but UserModel.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Server error" }
     * Expected Behavior: Should handle database errors when finding user
     * Mock Behavior: UserModel.findOne throws an error
     */
    test('should handle database error when finding user', async () => {
      // Mock UserModel.findOne to throw an error
      const originalFindOne = UserModel.findOne;
      UserModel.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .put('/api/user/users/profile')
        .send({
          email: 'testuser@example.com',
          dob: '2000-01-01',
          gender: 'Male'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      // Restore original
      UserModel.findOne = originalFindOne;
    });

    /**
     * Test: PUT /api/user/users/profile
     * Input: Valid profile data, but user.save fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Server error" }
     * Expected Behavior: Should handle database errors when saving user
     * Mock Behavior: user.save throws an error
     */
    test('should handle database error when saving user profile', async () => {
      // Create a mock user with save that fails
      const mockUser = {
        email: 'testuser@example.com',
        name: 'Test User',
        dob: null,
        gender: null,
        profileComplete: false,
        groupName: null,
        save: jest.fn().mockRejectedValue(new Error('Database write failed'))
      };

      const originalFindOne = UserModel.findOne;
      UserModel.findOne = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/user/users/profile')
        .send({
          email: 'testuser@example.com',
          dob: '2000-01-01',
          gender: 'Male'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      // Restore original
      UserModel.findOne = originalFindOne;
    });
  });

  // ===================================================================
  // PUT /api/user/users/optionalProfile - with mocking
  // ===================================================================
  describe('PUT /api/user/users/optionalProfile - with mocking', () => {
    /**
     * Test: PUT /api/user/users/optionalProfile
     * Input: Valid optional profile data, but UserModel.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Server error" }
     * Expected Behavior: Should handle database errors when finding user
     * Mock Behavior: UserModel.findOne throws an error
     */
    test('should handle database error when finding user', async () => {
      // Mock UserModel.findOne to throw an error
      const originalFindOne = UserModel.findOne;
      UserModel.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .put('/api/user/users/optionalProfile')
        .send({
          email: 'testuser@example.com',
          bio: 'Test bio'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      // Restore original
      UserModel.findOne = originalFindOne;
    });

    /**
     * Test: PUT /api/user/users/optionalProfile
     * Input: Valid optional profile data, but user.save fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Server error" }
     * Expected Behavior: Should handle database errors when saving user
     * Mock Behavior: user.save throws an error
     */
    test('should handle database error when saving optional profile', async () => {
      // Create a mock user with save that fails
      const mockUser = {
        email: 'testuser@example.com',
        name: 'Test User',
        profileComplete: true,
        bio: null,
        profilePicture: null,
        livingPreferences: null,
        groupName: null,
        save: jest.fn().mockRejectedValue(new Error('Database write failed'))
      };

      const originalFindOne = UserModel.findOne;
      UserModel.findOne = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/user/users/optionalProfile')
        .send({
          email: 'testuser@example.com',
          bio: 'Test bio'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      // Restore original
      UserModel.findOne = originalFindOne;
    });
  });

  // ===================================================================
  // DELETE /api/user/users/me - with mocking
  // ===================================================================
  describe('DELETE /api/user/users/me - with mocking', () => {
    /**
     * Test: DELETE /api/user/users/me
     * Input: Valid request, but Group.findOne fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Server error" }
     * Expected Behavior: Should handle database errors when finding group
     * Mock Behavior: Group.findOne throws an error
     */
    test('should handle database error when finding group', async () => {
      // Mock Group.findOne to throw an error
      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .delete('/api/user/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      // Restore original
      Group.findOne = originalFindOne;
    });

    /**
     * Test: DELETE /api/user/users/me
     * Input: Valid request, but UserModel.findByIdAndUpdate fails when updating new owner
     * Expected Status: 500
     * Expected Output: { success: false, message: "Server error" }
     * Expected Behavior: Should handle database errors when updating new owner
     * Mock Behavior: UserModel.findByIdAndUpdate throws an error
     */
    test('should handle database error when updating new owner', async () => {
      // Create a group with test user as owner
      const testGroup = await Group.create({
        name: 'Test Group',
        owner: testUser._id,
        members: [
          { userId: testUser._id, joinDate: new Date() },
          { userId: (await UserModel.create({
            email: 'member@example.com',
            name: 'Member',
            googleId: 'member-google-id',
            profileComplete: true
          }))._id, joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) } // Older member
        ]
      });

      // Mock UserModel.findByIdAndUpdate to throw an error
      const originalFindByIdAndUpdate = UserModel.findByIdAndUpdate;
      UserModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .delete('/api/user/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      // Restore original
      UserModel.findByIdAndUpdate = originalFindByIdAndUpdate;
    });

    /**
     * Test: DELETE /api/user/users/me
     * Input: Valid request, but group.save fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Server error" }
     * Expected Behavior: Should handle database errors when saving group
     * Mock Behavior: group.save throws an error
     */
    test('should handle database error when saving group', async () => {
      // Create a group with test user as member (not owner)
      const owner = await UserModel.create({
        email: 'owner@example.com',
        name: 'Owner',
        googleId: 'owner-google-id',
        profileComplete: true
      });

      const mockGroup = {
        _id: 'test-group-id',
        owner: owner._id,
        // Include another member so group.save() is attempted after removing testUser
        members: [
          { userId: testUser._id, joinDate: new Date() },
          { userId: owner._id, joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24) }
        ],
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      const originalFindOne = Group.findOne;
      Group.findOne = jest.fn().mockResolvedValue(mockGroup);

      const response = await request(app)
        .delete('/api/user/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      // Restore original
      Group.findOne = originalFindOne;
    });

    /**
     * Test: DELETE /api/user/users/me
     * Input: Valid request, but UserModel.findByIdAndDelete fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Server error" }
     * Expected Behavior: Should handle database errors when deleting user
     * Mock Behavior: UserModel.findByIdAndDelete throws an error
     */
    test('should handle database error when deleting user', async () => {
      // Mock UserModel.findByIdAndDelete to throw an error
      const originalFindByIdAndDelete = UserModel.findByIdAndDelete;
      UserModel.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .delete('/api/user/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      // Restore original
      UserModel.findByIdAndDelete = originalFindByIdAndDelete;
    });
  });
});
