// File: admin/backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const securityAuthRoutes = require('./routes/securityAuth');
const securityMemberRoutes = require('./routes/securityMember');
const phaseRoutes = require('./routes/phases');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    app.listen(PORT, () => {
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




