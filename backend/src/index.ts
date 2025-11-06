import { config } from "./config";  // Import config first to ensure env variables are loaded
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose, { ConnectionStates } from "mongoose";
import { createServer } from "http";
import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/user";
import { authenticate } from "./middleware/auth";
import groupRouter from "./routes/group";
import taskRouter from "./routes/task";
import chatRouter from "./routes/chat";
import ratingRouter from "./routes/rating";
import { SocketHandler } from "./socket/socketHandler";


const app = express();
const server = createServer(app);

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  if (req.body && Object.keys(req.body).length > 0) {
  }
  if (req.query && Object.keys(req.query).length > 0) {
  }
  next();
});

app.use(cors());
app.use(bodyParser.json());

// Response logging middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    const timestamp = new Date().toISOString();
      if (data) {
      try {
        const parsedData = JSON.parse(data);
      } catch (e) {
      }
    }
    return originalSend.call(this, data);
  };
  next();
});

// Health check endpoint (no auth required)
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === ConnectionStates.connected ? 'connected' : 'disconnected';
  
  res.status(200).json({ 
    message: 'RoomSync Backend is running!', 
    timestamp: new Date().toISOString(),
    database: dbStatus,
    version: '1.0.0',
    environment: process.env.NODE_ENV ?? 'development'
  });
});

app.use("/api/auth", authRouter);
app.use("/api/user", (req, res, next) => { authenticate(req, res, next).catch(next); }, userRouter);  //protected with auth middleware
app.use("/api/group", (req, res, next) => { authenticate(req, res, next).catch(next); }, groupRouter);  //protected with auth middleware
app.use("/api/task", (req, res, next) => { authenticate(req, res, next).catch(next); }, taskRouter);  //protected with auth middleware
app.use("/api/chat", (req, res, next) => { authenticate(req, res, next).catch(next); }, chatRouter);  //protected with auth middleware
app.use("/api/rating", ratingRouter);  //uses its own auth middleware
app.use("/api", userRouter);  //protected with auth middleware

console.log("Attempting MongoDB connection...");
mongoose.set('strictQuery', true);
mongoose
  .connect(config.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    connectTimeoutMS: 30000, // Connection timeout
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverApi: {
      version: '1',
      strict: true,
      deprecationErrors: true,
    }
  })
  .then(() => {
    console.log("Connected to MongoDB successfully");
      })
  .catch((err: unknown) => {
    const error = err as { name?: string; message?: string; code?: number };
    console.error("MongoDB connection error details:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Connection URI:", config.MONGODB_URI);
    if (error.code) console.error("Error code:", error.code);
    
    // Don't exit immediately, try to continue without DB for health checks
    console.error("⚠️  Continuing without database connection for now...");
    console.error("⚠️  Some features may not work until database is connected");
  });

// Add connection retry mechanism
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(() => {
    mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    }).catch((err: unknown) => {
      console.error('Reconnection failed:', (err as { message?: string }).message);
    });
  }, 5000);
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

// Initialize Socket.IO
const socketHandler = new SocketHandler(server);

// Export socketHandler for use in routes
export { socketHandler };

server.listen(config.PORT, () => {
});
//later need to switch to this for .env
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import mongoose from 'mongoose';
// import { createServer } from 'http';
// import { Server } from 'socket.io';

// // Import routes
// import authRoutes from './routes/auth';
// import userRoutes from './routes/user';
// import groupRoutes from './routes/group';
// import taskRoutes from './routes/task';
// import ratingRoutes from './routes/rating';
// import chatRoutes from './routes/chat';

// // Import models
// import { User, Group, Task, Message, Rating } from './models';

// // Import middleware
// import { errorHandler } from './middleware/errorHandler';
// import { protect } from './middleware/auth';

// // Load environment variables
// dotenv.config();

// const app = express();
// const server = createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: process.env.CORS_ORIGIN || "http://localhost:3000",
//     methods: ["GET", "POST"]
//   }
// });

