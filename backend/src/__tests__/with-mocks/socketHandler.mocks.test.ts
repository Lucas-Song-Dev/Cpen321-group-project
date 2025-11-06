/**
 * SocketHandler Tests - With Mocking
 * 
 * These tests verify SocketHandler functionality using mocks to simulate socket.io behavior.
 */

import { SocketHandler } from '../../socket/socketHandler';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { createServer } from 'http';

// Mock dependencies
jest.mock('socket.io');
jest.mock('jsonwebtoken');

describe('SocketHandler - With Mocking', () => {
  let httpServer: HTTPServer;
  let socketHandler: SocketHandler;
  let mockSocket: any;
  let mockIO: any;

  beforeEach(() => {
    // Create HTTP server
    httpServer = createServer();

    // Setup mock socket
    mockSocket = {
      id: 'socket-id-123',
      userId: undefined,
      groupId: undefined,
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      on: jest.fn()
    };

    // Setup mock IO
    mockIO = {
      on: jest.fn((event: string, callback: Function) => {
        if (event === 'connection') {
          // Simulate connection
          setTimeout(() => callback(mockSocket), 0);
        }
      }),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };

    (SocketIOServer as jest.MockedClass<typeof SocketIOServer>).mockImplementation(() => mockIO as any);
    (jwt.verify as jest.Mock).mockReturnValue({});

    socketHandler = new SocketHandler(httpServer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===================================================================
  // SocketHandler initialization
  // ===================================================================
  describe('SocketHandler initialization', () => {
    test('should initialize SocketIOServer with correct options', () => {
      expect(SocketIOServer).toHaveBeenCalledWith(
        httpServer,
        expect.objectContaining({
          cors: {
            origin: '*',
            methods: ['GET', 'POST']
          }
        })
      );
    });

    test('should set up connection handler', () => {
      expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    test('should return IO instance', () => {
      const io = socketHandler.getIO();
      expect(io).toBe(mockIO);
    });
  });

  // ===================================================================
  // Authentication
  // ===================================================================
  describe('Socket authentication', () => {
    beforeEach(() => {
      // Reset socket mock
      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'authenticate') {
          callback('valid-token');
        }
      });
    });

    test('should authenticate socket with valid token containing id', async () => {
      const mockDecoded = { id: 'user-id-123' };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      // Trigger authenticate event
      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Trigger authenticate
      const authenticateHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'authenticate')?.[1];
      if (authenticateHandler) {
        authenticateHandler('valid-token');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', config.JWT_SECRET);
      expect(mockSocket.userId).toBe('user-id-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('authenticated', { success: true, userId: 'user-id-123' });
    });

    test('should authenticate socket with valid token containing userId', async () => {
      const mockDecoded = { userId: 'user-id-456' };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const authenticateHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'authenticate')?.[1];
      if (authenticateHandler) {
        authenticateHandler('valid-token');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSocket.userId).toBe('user-id-456');
      expect(mockSocket.emit).toHaveBeenCalledWith('authenticated', { success: true, userId: 'user-id-456' });
    });

    test('should reject authentication with invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const authenticateHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'authenticate')?.[1];
      if (authenticateHandler) {
        authenticateHandler('invalid-token');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSocket.emit).toHaveBeenCalledWith('authenticated', { success: false, error: 'Invalid token' });
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    test('should reject authentication when token has no userId or id', async () => {
      const mockDecoded = {};
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const authenticateHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'authenticate')?.[1];
      if (authenticateHandler) {
        authenticateHandler('token-without-userid');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSocket.emit).toHaveBeenCalledWith('authenticated', { success: false, error: 'No userId in token' });
    });
  });

  // ===================================================================
  // Join group
  // ===================================================================
  describe('Join group', () => {
    beforeEach(() => {
      mockSocket.userId = 'user-id-123';
    });

    test('should allow authenticated user to join group', async () => {
      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const joinHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'join-group')?.[1];
      if (joinHandler) {
        joinHandler('group-id-456');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSocket.join).toHaveBeenCalledWith('group-id-456');
      expect(mockSocket.groupId).toBe('group-id-456');
      expect(mockSocket.to).toHaveBeenCalledWith('group-id-456');
      expect(mockSocket.emit).toHaveBeenCalledWith('user-joined', expect.objectContaining({
        userId: 'user-id-123',
        groupId: 'group-id-456',
        timestamp: expect.any(String)
      }));
    });

    test('should reject join-group when user is not authenticated', async () => {
      mockSocket.userId = undefined;

      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const joinHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'join-group')?.[1];
      if (joinHandler) {
        joinHandler('group-id-456');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSocket.join).not.toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('error', 'User not authenticated');
    });
  });

  // ===================================================================
  // Leave group
  // ===================================================================
  describe('Leave group', () => {
    beforeEach(() => {
      mockSocket.userId = 'user-id-123';
      mockSocket.groupId = 'group-id-456';
    });

    test('should allow user to leave group', async () => {
      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const leaveHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'leave-group')?.[1];
      if (leaveHandler) {
        leaveHandler('group-id-456');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSocket.leave).toHaveBeenCalledWith('group-id-456');
      expect(mockSocket.groupId).toBeUndefined();
      expect(mockSocket.to).toHaveBeenCalledWith('group-id-456');
      expect(mockSocket.emit).toHaveBeenCalledWith('user-left', expect.objectContaining({
        userId: 'user-id-123',
        groupId: 'group-id-456',
        timestamp: expect.any(String)
      }));
    });

    test('should not leave group when user is not authenticated', async () => {
      mockSocket.userId = undefined;

      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const leaveHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'leave-group')?.[1];
      if (leaveHandler) {
        leaveHandler('group-id-456');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSocket.leave).not.toHaveBeenCalled();
    });
  });

  // ===================================================================
  // Send message
  // ===================================================================
  describe('Send message', () => {
    beforeEach(() => {
      mockSocket.userId = 'user-id-123';
      mockSocket.groupId = 'group-id-456';
    });

    test('should broadcast message to group', async () => {
      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const sendMessageHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'send-message')?.[1];
      if (sendMessageHandler) {
        sendMessageHandler({
          content: 'Hello, world!',
          senderName: 'Test User'
        });
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockIO.to).toHaveBeenCalledWith('group-id-456');
      expect(mockIO.emit).toHaveBeenCalledWith('new-message', expect.objectContaining({
        content: 'Hello, world!',
        senderId: 'user-id-123',
        senderName: 'Test User',
        groupId: 'group-id-456',
        type: 'text',
        timestamp: expect.any(Number)
      }));
    });

    test('should reject send-message when user is not authenticated', async () => {
      mockSocket.userId = undefined;

      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const sendMessageHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'send-message')?.[1];
      if (sendMessageHandler) {
        sendMessageHandler({ content: 'Hello' });
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSocket.emit).toHaveBeenCalledWith('error', 'User not in a group');
    });

    test('should reject send-message when user is not in a group', async () => {
      mockSocket.groupId = undefined;

      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const sendMessageHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'send-message')?.[1];
      if (sendMessageHandler) {
        sendMessageHandler({ content: 'Hello' });
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSocket.emit).toHaveBeenCalledWith('error', 'User not in a group');
    });

    test('should use provided message id if given', async () => {
      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const sendMessageHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'send-message')?.[1];
      if (sendMessageHandler) {
        sendMessageHandler({
          id: 'custom-message-id',
          content: 'Hello'
        });
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockIO.emit).toHaveBeenCalledWith('new-message', expect.objectContaining({
        id: 'custom-message-id'
      }));
    });
  });

  // ===================================================================
  // Create poll
  // ===================================================================
  describe('Create poll', () => {
    beforeEach(() => {
      mockSocket.userId = 'user-id-123';
      mockSocket.groupId = 'group-id-456';
    });

    test('should create and broadcast poll', async () => {
      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const createPollHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'create-poll')?.[1];
      if (createPollHandler) {
        createPollHandler({
          question: 'What should we do?',
          options: 'Option1,Option2,Option3',
          senderName: 'Test User',
          durationDays: 5
        });
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockIO.to).toHaveBeenCalledWith('group-id-456');
      expect(mockIO.emit).toHaveBeenCalledWith('new-message', expect.objectContaining({
        question: 'What should we do?',
        options: ['Option1', 'Option2', 'Option3'],
        senderId: 'user-id-123',
        senderName: 'Test User',
        groupId: 'group-id-456',
        type: 'poll',
        durationDays: 5,
        votes: {},
        timestamp: expect.any(Number)
      }));
    });

    test('should use default durationDays if not provided', async () => {
      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const createPollHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'create-poll')?.[1];
      if (createPollHandler) {
        createPollHandler({
          question: 'Test?',
          options: 'Yes,No'
        });
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockIO.emit).toHaveBeenCalledWith('new-message', expect.objectContaining({
        durationDays: 7
      }));
    });

    test('should reject create-poll when user is not in a group', async () => {
      mockSocket.groupId = undefined;

      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const createPollHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'create-poll')?.[1];
      if (createPollHandler) {
        createPollHandler({
          question: 'Test?',
          options: 'Yes,No'
        });
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSocket.emit).toHaveBeenCalledWith('error', 'User not in a group');
    });
  });

  // ===================================================================
  // Vote on poll
  // ===================================================================
  describe('Vote on poll', () => {
    beforeEach(() => {
      mockSocket.userId = 'user-id-123';
      mockSocket.groupId = 'group-id-456';
    });

    test('should broadcast poll vote', async () => {
      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const votePollHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'vote-poll')?.[1];
      if (votePollHandler) {
        votePollHandler({
          pollId: 'poll-id-789',
          option: 'Option1'
        });
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockIO.to).toHaveBeenCalledWith('group-id-456');
      expect(mockIO.emit).toHaveBeenCalledWith('poll-update', expect.objectContaining({
        pollId: 'poll-id-789',
        option: 'Option1',
        userId: 'user-id-123',
        timestamp: expect.any(Number)
      }));
    });

    test('should reject vote when user is not authenticated', async () => {
      mockSocket.userId = undefined;

      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const votePollHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'vote-poll')?.[1];
      if (votePollHandler) {
        votePollHandler({
          pollId: 'poll-id-789',
          option: 'Option1'
        });
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSocket.emit).toHaveBeenCalledWith('error', 'User not authenticated');
    });

    test('should handle vote when groupId is undefined', async () => {
      mockSocket.groupId = undefined;

      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const votePollHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'vote-poll')?.[1];
      if (votePollHandler) {
        votePollHandler({
          pollId: 'poll-id-789',
          option: 'Option1'
        });
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockIO.to).toHaveBeenCalledWith('');
    });
  });

  // ===================================================================
  // Disconnect
  // ===================================================================
  describe('Disconnect', () => {
    beforeEach(() => {
      mockSocket.userId = 'user-id-123';
      mockSocket.groupId = 'group-id-456';
    });

    test('should clean up user and group on disconnect', async () => {
      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const disconnectHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'disconnect')?.[1];
      if (disconnectHandler) {
        disconnectHandler();
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSocket.to).toHaveBeenCalledWith('group-id-456');
      expect(mockSocket.emit).toHaveBeenCalledWith('user-left', expect.objectContaining({
        userId: 'user-id-123',
        groupId: 'group-id-456',
        timestamp: expect.any(String)
      }));
    });

    test('should handle disconnect when user is not authenticated', async () => {
      mockSocket.userId = undefined;

      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const disconnectHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'disconnect')?.[1];
      if (disconnectHandler) {
        disconnectHandler();
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not emit user-left if not authenticated
      expect(mockSocket.emit).not.toHaveBeenCalledWith('user-left', expect.any(Object));
    });

    test('should delete group from groupMembers when last member leaves in leave-group', async () => {
      mockSocket.userId = 'user-id-123';
      mockSocket.groupId = 'group-id-456';

      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      // Join group first
      const joinHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'join-group')?.[1];
      if (joinHandler) {
        joinHandler('group-id-456');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      // Leave group - should delete groupMembers entry when size becomes 0 (lines 83-85)
      const leaveHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'leave-group')?.[1];
      if (leaveHandler) {
        leaveHandler('group-id-456');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSocket.leave).toHaveBeenCalledWith('group-id-456');
    });

    test('should delete group from groupMembers when last member disconnects', async () => {
      mockSocket.userId = 'user-id-123';
      mockSocket.groupId = 'group-id-456';

      const connectionCallback = mockIO.on.mock.calls.find((call: any[]) => call[0] === 'connection')?.[1];
      if (connectionCallback) {
        connectionCallback(mockSocket);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      // Join group first
      const joinHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'join-group')?.[1];
      if (joinHandler) {
        joinHandler('group-id-456');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      // Disconnect - should delete groupMembers entry when size becomes 0 (lines 169-171)
      const disconnectHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'disconnect')?.[1];
      if (disconnectHandler) {
        disconnectHandler();
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSocket.to).toHaveBeenCalledWith('group-id-456');
    });
  });
});

