const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const reportController = require('../controllers/reportController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/reports/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Get all reports for a company
router.get('/', async (req, res) => {
  try {
    const reports = await reportController.getAllReports(null);
    res.json({
      success: true,
      data: reports.map(report => ({
        id: report._id,
        shopName: report.shopName,
        location: report.location,
        notice: report.notice,
        photo: report.photo,
        video: report.video,
        generatedDate: report.generatedDate,
        createdAt: report.createdAt
      }))
    });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching reports'
      }
    });
  }
});

// Get report by ID
router.get('/:id', async (req, res) => {
  try {
    const report = await reportController.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'Report not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        id: report._id,
        shopName: report.shopName,
        location: report.location,
        notice: report.notice,
        photo: report.photo,
        video: report.video,
        generatedDate: report.generatedDate,
        createdAt: report.createdAt
      }
    });
  } catch (err) {
    console.error('Error fetching report details:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching report details'
      }
    });
  }
});

// Generate new report
router.post('/generate', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { shopName, location, notice } = req.body;

    // Get file paths if files were uploaded
    const photo = req.files?.photo ? req.files.photo[0].path : null;
    const video = req.files?.video ? req.files.video[0].path : null;

    const report = await reportController.generateReport({
      shopName,
      location,
      notice,
      photo,
      video,
      generatedDate: new Date(),
      companyId: null
    });

    res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      data: {
        id: report._id,
        shopName: report.shopName,
        location: report.location,
        notice: report.notice,
        photo: report.photo,
        video: report.video,
        generatedDate: report.generatedDate,
        createdAt: report.createdAt
      }
    });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error generating report',
        details: err.message
      }
    });
  }
});

// Add new report
router.post('/add', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { shopName, location, notice } = req.body;

    // Get file paths if files were uploaded
    const photo = req.files?.photo ? req.files.photo[0].path : null;
    const video = req.files?.video ? req.files.video[0].path : null;

    const report = await reportController.generateReport({
      shopName,
      location,
      notice,
      photo,
      video,
      generatedDate: new Date(),
      companyId: null
    });

    res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      data: {
        id: report._id,
        shopName: report.shopName,
        location: report.location,
        notice: report.notice,
        photo: report.photo,
        video: report.video,
        generatedDate: report.generatedDate,
        createdAt: report.createdAt
      }
    });
  } catch (err) {
    console.error('Error in /add route:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error generating report',
        details: err.message
      }
    });
  }
});

// Archive report
router.delete('/archive/:id', async (req, res) => {
  try {
    const report = await reportController.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'Report not found'
        }
      });
    }

    await reportController.archiveReport(req.params.id);

    res.json({
      success: true,
      message: 'Report archived successfully'
    });
  } catch (err) {
    console.error('Error archiving report:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error archiving report'
      }
    });
  }
});

module.exports = router; 