// // Middleware
// app.use(cors({
//   origin: process.env.CORS_ORIGIN || "http://localhost:3000",
//   credentials: true
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/user', userRoutes);
// app.use('/api/group', groupRoutes);
// app.use('/api/task', taskRoutes);
// app.use('/api/rating', ratingRoutes);
// app.use('/api/chat', chatRoutes);

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
//   res.status(200).json({ 
//     message: 'RoomSync Backend is running!', 
//     timestamp: new Date().toISOString(),
//     database: dbStatus,
//     version: '1.0.0'
//   });
// });

// // Protected test endpoint
// app.get('/api/protected', protect, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'This is a protected route',
//     user: {
//       id: req.user?._id,
//       email: req.user?.email,
//       name: req.user?.fullname
//     }
//   });
// });

// // Socket.IO connection handling
// io.on('connection', (socket) => {
// 
//   // Join group room
//   socket.on('join-group', (groupId) => {
//     socket.join(`group-${groupId}`);
//   //   });

//   // Leave group room
//   socket.on('leave-group', (groupId) => {
//     socket.leave(`group-${groupId}`);
//   //   });

//   // Handle chat messages
//   socket.on('send-message', async (data) => {
//     try {
//       // Create message in database
//       const message = await Message.create({
//         groupId: data.groupId,
//         senderId: data.senderId,
//         content: data.content,
//         type: data.type || 'text'
//       });

//       // Populate sender information
//       await message.populate('senderId', 'fullname nickname');

//       // Broadcast message to all users in the group (including sender)
//       io.to(`group-${data.groupId}`).emit('new-message', message);
//     } catch (error) {
//       console.error('Error saving message:', error);
//       socket.emit('error', { message: 'Failed to send message' });
//     }
//   });

//   // Handle polls
//   socket.on('send-poll', async (data) => {
//     try {
//       const expiresAt = new Date();
//       expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7));

//       // Create poll message in database
//       const message = await Message.create({
//         groupId: data.groupId,
//         senderId: data.senderId,
//         content: data.question,
//         type: 'poll',
//         pollData: {
//           question: data.question,
//           options: data.options,
//           votes: [],
//           expiresAt
//         }
//       });

//       // Populate sender information
//       await message.populate('senderId', 'fullname nickname');

//       // Broadcast poll to all users in the group (including sender)
//       io.to(`group-${data.groupId}`).emit('new-poll', message);
//     } catch (error) {
//       console.error('Error saving poll:', error);
//       socket.emit('error', { message: 'Failed to create poll' });
//     }
//   });

//   // Handle poll votes
//   socket.on('vote-poll', async (data) => {
//     try {
//       const { messageId, option, userId, groupId } = data;
      
//       const message = await Message.findById(messageId);
//       if (!message || message.type !== 'poll') {
//         socket.emit('error', { message: 'Poll not found' });
//         return;
//       }

//       // Add vote - remove existing vote from this user first
//       if (message.pollData) {
//         message.pollData.votes = message.pollData.votes.filter((vote: any) => 
//           vote.userId.toString() !== userId.toString()
//         );
        
//         // Add new vote
//         message.pollData.votes.push({
//           userId,
//           option,
//           timestamp: new Date()
//         });
//       }
      
//       await message.save();

//       // Populate sender information
//       await message.populate('senderId', 'fullname nickname');

//       // Broadcast updated poll to all users in the group
//       io.to(`group-${groupId}`).emit('poll-updated', message);
//     } catch (error) {
//       console.error('Error voting on poll:', error);
//       socket.emit('error', { message: 'Failed to vote on poll' });
//     }
//   });

//   socket.on('disconnect', () => {
//   //   });
// });

// // Error handling middleware
// app.use(errorHandler);

// // Database connection
// const connectDB = async () => {
//   try {
//     const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomsync';
//     await mongoose.connect(mongoURI);
//     console.log('MongoDB connected successfully');
//   } catch (error) {
//     console.error('MongoDB connection error:', error);
//     process.exit(1);
//   }
// };

// //start server
// const PORT = process.env.PORT || 3000;

// const startServer = async () => {
//   console.log("Starting backend server...");
// //   await connectDB();
//   server.listen(PORT, () => {
//   //   //   });
// };

// startServer().catch(console.error);