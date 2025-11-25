import Message from '../models/chat.models';
import Group from '../models/group.models';
import mongoose from 'mongoose';

export class ChatService {
  /**
   * Get messages for a group with pagination
   */
  async getGroupMessages(groupId: string, userId: string, page: number, limit: number) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error('INVALID_GROUP_ID');
    }

    // Verify user is member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('GROUP_NOT_FOUND');
    }

    const isMember = group.members.some(member => 
      member.userId.toString() === userId
    );

    if (!isMember) {
      throw new Error('NOT_GROUP_MEMBER');
    }

    // Get messages with pagination
    const messages = await Message.find({ groupId })
      .populate('senderId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ groupId });

    return {
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total
      }
    };
  }

  /**
   * Send a text message
   */
  async sendTextMessage(groupId: string, userId: string, content: string) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error('INVALID_GROUP_ID');
    }

    // Verify user is member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('GROUP_NOT_FOUND');
    }

    const isMember = group.members.some(member => 
      member.userId.toString() === userId
    );

    if (!isMember) {
      throw new Error('NOT_GROUP_MEMBER');
    }

    // Create message
    const message = await Message.create({
      groupId,
      senderId: userId,
      content: content.trim(),
      type: 'text'
    });

    // Populate sender information
    await message.populate('senderId', 'name');

    return message;
  }

  /**
   * Create a poll
   */
  async createPoll(
    groupId: string, 
    userId: string, 
    question: string, 
    options: string[], 
    expiresInDays: number
  ) {
    // Verify user is member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('GROUP_NOT_FOUND');
    }

    const isMember = group.members.some(member => 
      member.userId.toString() === userId
    );

    if (!isMember) {
      throw new Error('NOT_GROUP_MEMBER');
    }

    // Create poll message
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const message = await Message.create({
      groupId,
      senderId: userId,
      content: question.trim(),
      type: 'poll',
      pollData: {
        question: question.trim(),
        options: options.map((option: string) => option.trim()),
        votes: [],
        expiresAt
      }
    });

    // Populate sender information
    await message.populate('senderId', 'name');

    return message;
  }

  /**
   * Vote on a poll
   */
  async voteOnPoll(groupId: string, messageId: string, userId: string, option: string) {
    // Validate ObjectId format for groupId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error('INVALID_GROUP_ID');
    }

    // Verify group exists and user is member
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('GROUP_NOT_FOUND');
    }

    const isMember = group.members.some(member => 
      member.userId.toString() === userId
    );

    if (!isMember) {
      throw new Error('NOT_GROUP_MEMBER');
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('POLL_NOT_FOUND');
    }

    if (message.groupId.toString() !== groupId) {
      throw new Error('POLL_NOT_IN_GROUP');
    }

    if (message.type !== 'poll' || !message.pollData) {
      throw new Error('NOT_A_POLL');
    }

    // Check if poll is expired
    if (message.pollData && new Date() > message.pollData.expiresAt) {
      throw new Error('POLL_EXPIRED');
    }

    // Check if option is valid
    if (!message.pollData.options.includes(option)) {
      throw new Error('INVALID_POLL_OPTION');
    }

    // Remove existing vote from this user first
    message.pollData.votes = message.pollData.votes.filter((vote: { userId: mongoose.Types.ObjectId }) => 
      vote.userId.toString() !== userId
    );
    
    // Add new vote
    message.pollData.votes.push({
      userId: new mongoose.Types.ObjectId(userId),
      option,
      timestamp: new Date()
    });
    
    await message.save();

    // Populate sender information
    await message.populate('senderId', 'name');

    return message;
  }

  /**
   * Delete a message (only by sender)
   */
  async deleteMessage(groupId: string, messageId: string, userId: string) {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('MESSAGE_NOT_FOUND');
    }

    if (message.groupId.toString() !== groupId) {
      throw new Error('MESSAGE_NOT_IN_GROUP');
    }

    // Only the sender can delete their message
    if (message.senderId.toString() !== userId) {
      throw new Error('NOT_MESSAGE_SENDER');
    }

    await Message.findByIdAndDelete(messageId);

    return { deleted: true };
  }
}

export default new ChatService();