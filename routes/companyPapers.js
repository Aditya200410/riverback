const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CompanyPaper = require('../models/CompanyPaper');
const CompanyUser = require('../models/CompanyUser');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Configure multer for PDF storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/company-papers';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'paper-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware to protect routes
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ 
    success: false,
    error: {
      code: 'NO_TOKEN',
      message: 'No token, authorization denied'
    }
  });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ 
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      }
    });
  }
};

// Upload a new company paper
router.post('/upload', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded'
        }
      });
    }

    const { description, category } = req.body;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CATEGORY',
          message: 'Category is required'
        }
      });
    }

    const companyUser = await CompanyUser.findById(req.user.id);
    if (!companyUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found'
        }
      });
    }

    const paper = new CompanyPaper({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
      companyId: req.user.id,
      description: description || '',
      category: category
    });

    await paper.save();

    res.status(201).json({
      success: true,
      message: 'Paper uploaded successfully',
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
      error: {
        code: 'SERVER_ERROR',
        message: 'Error uploading paper'
      }
    });
  }
});

// Get all papers for a company
router.get('/papers', auth, async (req, res) => {
  try {
    const papers = await CompanyPaper.find({ 
      companyId: req.user.id,
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
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching papers'
      }
    });
  }
});

// Get a specific paper
router.get('/papers/:id', auth, async (req, res) => {
  try {
    const paper = await CompanyPaper.findOne({
      _id: req.params.id,
      companyId: req.user.id,
      status: 'active'
    });

    if (!paper) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAPER_NOT_FOUND',
          message: 'Paper not found'
        }
      });
    }

    const filePath = path.join(__dirname, '..', 'uploads', 'company-papers', paper.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found'
        }
      });
    }

    res.download(filePath, paper.originalName);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error downloading paper'
      }
    });
  }
});

// Update paper details
router.put('/papers/:id', auth, async (req, res) => {
  try {
    const { description, category } = req.body;
    
    const paper = await CompanyPaper.findOne({
      _id: req.params.id,
      companyId: req.user.id,
      status: 'active'
    });

    if (!paper) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAPER_NOT_FOUND',
          message: 'Paper not found'
        }
      });
    }

    if (description) paper.description = description;
    if (category) paper.category = category;

    await paper.save();

    res.json({
      success: true,
      message: 'Paper updated successfully',
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
      error: {
        code: 'SERVER_ERROR',
        message: 'Error updating paper'
      }
    });
  }
});

// Delete a paper (soft delete)
router.delete('/papers/:id', auth, async (req, res) => {
  try {
    const paper = await CompanyPaper.findOne({
      _id: req.params.id,
      companyId: req.user.id,
      status: 'active'
    });

    if (!paper) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAPER_NOT_FOUND',
          message: 'Paper not found'
        }
      });
    }

    paper.status = 'deleted';
    await paper.save();

    // Delete the actual file
    const filePath = path.join(__dirname, '..', 'uploads', 'company-papers', paper.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'Paper deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error deleting paper'
      }
    });
  }
});

// Get papers by category
router.get('/papers/category/:category', auth, async (req, res) => {
  try {
    const papers = await CompanyPaper.find({
      companyId: req.user.id,
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
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching papers by category'
      }
    });
  }
});

module.exports = router; 