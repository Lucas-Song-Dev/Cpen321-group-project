/**
 * Rating API Tests - No Mocking
 * 
 * These tests verify rating endpoints without mocking external dependencies.
 */

import request from 'supertest';
import express from 'express';
import ratingRouter from '../../routes/rating';
import { UserModel } from '../../models/User';
import Group from '../../models/Group';
import Rating from '../../models/Rating';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());
// Routes already include protect middleware
app.use('/api/rating', ratingRouter);

describe('Rating API - No Mocking', () => {
  let testUser: any;
  let ratedUser: any;
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

  /**
   * Test: POST /api/rating
   * Input: { ratedUserId: "...", groupId: "...", rating: 5, testimonial: "Great!" }
   * Expected Status: 201
   * Expected Output: { success: true, data: {...rating} }
   * Expected Behavior: Should create a rating for another user
   */
  test('POST /api/rating - should create a rating', async () => {
    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ratedUserId: ratedUser._id.toString(),
        groupId: testGroup._id.toString(),
        rating: 5,
        testimonial: 'Great roommate!'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.rating).toBe(5);
  });

  /**
   * Test: POST /api/rating
   * Input: Invalid rating (out of range)
   * Expected Status: 400
   * Expected Behavior: Should reject invalid rating values
   */
  test('POST /api/rating - should reject invalid rating', async () => {
    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ratedUserId: ratedUser._id.toString(),
        groupId: testGroup._id.toString(),
        rating: 10 // Invalid: must be 1-5
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  /**
   * Test: GET /api/rating/:userId
   * Input: Valid userId
   * Expected Status: 200
   * Expected Output: { success: true, data: { ratings: [...], averageRating: number } }
   * Expected Behavior: Should return all ratings for a user
   */
  test('GET /api/rating/:userId - should return user ratings', async () => {
    await Rating.create({
      ratedUserId: ratedUser._id,
      raterUserId: testUser._id,
      groupId: testGroup._id,
      rating: 5,
      testimonial: 'Great!',
      timeSpentMinutes: 44640 // 31 days in minutes
    });

    const response = await request(app)
      .get(`/api/rating/${ratedUser._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.averageRating).toBeDefined();
  });

  /**
   * Test: GET /api/rating/user/:userId/group/:groupId
   * Input: Valid userId and groupId
   * Expected Status: 200
   * Expected Output: { success: true, data: { ratings: [...], averageRating: number } }
   * Expected Behavior: Should return ratings for user in specific group
   */
  test('GET /api/rating/user/:userId/group/:groupId - should return ratings for user in group', async () => {
    await Rating.create({
      ratedUserId: ratedUser._id,
      raterUserId: testUser._id,
      groupId: testGroup._id,
      rating: 5,
      testimonial: 'Great!',
      timeSpentMinutes: 44640
    });

    const response = await request(app)
      .get(`/api/rating/user/${ratedUser._id}/group/${testGroup._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.averageRating).toBeDefined();
    expect(Array.isArray(response.body.data.ratings)).toBe(true);
  });

  /**
   * Test: POST /api/rating
   * Input: User trying to rate themselves
   * Expected Status: 400
   * Expected Behavior: Should reject self-rating
   */
  test('POST /api/rating - should reject self-rating', async () => {
    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ratedUserId: testUser._id.toString(),
        groupId: testGroup._id.toString(),
        rating: 5
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('cannot rate yourself');
  });

  /**
   * Test: POST /api/rating
   * Input: User not in group long enough (< 30 days)
   * Expected Status: 400
   * Expected Behavior: Should reject rating if user hasn't been in group 30 days
   */
  test('POST /api/rating - should reject rating if insufficient time in group', async () => {
    const newUser = await UserModel.create({
      email: 'newuser@example.com',
      name: 'New User',
      googleId: 'new-google-id',
      profileComplete: true
    });

    const newGroup = await Group.create({
      name: 'New Group',
      owner: testUser._id,
      members: [
        { userId: testUser._id, joinDate: new Date() }, // Today
        { userId: newUser._id, joinDate: new Date() } // Today
      ]
    });

    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ratedUserId: (newUser._id as any).toString(),
        groupId: newGroup._id.toString(),
        rating: 5
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('30 days');
  });

  /**
   * Test: POST /api/rating
   * Input: Testimonial too long (> 500 chars)
   * Expected Status: 400
   * Expected Behavior: Should reject testimonial over length limit
   */
  test('POST /api/rating - should reject testimonial too long', async () => {
    const longTestimonial = 'a'.repeat(501);
    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ratedUserId: ratedUser._id.toString(),
        groupId: testGroup._id.toString(),
        rating: 5,
        testimonial: longTestimonial
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('500 characters');
  });

  /**
   * Test: POST /api/rating
   * Input: Missing required fields (covers line 22)
   * Expected Status: 400
   * Expected Behavior: Should reject when required fields are missing
   */
  test('POST /api/rating - should reject missing required fields', async () => {
    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        // Missing ratedUserId, groupId, or rating
        ratedUserId: ratedUser._id.toString()
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Missing required fields');
  });

  /**
   * Test: POST /api/rating
   * Input: Non-existent group (covers line 55)
   * Expected Status: 404
   * Expected Behavior: Should reject when group not found
   */
  test('POST /api/rating - should reject when group not found', async () => {
    const fakeGroupId = '507f1f77bcf86cd799439011';
    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ratedUserId: ratedUser._id.toString(),
        groupId: fakeGroupId,
        rating: 5
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Group not found');
  });

  /**
   * Test: POST /api/rating
   * Input: Rated user not in group (covers line 65)
   * Expected Status: 403
   * Expected Behavior: Should reject when users are not in the same group
   */
  test('POST /api/rating - should reject when users not in same group', async () => {
    // Create a different group with only the rater
    const otherGroup = await Group.create({
      name: 'Other Group',
      owner: testUser._id,
      members: [
        { userId: testUser._id, joinDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) }
      ]
    });

    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ratedUserId: ratedUser._id.toString(), // ratedUser is in testGroup, not otherGroup
        groupId: otherGroup._id.toString(),
        rating: 5
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Both users must be members');
  });

  /**
   * Test: POST /api/rating
   * Input: Rated user has been in group less than 30 days (covers line 88)
   * Expected Status: 400
   * Expected Behavior: Should reject when rated user hasn't been in group long enough
   */
  test('POST /api/rating - should reject when rated user has insufficient time', async () => {
    const newUser = await UserModel.create({
      email: 'newuser2@example.com',
      name: 'New User 2',
      googleId: 'new-google-id-2',
      profileComplete: true
    });

    // Create group where rater has been there 31 days, but rated user only 15 days
    const joinDateRater = new Date();
    joinDateRater.setDate(joinDateRater.getDate() - 31);
    const joinDateRated = new Date();
    joinDateRated.setDate(joinDateRated.getDate() - 15);

    const newGroup = await Group.create({
      name: 'New Group 2',
      owner: testUser._id,
      members: [
        { userId: testUser._id, joinDate: joinDateRater },
        { userId: newUser._id, joinDate: joinDateRated }
      ]
    });

    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ratedUserId: (newUser._id as any).toString(),
        groupId: newGroup._id.toString(),
        rating: 5
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('less than 30 days');
  });

  /**
   * Test: POST /api/rating
   * Input: Update existing rating (covers line 110)
   * Expected Status: 201
   * Expected Behavior: Should update existing rating instead of creating new one
   */
  test('POST /api/rating - should update existing rating', async () => {
    // First create a rating
    await Rating.create({
      ratedUserId: ratedUser._id,
      raterUserId: testUser._id,
      groupId: testGroup._id,
      rating: 3,
      testimonial: 'Initial rating'
    });

    // Update the rating
    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ratedUserId: ratedUser._id.toString(),
        groupId: testGroup._id.toString(),
        rating: 5,
        testimonial: 'Updated rating'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.rating).toBe(5);
    expect(response.body.data.testimonial).toBe('Updated rating');

    // Verify only one rating exists (not two)
    const ratings = await Rating.find({
      ratedUserId: ratedUser._id,
      raterUserId: testUser._id,
      groupId: testGroup._id
    });
    expect(ratings.length).toBe(1);
  });

  /**
   * Test: POST /api/rating
   * Input: Missing required fields
   * Expected Status: 400
   * Expected Behavior: Should reject missing required fields (line 22)
   */
  test('POST /api/rating - should reject missing required fields', async () => {
    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ratedUserId: 'some-id'
        // Missing groupId and rating
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Missing required fields');
  });

  /**
   * Test: POST /api/rating
   * Input: Group not found
   * Expected Status: 404
   * Expected Behavior: Should return 404 when group not found (line 55)
   */
  test('POST /api/rating - should return 404 when group not found', async () => {
    const ratedUser2 = await UserModel.create({
      email: 'rated2@example.com',
      name: 'Rated User 2',
      googleId: 'rated-google-id-2',
      profileComplete: true
    });

    const nonExistentGroupId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ratedUserId: (ratedUser2._id as any).toString(),
        groupId: nonExistentGroupId.toString(),
        rating: 5
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Group not found');
  });

  /**
   * Test: POST /api/rating
   * Input: User not a member of group
   * Expected Status: 403
   * Expected Behavior: Should reject when user not a member (line 65)
   */
  test('POST /api/rating - should reject when user not a member of group', async () => {
    const ratedUser3 = await UserModel.create({
      email: 'rated3@example.com',
      name: 'Rated User 3',
      googleId: 'rated-google-id-3',
      profileComplete: true
    });

    const otherGroup = await Group.create({
      name: 'Other Group',
      owner: ratedUser3._id,
      members: [{ userId: ratedUser3._id, joinDate: new Date() }]
    });

    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ratedUserId: (ratedUser3._id as any).toString(),
        groupId: otherGroup._id.toString(),
        rating: 5
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('must be members');
  });

  /**
   * Test: POST /api/rating
   * Input: Rater has been in group for less than 30 days
   * Expected Status: 400
   * Expected Behavior: Should reject when rater hasn't been in group long enough (line 88)
   */
  test('POST /api/rating - should reject when rater has been in group for less than 30 days', async () => {
    const ratedUser4 = await UserModel.create({
      email: 'rated4@example.com',
      name: 'Rated User 4',
      googleId: 'rated-google-id-4',
      profileComplete: true
    });

    // Create group where rated user has been in for 30+ days, but rater only recently joined
    const group = await Group.create({
      name: 'Test Group',
      owner: ratedUser4._id,
      members: [
        { userId: ratedUser4._id, joinDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) }, // 35 days ago
        { userId: testUser._id, joinDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } // 10 days ago (less than 30)
      ]
    });

    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ratedUserId: (ratedUser4._id as any).toString(),
        groupId: group._id.toString(),
        rating: 5
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('at least');
  });

  /**
   * Test: POST /api/rating
   * Input: Updating existing rating
   * Expected Status: 200
   * Expected Behavior: Should update existing rating (line 110)
   */
  test('POST /api/rating - should update existing rating', async () => {
    const ratedUser5 = await UserModel.create({
      email: 'rated5@example.com',
      name: 'Rated User 5',
      googleId: 'rated-google-id-5',
      profileComplete: true
    });

    // Create group with both users in for 30+ days
    const joinDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago
    const group = await Group.create({
      name: 'Test Group',
      owner: testUser._id,
      members: [
        { userId: testUser._id, joinDate },
        { userId: ratedUser5._id, joinDate }
      ]
    });

    // Create initial rating
    const initialRating = await Rating.create({
      ratedUserId: ratedUser5._id,
      raterUserId: testUser._id,
      groupId: group._id,
      rating: 3,
      timeSpentMinutes: 35 * 24 * 60
    });

    // Update the rating
    const response = await request(app)
      .post('/api/rating')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ratedUserId: (ratedUser5._id as any).toString(),
        groupId: group._id.toString(),
        rating: 5,
        testimonial: 'Updated testimonial'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.rating.rating).toBe(5);
  });
});

