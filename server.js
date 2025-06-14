// File: admin/backend/server.js
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');

const authRoutes = require('./routes/auth'); // Assuming your auth routes are here
const managerAuthRoutes = require('./routes/managerAuth');
const securityAuthRoutes = require('./routes/securityAuth');
const companyPapersRoutes = require('./routes/companyPapers');
const fetchCompanyPapersRoutes = require('./routes/fetchCompanyPapers');
const fishTypesRoutes = require('./routes/fishTypes');
const fetchFishTypesRoutes = require('./routes/fetchFishTypes');
const moneyHandlesRoutes = require('./routes/moneyHandles');
const fetchMoneyHandlesRoutes = require('./routes/fetchMoneyHandles');
const sikarisRoutes = require('./routes/sikaris');
const fetchSikarisRoutes = require('./routes/fetchSikaris');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection URL from environment variable
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/river";

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected to:", MONGODB_URI))
  .catch(err => console.error("MongoDB connection error:", err));

// API Routes

app.use('/api/auth', authRoutes);
app.use('/api/manager', managerAuthRoutes);
app.use('/api/security', securityAuthRoutes);
app.use('/api/company-papers', companyPapersRoutes);
app.use('/api/fetch-company-papers', fetchCompanyPapersRoutes);
app.use('/api/fish-types', fishTypesRoutes);
app.use('/api/fetch-fish-types', fetchFishTypesRoutes);
app.use('/api/money-handles', moneyHandlesRoutes);
app.use('/api/fetch-money-handles', fetchMoneyHandlesRoutes);
app.use('/api/sikaris', sikarisRoutes);
app.use('/api/fetch-sikaris', fetchSikarisRoutes);

// Port from environment variable
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));




