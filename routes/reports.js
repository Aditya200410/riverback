const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth } = require('../middleware/auth');

// Get all reports for a company
router.get('/', auth(['company']), async (req, res) => {
  try {
    const reports = await reportController.getAllReports(req.user.companyId);
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
router.get('/:id', auth(['company']), async (req, res) => {
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

    // Check if report belongs to the company
    if (report.companyId.toString() !== req.user.companyId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have access to this report'
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
router.post('/generate', auth(['company']), async (req, res) => {
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
      generatedBy: req.user._id,
      companyId: req.user.companyId
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
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error generating report'
      }
    });
  }
});

// Archive report
router.delete('/archive/:id', auth(['company']), async (req, res) => {
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

    // Check if report belongs to the company
    if (report.companyId.toString() !== req.user.companyId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have access to this report'
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