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
  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private groupMembers = new Map<string, Set<string>>(); // groupId -> Set of userIds

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
    
      // Authenticate user
      socket.on('authenticate', (token: string) => {
        try {
          console.log('[SOCKET] Authenticating socket with token...');
          const decoded = jwt.verify(token, config.JWT_SECRET) as unknown;
                  socket.userId = decoded.id || decoded.userId; // Support both 'id' and 'userId' in JWT payload
          if (socket.userId) {
            this.connectedUsers.set(socket.userId, socket.id);
                      // Emit authentication success event
            socket.emit('authenticated', { success: true, userId: socket.userId });
          } else {
            console.log('[SOCKET] No userId found in decoded token');
            socket.emit('authenticated', { success: false, error: 'No userId in token' });
          }
        } catch (error) {
                  socket.emit('authenticated', { success: false, error: 'Invalid token' });
          socket.disconnect();
        }
      });

      // Join group
      socket.on('join-group', (groupId: string) => {
              if (!socket.userId) {
                  socket.emit('error', 'User not authenticated');
          return;
        }

        socket.join(groupId);
        socket.groupId = groupId;
        
        if (!this.groupMembers.has(groupId)) {
          this.groupMembers.set(groupId, new Set());
        }
        this.groupMembers.get(groupId)?.add(socket.userId);

        
        // Notify other group members
        socket.to(groupId).emit('user-joined', {
          userId: socket.userId,
          groupId,
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

              
        // Notify other group members
        socket.to(groupId).emit('user-left', {
          userId: socket.userId,
          groupId: groupId,
          timestamp: new Date().toISOString()
        });
      });

      // Send message
      socket.on('send-message', (data: unknown) => {
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
            });

      // Create poll
      socket.on('create-poll', (data: unknown) => {
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
            });

      // Vote on poll
      socket.on('vote-poll', (data: unknown) => {
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
        this.io.to(socket.groupId ?? '').emit('poll-update', voteData);
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
