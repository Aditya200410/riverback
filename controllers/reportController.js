const Report = require('../models/Report');
const MoneyHandle = require('../models/MoneyHandle');
const Boat = require('../models/Boat');
const Sikari = require('../models/Sikari');
const Madhayam = require('../models/Madhayam');

// Get all reports for a company
exports.getAllReports = async (companyId) => {
  try {
    const query = companyId ? { companyId, status: 'active' } : { status: 'active' };
    return await Report.find(query)
      .sort({ createdAt: -1 })
      .populate('generatedBy', 'name email');
  } catch (err) {
    console.error('Error in getAllReports:', err);
    throw err;
  }
};

// Get report by ID
exports.getReportById = async (id) => {
  try {
    return await Report.findOne({ _id: id, status: 'active' })
      .populate('generatedBy', 'name email');
  } catch (err) {
    console.error('Error in getReportById:', err);
    throw err;
  }
};

// Generate report
exports.generateReport = async (reportData) => {
  try {
    const {
      reportType,
      startDate,
      endDate,
      generatedBy,
      companyId
    } = reportData;

    // Calculate report data based on type
    let calculatedReportData = {};
    
    switch (reportType) {
      case 'daily':
      case 'weekly':
      case 'monthly':
      case 'yearly':
      case 'custom':
        // Get financial data
        const financialQuery = companyId ? 
          { companyId, date: { $gte: startDate, $lte: endDate }, status: 'active' } :
          { date: { $gte: startDate, $lte: endDate }, status: 'active' };
        const financialData = await MoneyHandle.find(financialQuery);

        // Get boat data
        const boatQuery = companyId ? 
          { companyId, createdAt: { $gte: startDate, $lte: endDate }, status: 'active' } :
          { createdAt: { $gte: startDate, $lte: endDate }, status: 'active' };
        const boatData = await Boat.find(boatQuery);

        // Get sikari data
        const sikariQuery = companyId ? 
          { companyId, createdAt: { $gte: startDate, $lte: endDate }, status: 'active' } :
          { createdAt: { $gte: startDate, $lte: endDate }, status: 'active' };
        const sikariData = await Sikari.find(sikariQuery);

        // Get madhayam data
        const madhayamQuery = companyId ? 
          { companyId, createdAt: { $gte: startDate, $lte: endDate }, status: 'active' } :
          { createdAt: { $gte: startDate, $lte: endDate }, status: 'active' };
        const madhayamData = await Madhayam.find(madhayamQuery);

        // Calculate totals
        const totalIncome = financialData
          .filter(transaction => transaction.type === 'pay')
          .reduce((sum, transaction) => sum + transaction.amount, 0);

        const totalExpense = financialData
          .filter(transaction => transaction.type === 'take')
          .reduce((sum, transaction) => sum + transaction.amount, 0);

        calculatedReportData = {
          financial: {
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense,
            transactions: financialData
          },
          boats: {
            total: boatData.length,
            details: boatData
          },
          sikaris: {
            total: sikariData.length,
            details: sikariData
          },
          madhayams: {
            total: madhayamData.length,
            details: madhayamData
          }
        };
        break;

      default:
        throw new Error('Invalid report type');
    }

    // Create and save report
    const report = new Report({
      reportType,
      startDate,
      endDate,
      reportData: calculatedReportData,
      generatedBy,
      companyId
    });

    return await report.save();
  } catch (err) {
    console.error('Error in generateReport:', err);
    throw err;
  }
};

// Archive report
exports.archiveReport = async (id) => {
  try {
    return await Report.findByIdAndUpdate(
      id,
      { $set: { status: 'archived' } },
      { new: true }
    );
  } catch (err) {
    console.error('Error in archiveReport:', err);
    throw err;
  }
};

// Get reports by shop name
exports.getReportsByShop = async (req, res) => {
    try {
        const shopName = req.query.shopName;
        const reports = await Report.find({ 
            shopName: shopName,
            status: 'active' 
        }).sort({ createdAt: -1 });

        if (!reports.length) {
            return res.status(404).json({ message: 'No reports found for this shop' });
        }

        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new report
exports.createReport = async (req, res) => {
    try {
        const { shopName, notice } = req.body;
        
        // Handle file uploads if present
        const photo = req.files?.photo ? req.files.photo[0].path : null;
        const video = req.files?.video ? req.files.video[0].path : null;

        const report = new Report({
            shopName,
            notice,
            photo,
            video,
            status: 'active'
        });

        const newReport = await report.save();
        res.status(201).json(newReport);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update report
exports.updateReport = async (req, res) => {
    try {
        const { shopName, notice } = req.body;
        
        // Handle file uploads if present
        const photo = req.files?.photo ? req.files.photo[0].path : undefined;
        const video = req.files?.video ? req.files.video[0].path : undefined;

        const updateData = {
            shopName,
            notice,
            ...(photo && { photo }),
            ...(video && { video })
        };

        const report = await Report.findOneAndUpdate(
            { _id: req.params.id, status: 'active' },
            updateData,
            { new: true, runValidators: true }
        );

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.status(200).json(report);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete report (soft delete)
exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findOneAndUpdate(
            { _id: req.params.id, status: 'active' },
            { status: 'deleted' },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.status(200).json({ message: 'Report deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 