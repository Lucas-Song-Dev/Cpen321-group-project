/**
 * Middleware Tests - No Mocking
 * 
 * These tests verify authentication middleware without mocking.
 */

import request from 'supertest';
import express from 'express';
import { authenticate } from '../../middleware/auth';
import { UserModel } from '../../models/User';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// Test route protected by authenticate middleware
app.get('/protected', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

describe('Authentication Middleware - No Mocking', () => {
  let testUser: any;
  let testUser2: any;

  beforeEach(async () => {
    // Ensure mongoose connection is ready before creating records
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    testUser = await UserModel.create({
      email: 'test@example.com',
      name: 'Test User',
      googleId: 'test-google-id',
      profileComplete: true
    });

    testUser2 = await UserModel.create({
      email: 'test2@example.com',
      name: 'Test User 2',
      googleId: 'test-google-id-2',
      profileComplete: true
    });
  });

  /**
   * Test: GET /protected
   * Input: No Authorization header
   * Expected Status: 401
   * Expected Output: { success: false, message: "No token provided" }
   * Expected Behavior: Should reject requests without token
   */
  test('should reject request without Authorization header', async () => {
    const response = await request(app)
      .get('/protected');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('No token provided');
  });

  /**
   * Test: GET /protected
   * Input: Invalid Authorization format
   * Expected Status: 401
   * Expected Behavior: Should reject invalid Authorization format
   */
  test('should reject invalid Authorization format', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'InvalidFormat token');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('No token provided');
  });

  /**
   * Test: GET /protected
   * Input: Valid JWT token
   * Expected Status: 200
   * Expected Behavior: Should authenticate with valid JWT token
   */
  test('should authenticate with valid JWT token', async () => {
    const token = jwt.sign(
      { email: testUser.email, id: testUser._id.toString() },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe('test@example.com');
  });

  /**
   * Test: GET /protected
   * Input: Invalid JWT token
   * Expected Status: 401
   * Expected Behavior: Should reject invalid JWT token
   */
  test('should reject invalid JWT token', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid token');
  });

  /**
   * Test: GET /protected
   * Input: JWT token with non-existent user ID
   * Expected Status: 401
   * Expected Behavior: Should reject when user not found in database
   */
  test('should reject when user not found in database', async () => {
    const fakeUserId = '507f1f77bcf86cd799439011';
    const token = jwt.sign(
      { email: 'fake@example.com', id: fakeUserId },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('User not found');
  });

  /**
   * Test: GET /protected
   * Input: bypass-token
   * Expected Status: 200
   * Expected Behavior: Should authenticate using bypass token for test user 1
   */
  test('should authenticate with bypass-token for test user 1', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer bypass-token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe('test@example.com');
  });

  /**
   * Test: GET /protected
   * Input: bypass-token-2
   * Expected Status: 200
   * Expected Behavior: Should authenticate using bypass token for test user 2
   */
  test('should authenticate with bypass-token-2 for test user 2', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer bypass-token-2');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe('test2@example.com');
  });

  /**
   * Test: GET /protected
   * Input: bypass-token when test user not found
   * Expected Status: 401
   * Expected Behavior: Should reject bypass token when test user doesn't exist
   */
  test('should reject bypass-token when test user not found', async () => {
    // Delete the test user
    await UserModel.deleteOne({ email: 'test@example.com' });

    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer bypass-token');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Test user not found');
  });

  /**
   * Test: GET /protected
   * Input: bypass-token-2 when test user 2 not found
   * Expected Status: 401
   * Expected Behavior: Should reject bypass-token-2 when test user 2 doesn't exist (covers lines 49-50)
   */
  test('should reject bypass-token-2 when test user 2 not found', async () => {
    // Delete test user 2
    await UserModel.deleteOne({ email: 'test2@example.com' });

    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer bypass-token-2');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Test user not found');
  });
});


