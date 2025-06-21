const express = require('express');
const router = express.Router();
const CompanyPaper = require('../models/CompanyPaper');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to protect routes
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all papers for a company
router.get('/all', async (req, res) => {
  try {
    const papers = await CompanyPaper.find({ 
      status: 'active'
    }).sort({ uploadDate: -1 });

    res.json({
      success: true,
      papers: papers.map(paper => ({
        id: paper._id,
        fileName: paper.fileName,
        originalName: paper.originalName,
        uploadDate: paper.uploadDate,
        category: paper.category,
        description: paper.description,
        fileSize: paper.fileSize
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching papers' 
    });
  }
});

// Get papers by category
router.get('/category/:category', async (req, res) => {
  try {
    const papers = await CompanyPaper.find({
      category: req.params.category,
      status: 'active'
    }).sort({ uploadDate: -1 });

    res.json({
      success: true,
      papers: papers.map(paper => ({
        id: paper._id,
        fileName: paper.fileName,
        originalName: paper.originalName,
        uploadDate: paper.uploadDate,
        category: paper.category,
        description: paper.description,
        fileSize: paper.fileSize
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching papers by category' 
    });
  }
});

// Get papers by date range
router.get('/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const papers = await CompanyPaper.find({
      status: 'active',
      uploadDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ uploadDate: -1 });

    res.json({
      success: true,
      papers: papers.map(paper => ({
        id: paper._id,
        fileName: paper.fileName,
        originalName: paper.originalName,
        uploadDate: paper.uploadDate,
        category: paper.category,
        description: paper.description,
        fileSize: paper.fileSize
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching papers by date range' 
    });
  }
});

// Search papers by description
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const papers = await CompanyPaper.find({
      status: 'active',
      $or: [
        { description: { $regex: query, $options: 'i' } },
        { originalName: { $regex: query, $options: 'i' } }
      ]
    }).sort({ uploadDate: -1 });

    res.json({
      success: true,
      papers: papers.map(paper => ({
        id: paper._id,
        fileName: paper.fileName,
        originalName: paper.originalName,
        uploadDate: paper.uploadDate,
        category: paper.category,
        description: paper.description,
        fileSize: paper.fileSize
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Error searching papers' 
    });
  }
});

// Get paper details by ID
router.get('/:id', async (req, res) => {
  try {
    const paper = await CompanyPaper.findOne({
      _id: req.params.id,
      status: 'active'
    });

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found'
      });
    }

    res.json({
      success: true,
      paper: {
        id: paper._id,
        fileName: paper.fileName,
        originalName: paper.originalName,
        uploadDate: paper.uploadDate,
        category: paper.category,
        description: paper.description,
        fileSize: paper.fileSize
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching paper details' 
    });
  }
});

module.exports = router; 