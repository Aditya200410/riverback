const Note = require('../models/Note');

// Add a new note
exports.addNote = async (req, res) => {
  try {
    const { note, managerId, companyId } = req.body;
    const photo = req.file ? req.file.filename : null;

    if (!note) {
      return res.status(400).json({ success: false, message: 'Note is required' });
    }

    const newNote = new Note({ note, photo, managerId, companyId });
    await newNote.save();

    res.status(201).json({ success: true, data: newNote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get notes (optionally filter by managerId and companyId)
exports.getNotes = async (req, res) => {
  try {
    const { managerId, companyId } = req.query;
    const filter = {};
    if (managerId) filter.managerId = managerId;
    if (companyId) filter.companyId = companyId;
    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 