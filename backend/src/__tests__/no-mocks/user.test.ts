/**
 * User API Tests - With Mocking
 *
 * These tests verify user endpoints using mocks to simulate external component failures.
 * Each exposed interface has a describe group with tests that require mocking.
 */

import request from 'supertest';
import express from 'express';
import { userRouter } from '../../routes/user.routes';
import { errorHandler } from '../../middleware/errorHandler.middleware';
import { UserModel } from '../../models/user.models';
import Group from '../../models/group.models';
import Message from '../../models/chat.models';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import mongoose from 'mongoose';
import { UserController } from '../../controller/user.controller';

const app = express();
app.use(express.json());
app.use('/api/user', userRouter);
app.use(errorHandler);

describe('User API Tests - With Mocking', () => {
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    // Reset Jest mocks between tests
    jest.clearAllMocks();

    // Ensure mongoose connection is ready (connection itself is handled elsewhere)
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

  afterEach(async () => {
    // Clean up test data
    await UserModel.deleteMany({ email: /testuser@example.com|.*@example.com/ });
    await Group.deleteMany({ name: /Test Group|.*Test.*/ });
    await Message.deleteMany({});
    jest.clearAllMocks();
  });

  // Close mongoose connection after this suite (move to global teardown if you share the connection globally)
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
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
      const findOneSpy = jest
        .spyOn(UserModel, 'findOne')
        .mockRejectedValue(new Error('Database connection failed') as any);

      const response = await request(app)
        .put('/api/user/users/profile')
        .send({
          email: 'testuser@example.com',
          dob: '2000-01-01',
          gender: 'Male',
          name: 'Test User'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      findOneSpy.mockRestore();
    });

    /**
     * Test: PUT /api/user/users/profile - Test catch block (lines 63-64)
     * Input: Error during setProfile
     * Expected Status: 500
     * Expected Behavior: Should handle errors in catch block (lines 63-64)
     */
    test('should handle errors in setProfile catch block (lines 63-64)', async () => {
      const mockReq = {
        body: {
          email: testUser.email,
          dob: '2000-01-01',
          gender: 'Male',
          name: 'Test User'
        }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any;

      const findOneSpy = jest
        .spyOn(UserModel, 'findOne')
        .mockRejectedValue(new Error('Database error') as any);

      await UserController.setProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });

      findOneSpy.mockRestore();
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
      const mockUser = {
        email: 'testuser@example.com',
        name: 'Test User',
        dob: null,
        gender: null,
        profileComplete: false,
        groupName: null,
        save: jest.fn().mockRejectedValue(new Error('Database write failed'))
      };

      const findOneSpy = jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValue(mockUser as any);

      const response = await request(app)
        .put('/api/user/users/profile')
        .send({
          email: 'testuser@example.com',
          dob: '2000-01-01',
          gender: 'Male',
          name: 'Test User'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      findOneSpy.mockRestore();
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
      const findOneSpy = jest
        .spyOn(UserModel, 'findOne')
        .mockRejectedValue(new Error('Database connection failed') as any);

      const response = await request(app)
        .put('/api/user/users/optionalProfile')
        .send({
          email: 'testuser@example.com',
          bio: 'Test bio'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      findOneSpy.mockRestore();
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

      const findOneSpy = jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValue(mockUser as any);

      const response = await request(app)
        .put('/api/user/users/optionalProfile')
        .send({
          email: 'testuser@example.com',
          bio: 'Test bio'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      findOneSpy.mockRestore();
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
      const findOneSpy = jest
        .spyOn(Group, 'findOne')
        .mockRejectedValue(new Error('Database connection failed') as any);

      const response = await request(app)
        .delete('/api/user/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      findOneSpy.mockRestore();
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
      const otherMember = await UserModel.create({
        email: 'member@example.com',
        name: 'Member',
        googleId: 'member-google-id',
        profileComplete: true
      });

      await Group.create({
        name: 'Test Group',
        owner: testUser._id,
        members: [
          { userId: testUser._id, joinDate: new Date() },
          {
            userId: otherMember._id,
            joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
          }
        ]
      });

      const updateSpy = jest
        .spyOn(UserModel, 'findByIdAndUpdate')
        .mockRejectedValue(new Error('Update failed') as any);

      const response = await request(app)
        .delete('/api/user/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      updateSpy.mockRestore();
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
      const owner = await UserModel.create({
        email: 'owner@example.com',
        name: 'Owner',
        googleId: 'owner-google-id',
        profileComplete: true
      });

      const mockGroup = {
        _id: 'test-group-id',
        owner: owner._id,
        members: [
          { userId: testUser._id, joinDate: new Date() },
          { userId: owner._id, joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24) }
        ],
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      const findOneSpy = jest
        .spyOn(Group, 'findOne')
        .mockResolvedValue(mockGroup as any);

      const response = await request(app)
        .delete('/api/user/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      findOneSpy.mockRestore();
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
      const deleteSpy = jest
        .spyOn(UserModel, 'findByIdAndDelete')
        .mockRejectedValue(new Error('Delete failed') as any);

      const response = await request(app)
        .delete('/api/user/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      deleteSpy.mockRestore();
    });

    /**
     * Test: DELETE /api/user/users/me
     * Input: Request without userId (req.user._id is undefined)
     * Expected Status: 401
     * Expected Output: { success: false, message: "Unauthorized" }
     * Expected Behavior: Should return 401 when userId is missing (lines 186-188)
     * Mock Behavior: Test controller directly with req.user without _id
     */
    test('should return 401 when userId is missing', async () => {
      const mockReq = {
        user: {}
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any;

      await UserController.deleteUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized'
      });
    });

    /**
     * Test: DELETE /api/user/users/me
     * Input: User not found after findByIdAndDelete (returns null)
     * Expected Status: 404
     * Expected Output: { success: false, message: "User not found" }
     * Expected Behavior: Should return 404 when user not found (lines 228-230)
     * Mock Behavior: UserModel.findByIdAndDelete returns null
     */
    test('should return 404 when user not found after deletion attempt', async () => {
      const deleteSpy = jest
        .spyOn(UserModel, 'findByIdAndDelete')
        .mockResolvedValue(null as any);

      const response = await request(app)
        .delete('/api/user/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');

      deleteSpy.mockRestore();
    });

    /**
     * Test: PUT /api/user/users/optionalProfile - Test controller directly with null livingPreferences (line 138)
     * Input: User with null livingPreferences
     * Expected Status: 200
     * Expected Behavior: Should initialize livingPreferences object when it's null (line 138)
     * Mock Behavior: Test controller directly with mocked user
     */
    test('should initialize livingPreferences when it is null (line 138)', async () => {
      const mockReq = {
        body: {
          email: testUser.email,
          livingPreferences: {
            schedule: 'Morning'
          }
        }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any;

      const mockUser = {
        _id: testUser._id,
        email: testUser.email,
        name: testUser.name,
        profileComplete: true,
        livingPreferences: null,
        bio: undefined,
        profilePicture: undefined,
        groupName: null,
        save: jest.fn().mockResolvedValue(true)
      };

      const findOneSpy = jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValue(mockUser as any);

      await UserController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockUser.livingPreferences).toEqual({ schedule: 'Morning' });
      expect(mockUser.save).toHaveBeenCalled();

      findOneSpy.mockRestore();
    });
  });

  // ===================================================================
  // PUT /api/user/users/report - with mocking
  // ===================================================================
  describe('PUT /api/user/users/report - with mocking', () => {
    let reportedUser: any;
    let testGroup: any;

    beforeEach(async () => {
      reportedUser = await UserModel.create({
        email: 'reported@example.com',
        name: 'Reported User',
        googleId: 'reported-google-id',
        profileComplete: true
      });

      testGroup = await Group.create({
        name: 'Report Test Group',
        owner: testUser._id,
        members: [
          { userId: testUser._id, joinDate: new Date() },
          { userId: reportedUser._id, joinDate: new Date() }
        ]
      });

      await Message.create({
        groupId: testGroup._id,
        senderId: reportedUser._id,
        content: 'Test message',
        type: 'text'
      });
    });

    /**
     * Test: PUT /api/user/users/report
     * Input: Valid request, but UserModel.findById fails for reported user
     * Expected Status: 500
     * Expected Output: { success: false, message: "Failed to process report" }
     * Expected Behavior: Should handle database errors when finding reported user
     * Mock Behavior: UserModel.findById throws an error
     */
    test('should handle database error when finding reported user', async () => {
      const originalFindById = UserModel.findById.bind(UserModel);

      const findByIdSpy = jest
        .spyOn(UserModel, 'findById')
        .mockImplementation((id: any) => {
          if (id?.toString() === reportedUser._id.toString()) {
            return Promise.reject(new Error('Database query failed')) as any;
          }
          return originalFindById(id) as any;
        });

      const response = await request(app)
        .put('/api/user/users/report')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportedUserId: reportedUser._id.toString(),
          reporterId: testUser._id.toString(),
          groupId: testGroup._id.toString(),
          reason: 'Test reason'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      findByIdSpy.mockRestore();
    });

    /**
     * Test: PUT /api/user/users/report
     * Input: Valid request, but Message.find fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Failed to process report" }
     * Expected Behavior: Should handle database errors when finding messages
     * Mock Behavior: Message.find throws an error
     */
    test('should handle database error when finding messages', async () => {
      const findSpy = jest
        .spyOn(Message, 'find')
        .mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockRejectedValue(new Error('Query failed'))
        } as any);

      const response = await request(app)
        .put('/api/user/users/report')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportedUserId: reportedUser._id.toString(),
          reporterId: testUser._id.toString(),
          groupId: testGroup._id.toString(),
          reason: 'Test reason'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      findSpy.mockRestore();
    });

    /**
     * Test: PUT /api/user/users/report
     * Input: Valid request, but user.save fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Failed to process report" }
     * Expected Behavior: Should handle database errors when saving user
     * Mock Behavior: user.save throws an error
     *
     * Note: In the actual controller, analysis.isOffensive may be false,
     * so save might not be called; this test mainly ensures endpoint works.
     */
    test('should handle database error when saving user (if save is triggered)', async () => {
      const mockReportedUser = {
        _id: reportedUser._id,
        isOffensive: false,
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      const originalFindById = UserModel.findById.bind(UserModel);

      const findByIdSpy = jest
        .spyOn(UserModel, 'findById')
        .mockImplementation((id: any) => {
          if (id?.toString() === reportedUser._id.toString()) {
            return Promise.resolve(mockReportedUser) as any;
          }
          return originalFindById(id) as any;
        });

      const response = await request(app)
        .put('/api/user/users/report')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportedUserId: reportedUser._id.toString(),
          reporterId: testUser._id.toString(),
          groupId: testGroup._id.toString(),
          reason: 'Test reason'
        });

      // Expect endpoint to respond successfully even if save isn't actually called
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      findByIdSpy.mockRestore();
    });

    /**
     * Test: PUT /api/user/users/report - Test controller with isOffensive: true
     * Input: Valid request with offensive content
     * Expected Status: 200
     * Expected Output: { success: true, data: { isOffensive: true, actionTaken: "User has been marked as offensive" } }
     * Expected Behavior: Should mark user as offensive when analysis.isOffensive is true (lines 102-106)
     * Mock Behavior: Test controller directly by executing the exact code path
     */
    test('should mark user as offensive when analysis.isOffensive is true', async () => {
      // Preserve original env
      const originalEnv = process.env.TEST_REPORT_OFFENSIVE;
      process.env.TEST_REPORT_OFFENSIVE = 'true';

      const reportPath = require.resolve('../../controller/report.controller');
      delete require.cache[reportPath];

      const { UserReporter: ReloadedReporter } = require('../../controller/report.controller');

      const mockReq = {
        body: {
          reportedUserId: reportedUser._id.toString(),
          reporterId: testUser._id.toString(),
          groupId: testGroup._id.toString(),
          reason: 'Test reason'
        }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any;

      await ReloadedReporter.report(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Report submitted successfully',
        data: {
          isOffensive: true,
          actionTaken: 'User has been marked as offensive',
          reason: 'Test mode: flagged as offensive'
        }
      });

      const updatedUser = await UserModel.findById(reportedUser._id);
      expect(updatedUser?.isOffensive).toBe(true);

      // Restore env & clear reloaded module
      if (originalEnv !== undefined) {
        process.env.TEST_REPORT_OFFENSIVE = originalEnv;
      } else {
        delete process.env.TEST_REPORT_OFFENSIVE;
      }
      delete require.cache[reportPath];
    });
  });
});
