const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CompanyPaper = require('../models/CompanyPaper');
const { auth } = require('../middleware/auth');
const pdf = require('pdf-lib');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

// Configure multer for PDF storage with memory storage for better performance
const storage = multer.memoryStorage();

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

// Function to compress PDF
async function compressPDF(buffer) {
  try {
    const pdfDoc = await pdf.PDFDocument.load(buffer);
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });
    return compressedPdfBytes;
  } catch (error) {
    console.error('Error compressing PDF:', error);
    return buffer; // Return original buffer if compression fails
  }
}

// Upload a new company paper
router.post('/upload', upload.single('file'), async (req, res) => {
  let tempFilePath = null;
  
  try {
    const { description } = req.body;

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', 'uploads', 'company-papers');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'paper-' + uniqueSuffix + '.pdf';
    tempFilePath = path.join(uploadDir, filename);

    // Compress PDF
    const compressedBuffer = await compressPDF(req.file.buffer);

    // Write compressed file
    await writeFileAsync(tempFilePath, compressedBuffer);

    const paper = new CompanyPaper({
      fileName: filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: compressedBuffer.length,
      uploadedBy: req.user.id,
      companyId: req.user.id,
      description: description || '',
      category: 'other'
    });

    await paper.save();

    res.status(201).json({
      success: true,
      message: 'Paper uploaded successfully',
      data: {
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
    console.error('Error uploading paper:', err);
    
    // Clean up temporary file if it exists
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await unlinkAsync(tempFilePath);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }

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
router.get('/papers', async (req, res) => {
  try {
    const papers = await CompanyPaper.find({ 
      companyId: req.user.id,
      status: 'active'
    }).sort({ uploadDate: -1 });

    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      success: true,
      data: papers.map(paper => ({
        id: paper._id,
        fileName: paper.fileName,
        originalName: paper.originalName,
        uploadDate: paper.uploadDate,
        category: paper.category,
        description: paper.description,
        fileSize: paper.fileSize,
        pdfUrl: `${baseUrl}/uploads/company-papers/${paper.fileName}`
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
router.get('/papers/:id', async (req, res) => {
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
router.put('/papers/:id', async (req, res) => {
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
      data: {
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
router.delete('/papers/:id', async (req, res) => {
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
      await unlinkAsync(filePath);
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
router.get('/papers/category/:category', async (req, res) => {
  try {
    const papers = await CompanyPaper.find({
      companyId: req.user.id,
      category: req.params.category,
      status: 'active'
    }).sort({ uploadDate: -1 });

    res.json({
      success: true,
      data: papers.map(paper => ({
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