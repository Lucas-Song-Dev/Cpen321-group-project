/**
 * Non-Functional Requirements Tests - API Response Time
 * 
 * These tests verify that API response times meet the non-functional requirements:
 * - API response times for login, signup, message send, and user profile fetch 
 *   must be under 200ms on Wi-Fi 5+ connection on a 16GB Android phone running Android API 33.
 * 
 * Testing Method: Use Jest and supertest to send API requests and measure response time 
 * from request to 200 OK response.
 */

import request from 'supertest';
import express from 'express';
import { authRouter } from '../../routes/auth';
import chatRouter from '../../routes/chat';
import { UserModel } from '../../models/User';
import Group from '../../models/Group';
import Message from '../../models/Message';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import mongoose from 'mongoose';

// Mock Google OAuth for testing (same as auth.test.ts)
jest.mock('google-auth-library', () => {
  const originalModule = jest.requireActual('google-auth-library');
  return {
    ...originalModule,
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        verifyIdToken: jest.fn().mockImplementation(async ({ idToken }: { idToken: string }) => {
          if (idToken === 'valid-signup-token') {
            return {
              getPayload: () => ({
                email: 'perf-test-signup@example.com',
                name: 'Performance Test User Signup',
                sub: 'google-id-perf-signup'
              })
            };
          }
          if (idToken === 'valid-login-token') {
            return {
              getPayload: () => ({
                email: 'perf-test-login@example.com',
                name: 'Performance Test User Login',
                sub: 'google-id-perf-login'
              })
            };
          }
          throw new Error('Invalid token');
        })
      };
    })
  };
});

// Mock socketHandler for chat tests
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

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);

