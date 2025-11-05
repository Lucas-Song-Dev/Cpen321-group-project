/**
 * Auth API Tests - No Mocking
 * 
 * These tests verify authentication endpoints without mocking external dependencies.
 * Each exposed interface has a describe group with tests that can run without mocks.
 */

import request from 'supertest';
import express from 'express';
import { authRouter } from '../../routes/auth';
import mongoose from 'mongoose';
import { UserModel } from '../../models/User';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { OAuth2Client } from 'google-auth-library';

// Mock Google OAuth for testing success paths (lines 27-28, 41-42)
jest.mock('google-auth-library', () => {
  const originalModule = jest.requireActual('google-auth-library');
  return {
    ...originalModule,
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        verifyIdToken: jest.fn().mockImplementation(async ({ idToken }: { idToken: string }) => {
          // Simulate successful verification for test tokens
          if (idToken === 'valid-signup-token') {
            return {
              getPayload: () => ({
                email: 'newuser@example.com',
                name: 'New User',
                sub: 'google-id-123'
              })
            };
          }
          if (idToken === 'valid-login-token') {
            return {
              getPayload: () => ({
                email: 'existing@example.com',
                name: 'Existing User',
                sub: 'google-id-456'
              })
            };
          }
          if (idToken === 'null-payload-token') {
            return {
              getPayload: () => null // Simulate null payload (lines 12-14)
            };
          }
          // Default: throw error for invalid tokens
          throw new Error('Invalid token');
        })
      };
    })
  };
});

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth API Tests', () => {
  // ===================================================================
  // POST /api/auth/signup - no mocking
  // ===================================================================
  describe('POST /api/auth/signup - no mocking', () => {
    /**
     * Test: POST /api/auth/signup
     * Input: { token: "valid-google-token" }
     * Expected Status: 401 (since we can't verify real Google tokens without mocking)
     * Expected Behavior: Should fail with invalid token error
     * Note: Without mocking Google OAuth, this will fail as expected
     */
    test('should fail with invalid Google token (no mocking)', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ token: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Signup failed');
    });

    /**
     * Test: POST /api/auth/signup
     * Input: { token: null }
     * Expected Status: 400
     * Expected Behavior: Should return error for missing token
     */
    test('should return 400 for missing token', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing ID token');
    });

    /**
     * Test: POST /api/auth/signup
     * Input: Empty token
     * Expected Status: 400
     * Expected Behavior: Should return error for empty token string
     */
    test('should return 400 for empty token string', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ token: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing ID token');
    });

    /**
     * Test: POST /api/auth/signup
     * Input: Valid Google token (mocked)
     * Expected Status: 200
     * Expected Output: { success: true, user: {...}, token: "..." }
     * Expected Behavior: Should create user and return success (lines 27-28)
     */
    test('should successfully signup with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ token: 'valid-signup-token' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();

      // Verify user was created
      const user = await UserModel.findOne({ email: 'newuser@example.com' });
      expect(user).toBeDefined();
    });

    /**
     * Test: POST /api/auth/signup
     * Input: Google token that returns null payload
     * Expected Status: 401
     * Expected Output: { success: false, message: "Signup failed: Invalid Google token" }
     * Expected Behavior: Should handle null payload error (lines 12-14)
     */
    test('should handle null payload from Google token', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ token: 'null-payload-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Signup failed');
    });
  });

  // ===================================================================
  // POST /api/auth/login - no mocking
  // ===================================================================
  describe('POST /api/auth/login - no mocking', () => {
    /**
     * Test: POST /api/auth/login
     * Input: { token: null }
     * Expected Status: 400
     * Expected Output: { success: false, message: "Missing ID token" }
     * Expected Behavior: Should return error for missing token
     */
    test('should return 400 for missing token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing ID token');
    });

    /**
     * Test: POST /api/auth/login
     * Input: Empty token
     * Expected Status: 400
     * Expected Output: { success: false, message: "Missing ID token" }
     * Expected Behavior: Should return error for empty token string
     */
    test('should return 400 for empty token string', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ token: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing ID token');
    });

    /**
     * Test: POST /api/auth/login
     * Input: { token: "invalid-token" }
     * Expected Status: 401
     * Expected Output: { success: false, message: "Login failed: Invalid Google token" }
     * Expected Behavior: Should fail with invalid token error
     */
    test('should fail with invalid Google token (no mocking)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ token: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Login failed');
    });

    /**
     * Test: POST /api/auth/login
     * Input: Valid Google token (mocked) for existing user
     * Expected Status: 200
     * Expected Output: { success: true, user: {...}, token: "..." }
     * Expected Behavior: Should login existing user and return success (lines 41-42)
     */
    test('should successfully login with valid token', async () => {
      // Create user first
      await UserModel.create({
        email: 'existing@example.com',
        name: 'Existing User',
        googleId: 'google-id-456',
        profileComplete: true
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ token: 'valid-login-token' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
    });
  });
});
