// File: admin/backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const securityAuthRoutes = require('./routes/securityAuth');
const securityMemberRoutes = require('./routes/securityMember');
const phaseRoutes = require('./routes/phases');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with CORS allowing all origins
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

// Make io accessible to routes
app.set('io', io);

// Enable CORS for all routes
app.use(cors({
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New WebSocket connection established. Socket ID:', socket.id);
  console.log('Total connected clients:', io.engine.clientsCount);

  // Join money-updates room
  socket.on('join-money-updates', () => {
    socket.join('money-updates');
    console.log(`Socket ${socket.id} joined money-updates room`);
    console.log('Clients in money-updates room:', io.sockets.adapter.rooms.get('money-updates')?.size || 0);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected. Socket ID:', socket.id);
    console.log('Remaining connected clients:', io.engine.clientsCount);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Log all Socket.IO events
io.engine.on('connection_error', (err) => {
  console.error('Connection error:', err);
});

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/manager-auth', require('./routes/managerAuth'));
app.use('/api/security-auth', securityAuthRoutes);
app.use('/api/security-members', securityMemberRoutes);
app.use('/api/boats', require('./routes/boats'));
app.use('/api/phases', phaseRoutes);
app.use('/api/company-papers', require('./routes/companyPapers'));
app.use('/api/money-handles', require('./routes/moneyHandles'));
app.use('/api/madhayams', require('./routes/madhayams'));
app.use('/api/fish-types', require('./routes/fishTypes'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/managers', require('./routes/managers'));
app.use('/api/sikaris', require('./routes/sikaris'));
app.use('/api/company-summary', require('./routes/companySummary'));
app.use('/api/collection', require('./routes/collection'));
app.use('/api/notes', require('./routes/notes'));

// Handle upload errors
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message
      }
    });
  }
  next(err);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Something went wrong!'
    }
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/river', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));
    
// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
    // Don't exit the process in development
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit the process in development
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});




