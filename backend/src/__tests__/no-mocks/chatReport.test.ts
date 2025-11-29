import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import chatRouter from '../../routes/chat.routes';
import Message from '../../models/chat.models';
import Group from '../../models/group.models';
import { UserModel } from '../../models/user.models';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

const app = express();
app.use(express.json());
app.use('/api/chat', chatRouter);

describe('Chat message report moderation', () => {
  let userId: mongoose.Types.ObjectId;
  let groupId: mongoose.Types.ObjectId;
  let messageId: mongoose.Types.ObjectId;
  let authToken: string;

  beforeAll(async () => {
    // Ensure mongoose connection is ready before creating records
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Create a user, group, and message directly in the DB
    const user = await UserModel.create({
      email: 'reporter@example.com',
      password: 'password123',
      name: 'Reporter'
    });
    userId = user._id;

    const group = await Group.create({
      name: 'Test Group',
      owner: userId,
      members: [{ userId }]
    });
    groupId = group._id;

    const message = await Message.create({
      groupId,
      senderId: userId,
      content: 'offensive message for testing',
      type: 'text'
    });
    messageId = message._id;

    // Generate auth token
    authToken = jwt.sign(
      { email: user.email, id: user._id.toString() },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Enable test moderation flag so moderation service always flags as offensive
    process.env.TEST_REPORT_OFFENSIVE = 'true';
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  it('should delete a message when moderation flags it as offensive', async () => {
    const res = await request(app)
      .post(`/api/chat/${groupId.toString()}/message/${messageId.toString()}/report`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Offensive content' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isOffensive).toBe(true);
    expect(res.body.data.actionTaken).toContain('deleted');

    const messageInDb = await Message.findById(messageId);
    expect(messageInDb).toBeNull();
  });

  it('should not treat clean messages as offensive when flag disabled', async () => {
    // Create a clean message
    const cleanMessage = await Message.create({
      groupId,
      senderId: userId,
      content: 'hello roommates',
      type: 'text'
    });

    // Disable forced offensive flag
    process.env.TEST_REPORT_OFFENSIVE = 'false';

    const res = await request(app)
      .post(`/api/chat/${groupId.toString()}/message/${cleanMessage._id.toString()}/report`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Just checking' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isOffensive).toBe(false);

    const messageInDb = await Message.findById(cleanMessage._id);
    // Message should remain if not flagged as offensive
    expect(messageInDb).not.toBeNull();
  });
});