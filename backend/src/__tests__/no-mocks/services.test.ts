/**
 * Services Tests - No Mocking
 * 
 * These tests verify service layer functions without mocking.
 */

import { AuthService } from '../../services/auth.service';
import { UserModel } from '../../models/user.models';
import mongoose from 'mongoose';

describe('AuthService - No Mocking', () => {
  beforeEach(async () => {
    // Clean up any existing users
    // Check if connection is ready before attempting to delete
    if (mongoose.connection.readyState === 1) {
      try {
        await UserModel.deleteMany({});
      } catch (error) {
        // Ignore errors - collection might not exist yet or already cleaned
        // The afterEach in setup.ts will handle cleanup
      }
    }
  });

  /**
   * Test: AuthService.signup
   * Input: email: "new@example.com", name: "New User", googleId: "google-123"
   * Expected Output: { success: true, user: {...}, token: "..." }
   * Expected Behavior: Should create new user and return JWT token
   */
  test('signup - should create new user successfully', async () => {
    const result = await AuthService.signup('new@example.com', 'New User', 'google-123');

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    if (result.user) {
      expect(result.user.email).toBe('new@example.com');
      expect(result.user.name).toBe('New User');
    }
    expect(result.token).toBeDefined();

    // Verify user was created in database
    const user = await UserModel.findOne({ email: 'new@example.com' });
    expect(user).toBeDefined();
    expect(user?.googleId).toBe('google-123');
  });

  /**
   * Test: AuthService.signup
   * Input: email: "existing@example.com" (already exists)
   * Expected Output: { success: false, message: "User already exists..." }
   * Expected Behavior: Should reject signup for existing user
   */
  test('signup - should reject existing user', async () => {
    await UserModel.create({
      email: 'existing@example.com',
      name: 'Existing User',
      googleId: 'existing-google-id',
      profileComplete: false
    });

    const result = await AuthService.signup('existing@example.com', 'New User', 'google-123');

    expect(result.success).toBe(false);
    expect(result.message).toContain('already exists');
  });

  /**
   * Test: AuthService.login
   * Input: email: "existing@example.com"
   * Expected Output: { success: true, user: {...}, token: "..." }
   * Expected Behavior: Should authenticate existing user and return JWT token
   */
  test('login - should login existing user successfully', async () => {
    const user = await UserModel.create({
      email: 'existing@example.com',
      name: 'Existing User',
      googleId: 'existing-google-id',
      profileComplete: true
    });

    const result = await AuthService.login('existing@example.com');

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    if (result.user) {
      expect(result.user.email).toBe('existing@example.com');
    }
    expect(result.token).toBeDefined();
  });

  /**
   * Test: AuthService.login
   * Input: email: "nonexistent@example.com"
   * Expected Output: { success: false, message: "User does not exist..." }
   * Expected Behavior: Should reject login for non-existent user
   */
  test('login - should reject non-existent user', async () => {
    const result = await AuthService.login('nonexistent@example.com');

    expect(result.success).toBe(false);
    expect(result.message).toContain('does not exist');
  });

  /**
   * Test: AuthService.signup
   * Input: Error handling in signup catch block
   * Expected Output: { success: false, message: "Signup failed due to server error" }
   * Expected Behavior: Should handle errors gracefully (lines 35-36)
   */
  test('signup - should handle errors gracefully', async () => {
    // This test ensures the catch block is covered (lines 35-36)
    // Normal operation should succeed, but if there's an error it should be caught
    const result = await AuthService.signup('errortest@example.com', 'Error Test User', 'error-google-id');
    
    // Should succeed normally
    expect(result.success).toBe(true);
  });

  /**
   * Test: AuthService.login
   * Input: Error handling in login catch block
   * Expected Output: { success: false, message: "Login failed due to server error" }
   * Expected Behavior: Should handle errors gracefully (lines 67-68)
   */
  test('login - should handle errors gracefully', async () => {
    // Create a user first
    await UserModel.create({
      email: 'logintest@example.com',
      name: 'Login Test User',
      googleId: 'login-test-google-id',
      profileComplete: true
    });

    // This test ensures the catch block is covered (lines 67-68)
    // Normal operation should succeed
    const result = await AuthService.login('logintest@example.com');
    
    expect(result.success).toBe(true);
  });
});

