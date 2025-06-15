const Report = require('../models/Report');

// Get all reports
exports.getAllReports = async (req, res) => {
    try {
        const reports = await Report.find({ status: 'active' })
            .sort({ createdAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
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