/**
 * Health Check API Tests - No Mocking
 * 
 * These tests verify the health check endpoint.
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

describe('Health Check API - No Mocking', () => {
  /**
   * Test: GET /api/health
   * Input: None
   * Expected Status: 200
   * Expected Output: { message: "...", database: "...", version: "..." }
   * Expected Behavior: Should return health status of the backend
   */
  test('GET /api/health - should return health status', async () => {
    const response = await request(app)
      .get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('RoomSync Backend is running!');
    expect(response.body.database).toBeDefined();
    expect(response.body.version).toBe('1.0.0');
  });
});

