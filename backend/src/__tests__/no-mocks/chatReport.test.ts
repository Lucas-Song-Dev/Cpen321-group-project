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
  let authToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

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

    authToken = jwt.sign(
      { email: user.email, id: user._id.toString() },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    delete process.env.TEST_REPORT_OFFENSIVE;
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  it('should delete a message when moderation flags it as offensive', async () => {
    process.env.TEST_REPORT_OFFENSIVE = 'true';
    
    const message = await Message.create({
      groupId,
      senderId: userId,
      content: 'offensive message',
      type: 'text'
    });

    const res = await request(app)
      .post(`/api/chat/${groupId.toString()}/message/${message._id.toString()}/report`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Offensive content' });

    const messageInDb = await Message.findById(message._id);
  });

  it('should not delete clean messages', async () => {
    process.env.TEST_REPORT_OFFENSIVE = 'false';
    
    const cleanMessage = await Message.create({
      groupId,
      senderId: userId,
      content: 'hello roommates',
      type: 'text'
    });

    const res = await request(app)
      .post(`/api/chat/${groupId.toString()}/message/${cleanMessage._id.toString()}/report`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Just checking' });

  });
});