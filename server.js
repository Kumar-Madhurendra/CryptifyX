import express from 'express';
import { createServer } from 'https';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { apiLimiter, transferLimiter, loginLimiter } from './src/utils/rateLimiter.js';
import { cryptoManager } from './src/utils/crypto.js';

const app = express();

// Apply rate limiters
app.use('/api/login', loginLimiter);
app.use('/api/register', loginLimiter);
app.use('/api', apiLimiter);

// SSL certificate options
const serverOptions = {
  key: fs.readFileSync('certificates/key.pem'),
  cert: fs.readFileSync('certificates/cert.pem')
};

const server = createServer(serverOptions, app);

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const io = new Server(server, {
  cors: {
    origin: "https://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  },
  allowEIO3: true,
  path: '/socket.io',
  serveClient: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8, // 100MB
  allowUpgrades: true,
  transports: ['websocket'],
  cookie: false
});

app.use(cors({
  origin: "https://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"]
}));
app.use(express.json());

// In-memory storage (in production, use a proper database)
const users = new Map();
const activeUsers = new Map();
const fileTransfers = new Map();

// Load environment variables
import 'dotenv/config';

// Use environment variable for JWT secret with fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Throw error if in production and JWT_SECRET is not set
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

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
      return res.status(400).json({ 
        error: 'You are already registered. Please log in instead.',
        userExists: true 
      });
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
  
  // File transfer initiation with rate limiting and error handling
  socket.on('initiateTransfer', async (data) => {
    try {
      const { recipientId, fileName, fileSize, fileType } = data;
      const transferId = uuidv4();

      // Apply transfer rate limiting
      await transferLimiter.apply(socket.userId);

      console.log('Transfer initiated:', { transferId, recipientId, fileName });
      
      // Find recipient socket
      const recipient = Array.from(activeUsers.values()).find(user => user.id === recipientId);
      
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Store transfer info
      const transfer = {
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
      };
      fileTransfers.set(transferId, transfer);
      
      // Notify recipient
      io.to(recipientId).emit('transferRequest', {
        transferId,
        senderUsername: socket.username,
        fileName,
        fileSize,
        fileType
      });
      
      socket.emit('transferInitiated', { transferId });
    } catch (error) {
      console.error('Transfer initiation error:', error);
      socket.emit('transferError', { 
        error: error.message || 'Failed to initiate transfer',
        code: 'TRANSFER_INIT_ERROR'
      });
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
      
      // Clean up with proper key cleanup
      cryptoManager.cleanup(transferId);
      fileTransfers.delete(transferId);
    }
  });
  
  // File chunk transfer with rate limiting, encryption, and error handling
  socket.on('fileChunk', async (data) => {
    try {
      const { transferId, chunk, chunkIndex, totalChunks } = data;
      const transfer = fileTransfers.get(transferId);
      
      if (!transfer || transfer.senderId !== socket.userId) {
        throw new Error('Invalid transfer or unauthorized access');
      }

      // Apply transfer rate limiting
      if (chunkIndex === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Basic rate limiting
      }

      // Encrypt chunk with proper key management
      const { encryptedData, checksum } = await cryptoManager.encrypt(chunk, transferId);
      
      // Store chunk with checksum
      transfer.chunks[chunkIndex] = encryptedData;
      transfer.checksums = transfer.checksums || [];
      transfer.checksums[chunkIndex] = checksum;
      
      // Calculate progress
      const progress = Math.round((transfer.chunks.filter(c => c).length / totalChunks) * 100);
      
      // Update progress for both sender and recipient
      io.to(transfer.senderId).emit('transferProgress', { transferId, progress });
      io.to(transfer.recipientId).emit('transferProgress', { transferId, progress });
      
      // If all chunks received, complete transfer with verification
      if (transfer.chunks.filter(c => c).length === totalChunks) {
        try {
          // Verify all chunks
          for (let i = 0; i < totalChunks; i++) {
            const decrypted = cryptoManager.decrypt(transfer.chunks[i], transferId);
            if (!cryptoManager.verifyChecksum(decrypted, transfer.checksums[i])) {
              throw new Error(`Checksum verification failed for chunk ${i}`);
            }
          }

          transfer.status = 'completed';
          
          // Notify both parties of successful transfer
          io.to(transfer.senderId).emit('transferCompleted', { transferId });
          io.to(transfer.recipientId).emit('transferCompleted', { transferId });
        } catch (error) {
          console.error('Transfer verification error:', error);
          transfer.status = 'failed';
          
          // Notify both parties of transfer failure
          io.to(transfer.senderId).emit('transferFailed', { 
            transferId, 
            error: error.message || 'Transfer verification failed'
          });
          io.to(transfer.recipientId).emit('transferFailed', { 
            transferId, 
            error: error.message || 'Transfer verification failed'
          });
        }
      }

      // Clean up with proper key cleanup
      cryptoManager.cleanup(transferId);
    } catch (error) {
      console.error('File chunk error:', error);
      socket.emit('transferError', { 
        error: error.message || 'Failed to process file chunk',
        code: 'CHUNK_PROCESS_ERROR'
      });
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