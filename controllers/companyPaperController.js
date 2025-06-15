const CompanyPaper = require('../models/CompanyPaper');

// Get all company papers
exports.getAllPapers = async (req, res) => {
  try {
    const papers = await CompanyPaper.find({ status: 'active' })
      .populate('uploadedBy', 'name email')
      .populate('companyId', 'name');
    res.status(200).json(papers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single paper by ID
exports.getPaperById = async (req, res) => {
  try {
    const paper = await CompanyPaper.findOne({ _id: req.params.id, status: 'active' })
      .populate('uploadedBy', 'name email')
      .populate('companyId', 'name');
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }
    res.status(200).json(paper);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new paper
exports.createPaper = async (req, res) => {
  try {
    const paper = new CompanyPaper(req.body);
    const newPaper = await paper.save();
    res.status(201).json(newPaper);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update paper
exports.updatePaper = async (req, res) => {
  try {
    const paper = await CompanyPaper.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      req.body,
      { new: true, runValidators: true }
    );
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }
    res.status(200).json(paper);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete paper (soft delete)
exports.deletePaper = async (req, res) => {
  try {
    const paper = await CompanyPaper.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      { status: 'deleted' },
      { new: true }
    );
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }
    res.status(200).json({ message: 'Paper deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Archive paper
exports.archivePaper = async (req, res) => {
  try {
    const paper = await CompanyPaper.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      { status: 'archived' },
      { new: true }
    );
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }
    res.status(200).json({ message: 'Paper archived successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 