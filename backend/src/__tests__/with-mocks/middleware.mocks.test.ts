/**
 * Middleware Tests - With Mocking
 * 
 * These tests verify authentication middleware using mocks to simulate external component failures.
 */

import request from 'supertest';
import express from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { UserModel } from '../../models/user.models';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// Test route protected by authenticate middleware
app.get('/protected', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

describe('Authentication Middleware - With Mocking', () => {
  let testUser: any;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Ensure mongoose connection is ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    testUser = await UserModel.create({
      email: 'test@example.com',
      name: 'Test User',
      googleId: 'test-google-id',
      profileComplete: true
    });
  });

  // ===================================================================
  // authenticate middleware - with mocking
  // ===================================================================
  describe('authenticate middleware - with mocking', () => {
    /**
     * Test: authenticate middleware
     * Input: Valid JWT token, but jwt.verify throws error
     * Expected Status: 401
     * Expected Output: { success: false, message: "Invalid token" }
     * Expected Behavior: Should handle JWT verification errors gracefully
     * Mock Behavior: jwt.verify throws an error
     */
    test('should handle jwt.verify throwing an error', async () => {
      // Mock jwt.verify to throw an error
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      const token = jwt.sign(
        { email: testUser.email, id: testUser._id.toString() },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token');

      // Restore original
      jwt.verify = originalVerify;
    });

    /**
     * Test: authenticate middleware
     * Input: Valid JWT token, but UserModel.findById fails
     * Expected Status: 401
     * Expected Output: { success: false, message: "User not found" }
     * Expected Behavior: Should handle database errors when finding user
     * Mock Behavior: UserModel.findById throws an error (but should return null, not throw)
     */
    test('should handle UserModel.findById returning null', async () => {
      // Mock UserModel.findById to return null
      const originalFindById = UserModel.findById;
      UserModel.findById = jest.fn().mockResolvedValue(null);

      const token = jwt.sign(
        { email: testUser.email, id: testUser._id.toString() },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');

      // Restore original
      UserModel.findById = originalFindById;
    });

    /**
     * Test: authenticate middleware
     * Input: Valid JWT token, but UserModel.findById throws database error
     * Expected Status: 401
     * Expected Output: { success: false, message: "Invalid token" }
     * Expected Behavior: Should handle database errors gracefully
     * Mock Behavior: UserModel.findById throws a database error
     */
    test('should handle database error when finding user', async () => {
      // Mock UserModel.findById to throw an error
      const originalFindById = UserModel.findById;
      UserModel.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const token = jwt.sign(
        { email: testUser.email, id: testUser._id.toString() },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      // The error handler should catch this and return 401
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);

      // Restore original
      UserModel.findById = originalFindById;
    });

    /**
     * Test: authenticate middleware
     * Input: Valid JWT token with bypass-token, but UserModel.findOne fails
     * Expected Status: 401
     * Expected Output: { success: false, message: "Test user not found" }
     * Expected Behavior: Should handle database errors when finding test user
     * Mock Behavior: UserModel.findOne throws an error
     */
    test('should handle database error when finding test user with bypass token', async () => {
      // Mock UserModel.findOne to throw an error
      const originalFindOne = UserModel.findOne;
      UserModel.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer bypass-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);

      // Restore original
      UserModel.findOne = originalFindOne;
    });

    /**
     * Test: authenticate middleware
     * Input: Valid JWT token with bypass-token-2, but UserModel.findOne returns null
     * Expected Status: 401
     * Expected Output: { success: false, message: "Test user not found" }
     * Expected Behavior: Should handle test user not found
     * Mock Behavior: UserModel.findOne returns null
     */
    test('should handle test user not found with bypass-token-2', async () => {
      // Mock UserModel.findOne to return null
      const originalFindOne = UserModel.findOne;
      UserModel.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer bypass-token-2');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Test user not found');

      // Restore original
      UserModel.findOne = originalFindOne;
    });
  });
});
