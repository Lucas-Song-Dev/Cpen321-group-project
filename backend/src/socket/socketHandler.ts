import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  groupId?: string;
}

export class SocketHandler {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private groupMembers: Map<string, Set<string>> = new Map(); // groupId -> Set of userIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Authenticate user
      socket.on('authenticate', (token: string) => {
        try {
          console.log('Authenticating socket with token...');
          const decoded = jwt.verify(token, config.JWT_SECRET) as any;
          console.log('Token decoded:', decoded);
          socket.userId = decoded.id || decoded.userId; // Support both 'id' and 'userId' in JWT payload
          if (socket.userId) {
            this.connectedUsers.set(socket.userId, socket.id);
            console.log(`User authenticated: ${socket.userId}`);
          } else {
            console.log('No userId found in decoded token');
          }
        } catch (error) {
          console.log('Authentication failed:', error);
          socket.disconnect();
        }
      });

      // Join group
      socket.on('join-group', (groupId: string) => {
        console.log(`[SOCKET] Received join-group request for group: ${groupId}, socket.userId: ${socket.userId}`);
        if (!socket.userId) {
          console.log('[SOCKET] Socket not authenticated, cannot join group');
          socket.emit('error', 'User not authenticated');
          return;
        }

        socket.join(groupId);
        socket.groupId = groupId;
        
        if (!this.groupMembers.has(groupId)) {
          this.groupMembers.set(groupId, new Set());
        }
        this.groupMembers.get(groupId)!.add(socket.userId);

        console.log(`[SOCKET] User ${socket.userId} joined group ${groupId}`);
        console.log(`[SOCKET] Total members in group ${groupId}: ${this.groupMembers.get(groupId)!.size}`);
        console.log(`[SOCKET] Socket rooms for this socket:`, Array.from(socket.rooms));
        
        // Notify other group members
        socket.to(groupId).emit('user-joined', {
          userId: socket.userId,
          groupId: groupId,
          timestamp: new Date().toISOString()
        });
      });

      // Leave group
      socket.on('leave-group', (groupId: string) => {
        if (!socket.userId) return;

        socket.leave(groupId);
        socket.groupId = undefined;
        
        const groupMembers = this.groupMembers.get(groupId);
        if (groupMembers) {
          groupMembers.delete(socket.userId);
          if (groupMembers.size === 0) {
            this.groupMembers.delete(groupId);
          }
        }

        console.log(`User ${socket.userId} left group ${groupId}`);
        
        // Notify other group members
        socket.to(groupId).emit('user-left', {
          userId: socket.userId,
          groupId: groupId,
          timestamp: new Date().toISOString()
        });
      });

      // Send message
      socket.on('send-message', (data: any) => {
        if (!socket.userId || !socket.groupId) {
          socket.emit('error', 'User not in a group');
          return;
        }

        const messageData = {
          id: data.id || this.generateId(),
          content: data.content,
          senderId: socket.userId,
          senderName: data.senderName || 'User',
          groupId: socket.groupId,
          timestamp: Date.now(),
          type: 'text'
        };

        // Broadcast to all group members
        this.io.to(socket.groupId).emit('new-message', messageData);
        console.log(`Message sent in group ${socket.groupId}: ${data.content}`);
      });

      // Create poll
      socket.on('create-poll', (data: any) => {
        if (!socket.userId || !socket.groupId) {
          socket.emit('error', 'User not in a group');
          return;
        }

        const pollData = {
          id: this.generateId(),
          question: data.question,
          options: data.options.split(','),
          senderId: socket.userId,
          senderName: data.senderName || 'User',
          groupId: socket.groupId,
          timestamp: Date.now(),
          type: 'poll',
          durationDays: data.durationDays || 7,
          votes: {}
        };

        // Broadcast to all group members
        this.io.to(socket.groupId).emit('new-message', pollData);
        console.log(`Poll created in group ${socket.groupId}: ${data.question}`);
      });

      // Vote on poll
      socket.on('vote-poll', (data: any) => {
        if (!socket.userId) {
          socket.emit('error', 'User not authenticated');
          return;
        }

        const voteData = {
          pollId: data.pollId,
          option: data.option,
          userId: socket.userId,
          timestamp: Date.now()
        };

        // Broadcast poll update to all group members
        this.io.to(socket.groupId || '').emit('poll-update', voteData);
        console.log(`Vote cast on poll ${data.pollId}: ${data.option}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          
          if (socket.groupId) {
            const groupMembers = this.groupMembers.get(socket.groupId);
            if (groupMembers) {
              groupMembers.delete(socket.userId);
              if (groupMembers.size === 0) {
                this.groupMembers.delete(socket.groupId);
              }
            }

            // Notify other group members
            socket.to(socket.groupId).emit('user-left', {
              userId: socket.userId,
              groupId: socket.groupId,
              timestamp: new Date().toISOString()
            });
          }
        }
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}
