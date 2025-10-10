import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import groupRoutes from './routes/group';
import taskRoutes from './routes/task';
import ratingRoutes from './routes/rating';

// Import models
import { User, Group, Task, Message, Rating } from './models';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { protect } from './middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/rating', ratingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({ 
    message: 'RoomSync Backend is running!', 
    timestamp: new Date().toISOString(),
    database: dbStatus,
    version: '1.0.0'
  });
});

// Protected test endpoint
app.get('/api/protected', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'This is a protected route',
    user: {
      id: req.user?._id,
      email: req.user?.email,
      name: req.user?.fullName
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join group room
  socket.on('join-group', (groupId) => {
    socket.join(`group-${groupId}`);
    console.log(`User ${socket.id} joined group ${groupId}`);
  });

  // Leave group room
  socket.on('leave-group', (groupId) => {
    socket.leave(`group-${groupId}`);
    console.log(`User ${socket.id} left group ${groupId}`);
  });

  // Handle chat messages
  socket.on('send-message', (data) => {
    // Broadcast message to all users in the group
    socket.to(`group-${data.groupId}`).emit('new-message', data);
  });

  // Handle polls
  socket.on('send-poll', (data) => {
    socket.to(`group-${data.groupId}`).emit('new-poll', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomsync';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 RoomSync Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer().catch(console.error);