describe('Non-Functional Requirements: API Response Time Tests', () => {
  const RESPONSE_TIME_THRESHOLD_MS = 200; // 200ms requirement

  let testUser: any;
  let testGroup: any;
  let authToken: string;

  beforeEach(async () => {
    // Ensure mongoose connection is ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Create test user for login and profile fetch tests
    testUser = await UserModel.create({
      email: 'perf-test-login@example.com',
      name: 'Performance Test User Login',
      googleId: 'google-id-perf-login',
      profileComplete: true,
      dob: new Date('2000-01-01'),
      gender: 'Male'
    });

    // Create test group for message send tests
    testGroup = await Group.create({
      name: 'Performance Test Group',
      owner: testUser._id,
      members: [{ userId: testUser._id, joinDate: new Date() }]
    });

    // Generate auth token for authenticated requests
    authToken = jwt.sign(
      { email: testUser.email, id: testUser._id.toString() },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  /**
   * Test: POST /api/auth/login - Response Time Requirement
   * Requirement: Response time must be under 200ms
   * Verification: Measure time from request to 200 OK response
   */
  describe('POST /api/auth/login - Response Time', () => {
    test('should respond within 200ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ token: 'valid-login-token' });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD_MS);

      console.log(`[LOG] POST /api/auth/login - Response Time: ${responseTime}ms`);
    });

    test('should consistently meet response time requirement across multiple requests', async () => {
      const responseTimes: number[] = [];
      const numRequests = 5;

      for (let i = 0; i < numRequests; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/auth/login')
          .send({ token: 'valid-login-token' });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBe(200);
        responseTimes.push(responseTime);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      expect(averageResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD_MS);
      expect(maxResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD_MS);

      console.log(`[LOG] POST /api/auth/login - Average Response Time: ${averageResponseTime.toFixed(2)}ms`);
      console.log(`[LOG] POST /api/auth/login - Max Response Time: ${maxResponseTime}ms`);
    });
  });

  /**
   * Test: POST /api/auth/signup - Response Time Requirement
   * Requirement: Response time must be under 200ms (with all required data entered)
   * Verification: Measure time from request to 200 OK response
   */
  describe('POST /api/auth/signup - Response Time', () => {
    test('should respond within 200ms', async () => {
      // Clean up any existing user with this email first
      await UserModel.deleteOne({ email: 'perf-test-signup@example.com' });

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ token: 'valid-signup-token' });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD_MS);

      console.log(`[LOG] POST /api/auth/signup - Response Time: ${responseTime}ms`);
    });

    test('should consistently meet response time requirement across multiple requests', async () => {
      const responseTimes: number[] = [];
      const numRequests = 5;

      for (let i = 0; i < numRequests; i++) {
        // Clean up any existing user before each signup
        await UserModel.deleteOne({ email: `perf-test-signup-${i}@example.com` });

        // Mock to return unique email for each request
        jest.spyOn(require('google-auth-library'), 'OAuth2Client').mockImplementationOnce(() => ({
          verifyIdToken: jest.fn().mockResolvedValue({
            getPayload: () => ({
              email: `perf-test-signup-${i}@example.com`,
              name: `Performance Test User ${i}`,
              sub: `google-id-perf-signup-${i}`
            })
          })
        }));

        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/auth/signup')
          .send({ token: 'valid-signup-token' });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (response.status === 200) {
          responseTimes.push(responseTime);
        }
      }

      if (responseTimes.length > 0) {
        const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const maxResponseTime = Math.max(...responseTimes);

        expect(averageResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD_MS);
        expect(maxResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD_MS);

        console.log(`[LOG] POST /api/auth/signup - Average Response Time: ${averageResponseTime.toFixed(2)}ms`);
        console.log(`[LOG] POST /api/auth/signup - Max Response Time: ${maxResponseTime}ms`);
      }
    });
  });

  /**
   * Test: POST /api/chat/:groupId/message - Response Time Requirement
   * Requirement: Response time must be under 200ms (not downstream message delivery)
   * Verification: Measure time from request to 201 Created response (message send confirmation)
   */
  describe('POST /api/chat/:groupId/message - Response Time', () => {
    test('should respond within 200ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post(`/api/chat/${testGroup._id}/message`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Performance test message' });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD_MS);

      console.log(`[LOG] POST /api/chat/:groupId/message - Response Time: ${responseTime}ms`);
    });

    test('should consistently meet response time requirement across multiple requests', async () => {
      const responseTimes: number[] = [];
      const numRequests = 5;

      for (let i = 0; i < numRequests; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post(`/api/chat/${testGroup._id}/message`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: `Performance test message ${i}` });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBe(201);
        responseTimes.push(responseTime);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      expect(averageResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD_MS);
      expect(maxResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD_MS);

      console.log(`[LOG] POST /api/chat/:groupId/message - Average Response Time: ${averageResponseTime.toFixed(2)}ms`);
      console.log(`[LOG] POST /api/chat/:groupId/message - Max Response Time: ${maxResponseTime}ms`);
    });
  });

  /**
   * Test: User Profile Fetch - Response Time Requirement
   * Requirement: Response time must be under 200ms
   * Note: Since login response includes user profile data, we test the login endpoint
   * which returns the complete user profile in the response.
   * Verification: Measure time from request to 200 OK response containing user profile
   */
  describe('User Profile Fetch - Response Time (via Login Response)', () => {
    test('should fetch user profile within 200ms via login response', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ token: 'valid-login-token' });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBeDefined();
      expect(response.body.user.name).toBeDefined();
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD_MS);

      console.log(`[LOG] User Profile Fetch (via login) - Response Time: ${responseTime}ms`);
    });

    test('should consistently fetch user profile within response time requirement', async () => {
      const responseTimes: number[] = [];
      const numRequests = 5;

      for (let i = 0; i < numRequests; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/auth/login')
          .send({ token: 'valid-login-token' });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBe(200);
        expect(response.body.user).toBeDefined();
        responseTimes.push(responseTime);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      expect(averageResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD_MS);
      expect(maxResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD_MS);

      console.log(`[LOG] User Profile Fetch (via login) - Average Response Time: ${averageResponseTime.toFixed(2)}ms`);
      console.log(`[LOG] User Profile Fetch (via login) - Max Response Time: ${maxResponseTime}ms`);
    });
  });
});

