import mongoose from 'mongoose';
import Message from '../models/chat.models';
import Group from '../models/group.models';

class ChatService {
  async getGroupMessages(userId: string, groupId: string, page = 1, limit = 50) {
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
      throw new Error('ACCESS_DENIED');
    }

    // Get messages with pagination
    const skip = (page - 1) * limit;
    const messages = await Message.find({ groupId })
      .populate('senderId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({ groupId });
    const totalPages = Math.ceil(totalMessages / limit);

    return {
      messages,
      pagination: {
        currentPage: page,
        totalPages,
        totalMessages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  async sendMessage(userId: string, groupId: string, content: string) {
    // Validate inputs
    if (!content || content.trim().length === 0) {
      throw new Error('MESSAGE_CONTENT_REQUIRED');
    }

    if (content.length > 1000) {
      throw new Error('MESSAGE_TOO_LONG');
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
      throw new Error('ACCESS_DENIED');
    }

    // Create message
    const message = await Message.create({
      groupId: new mongoose.Types.ObjectId(groupId),
      senderId: new mongoose.Types.ObjectId(userId),
      content: content.trim(),
      type: 'text'
    });

    // Populate sender info
    await message.populate('senderId', 'name email');

    return message;
  }

  async createPoll(userId: string, groupId: string, question: string, options: string[]) {
    // Validate inputs
    if (!question || question.trim().length === 0) {
      throw new Error('POLL_QUESTION_REQUIRED');
    }

    if (question.length > 200) {
      throw new Error('QUESTION_TOO_LONG');
    }

    if (options.length < 2 || options.length > 10) {
      throw new Error('INVALID_POLL_OPTIONS');
    }

    // Validate each option
    for (const option of options) {
      if (!option || option.trim().length === 0) {
        throw new Error('EMPTY_POLL_OPTION');
      }
      if (option.length > 100) {
        throw new Error('POLL_OPTION_TOO_LONG');
      }
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
      throw new Error('ACCESS_DENIED');
    }

    // Create poll message
    const message = await Message.create({
      groupId: new mongoose.Types.ObjectId(groupId),
      senderId: new mongoose.Types.ObjectId(userId),
      content: question.trim(),
      type: 'poll',
      pollData: {
        question: question.trim(),
        options: options.map(opt => opt.trim()),
        votes: [],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
      }
    });

    // Populate sender info
    await message.populate('senderId', 'name email');

    return message;
  }

  async voteOnPoll(userId: string, groupId: string, messageId: string, option: string) {
    // Validate inputs
    if (!option || option.trim().length === 0) {
      throw new Error('POLL_OPTION_REQUIRED');
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
      throw new Error('ACCESS_DENIED');
    }

    // Find the poll message
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('MESSAGE_NOT_FOUND');
    }

    if (message.type !== 'poll') {
      throw new Error('NOT_A_POLL');
    }

    if (!message.pollData) {
      throw new Error('POLL_DATA_MISSING');
    }

    // Check if poll is expired
    if (new Date() > message.pollData.expiresAt) {
      throw new Error('POLL_EXPIRED');
    }

    // Check if option exists
    if (!message.pollData.options.includes(option.trim())) {
      throw new Error('INVALID_POLL_OPTION');
    }

    // Remove existing vote from this user
    message.pollData.votes = message.pollData.votes.filter(vote =>
      vote.userId.toString() !== userId
    );

    // Add new vote
    message.pollData.votes.push({
      userId: new mongoose.Types.ObjectId(userId),
      option: option.trim(),
      timestamp: new Date()
    });

    await message.save();

    // Populate sender info
    await message.populate('senderId', 'name email');

    return message;
  }

  async deleteMessage(userId: string, groupId: string, messageId: string) {
    // Verify user is member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('GROUP_NOT_FOUND');
    }

    const isMember = group.members.some(member =>
      member.userId.toString() === userId
    );

    if (!isMember) {
      throw new Error('ACCESS_DENIED');
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('MESSAGE_NOT_FOUND');
    }

    // Check if user is the sender
    if (message.senderId.toString() !== userId) {
      throw new Error('DELETE_PERMISSION_DENIED');
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    return { message: 'Message deleted successfully' };
  }
}

export default new ChatService();
