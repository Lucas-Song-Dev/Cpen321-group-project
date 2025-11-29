/**
 * User API Tests - With Mocking (controller-level)
 *
 * These tests focus on exercising error-handling code paths by mocking
 * database interactions directly on the controllers instead of booting
 * up an Express server. This keeps memory usage low while still covering
 * the same branches the previous supertest-based suite verified.
 */

import mongoose from 'mongoose';
import { UserController } from '../../controller/user.controller';
import { UserReporter } from '../../controller/report.controller';
import { UserModel } from '../../models/user.models';
import Group from '../../models/group.models';
import Message from '../../models/chat.models';

// Ensure any global setup that spins up a Mongo memory server is skipped
process.env.SKIP_MONGO_MEMORY_SERVER = 'true';

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('User API Tests - With Mocking', () => {
  let testUserId: mongoose.Types.ObjectId;
  let testUser: any;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();

    testUserId = new mongoose.Types.ObjectId();
    testUser = {
      _id: testUserId,
      email: 'testuser@example.com',
      name: 'Test User',
      googleId: 'test-google-id',
      profileComplete: false,
      groupName: null,
      dob: undefined,
      gender: undefined,
      livingPreferences: undefined,
      save: jest.fn().mockResolvedValue(true)
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  // Just in case any shared setup opened a connection
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // -------------------------------------------------------------------
  // UserController.setProfile
  // -------------------------------------------------------------------
  describe('UserController.setProfile', () => {
    const baseReq = () => ({
      body: {
        email: 'testuser@example.com',
        dob: '2000-01-01',
        gender: 'Male',
        name: 'Test User'
      }
    });

    test('should handle database error when finding user', async () => {
      const req = baseReq() as any;
      const res = createMockRes();
      jest
        .spyOn(UserModel, 'findOne')
        .mockRejectedValue(new Error('Database connection failed'));

      await UserController.setProfile(req, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });
    });

    test('should handle database error when saving user profile', async () => {
      const req = baseReq() as any;
      const res = createMockRes();
      const mockedUser = {
        ...testUser,
        save: jest.fn().mockRejectedValue(new Error('Database write failed'))
      };

      jest.spyOn(UserModel, 'findOne').mockResolvedValue(mockedUser as any);

      await UserController.setProfile(req, res as any);

      expect(mockedUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });
    });
  });

  // -------------------------------------------------------------------
  // UserController.updateProfile
  // -------------------------------------------------------------------
  describe('UserController.updateProfile', () => {
    const baseReq = (overrides = {}) => ({
      body: {
        email: 'testuser@example.com',
        bio: 'Test bio',
        livingPreferences: { schedule: 'Morning' },
        ...overrides
      }
    });

    test('should handle database error when finding user', async () => {
      const req = baseReq() as any;
      const res = createMockRes();
      jest
        .spyOn(UserModel, 'findOne')
        .mockRejectedValue(new Error('Database connection failed'));

      await UserController.updateProfile(req, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });
    });

    test('should handle database error when saving optional profile', async () => {
      const req = baseReq() as any;
      const res = createMockRes();
      const mockedUser = {
        ...testUser,
        profileComplete: true,
        save: jest.fn().mockRejectedValue(new Error('Database write failed'))
      };

      jest.spyOn(UserModel, 'findOne').mockResolvedValue(mockedUser as any);

      await UserController.updateProfile(req, res as any);

      expect(mockedUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });
    });

    test('should initialize livingPreferences when it is null', async () => {
      const req = baseReq({ livingPreferences: { schedule: 'Night' } }) as any;
      const res = createMockRes();
      const mockedUser = {
        ...testUser,
        profileComplete: true,
        livingPreferences: null,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(UserModel, 'findOne').mockResolvedValue(mockedUser as any);

      await UserController.updateProfile(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockedUser.livingPreferences).toEqual({ schedule: 'Night' });
      expect(mockedUser.save).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------
  // UserController.deleteUser
  // -------------------------------------------------------------------
  describe('UserController.deleteUser', () => {
    const deleteReq = (overrides = {}) =>
      ({
        user: { _id: testUserId },
        ...overrides
      } as any);

    const successfulDelete = () =>
      jest
        .spyOn(UserModel, 'findByIdAndDelete')
        .mockResolvedValue({ _id: testUserId } as any);

    test('should return 401 when userId is missing', async () => {
      const res = createMockRes();

      await UserController.deleteUser({ user: {} } as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized'
      });
    });

    test('should handle database error when finding group', async () => {
      const res = createMockRes();
      jest
        .spyOn(Group, 'findOne')
        .mockRejectedValue(new Error('Database connection failed'));

      await UserController.deleteUser(deleteReq(), res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });
    });

    test('should handle database error when updating new owner', async () => {
      const res = createMockRes();
      const otherUserId = new mongoose.Types.ObjectId();
      const mockGroup: any = {
        owner: testUserId,
        members: [
          { userId: otherUserId, joinDate: new Date(Date.now() - 1000 * 60) },
          { userId: testUserId, joinDate: new Date() }
        ],
        deleteOne: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined)
      };

      jest.spyOn(Group, 'findOne').mockResolvedValue(mockGroup);
      jest
        .spyOn(UserModel, 'findByIdAndUpdate')
        .mockRejectedValue(new Error('Update failed'));
      successfulDelete();

      await UserController.deleteUser(deleteReq(), res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });
    });

    test('should handle database error when saving group', async () => {
      const res = createMockRes();
      const ownerId = new mongoose.Types.ObjectId();
      const mockGroup: any = {
        owner: ownerId,
        members: [
          { userId: testUserId, joinDate: new Date() },
          { userId: ownerId, joinDate: new Date(Date.now() - 1000 * 60) }
        ],
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      jest.spyOn(Group, 'findOne').mockResolvedValue(mockGroup);
      jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(null);
      successfulDelete();

      await UserController.deleteUser(deleteReq(), res as any);

      expect(mockGroup.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });
    });

    test('should handle database error when deleting user', async () => {
      const res = createMockRes();
      jest.spyOn(Group, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(UserModel, 'findByIdAndDelete')
        .mockRejectedValue(new Error('Delete failed'));

      await UserController.deleteUser(deleteReq(), res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });
    });

    test('should return 404 when user not found after deletion', async () => {
      const res = createMockRes();
      jest.spyOn(Group, 'findOne').mockResolvedValue(null);
      jest.spyOn(UserModel, 'findByIdAndDelete').mockResolvedValue(null);

      await UserController.deleteUser(deleteReq(), res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  // -------------------------------------------------------------------
  // UserReporter.report
  // -------------------------------------------------------------------
  describe('UserReporter.report', () => {
    const reportedUserId = () => new mongoose.Types.ObjectId();
    const reporterId = () => new mongoose.Types.ObjectId();
    const groupId = () => new mongoose.Types.ObjectId();

    const baseReq = (overrides = {}) =>
      ({
        body: {
          reportedUserId: reportedUserId().toString(),
          reporterId: reporterId().toString(),
          groupId: groupId().toString(),
          reason: 'Test reason',
          ...overrides
        }
      } as any);

    const defaultMessageQuery = (messages: any[]) => ({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(messages)
    });

    test('should handle database error when finding reported user', async () => {
      const repUserId = reportedUserId();
      const reptrId = reporterId();
      const req = baseReq({
        reportedUserId: repUserId.toString(),
        reporterId: reptrId.toString()
      });
      const res = createMockRes();

      jest.spyOn(UserModel, 'findById').mockImplementation((id: string) => {
        if (id === repUserId.toString()) {
          return Promise.reject(new Error('Database query failed')) as any;
        }
        return Promise.resolve({ _id: reptrId }) as any;
      });

      await UserReporter.report(req, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    test('should handle database error when finding messages', async () => {
      const repUserId = reportedUserId();
      const reptrId = reporterId();
      const req = baseReq({
        reportedUserId: repUserId.toString(),
        reporterId: reptrId.toString()
      });
      const res = createMockRes();

      jest
        .spyOn(UserModel, 'findById')
        .mockImplementation((id: string) => {
          if (id === repUserId.toString()) {
            return Promise.resolve({
              _id: repUserId,
              isOffensive: false,
              save: jest.fn()
            }) as any;
          }
          return Promise.resolve({ _id: reptrId }) as any;
        });

      const failingQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Query failed'))
      };
      jest.spyOn(Message, 'find').mockReturnValue(failingQuery as any);

      await UserReporter.report(req, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    test('should return 400 when no messages are found', async () => {
      const repUserId = reportedUserId();
      const reptrId = reporterId();
      const req = baseReq({
        reportedUserId: repUserId.toString(),
        reporterId: reptrId.toString()
      });
      const res = createMockRes();

      jest
        .spyOn(UserModel, 'findById')
        .mockResolvedValueOnce({
          _id: repUserId,
          isOffensive: false
        } as any)
        .mockResolvedValueOnce({ _id: reptrId } as any);

      jest
        .spyOn(Message, 'find')
        .mockReturnValue(defaultMessageQuery([]) as any);

      await UserReporter.report(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    test('should process report successfully when messages exist', async () => {
      const repUserId = reportedUserId();
      const reptrId = reporterId();
      const req = baseReq({
        reportedUserId: repUserId.toString(),
        reporterId: reptrId.toString()
      });
      const res = createMockRes();
      const reportedUser = {
        _id: repUserId,
        isOffensive: false,
        save: jest.fn().mockResolvedValue(true)
      };

      jest
        .spyOn(UserModel, 'findById')
        .mockResolvedValueOnce(reportedUser as any)
        .mockResolvedValueOnce({ _id: reptrId } as any);

      jest
        .spyOn(Message, 'find')
        .mockReturnValue(
          defaultMessageQuery([{ content: 'hello world' }]) as any
        );

      await UserReporter.report(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ isOffensive: false })
        })
      );
      // analysis.isOffensive assumed false → save not called
      expect(reportedUser.save).not.toHaveBeenCalled();
    });
  });
});
