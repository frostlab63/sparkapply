const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3003;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'chat-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    connectedUsers: connectedUsers.size
  });
});

// Store connected users
const connectedUsers = new Map();
const activeRooms = new Map();

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user authentication
  socket.on('authenticate', (userData) => {
    connectedUsers.set(socket.id, {
      userId: userData.userId,
      username: userData.username,
      email: userData.email,
      socketId: socket.id
    });
    
    console.log(`User authenticated: ${userData.username} (${userData.userId})`);
    
    // Send confirmation to user
    socket.emit('authenticated', {
      success: true,
      message: 'Successfully authenticated'
    });
    
    // Broadcast user online status
    socket.broadcast.emit('user_online', {
      userId: userData.userId,
      username: userData.username
    });
  });

  // Handle joining chat rooms
  socket.on('join_room', (roomData) => {
    const { roomId, userId } = roomData;
    socket.join(roomId);
    
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, new Set());
    }
    activeRooms.get(roomId).add(userId);
    
    console.log(`User ${userId} joined room ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('user_joined_room', {
      userId,
      roomId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle leaving chat rooms
  socket.on('leave_room', (roomData) => {
    const { roomId, userId } = roomData;
    socket.leave(roomId);
    
    if (activeRooms.has(roomId)) {
      activeRooms.get(roomId).delete(userId);
      if (activeRooms.get(roomId).size === 0) {
        activeRooms.delete(roomId);
      }
    }
    
    console.log(`User ${userId} left room ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('user_left_room', {
      userId,
      roomId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle sending messages
  socket.on('send_message', (messageData) => {
    const { roomId, message, userId, username } = messageData;
    
    const messageObject = {
      id: generateMessageId(),
      roomId,
      message,
      userId,
      username,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    
    console.log(`Message sent in room ${roomId} by ${username}: ${message}`);
    
    // Send message to all users in the room
    io.to(roomId).emit('receive_message', messageObject);
    
    // Store message (in a real app, this would be saved to database)
    // For now, we'll just log it
    console.log('Message stored:', messageObject);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { roomId, userId, username } = data;
    socket.to(roomId).emit('user_typing', {
      userId,
      username,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    const { roomId, userId, username } = data;
    socket.to(roomId).emit('user_typing', {
      userId,
      username,
      isTyping: false
    });
  });

  // Handle notifications
  socket.on('send_notification', (notificationData) => {
    const { targetUserId, type, title, message, data } = notificationData;
    
    // Find target user's socket
    const targetUser = Array.from(connectedUsers.values()).find(user => user.userId === targetUserId);
    
    if (targetUser) {
      io.to(targetUser.socketId).emit('receive_notification', {
        id: generateMessageId(),
        type,
        title,
        message,
        data,
        timestamp: new Date().toISOString(),
        read: false
      });
      
      console.log(`Notification sent to user ${targetUserId}: ${title}`);
    } else {
      console.log(`User ${targetUserId} not connected, notification queued`);
      // In a real app, you would store this notification for later delivery
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`User disconnected: ${user.username} (${user.userId})`);
      
      // Remove from all rooms
      activeRooms.forEach((users, roomId) => {
        if (users.has(user.userId)) {
          users.delete(user.userId);
          socket.to(roomId).emit('user_left_room', {
            userId: user.userId,
            roomId,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Broadcast user offline status
      socket.broadcast.emit('user_offline', {
        userId: user.userId,
        username: user.username
      });
      
      connectedUsers.delete(socket.id);
    }
  });
});

// REST API endpoints for chat functionality
app.get('/api/chat/rooms', (req, res) => {
  const rooms = Array.from(activeRooms.keys()).map(roomId => ({
    roomId,
    userCount: activeRooms.get(roomId).size,
    users: Array.from(activeRooms.get(roomId))
  }));
  
  res.json({
    success: true,
    data: rooms,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/chat/users', (req, res) => {
  const users = Array.from(connectedUsers.values()).map(user => ({
    userId: user.userId,
    username: user.username,
    status: 'online'
  }));
  
  res.json({
    success: true,
    data: users,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Helper function to generate unique message IDs
function generateMessageId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Chat service running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 WebSocket server ready for connections`);
});

module.exports = { app, server, io };
