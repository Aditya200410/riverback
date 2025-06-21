const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CompanyPaper = require('../models/CompanyPaper');
const pdf = require('pdf-lib');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Company papers router is working'
  });
});

// Test static file serving
router.get('/test-file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', 'company-papers', filename);
    
    if (fs.existsSync(filePath)) {
      res.json({
        success: true,
        message: 'File exists',
        filename: filename,
        filePath: filePath,
        fileSize: fs.statSync(filePath).size
      });
    } else {
      res.json({
        success: false,
        message: 'File does not exist',
        filename: filename,
        filePath: filePath
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Error checking file: ' + err.message
    });
  }
});

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
    console.log('Upload request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded'
        }
      });
    }

    const { description, companyName, companyId } = req.body;

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', 'uploads', 'company-papers');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'paper-' + uniqueSuffix + '.pdf';
    tempFilePath = path.join(uploadDir, filename);

    console.log('Compressing PDF...');
    // Compress PDF
    const compressedBuffer = await compressPDF(req.file.buffer);

    console.log('Writing file...');
    // Write compressed file
    await writeFileAsync(tempFilePath, compressedBuffer);

    console.log('Creating paper record...');
    const paper = new CompanyPaper({
      fileName: filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: compressedBuffer.length,
      uploadedBy: null,
      companyId: companyId || null,
      companyName: companyName || 'Unknown Company',
      description: description || '',
      category: 'other'
    });

    await paper.save();
    console.log('Paper saved successfully');

    const baseUrl = req.protocol + '://' + req.get('host');
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
        fileSize: paper.fileSize,
        companyName: paper.companyName,
        companyId: paper.companyId,
        pdfUrl: `${baseUrl}/uploads/company-papers/${paper.fileName}`
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
        message: 'Error uploading paper: ' + err.message
      }
    });
  }
});

// Get all papers for a company
router.get('/papers', async (req, res) => {
  try {
    console.log('Fetching all papers...');
    
    const papers = await CompanyPaper.find({ 
      status: 'active'
    }).sort({ uploadDate: -1 });

    console.log(`Found ${papers.length} papers`);

    const baseUrl = req.protocol + '://' + req.get('host');
    console.log('Base URL:', baseUrl);
    
    const papersWithUrls = papers.map(paper => {
      const pdfUrl = `${baseUrl}/uploads/company-papers/${paper.fileName}`;
      console.log(`Generated PDF URL for ${paper.fileName}:`, pdfUrl);
      
      // Check if file exists
      const filePath = path.join(__dirname, '..', 'uploads', 'company-papers', paper.fileName);
      const fileExists = fs.existsSync(filePath);
      console.log(`File exists for ${paper.fileName}:`, fileExists);
      
      return {
        id: paper._id,
        fileName: paper.fileName,
        originalName: paper.originalName,
        uploadDate: paper.uploadDate,
        category: paper.category,
        description: paper.description,
        fileSize: paper.fileSize,
        companyName: paper.companyName || 'Unknown Company',
        companyId: paper.companyId || null,
        pdfUrl: pdfUrl,
        fileExists: fileExists
      };
    });

    res.json({
      success: true,
      data: papersWithUrls
    });
  } catch (err) {
    console.error('Error fetching papers:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching papers: ' + err.message
      }
    });
  }
});

// Get all papers (including inactive) for debugging
router.get('/papers/all', async (req, res) => {
  try {
    const papers = await CompanyPaper.find({}).sort({ uploadDate: -1 });

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
        status: paper.status,
        companyName: paper.companyName || 'Unknown Company',
        companyId: paper.companyId || null,
        pdfUrl: `${baseUrl}/uploads/company-papers/${paper.fileName}`
      }))
    });
  } catch (err) {
    console.error('Error fetching all papers:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching all papers'
      }
    });
  }
});

// Get a specific paper details
router.get('/papers/:id', async (req, res) => {
  try {
    console.log('Fetching paper with ID:', req.params.id);
    
    // Validate ID format
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid paper ID format'
        }
      });
    }

    const paper = await CompanyPaper.findOne({
      _id: req.params.id,
      status: 'active'
    });

    console.log('Paper found:', paper ? 'Yes' : 'No');

    if (!paper) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAPER_NOT_FOUND',
          message: 'Paper not found'
        }
      });
    }

    const baseUrl = req.protocol + '://' + req.get('host');
    const responseData = {
      success: true,
      data: {
        id: paper._id,
        fileName: paper.fileName,
        originalName: paper.originalName,
        uploadDate: paper.uploadDate,
        category: paper.category,
        description: paper.description,
        fileSize: paper.fileSize,
        companyName: paper.companyName || 'Unknown Company',
        companyId: paper.companyId || null,
        pdfUrl: `${baseUrl}/uploads/company-papers/${paper.fileName}`
      }
    };

    console.log('Sending response:', responseData);
    res.json(responseData);
  } catch (err) {
    console.error('Error fetching paper details:', err);
    
    // Handle specific MongoDB errors
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid paper ID format'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching paper details: ' + err.message
      }
    });
  }
});

// Download a specific paper file
router.get('/papers/:id/download', async (req, res) => {
  try {
    const paper = await CompanyPaper.findOne({
      _id: req.params.id,
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
    console.error('Error downloading paper:', err);
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

    const baseUrl = req.protocol + '://' + req.get('host');
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
        fileSize: paper.fileSize,
        pdfUrl: `${baseUrl}/uploads/company-papers/${paper.fileName}`
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
      category: req.params.category,
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
        message: 'Error fetching papers by category'
      }
    });
  }
});

module.exports = router; 