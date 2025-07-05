import express from 'express';
import { createServer } from 'https';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const app = express();

// SSL certificate options
const serverOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const server = createServer(serverOptions, app);
const io = new Server(server, {
  cors: {
    origin: "https://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: "https://localhost:5173",
  credentials: true
}));
app.use(express.json());

// In-memory storage (in production, use a proper database)
const users = new Map();
const activeUsers = new Map();
const fileTransfers = new Map();

const JWT_SECRET = 'your-secret-key-change-in-production';

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    console.log('Registration attempt:', { username, email });
    
    // Check if user already exists
    const existingUser = Array.from(users.values()).find(
      user => user.email === email || user.username === username
    );
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = uuidv4();
    const user = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };
    
    users.set(userId, user);
    console.log('User created:', { id: userId, username, email });
    
    // Generate JWT token
    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      success: true,
      user: { id: userId, username, email },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username });
    
    // Find user
    const user = Array.from(users.values()).find(
      u => u.username === username || u.email === username
    );
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('User logged in:', { id: user.id, username: user.username });
    
    res.json({
      success: true,
      user: { id: user.id, username: user.username, email: user.email },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get active users
app.get('/api/users', (req, res) => {
  const userList = Array.from(activeUsers.values()).map(user => ({
    id: user.id,
    username: user.username,
    status: user.status
  }));
  res.json(userList);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // User authentication
  socket.on('authenticate', (data) => {
    try {
      const { token } = data;
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = users.get(decoded.userId);
      
      if (user) {
        socket.userId = user.id;
        socket.username = user.username;
        
        // Add to active users
        activeUsers.set(socket.id, {
          id: user.id,
          username: user.username,
          socketId: socket.id,
          status: 'online'
        });
        
        // Join user to their own room
        socket.join(user.id);
        
        // Broadcast updated user list
        io.emit('userList', Array.from(activeUsers.values()));
        
        socket.emit('authenticated', { success: true, user: { id: user.id, username: user.username } });
        console.log('User authenticated:', user.username);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('authenticated', { success: false, error: 'Invalid token' });
    }
  });
  
  // File transfer initiation
  socket.on('initiateTransfer', (data) => {
    const { recipientId, fileName, fileSize, fileType } = data;
    const transferId = uuidv4();
    
    console.log('Transfer initiated:', { transferId, recipientId, fileName });
    
    // Find recipient socket
    const recipient = Array.from(activeUsers.values()).find(user => user.id === recipientId);
    
    if (recipient) {
      // Store transfer info
      fileTransfers.set(transferId, {
        id: transferId,
        senderId: socket.userId,
        senderUsername: socket.username,
        recipientId,
        fileName,
        fileSize,
        fileType,
        status: 'pending',
        chunks: [],
        createdAt: new Date()
      });
      
      // Notify recipient
      io.to(recipientId).emit('transferRequest', {
        transferId,
        senderUsername: socket.username,
        fileName,
        fileSize,
        fileType
      });
      
      socket.emit('transferInitiated', { transferId });
    } else {
      socket.emit('transferError', { error: 'Recipient not found' });
    }
  });
  
  // Accept file transfer
  socket.on('acceptTransfer', (data) => {
    const { transferId } = data;
    const transfer = fileTransfers.get(transferId);
    
    if (transfer && transfer.recipientId === socket.userId) {
      transfer.status = 'accepted';
      
      console.log('Transfer accepted:', transferId);
      
      // Notify sender
      io.to(transfer.senderId).emit('transferAccepted', { transferId });
      
      socket.emit('transferAccepted', { transferId });
    }
  });
  
  // Reject file transfer
  socket.on('rejectTransfer', (data) => {
    const { transferId } = data;
    const transfer = fileTransfers.get(transferId);
    
    if (transfer && transfer.recipientId === socket.userId) {
      transfer.status = 'rejected';
      
      console.log('Transfer rejected:', transferId);
      
      // Notify sender
      io.to(transfer.senderId).emit('transferRejected', { transferId });
      
      // Clean up
      fileTransfers.delete(transferId);
    }
  });
  
  // File chunk transfer
  socket.on('fileChunk', (data) => {
    const { transferId, chunk, chunkIndex, totalChunks } = data;
    const transfer = fileTransfers.get(transferId);
    
    if (transfer && transfer.senderId === socket.userId) {
      // Encrypt chunk
      const encryptedChunk = CryptoJS.AES.encrypt(JSON.stringify(chunk), 'secret-key').toString();
      
      // Store chunk
      transfer.chunks[chunkIndex] = encryptedChunk;
      
      // Calculate progress
      const progress = Math.round((transfer.chunks.filter(c => c).length / totalChunks) * 100);
      
      // Update progress for both sender and recipient
      io.to(transfer.senderId).emit('transferProgress', { transferId, progress });
      io.to(transfer.recipientId).emit('transferProgress', { transferId, progress });
      
      // If all chunks received, complete transfer
      if (transfer.chunks.filter(c => c).length === totalChunks) {
        transfer.status = 'completed';
        
        console.log('Transfer completed:', transferId);
        
        // Decrypt and send complete file to recipient
        const decryptedChunks = transfer.chunks.map(chunk => {
          const decrypted = CryptoJS.AES.decrypt(chunk, 'secret-key').toString(CryptoJS.enc.Utf8);
          return JSON.parse(decrypted);
        });
        
        io.to(transfer.recipientId).emit('fileReceived', {
          transferId,
          fileName: transfer.fileName,
          fileType: transfer.fileType,
          chunks: decryptedChunks
        });
        
        io.to(transfer.senderId).emit('transferCompleted', { transferId });
        
        // Clean up after some time
        setTimeout(() => {
          fileTransfers.delete(transferId);
        }, 300000); // 5 minutes
      }
    }
  });
  
  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove from active users
    activeUsers.delete(socket.id);
    
    // Broadcast updated user list
    io.emit('userList', Array.from(activeUsers.values()));
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on https://localhost:${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
});