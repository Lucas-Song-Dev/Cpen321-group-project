/**
 * Model Tests - No Mocking
 * 
 * These tests verify model methods, virtual properties, and static methods
 * without mocking external dependencies.
 */

import mongoose from 'mongoose';
import Group from '../../models/group.models';
import Task from '../../models/Task';
import Message from '../../models/Message';
import Rating from '../../models/Rating';
import { UserModel } from '../../models/User';

describe('Model Tests - No Mocking', () => {
  beforeEach(async () => {
    // Ensure mongoose connection is ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });

  describe('Group Model', () => {
    let testUser: any;
    let testGroup: any;

    beforeEach(async () => {
      testUser = await UserModel.create({
        email: 'modeluser@example.com',
        name: 'Model Test User',
        googleId: 'model-google-id',
        profileComplete: true
      });

      testGroup = await Group.create({
        name: 'Model Test Group',
        owner: testUser._id,
        members: [{ userId: testUser._id, joinDate: new Date() }]
      });
    });

    /**
     * Test: Group virtual - memberCount
     * Expected Behavior: Should return the number of members
     */
    test('memberCount virtual should return correct count', () => {
      expect(testGroup.memberCount).toBe(1);
      
      // Add more members
      testGroup.members.push({
        userId: testUser._id,
        joinDate: new Date()
      });
      expect(testGroup.memberCount).toBe(2);
    });

    /**
     * Test: Group virtual - memberCount with empty members
     * Expected Behavior: Should return 0 when members array is empty
     */
    test('memberCount virtual should return 0 for empty members', () => {
      const emptyGroup = new Group({
        name: 'Empty Group',
        owner: testUser._id,
        members: []
      });
      expect(emptyGroup.memberCount).toBe(0);
    });

    /**
     * Test: Group virtual - isFull
     * Expected Behavior: Should return false when less than 8 members, true when 8 or more
     */
    test('isFull virtual should return correct status', () => {
      expect(testGroup.isFull).toBe(false);
      
      // Add members up to 8
      for (let i = 0; i < 7; i++) {
        testGroup.members.push({
          userId: testUser._id,
          joinDate: new Date()
        });
      }
      expect(testGroup.isFull).toBe(true);
    });

    /**
     * Test: Group virtual - isFull with empty members
     * Expected Behavior: Should return false when members array is empty
     */
    test('isFull virtual should return false for empty members', () => {
      const emptyGroup = new Group({
        name: 'Empty Group',
        owner: testUser._id,
        members: []
      });
      expect(emptyGroup.isFull).toBe(false);
    });

    /**
     * Test: Group pre-save hook - max members validation
     * Expected Behavior: Should reject groups with more than 8 members
     */
    test('pre-save hook should reject groups with more than 8 members', async () => {
      // Add 8 members
      for (let i = 0; i < 8; i++) {
        testGroup.members.push({
          userId: testUser._id,
          joinDate: new Date()
        });
      }

      await expect(testGroup.save()).rejects.toThrow('Group cannot have more than 8 members');
    });

    /**
     * Test: Group pre-save hook - group code generation
     * Expected Behavior: Should generate unique 4-character group code
     */
    test('pre-save hook should generate unique group code', async () => {
      const newGroup = new Group({
        name: 'New Test Group',
        owner: testUser._id,
        members: [{ userId: testUser._id, joinDate: new Date() }]
      });

      await newGroup.save();
      
      expect(newGroup.groupCode).toBeDefined();
      expect(newGroup.groupCode).toHaveLength(4);
      expect(newGroup.groupCode).toMatch(/^[A-Z0-9]{4}$/);
    });
  });

  describe('Task Model', () => {
    let testUser: any;
    let testGroup: any;
    let testTask: any;

    beforeEach(async () => {
      testUser = await UserModel.create({
        email: 'taskuser@example.com',
        name: 'Task Test User',
        googleId: 'task-google-id',
        profileComplete: true
      });

      testGroup = await Group.create({
        name: 'Task Test Group',
        owner: testUser._id,
        members: [{ userId: testUser._id, joinDate: new Date() }]
      });

      testTask = await Task.create({
        name: 'Test Task',
        groupId: testGroup._id,
        createdBy: testUser._id,
        difficulty: 3,
        recurrence: 'weekly',
        requiredPeople: 1
      });
    });

    /**
     * Test: Task virtual - completionRate
     * Expected Behavior: Should calculate completion rate correctly
     */
    test('completionRate virtual should calculate correctly', () => {
      // No assignments - should return 0
      expect(testTask.completionRate).toBe(0);

      // Add assignments
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      testTask.assignments.push({
        userId: testUser._id,
        weekStart: startOfWeek,
        status: 'completed'
      });

      testTask.assignments.push({
        userId: testUser._id,
        weekStart: startOfWeek,
        status: 'incomplete'
      });

      expect(testTask.completionRate).toBe(50);
    });

    /**
     * Test: Task virtual - currentWeekAssignment
     * Expected Behavior: Should return assignment for current week
     */
    test('currentWeekAssignment virtual should return current week assignment', () => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const currentAssignment = {
        userId: testUser._id,
        weekStart: startOfWeek,
        status: 'incomplete'
      };

      testTask.assignments.push(currentAssignment);
      
      const found = testTask.currentWeekAssignment;
      expect(found).toBeDefined();
      expect(found?.userId.toString()).toBe(testUser._id.toString());
    });

    /**
     * Test: Task method - assignToWeek
     * Expected Behavior: Should assign task to users for a specific week
     */
    test('assignToWeek method should assign users for week', async () => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const otherUser = await UserModel.create({
        email: 'otheruser@example.com',
        name: 'Other User',
        googleId: 'other-google-id',
        profileComplete: true
      });

      testTask.assignToWeek(startOfWeek, [testUser._id.toString(), otherUser._id.toString()]);
      
      expect(testTask.assignments).toHaveLength(2);
      expect(testTask.assignments[0].userId.toString()).toBe(testUser._id.toString());
      expect(testTask.assignments[1].userId.toString()).toBe(otherUser._id.toString());
    });

    /**
     * Test: Task method - assignToWeek should replace existing assignments
     * Expected Behavior: Should remove existing assignments for the week before adding new ones
     */
    test('assignToWeek should replace existing assignments for same week', async () => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Add initial assignment
      testTask.assignments.push({
        userId: testUser._id,
        weekStart: startOfWeek,
        status: 'incomplete'
      });

      const otherUser = await UserModel.create({
        email: 'replaceuser@example.com',
        name: 'Replace User',
        googleId: 'replace-google-id',
        profileComplete: true
      });

      // Assign to different user for same week
      testTask.assignToWeek(startOfWeek, [otherUser._id.toString()]);
      
      expect(testTask.assignments).toHaveLength(1);
      expect(testTask.assignments[0].userId.toString()).toBe(otherUser._id.toString());
    });

    /**
     * Test: Task deadline validator - non-one-time task
     * Expected Behavior: Should return true for non-one-time tasks without deadline
     */
    test('deadline validator should return true for non-one-time tasks', async () => {
      const task = new Task({
        name: 'Weekly Task',
        groupId: testGroup._id,
        createdBy: testUser._id,
        difficulty: 3,
        recurrence: 'weekly',
        requiredPeople: 1
        // No deadline - should be valid for weekly tasks
      });

      const validationError = task.validateSync();
      expect(validationError).toBeUndefined();
    });

    /**
     * Test: Task deadline validator - should return true when deadline is provided for non-one-time tasks (line 62)
     * Expected Behavior: Should return true when recurrence is not 'one-time' even if deadline is provided (line 62)
     */
    test('deadline validator should return true for non-one-time tasks with deadline (line 62)', async () => {
      // Create a task with recurrence 'weekly' but with a deadline
      // This tests line 62: return true (when recurrence is not 'one-time')
      const task = new Task({
        name: 'Weekly Task With Deadline',
        groupId: testGroup._id,
        createdBy: testUser._id,
        difficulty: 3,
        recurrence: 'weekly',  // Not 'one-time'
        requiredPeople: 1,
        deadline: new Date('2025-12-31')  // Deadline provided but not required for weekly tasks
      });

      // Should validate successfully - line 62 returns true
      const validationError = task.validateSync();
      expect(validationError).toBeUndefined();
    });
  });

  describe('Message Model', () => {
    let testUser: any;
    let testGroup: any;
    let testMessage: any;

    beforeEach(async () => {
      testUser = await UserModel.create({
        email: 'messageuser@example.com',
        name: 'Message Test User',
        googleId: 'message-google-id',
        profileComplete: true
      });

      testGroup = await Group.create({
        name: 'Message Test Group',
        owner: testUser._id,
        members: [{ userId: testUser._id, joinDate: new Date() }]
      });

      testMessage = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Test message',
        type: 'text'
      });
    });

    /**
     * Test: Message virtual - pollResults
     * Expected Behavior: Should return null for non-poll messages
     */
    test('pollResults virtual should return null for non-poll messages', () => {
      expect(testMessage.pollResults).toBeNull();
    });

    /**
     * Test: Message virtual - pollResults
     * Expected Behavior: Should calculate poll results correctly
     */
    test('pollResults virtual should calculate poll results', async () => {
      const pollMessage = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Test poll',
        type: 'poll',
        pollData: {
          question: 'Test question?',
          options: ['Option 1', 'Option 2'],
          votes: [
            { userId: testUser._id, option: 'Option 1', timestamp: new Date() },
            { userId: testUser._id, option: 'Option 1', timestamp: new Date() },
            { userId: testUser._id, option: 'Option 2', timestamp: new Date() }
          ],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      const results = pollMessage.pollResults;
      expect(results).toBeDefined();
      expect(results?.['Option 1']).toBe(2);
      expect(results?.['Option 2']).toBe(1);
    });

    /**
     * Test: Message virtual - isPollExpired
     * Expected Behavior: Should return false for non-poll messages
     */
    test('isPollExpired virtual should return false for non-poll messages', () => {
      expect(testMessage.isPollExpired).toBe(false);
    });

    /**
     * Test: Message virtual - isPollExpired
     * Expected Behavior: Should correctly detect expired polls
     */
    test('isPollExpired virtual should detect expired polls', async () => {
      const expiredPoll = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Expired poll',
        type: 'poll',
        pollData: {
          question: 'Test question?',
          options: ['Option 1'],
          votes: [],
          expiresAt: new Date(Date.now() - 1000) // Expired
        }
      });

      expect(expiredPoll.isPollExpired).toBe(true);
    });

    /**
     * Test: Message virtual - totalPollVotes
     * Expected Behavior: Should return 0 for non-poll messages
     */
    test('totalPollVotes virtual should return 0 for non-poll messages', () => {
      expect(testMessage.totalPollVotes).toBe(0);
    });

    /**
     * Test: Message virtual - totalPollVotes
     * Expected Behavior: Should return correct vote count
     */
    test('totalPollVotes virtual should return correct count', async () => {
      const pollMessage = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Vote poll',
        type: 'poll',
        pollData: {
          question: 'Test question?',
          options: ['Option 1'],
          votes: [
            { userId: testUser._id, option: 'Option 1', timestamp: new Date() },
            { userId: testUser._id, option: 'Option 1', timestamp: new Date() }
          ],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      expect(pollMessage.totalPollVotes).toBe(2);
    });

    /**
     * Test: Message method - addVote
     * Expected Behavior: Should add vote to poll
     */
    test('addVote method should add vote to poll', async () => {
      const pollMessage = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Add vote poll',
        type: 'poll',
        pollData: {
          question: 'Test question?',
          options: ['Option 1', 'Option 2'],
          votes: [],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      pollMessage.addVote(testUser._id.toString(), 'Option 1');
      await pollMessage.save();

      expect(pollMessage.pollData.votes).toHaveLength(1);
      expect(pollMessage.pollData.votes[0].option).toBe('Option 1');
    });

    /**
     * Test: Message method - addVote should replace existing vote
     * Expected Behavior: Should replace user's existing vote with new one
     */
    test('addVote should replace existing vote from same user', async () => {
      const pollMessage = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Replace vote poll',
        type: 'poll',
        pollData: {
          question: 'Test question?',
          options: ['Option 1', 'Option 2'],
          votes: [
            { userId: testUser._id, option: 'Option 1', timestamp: new Date() }
          ],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      pollMessage.addVote(testUser._id.toString(), 'Option 2');
      await pollMessage.save();

      expect(pollMessage.pollData.votes).toHaveLength(1);
      expect(pollMessage.pollData.votes[0].option).toBe('Option 2');
    });

    /**
     * Test: Message method - addVote should throw for non-poll
     * Expected Behavior: Should throw error when voting on non-poll message
     */
    test('addVote should throw error for non-poll message', () => {
      expect(() => {
        testMessage.addVote(testUser._id.toString(), 'Option 1');
      }).toThrow('Cannot vote on non-poll message');
    });

    /**
     * Test: Message method - addVote should throw for expired poll
     * Expected Behavior: Should throw error when voting on expired poll
     */
    test('addVote should throw error for expired poll', async () => {
      const expiredPoll = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Expired poll',
        type: 'poll',
        pollData: {
          question: 'Test question?',
          options: ['Option 1'],
          votes: [],
          expiresAt: new Date(Date.now() - 1000) // Expired
        }
      });

      expect(() => {
        expiredPoll.addVote(testUser._id.toString(), 'Option 1');
      }).toThrow('Poll has expired');
    });

    /**
     * Test: Message method - hasUserVoted
     * Expected Behavior: Should return false for non-poll messages
     */
    test('hasUserVoted should return false for non-poll messages', () => {
      expect(testMessage.hasUserVoted(testUser._id.toString())).toBe(false);
    });

    /**
     * Test: Message method - hasUserVoted
     * Expected Behavior: Should correctly detect if user has voted
     */
    test('hasUserVoted should detect if user has voted', async () => {
      const pollMessage = await Message.create({
        groupId: testGroup._id,
        senderId: testUser._id,
        content: 'Vote check poll',
        type: 'poll',
        pollData: {
          question: 'Test question?',
          options: ['Option 1'],
          votes: [
            { userId: testUser._id, option: 'Option 1', timestamp: new Date() }
          ],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      expect(pollMessage.hasUserVoted(testUser._id.toString())).toBe(true);

      const otherUser = await UserModel.create({
        email: 'novoteuser@example.com',
        name: 'No Vote User',
        googleId: 'novote-google-id',
        profileComplete: true
      });

      expect(pollMessage.hasUserVoted(otherUser._id.toString())).toBe(false);
    });
  });

  describe('Rating Model', () => {
    let testUser: any;
    let ratedUser: any;
    let testGroup: any;

    beforeEach(async () => {
      testUser = await UserModel.create({
        email: 'rateruser@example.com',
        name: 'Rater User',
        googleId: 'rater-google-id',
        profileComplete: true
      });

      ratedUser = await UserModel.create({
        email: 'rateduser@example.com',
        name: 'Rated User',
        googleId: 'rated-google-id',
        profileComplete: true
      });

      testGroup = await Group.create({
        name: 'Rating Test Group',
        owner: testUser._id,
        members: [
          { userId: testUser._id, joinDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) },
          { userId: ratedUser._id, joinDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) }
        ]
      });
    });

    /**
     * Test: Rating static method - getAverageRating
     * Expected Behavior: Should calculate average rating correctly
     */
    test('getAverageRating should calculate average rating', async () => {
      // Create ratings
      await Rating.create({
        ratedUserId: ratedUser._id,
        raterUserId: testUser._id,
        groupId: testGroup._id,
        rating: 5,
        testimonial: 'Great!',
        timeSpentMinutes: 1000
      });

      const otherUser = await UserModel.create({
        email: 'otherrater@example.com',
        name: 'Other Rater',
        googleId: 'otherrater-google-id',
        profileComplete: true
      });

      await Rating.create({
        ratedUserId: ratedUser._id,
        raterUserId: otherUser._id,
        groupId: testGroup._id,
        rating: 3,
        testimonial: 'Okay',
        timeSpentMinutes: 500
      });

      const result = await Rating.getAverageRating(ratedUser._id.toString());
      
      expect(result.averageRating).toBe(4); // (5 + 3) / 2
      expect(result.totalRatings).toBe(2);
    });

    /**
     * Test: Rating static method - getAverageRating with no ratings
     * Expected Behavior: Should return 0 for user with no ratings
     */
    test('getAverageRating should return 0 for user with no ratings', async () => {
      const newUser = await UserModel.create({
        email: 'noratings@example.com',
        name: 'No Ratings User',
        googleId: 'noratings-google-id',
        profileComplete: true
      });

      const result = await Rating.getAverageRating(newUser._id.toString());
      
      expect(result.averageRating).toBe(0);
      expect(result.totalRatings).toBe(0);
    });

    /**
     * Test: Rating pre-save hook - negative time validation
     * Expected Behavior: Should reject negative timeSpentMinutes (line 75)
     */
    test('pre-save hook should reject negative timeSpentMinutes', async () => {
      // Create rating with valid timeSpentMinutes first
      const rating = new Rating({
        ratedUserId: ratedUser._id,
        raterUserId: testUser._id,
        groupId: testGroup._id,
        rating: 5,
        timeSpentMinutes: 100
      });

      // Save it first to get past schema validation
      await rating.save();

      // Now set timeSpentMinutes to negative to test pre-save hook (line 75)
      // Use updateOne with runValidators: false to bypass schema validation but still run pre-save hooks
      // Actually, updateOne doesn't run pre-save hooks, so we need to use save with validateBeforeSave: false
      rating.timeSpentMinutes = -10;
      rating.markModified('timeSpentMinutes');
      
      // The pre-save hook should catch this and call next with error (line 75)
      // validateBeforeSave: false bypasses schema validation but still runs pre-save hooks
      await expect(rating.save({ validateBeforeSave: false })).rejects.toThrow('Time spent cannot be negative');
    });
  });
});

