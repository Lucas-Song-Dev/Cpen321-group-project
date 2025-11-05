/**
 * AuthService Tests - With Mocking
 * 
 * These tests verify authService functions using mocks to simulate external component failures.
 */

import { verifyGoogleToken, generateTokens, findOrCreateUser, verifyJWT, getUserFromToken, GoogleTokenPayload } from '../../services/authService';
import { User } from '../../models';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { AppError } from '../../middleware/errorHandler';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('google-auth-library', () => {
  const mockVerifyIdToken = jest.fn();
  const mockGetPayload = jest.fn();
  
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken
    })),
    __mockVerifyIdToken: mockVerifyIdToken,
    __mockGetPayload: mockGetPayload
  };
});

jest.mock('jsonwebtoken');

describe('AuthService - With Mocking', () => {
  let createdUsers: any[] = [];

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Ensure mongoose connection is ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });

  afterEach(async () => {
    // Clean up any test users created during tests
    try {
      for (const user of createdUsers) {
        if (user && user._id) {
          await User.findByIdAndDelete(user._id).catch(() => {});
        }
      }
      createdUsers = [];
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // ===================================================================
  // verifyGoogleToken - with mocking
  // ===================================================================
  describe('verifyGoogleToken - with mocking', () => {
    // Get the mocked functions
    const getMockVerifyIdToken = () => {
      const googleAuthLib = require('google-auth-library');
      return googleAuthLib.__mockVerifyIdToken;
    };

    beforeEach(() => {
      // Reset mocks before each test
      const mockVerifyIdToken = getMockVerifyIdToken();
      mockVerifyIdToken.mockReset();
    });

    test('should successfully verify a valid Google token', async () => {
      const mockPayload = {
        sub: 'google-user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/pic.jpg',
        email_verified: true
      };

      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockPayload)
      };

      const mockVerifyIdToken = getMockVerifyIdToken();
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      const result = await verifyGoogleToken('valid-token');

      expect(result).toEqual({
        sub: 'google-user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/pic.jpg',
        email_verified: true
      });
      expect(mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: 'valid-token',
        audience: '445076519627-97j67dhhi8pqvkqsts8luanr6pttltbv.apps.googleusercontent.com'
      });
    });

    test('should throw AppError when token verification fails', async () => {
      const mockVerifyIdToken = getMockVerifyIdToken();
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(verifyGoogleToken('invalid-token')).rejects.toThrow(AppError);
      await expect(verifyGoogleToken('invalid-token')).rejects.toThrow('Invalid Google token');
    });

    test('should throw AppError when payload is null', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(null)
      };

      const mockVerifyIdToken = getMockVerifyIdToken();
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      await expect(verifyGoogleToken('token-with-null-payload')).rejects.toThrow(AppError);
    });

    test('should handle missing optional fields in payload', async () => {
      const mockPayload = {
        sub: 'google-user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        email_verified: false
      };

      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockPayload)
      };

      const mockVerifyIdToken = getMockVerifyIdToken();
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      const result = await verifyGoogleToken('valid-token');

      expect(result.picture).toBeUndefined();
      expect(result.email_verified).toBe(false);
    });
  });

  // ===================================================================
  // generateTokens - with mocking
  // ===================================================================
  describe('generateTokens - with mocking', () => {
    test('should generate access token successfully', () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockToken = 'generated-access-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = generateTokens(mockUser as any);

      expect(result.accessToken).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUser._id.toString(),
          email: 'test@example.com',
          name: 'Test User'
        },
        expect.any(String),
        { expiresIn: '1h' }
      );
    });

    test('should use fallback secret when JWT_SECRET is not set', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        name: 'Test User'
      };

      generateTokens(mockUser as any);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'fallback-secret-key',
        { expiresIn: '1h' }
      );

      // Restore original
      if (originalSecret) {
        process.env.JWT_SECRET = originalSecret;
      }
    });
  });

  // ===================================================================
  // findOrCreateUser - with mocking
  // ===================================================================
  describe('findOrCreateUser - with mocking', () => {
    test('should return existing user by Google ID', async () => {
      const existingUser = await User.create({
        googleId: 'google-user-id-123',
        email: 'existing@example.com',
        name: 'Existing User',
        profileComplete: true
      });
      createdUsers.push(existingUser);

      const payload: GoogleTokenPayload = {
        sub: 'google-user-id-123',
        email: 'existing@example.com',
        name: 'Existing User',
        given_name: 'Existing',
        family_name: 'User',
        email_verified: true
      };

      const result = await findOrCreateUser(payload);

      expect(result._id.toString()).toBe(existingUser._id.toString());
      expect(result.googleId).toBe('google-user-id-123');
    });

    test('should update email if it changed for existing user', async () => {
      const existingUser = await User.create({
        googleId: 'google-user-id-123',
        email: 'old@example.com',
        name: 'Existing User',
        profileComplete: true
      });
      createdUsers.push(existingUser);

      const payload: GoogleTokenPayload = {
        sub: 'google-user-id-123',
        email: 'new@example.com',
        name: 'Existing User',
        given_name: 'Existing',
        family_name: 'User',
        email_verified: true
      };

      const result = await findOrCreateUser(payload);

      expect(result.email).toBe('new@example.com');
      const updatedUser = await User.findById(existingUser._id);
      expect(updatedUser?.email).toBe('new@example.com');
    });

    test('should link Google account to existing user by email', async () => {
      const existingUser = await User.create({
        email: 'existing@example.com',
        name: 'Existing User',
        profileComplete: true
      });
      createdUsers.push(existingUser);

      const payload: GoogleTokenPayload = {
        sub: 'new-google-id-456',
        email: 'existing@example.com',
        name: 'Existing User',
        given_name: 'Existing',
        family_name: 'User',
        email_verified: true
      };

      const result = await findOrCreateUser(payload);

      expect(result._id.toString()).toBe(existingUser._id.toString());
      expect(result.googleId).toBe('new-google-id-456');
      const updatedUser = await User.findById(existingUser._id);
      expect(updatedUser?.googleId).toBe('new-google-id-456');
    });

    test('should create new user when no existing user found', async () => {
      const payload: GoogleTokenPayload = {
        sub: 'new-google-id-789',
        email: 'newuser@example.com',
        name: 'New User',
        given_name: 'New',
        family_name: 'User',
        email_verified: true
      };

      const result = await findOrCreateUser(payload);
      createdUsers.push(result);

      expect(result.googleId).toBe('new-google-id-789');
      expect(result.email).toBe('newuser@example.com');
      expect(result.name).toBe('New User');
      expect(result.profileComplete).toBe(false);
      expect(result.dob).toBeDefined();
      expect(result.gender).toBe('Prefer-not-to-say');
    });

    test('should handle user with only given_name', async () => {
      const payload: GoogleTokenPayload = {
        sub: 'google-id-single-name',
        email: 'single@example.com',
        name: 'Single',
        given_name: 'Single',
        family_name: '',
        email_verified: true
      };

      const result = await findOrCreateUser(payload);
      createdUsers.push(result);

      expect(result.name).toBe('Single');
    });

    test('should throw AppError when database operation fails', async () => {
      const findOneSpy = jest.spyOn(User, 'findOne').mockRejectedValue(new Error('Database error'));

      const payload: GoogleTokenPayload = {
        sub: 'google-id-error',
        email: 'error@example.com',
        name: 'Error User',
        given_name: 'Error',
        family_name: 'User',
        email_verified: true
      };

      await expect(findOrCreateUser(payload)).rejects.toThrow(AppError);
      await expect(findOrCreateUser(payload)).rejects.toThrow('Failed to create or find user');

      findOneSpy.mockRestore();
    });
  });

  // ===================================================================
  // verifyJWT - with mocking
  // ===================================================================
  describe('verifyJWT - with mocking', () => {
    test('should successfully verify a valid JWT token', () => {
      const mockDecoded = {
        userId: 'user-id-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const result = verifyJWT('valid-token');

      expect(result).toEqual(mockDecoded);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
    });

    test('should throw AppError when token is invalid', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => verifyJWT('invalid-token')).toThrow(AppError);
      expect(() => verifyJWT('invalid-token')).toThrow('Invalid or expired token');
    });

    test('should throw AppError when token is expired', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      expect(() => verifyJWT('expired-token')).toThrow(AppError);
    });
  });

  // ===================================================================
  // getUserFromToken - with mocking
  // ===================================================================
  describe('getUserFromToken - with mocking', () => {
    test('should return user when token is valid and user exists', async () => {
      const testUser = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        googleId: 'google-123',
        profileComplete: true
      });
      createdUsers.push(testUser);

      const mockDecoded = {
        userId: testUser._id.toString(),
        email: 'test@example.com',
        name: 'Test User'
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const result = await getUserFromToken('valid-token');

      expect(result).not.toBeNull();
      expect(result?._id.toString()).toBe(testUser._id.toString());
    });

    test('should return null when token is invalid', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await getUserFromToken('invalid-token');

      expect(result).toBeNull();
    });

    test('should return null when user does not exist', async () => {
      const mockDecoded = {
        userId: new mongoose.Types.ObjectId().toString(),
        email: 'nonexistent@example.com',
        name: 'Nonexistent User'
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const result = await getUserFromToken('valid-token-for-nonexistent-user');

      expect(result).toBeNull();
    });

    test('should return null when token is expired', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = await getUserFromToken('expired-token');

      expect(result).toBeNull();
    });
  });
});

