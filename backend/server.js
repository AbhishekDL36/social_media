const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const { startScheduler } = require('./utils/scheduler');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

console.log('Initializing Socket.io...');
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
console.log('Socket.io initialized');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    // Start the scheduler after database connection
    startScheduler();
  })
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/follow-requests', require('./routes/followRequests'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/shares', require('./routes/shares'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/hashtags', require('./routes/hashtags'));

// Store active users
const activeUsers = new Map();

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Socket.io: User connected:', socket.id);

  // User joins with their ID
  socket.on('user:join', (userId) => {
    try {
      console.log('Socket.io: user:join received for', userId);
      activeUsers.set(userId, socket.id);
      console.log(`User ${userId} joined with socket ${socket.id}`);
      console.log('Active users now:', Array.from(activeUsers.entries()));
    } catch (err) {
      console.error('Error in user:join:', err);
      socket.emit('error', { message: 'Server error handling join' });
    }
  });

  // Handle typing events
  socket.on('typing:start', ({ userId, recipientId }) => {
    try {
      console.log(`${userId} started typing to ${recipientId}`);
      console.log('Active users:', Array.from(activeUsers.keys()));
      const recipientSocketId = activeUsers.get(recipientId);
      console.log(`Recipient socket ID: ${recipientSocketId}`);
      if (recipientSocketId) {
        console.log(`Sending typing indicator to ${recipientId}`);
        io.to(recipientSocketId).emit('typing:indicator', {
          userId,
          isTyping: true
        });
      } else {
        console.log(`Recipient ${recipientId} not found in active users`);
      }
    } catch (err) {
      console.error('Error in typing:start:', err);
    }
  });

  socket.on('typing:stop', ({ userId, recipientId }) => {
    try {
      console.log(`${userId} stopped typing to ${recipientId}`);
      const recipientSocketId = activeUsers.get(recipientId);
      if (recipientSocketId) {
        console.log(`Sending stop typing to ${recipientId}`);
        io.to(recipientSocketId).emit('typing:indicator', {
          userId,
          isTyping: false
        });
      }
    } catch (err) {
      console.error('Error in typing:stop:', err);
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    for (let [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
