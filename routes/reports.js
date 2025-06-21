const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Get all reports for a company
router.get('/', async (req, res) => {
  try {
    const reports = await reportController.getAllReports(null);
    res.json({
      success: true,
      data: reports.map(report => ({
        id: report._id,
        reportType: report.reportType,
        startDate: report.startDate,
        endDate: report.endDate,
        generatedBy: report.generatedBy,
        createdAt: report.createdAt,
        financial: {
          totalIncome: report.reportData.financial.totalIncome,
          totalExpense: report.reportData.financial.totalExpense,
          netProfit: report.reportData.financial.netProfit
        },
        summary: {
          totalBoats: report.reportData.boats.total,
          totalSikaris: report.reportData.sikaris.total,
          totalMadhayams: report.reportData.madhayams.total
        }
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
        reportType: report.reportType,
        startDate: report.startDate,
        endDate: report.endDate,
        generatedBy: report.generatedBy,
        createdAt: report.createdAt,
        reportData: report.reportData
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
router.post('/generate', async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.body;

    // Validate required fields
    const requiredFields = ['reportType', 'startDate', 'endDate'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: `Missing required fields: ${missingFields.join(', ')}`
        }
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATES',
          message: 'Invalid date format'
        }
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'Start date must be before end date'
        }
      });
    }

    // Validate report type
    const validTypes = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];
    if (!validTypes.includes(reportType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REPORT_TYPE',
          message: `Report type must be one of: ${validTypes.join(', ')}`
        }
      });
    }

    const report = await reportController.generateReport({
      reportType,
      startDate: start,
      endDate: end,
      generatedBy: null,
      companyId: null
    });

    res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      data: {
        id: report._id,
        reportType: report.reportType,
        startDate: report.startDate,
        endDate: report.endDate,
        createdAt: report.createdAt,
        financial: {
          totalIncome: report.reportData.financial.totalIncome,
          totalExpense: report.reportData.financial.totalExpense,
          netProfit: report.reportData.financial.netProfit
        },
        summary: {
          totalBoats: report.reportData.boats.total,
          totalSikaris: report.reportData.sikaris.total,
          totalMadhayams: report.reportData.madhayams.total
        }
      }
    });
  } catch (err) {
    console.error('Error generating report:', err);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validationErrors
        }
      });
    }

    if (err.message === 'Invalid report type') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REPORT_TYPE',
          message: 'Invalid report type provided'
        }
      });
    }

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