import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import mongoose, { ConnectionStates } from "mongoose";
import { config } from "./config";
import { authenticate } from "./middleware/auth.middleware";
import { authRouter } from "./routes/auth.routes";
import chatRouter from "./routes/chat.routes";
import groupRouter from "./routes/group.routes";
import ratingRouter from "./routes/rating.routes";
import taskRouter from "./routes/task.routes";
import { userRouter } from "./routes/user.routes";
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
app.use("/api/user", (req, res, next) => { authenticate(req, res, next).catch((err: unknown) => { next(err); }); }, userRouter);  //protected with auth middleware
app.use("/api/group", (req, res, next) => { authenticate(req, res, next).catch((err: unknown) => { next(err); }); }, groupRouter);  //protected with auth middleware
app.use("/api/task", (req, res, next) => { authenticate(req, res, next).catch((err: unknown) => { next(err); }); }, taskRouter);  //protected with auth middleware
app.use("/api/chat", (req, res, next) => { authenticate(req, res, next).catch((err: unknown) => { next(err); }); }, chatRouter);  //protected with auth middleware
app.use("/api/rating", ratingRouter);  //uses its own auth middleware
app.use("/api", userRouter);           //protected with auth middleware

console.log("Attempting MongoDB connection...");
mongoose.set('strictQuery', true);
mongoose
  .connect(config.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,  // Timeout after 30 seconds
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