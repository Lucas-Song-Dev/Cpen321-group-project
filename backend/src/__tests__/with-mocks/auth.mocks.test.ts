/**
 * Auth API Tests - With Mocking
 * 
 * These tests verify authentication endpoints using mocks to simulate external component failures.
 * Each exposed interface has a describe group with tests that require mocking.
 */

import request from 'supertest';
import express from 'express';
import { authRouter } from '../../routes/auth.routes';
import { UserModel } from '../../models/user.models';
import mongoose from 'mongoose';

// Mock Google OAuth client (hoist-safe)
var mockVerifyIdToken: jest.Mock;
var mockOAuth2Client: jest.Mock;

jest.mock('google-auth-library', () => {
  mockVerifyIdToken = jest.fn();
  mockOAuth2Client = jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken
  }));
  return {
    OAuth2Client: mockOAuth2Client
  };
});

// Mock AuthService (hoist-safe)
var mockSignup: jest.Mock;
var mockLogin: jest.Mock;

jest.mock('../../services/auth.services', () => {
  mockSignup = jest.fn();
  mockLogin = jest.fn();
  return {
    AuthService: {
      signup: mockSignup,
      login: mockLogin
    }
  };
});

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth API Tests - With Mocking', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockVerifyIdToken.mockClear();
    mockSignup.mockClear();
    mockLogin.mockClear();
  });

  // ===================================================================
  // POST /api/auth/signup - with mocking
  // ===================================================================
  describe('POST /api/auth/signup - with mocking', () => {
    /**
     * Test: POST /api/auth/signup
     * Input: Valid token, but Google OAuth verification throws error
     * Expected Status: 401
     * Expected Output: { success: false, message: "Signup failed: Invalid Google token" }
     * Expected Behavior: Should handle Google OAuth verification errors gracefully
     * Mock Behavior: OAuth2Client.verifyIdToken throws an error
     */
    test('should handle Google OAuth verification error', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Token verification failed'));

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Signup failed');
      expect(mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: 'valid-token',
        audience: process.env.GOOGLE_CLIENT_ID
      });
    });

    /**
     * Test: POST /api/auth/signup
     * Input: Valid token, Google OAuth succeeds, but AuthService.signup throws error
     * Expected Status: 500 (or whatever error handler returns)
     * Expected Output: Error response
     * Expected Behavior: Should handle database/service errors when creating user
     * Mock Behavior: verifyGoogleToken succeeds but AuthService.signup throws error
     */
    test('should handle AuthService.signup database error', async () => {
      // Mock successful Google verification
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue({
          email: 'test@example.com',
          name: 'Test User',
          sub: 'google-id-123'
        })
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      // Mock AuthService.signup to throw error (simulating database failure)
      mockSignup.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ token: 'valid-token' });

      // The error handler should catch this
      expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'Test User', 'google-id-123');
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * Test: POST /api/auth/signup
     * Input: Valid token, but Google OAuth returns null payload
     * Expected Status: 401
     * Expected Output: { success: false, message: "Signup failed: Invalid Google token" }
     * Expected Behavior: Should handle null payload from Google token verification
     * Mock Behavior: verifyGoogleToken returns null payload
     */
    test('should handle null payload from Google token', async () => {
      // Mock Google verification that returns null payload
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(null)
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Signup failed');
    });

    /**
     * Test: POST /api/auth/signup
     * Input: Valid token, but Google OAuth returns payload without email
     * Expected Status: 401
     * Expected Output: { success: false, message: "Signup failed: Invalid Google token" }
     * Expected Behavior: Should handle missing email in payload
     * Mock Behavior: verifyGoogleToken returns payload without email
     */
    test('should handle missing email in Google payload', async () => {
      // Mock Google verification that returns payload without email
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue({
          name: 'Test User',
          sub: 'google-id-123'
          // Missing email
        })
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ token: 'valid-token' });

      // Should fail because email is required
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * Test: POST /api/auth/signup
     * Input: Valid token, but network error occurs during Google verification
     * Expected Status: 401
     * Expected Output: { success: false, message: "Signup failed: Invalid Google token" }
     * Expected Behavior: Should handle network errors from Google API
     * Mock Behavior: OAuth2Client.verifyIdToken throws network error
     */
    test('should handle network error during Google verification', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Network request failed'));

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Signup failed');
    });

    /**
     * Test: POST /api/auth/signup
     * Input: Valid token, Google OAuth succeeds, AuthService.signup succeeds
     * Expected Status: 200
     * Expected Output: { success: true, user: {...}, token: "..." }
     * Expected Behavior: Should successfully signup when all external components work
     * Mock Behavior: All mocks return success
     */
    test('should successfully signup when all external components work', async () => {
      // Mock successful Google verification
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue({
          email: 'newuser@example.com',
          name: 'New User',
          sub: 'google-id-123'
        })
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      // Mock successful AuthService.signup
      mockSignup.mockResolvedValue({
        success: true,
        user: { email: 'newuser@example.com', name: 'New User' },
        token: 'jwt-token-123'
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(mockSignup).toHaveBeenCalledWith('newuser@example.com', 'New User', 'google-id-123');
    });
  });

  // ===================================================================
  // POST /api/auth/login - with mocking
  // ===================================================================
  describe('POST /api/auth/login - with mocking', () => {
    /**
     * Test: POST /api/auth/login
     * Input: Valid token, but Google OAuth verification throws error
     * Expected Status: 401
     * Expected Output: { success: false, message: "Login failed: Invalid Google token" }
     * Expected Behavior: Should handle Google OAuth verification errors gracefully
     * Mock Behavior: OAuth2Client.verifyIdToken throws an error
     */
    test('should handle Google OAuth verification error', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Token verification failed'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Login failed');
      expect(mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: 'valid-token',
        audience: process.env.GOOGLE_CLIENT_ID
      });
    });

    /**
     * Test: POST /api/auth/login
     * Input: Valid token, Google OAuth succeeds, but AuthService.login throws error
     * Expected Status: 500 (or whatever error handler returns)
     * Expected Output: Error response
     * Expected Behavior: Should handle database/service errors when logging in
     * Mock Behavior: verifyGoogleToken succeeds but AuthService.login throws error
     */
    test('should handle AuthService.login database error', async () => {
      // Mock successful Google verification
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue({
          email: 'existing@example.com',
          name: 'Existing User',
          sub: 'google-id-456'
        })
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      // Mock AuthService.login to throw error (simulating database failure)
      mockLogin.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ token: 'valid-token' });

      // The error handler should catch this
      expect(mockLogin).toHaveBeenCalledWith('existing@example.com');
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * Test: POST /api/auth/login
     * Input: Valid token, but Google OAuth returns null payload
     * Expected Status: 401
     * Expected Output: { success: false, message: "Login failed: Invalid Google token" }
     * Expected Behavior: Should handle null payload from Google token verification
     * Mock Behavior: verifyGoogleToken returns null payload
     */
    test('should handle null payload from Google token', async () => {
      // Mock Google verification that returns null payload
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(null)
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Login failed');
    });

    /**
     * Test: POST /api/auth/login
     * Input: Valid token, but Google OAuth returns payload without email
     * Expected Status: 401
     * Expected Output: { success: false, message: "Login failed: Invalid Google token" }
     * Expected Behavior: Should handle missing email in payload
     * Mock Behavior: verifyGoogleToken returns payload without email
     */
    test('should handle missing email in Google payload', async () => {
      // Mock Google verification that returns payload without email
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue({
          name: 'Existing User',
          sub: 'google-id-456'
          // Missing email
        })
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ token: 'valid-token' });

      // Should fail because email is required
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * Test: POST /api/auth/login
     * Input: Valid token, but network error occurs during Google verification
     * Expected Status: 401
     * Expected Output: { success: false, message: "Login failed: Invalid Google token" }
     * Expected Behavior: Should handle network errors from Google API
     * Mock Behavior: OAuth2Client.verifyIdToken throws network error
     */
    test('should handle network error during Google verification', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Network request failed'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Login failed');
    });

    /**
     * Test: POST /api/auth/login
     * Input: Valid token, Google OAuth succeeds, AuthService.login succeeds
     * Expected Status: 200
     * Expected Output: { success: true, user: {...}, token: "..." }
     * Expected Behavior: Should successfully login when all external components work
     * Mock Behavior: All mocks return success
     */
    test('should successfully login when all external components work', async () => {
      // Mock successful Google verification
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue({
          email: 'existing@example.com',
          name: 'Existing User',
          sub: 'google-id-456'
        })
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      // Mock successful AuthService.login
      mockLogin.mockResolvedValue({
        success: true,
        user: { email: 'existing@example.com', name: 'Existing User' },
        token: 'jwt-token-456'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(mockLogin).toHaveBeenCalledWith('existing@example.com');
    });

    /**
     * Test: POST /api/auth/login
     * Input: Valid token, Google OAuth succeeds, but user not found in database
     * Expected Status: 200 or 404 (depending on AuthService implementation)
     * Expected Output: Error response indicating user not found
     * Expected Behavior: Should handle case where user doesn't exist
     * Mock Behavior: AuthService.login returns error for non-existent user
     */
    test('should handle user not found error', async () => {
      // Mock successful Google verification
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue({
          email: 'nonexistent@example.com',
          name: 'Non-existent User',
          sub: 'google-id-999'
        })
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      // Mock AuthService.login to return error for non-existent user
      mockLogin.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ token: 'valid-token' });

      expect(mockLogin).toHaveBeenCalledWith('nonexistent@example.com');
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });
  });
});

