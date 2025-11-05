/**
 * Health Check API Tests - With Mocking
 * 
 * These tests verify the health check endpoint using mocks to simulate external component failures.
 * Each exposed interface has a describe group with tests that require mocking.
 */

import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';

const app = express();

// Health check endpoint (simplified version for testing)
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({ 
    message: 'RoomSync Backend is running!', 
    timestamp: new Date().toISOString(),
    database: dbStatus,
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

describe('Health Check API Tests - With Mocking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===================================================================
  // GET /api/health - with mocking
  // ===================================================================
  describe('GET /api/health - with mocking', () => {
    /**
     * Test: GET /api/health
     * Input: None
     * Expected Status: 200
     * Expected Output: { message: "...", database: "disconnected", ... }
     * Expected Behavior: Should return health status even when database is disconnected
     * Mock Behavior: mongoose.connection.readyState is mocked to return 0 (disconnected)
     */
    test('should return health status when database is disconnected', async () => {
      // Mock mongoose connection state to disconnected
      const originalReadyState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
      Object.defineProperty(mongoose.connection, 'readyState', {
        get: () => 0, // disconnected
        configurable: true
      });

      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('RoomSync Backend is running!');
      expect(response.body.database).toBe('disconnected');
      expect(response.body.version).toBe('1.0.0');

      // Restore original readyState
      if (originalReadyState) {
        Object.defineProperty(mongoose.connection, 'readyState', originalReadyState);
      }
    });

    /**
     * Test: GET /api/health
     * Input: None
     * Expected Status: 200
     * Expected Output: { message: "...", database: "connected", ... }
     * Expected Behavior: Should return health status when database is connected
     * Mock Behavior: mongoose.connection.readyState is mocked to return 1 (connected)
     */
    test('should return health status when database is connected', async () => {
      // Mock mongoose connection state to connected
      const originalReadyState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
      Object.defineProperty(mongoose.connection, 'readyState', {
        get: () => 1, // connected
        configurable: true
      });

      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('RoomSync Backend is running!');
      expect(response.body.database).toBe('connected');
      expect(response.body.version).toBe('1.0.0');

      // Restore original readyState
      if (originalReadyState) {
        Object.defineProperty(mongoose.connection, 'readyState', originalReadyState);
      }
    });

    /**
     * Test: GET /api/health
     * Input: None
     * Expected Status: 200
     * Expected Output: { message: "...", database: "disconnected", environment: "test" }
     * Expected Behavior: Should return health status with environment variable
     * Mock Behavior: process.env.NODE_ENV is mocked
     */
    test('should return health status with correct environment', async () => {
      // Mock environment variable
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.environment).toBe('test');

      // Restore original environment
      if (originalEnv) {
        process.env.NODE_ENV = originalEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    /**
     * Test: GET /api/health
     * Input: None
     * Expected Status: 200
     * Expected Output: { message: "...", timestamp: "..." }
     * Expected Behavior: Should return health status with timestamp
     * Mock Behavior: Date is mocked to return a specific timestamp
     */
    test('should return health status with timestamp', async () => {
      const mockDate = new Date('2024-01-01T00:00:00.000Z');
      const originalDate = Date;
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = jest.fn(() => mockDate.getTime());

      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.timestamp).toBe('2024-01-01T00:00:00.000Z');

      // Restore original Date
      global.Date = originalDate;
    });

    /**
     * Test: GET /api/health
     * Input: None
     * Expected Status: 200
     * Expected Output: { message: "...", database: "disconnected", ... }
     * Expected Behavior: Should handle database connection state changes
     * Mock Behavior: mongoose.connection.readyState changes between calls
     */
    test('should handle database connection state changes', async () => {
      // First call - disconnected
      const originalReadyState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
      let callCount = 0;
      Object.defineProperty(mongoose.connection, 'readyState', {
        get: () => {
          callCount++;
          return callCount === 1 ? 0 : 1; // First call disconnected, subsequent connected
        },
        configurable: true
      });

      const response1 = await request(app)
        .get('/api/health');

      expect(response1.status).toBe(200);
      expect(response1.body.database).toBe('disconnected');

      const response2 = await request(app)
        .get('/api/health');

      expect(response2.status).toBe(200);
      expect(response2.body.database).toBe('connected');

      // Restore original readyState
      if (originalReadyState) {
        Object.defineProperty(mongoose.connection, 'readyState', originalReadyState);
      }
    });
  });
});

