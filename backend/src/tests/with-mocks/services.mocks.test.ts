/**
 * Services Tests - With Mocking
 * 
 * These tests verify service layer functions using mocks to simulate external component failures.
 */

import { AuthService } from '../../services/auth';
import { UserModel } from '../../models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

describe('AuthService - With Mocking', () => {
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Ensure mongoose connection is ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });

  // ===================================================================
  // AuthService.signup - with mocking
  // ===================================================================
  describe('AuthService.signup - with mocking', () => {
    /**
     * Test: AuthService.signup
     * Input: Valid email, name, googleId, but UserModel.findOne fails
     * Expected Output: { success: false, message: "Signup failed due to server error" }
     * Expected Behavior: Should handle database errors when checking for existing user
     * Mock Behavior: UserModel.findOne throws an error
     */
    test('should handle database error when checking for existing user', async () => {
      // Mock UserModel.findOne to throw an error
      const originalFindOne = UserModel.findOne;
      UserModel.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const result = await AuthService.signup('new@example.com', 'New User', 'google-123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Signup failed due to server error');

      // Restore original
      UserModel.findOne = originalFindOne;
    });

    /**
     * Test: AuthService.signup
     * Input: Valid email, name, googleId, but UserModel.save fails
     * Expected Output: { success: false, message: "Signup failed due to server error" }
     * Expected Behavior: Should handle database errors when saving new user
     * Mock Behavior: user.save throws an error
     */
    test('should handle database error when saving new user', async () => {
      // Mock UserModel.findOne to return null (user doesn't exist)
      const originalFindOne = UserModel.findOne;
      UserModel.findOne = jest.fn().mockResolvedValue(null);
      
      // Mock the save method on UserModel prototype to fail
      // This will catch any new UserModel() instances created in AuthService.signup
      const saveSpy = jest.spyOn(UserModel.prototype, 'save');
      saveSpy.mockRejectedValueOnce(new Error('Database write failed'));
      
      const result = await AuthService.signup('new@example.com', 'New User', 'google-123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Signup failed due to server error');

      // Restore originals
      UserModel.findOne = originalFindOne;
      saveSpy.mockRestore();
    });

    /**
     * Test: AuthService.signup
     * Input: Valid email, name, googleId, but jwt.sign fails
     * Expected Output: { success: false, message: "Signup failed due to server error" }
     * Expected Behavior: Should handle JWT signing errors
     * Mock Behavior: jwt.sign throws an error
     */
    test('should handle jwt.sign throwing an error', async () => {
      // Mock jwt.sign to throw an error
      const originalSign = jwt.sign;
      jwt.sign = jest.fn().mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      const result = await AuthService.signup('new@example.com', 'New User', 'google-123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Signup failed due to server error');

      // Restore original
      jwt.sign = originalSign;
    });
  });

  // ===================================================================
  // AuthService.login - with mocking
  // ===================================================================
  describe('AuthService.login - with mocking', () => {
    /**
     * Test: AuthService.login
     * Input: Valid email, but UserModel.findOne fails
     * Expected Output: { success: false, message: "Login failed due to server error" }
     * Expected Behavior: Should handle database errors when finding user
     * Mock Behavior: UserModel.findOne throws an error
     */
    test('should handle database error when finding user', async () => {
      // Mock UserModel.findOne to throw an error
      const originalFindOne = UserModel.findOne;
      UserModel.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const result = await AuthService.login('existing@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Login failed due to server error');

      // Restore original
      UserModel.findOne = originalFindOne;
    });

    /**
     * Test: AuthService.login
     * Input: Valid email, but jwt.sign fails
     * Expected Output: { success: false, message: "Login failed due to server error" }
     * Expected Behavior: Should handle JWT signing errors
     * Mock Behavior: jwt.sign throws an error
     */
    test('should handle jwt.sign throwing an error', async () => {
      // Create a test user first
      const testUser = await UserModel.create({
        email: 'existing@example.com',
        name: 'Existing User',
        googleId: 'existing-google-id',
        profileComplete: true
      });

      // Mock jwt.sign to throw an error
      const originalSign = jwt.sign;
      jwt.sign = jest.fn().mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      const result = await AuthService.login('existing@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Login failed due to server error');

      // Restore original
      jwt.sign = originalSign;
    });
  });
});
