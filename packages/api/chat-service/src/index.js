const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3011;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/chat-service', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Message = require('./models/Message');

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('chat message', async (msg) => {
    const message = new Message(msg);
    await message.save();
    io.emit('chat message', msg);
  });
});

server.listen(PORT, () => {
  console.log(`Chat service listening on port ${PORT}`);
});

