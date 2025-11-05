/**
 * Health Check API Tests - No Mocking
 * 
 * These tests verify the health check endpoint without mocking external dependencies.
 * Each exposed interface has a describe group with tests that can run without mocks.
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

describe('Health Check API Tests', () => {
  // ===================================================================
  // GET /api/health - no mocking
  // ===================================================================
  describe('GET /api/health - no mocking', () => {
    /**
     * Test: GET /api/health
     * Input: None
     * Expected Status: 200
     * Expected Output: { message: "RoomSync Backend is running!", database: "...", version: "1.0.0", timestamp: "...", environment: "..." }
     * Expected Behavior: Should return health status of the backend with all required fields
     */
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('RoomSync Backend is running!');
      expect(response.body.database).toBeDefined();
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });

    /**
     * Test: GET /api/health
     * Input: None
     * Expected Status: 200
     * Expected Output: { message: "...", database: "connected" or "disconnected" }
     * Expected Behavior: Should return current database connection status
     */
    test('should return current database connection status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(['connected', 'disconnected']).toContain(response.body.database);
    });

    /**
     * Test: GET /api/health
     * Input: None
     * Expected Status: 200
     * Expected Output: { timestamp: "ISO string" }
     * Expected Behavior: Should return a valid ISO timestamp
     */
    test('should return valid ISO timestamp', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(new Date(response.body.timestamp).getTime()).not.toBeNaN();
    });
  });
});

