# Send Message Sequence Diagram

This diagram illustrates the complete flow when a user sends a message in the chat system.

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as Frontend
    participant SocketManager as SocketManager
    participant Backend as Backend
    participant Auth as Auth
    participant ChatService as ChatService
    participant Database as Database
    participant OtherUsers as OtherUsers

    Note over User, OtherUsers: Send Message Flow

    User->>Frontend: Types message and clicks send
    Frontend->>SocketManager: sendMessage(content, senderName)
    SocketManager->>SocketManager: Create messageData JSON
    Note over SocketManager: content: message text<br/>senderName: User Name<br/>timestamp: System.currentTimeMillis()
    
    SocketManager->>Backend: emit("send-message", messageData)
    Backend->>Auth: Authenticate socket connection
    Auth->>Auth: Verify JWT token
    Auth->>Auth: Extract userId and groupId
    Auth-->>Backend: Authentication successful
    
    Backend->>ChatService: Process send-message event
    ChatService->>Database: Save message to group
    Database-->>ChatService: Message saved with ID
    
    ChatService->>ChatService: Generate broadcast data
    Note over ChatService: id: generatedId<br/>content: data.content<br/>senderId: socket.userId<br/>senderName: data.senderName<br/>groupId: socket.groupId<br/>timestamp: data.timestamp<br/>type: text
    
    ChatService->>Backend: Broadcast to group room
    Backend->>OtherUsers: emit("new-message", messageData)
    Backend->>User: emit("new-message", messageData)
    
    OtherUsers->>OtherUsers: Display message in UI
    User->>User: Display message in UI
    
    Backend-->>SocketManager: Message broadcasted
    SocketManager-->>Frontend: Message sent successfully
    Frontend-->>User: Show message in chat

    Note over User, OtherUsers: Error Handling

    alt Invalid Authentication
        Backend->>Auth: Verify JWT token
        Auth-->>Backend: Authentication failed
        Backend-->>SocketManager: Error: Unauthorized
        SocketManager-->>Frontend: Show error message
        Frontend-->>User: Display "Authentication failed"
    end

    alt Socket Not Connected
        SocketManager->>Backend: emit("send-message", messageData)
        Backend-->>SocketManager: Error: Not connected
        SocketManager-->>Frontend: Show connection error
        Frontend-->>User: Display "Connection lost"
    end

    alt Database Error
        ChatService->>Database: Save message to group
        Database-->>ChatService: Database error
        ChatService-->>Backend: Error: Failed to save
        Backend-->>SocketManager: Error: Message not saved
        SocketManager-->>Frontend: Show error message
        Frontend-->>User: Display "Message failed to send"
    end
```

## Key Components:

1. **User**: The person sending the message
2. **Frontend (Android)**: The mobile app interface
3. **SocketManager**: Handles Socket.IO connection and message sending
4. **Backend (Socket.IO)**: The server handling real-time communication
5. **Auth Middleware**: Validates JWT tokens and user authentication
6. **Chat Service**: Processes messages and manages group communication
7. **Database**: Stores messages persistently
8. **Other Users**: Other members of the group receiving the message

## Main Flow:

1. User types message and clicks send
2. Frontend calls SocketManager.sendMessage()
3. SocketManager creates messageData JSON and emits to backend
4. Backend authenticates the socket connection
5. Chat service saves message to database
6. Message is broadcasted to all users in the group
7. All users (including sender) receive the message in real-time

## Error Handling:

- **Invalid Authentication**: JWT token verification fails
- **Socket Not Connected**: No active Socket.IO connection
- **Database Error**: Message fails to save to database
