/**
 * Rating API Tests - With Mocking
 * 
 * These tests verify rating endpoints using mocks to simulate external component failures.
 * Each exposed interface has a describe group with tests that require mocking.
 */

import request from 'supertest';
import express from 'express';
import ratingRouter from '../../routes/rating';
import { errorHandler } from '../../middleware/errorHandler';
import { UserModel } from '../../models/User';
import Group from '../../models/Group';
import Rating from '../../models/Rating';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());
app.use('/api/rating', ratingRouter);
app.use(errorHandler);

describe('Rating API Tests - With Mocking', () => {
  let testUser: any;
  let ratedUser: any;
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

    ratedUser = await UserModel.create({
      email: 'rated@example.com',
      name: 'Rated User',
      googleId: 'rated-google-id',
      profileComplete: true
    });

    // Create group with both users, join date set to 31 days ago to meet rating requirement
    const joinDate = new Date();
    joinDate.setDate(joinDate.getDate() - 31);

    testGroup = await Group.create({
      name: 'Test Group',
      owner: testUser._id,
      members: [
        { userId: testUser._id, joinDate },
        { userId: ratedUser._id, joinDate }
      ]
    });

    authToken = jwt.sign(
      { email: testUser.email, id: testUser._id.toString() },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  // ===================================================================
  // POST /api/rating - with mocking
  // ===================================================================
  describe('POST /api/rating - with mocking', () => {
    /**
     * Test: POST /api/rating
     * Input: Valid rating data, but Group.findById fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding group
     * Mock Behavior: Group.findById throws an error
     */
    test('should handle database error when finding group', async () => {
      // Mock Group.findById to throw an error
      const originalFindById = Group.findById;
      Group.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/rating')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ratedUserId: ratedUser._id.toString(),
          groupId: testGroup._id.toString(),
          rating: 5,
          testimonial: 'Great roommate!'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Group.findById = originalFindById;
    });

    /**
     * Test: POST /api/rating
     * Input: Valid rating data, but Rating.findOneAndUpdate fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when creating/updating rating
     * Mock Behavior: Rating.findOneAndUpdate throws an error
     */
    test('should handle database error when creating rating', async () => {
      // Mock Rating.findOneAndUpdate to throw an error
      const originalFindOneAndUpdate = Rating.findOneAndUpdate;
      Rating.findOneAndUpdate = jest.fn().mockRejectedValue(new Error('Database write failed'));

      const response = await request(app)
        .post('/api/rating')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ratedUserId: ratedUser._id.toString(),
          groupId: testGroup._id.toString(),
          rating: 5,
          testimonial: 'Great roommate!'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Rating.findOneAndUpdate = originalFindOneAndUpdate;
    });

    /**
     * Test: POST /api/rating
     * Input: Valid rating data, but Rating.getAverageRating fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when calculating average rating
     * Mock Behavior: Rating.getAverageRating throws an error
     */
    test('should handle database error when calculating average rating', async () => {
      // Mock Rating.getAverageRating to throw an error
      const originalGetAverageRating = Rating.getAverageRating;
      Rating.getAverageRating = jest.fn().mockRejectedValue(new Error('Aggregation failed'));

      const response = await request(app)
        .post('/api/rating')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ratedUserId: ratedUser._id.toString(),
          groupId: testGroup._id.toString(),
          rating: 5,
          testimonial: 'Great roommate!'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Rating.getAverageRating = originalGetAverageRating;
    });

    /**
     * Test: POST /api/rating
     * Input: Valid rating data, but UserModel.findByIdAndUpdate fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when updating user average rating
     * Mock Behavior: UserModel.findByIdAndUpdate throws an error
     */
    test('should handle database error when updating user average rating', async () => {
      // Mock UserModel.findByIdAndUpdate to throw an error
      const originalFindByIdAndUpdate = UserModel.findByIdAndUpdate;
      UserModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('User update failed'));

      const response = await request(app)
        .post('/api/rating')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ratedUserId: ratedUser._id.toString(),
          groupId: testGroup._id.toString(),
          rating: 5,
          testimonial: 'Great roommate!'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      UserModel.findByIdAndUpdate = originalFindByIdAndUpdate;
    });
  });

  // ===================================================================
  // GET /api/rating/:userId - with mocking
  // ===================================================================
  describe('GET /api/rating/:userId - with mocking', () => {
    /**
     * Test: GET /api/rating/:userId
     * Input: Valid userId, but Rating.find fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding ratings
     * Mock Behavior: Rating.find throws an error
     */
    test('should handle database error when finding ratings', async () => {
      // Mock Rating.find to throw an error
      const originalFind = Rating.find;
      Rating.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error('Database query failed'))
        })
      });

      const response = await request(app)
        .get(`/api/rating/${ratedUser._id.toString()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Rating.find = originalFind;
    });

    /**
     * Test: GET /api/rating/:userId
     * Input: Valid userId, but Rating.getAverageRating fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when calculating average rating
     * Mock Behavior: Rating.getAverageRating throws an error
     */
    test('should handle database error when calculating average rating', async () => {
      // Mock Rating.getAverageRating to throw an error
      const originalGetAverageRating = Rating.getAverageRating;
      Rating.getAverageRating = jest.fn().mockRejectedValue(new Error('Aggregation failed'));

      const response = await request(app)
        .get(`/api/rating/${ratedUser._id.toString()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Rating.getAverageRating = originalGetAverageRating;
    });
  });

  // ===================================================================
  // GET /api/rating/user/:userId/group/:groupId - with mocking
  // ===================================================================
  describe('GET /api/rating/user/:userId/group/:groupId - with mocking', () => {
    /**
     * Test: GET /api/rating/user/:userId/group/:groupId
     * Input: Valid userId and groupId, but Rating.find fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when finding ratings
     * Mock Behavior: Rating.find throws an error
     */
    test('should handle database error when finding ratings by group', async () => {
      // Mock Rating.find to throw an error
      const originalFind = Rating.find;
      Rating.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('Database query failed'))
        })
      });

      const response = await request(app)
        .get(`/api/rating/user/${ratedUser._id.toString()}/group/${testGroup._id.toString()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Rating.find = originalFind;
    });

    /**
     * Test: GET /api/rating/user/:userId/group/:groupId
     * Input: Valid userId and groupId, but Rating.aggregate fails
     * Expected Status: 500
     * Expected Output: { success: false, message: "Internal server error" }
     * Expected Behavior: Should handle database errors when aggregating ratings
     * Mock Behavior: Rating.aggregate throws an error
     */
    test('should handle database error when aggregating ratings by group', async () => {
      // Mock Rating.aggregate to throw an error
      const originalAggregate = Rating.aggregate;
      Rating.aggregate = jest.fn().mockRejectedValue(new Error('Aggregation failed'));

      const response = await request(app)
        .get(`/api/rating/user/${ratedUser._id.toString()}/group/${testGroup._id.toString()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original
      Rating.aggregate = originalAggregate;
    });
  });
});
