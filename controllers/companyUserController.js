const CompanyUser = require('../models/CompanyUser');
const jwt = require('jsonwebtoken');

// Get all company users
exports.getAllCompanyUsers = async (req, res) => {
  try {
    const companyUsers = await CompanyUser.find().select('-password -resetPasswordToken -resetPasswordExpires');
    const baseUrl = req.protocol + '://' + req.get('host');
    const usersWithUrls = companyUsers.map(user => {
      const userObj = user.toObject();
      if (userObj.profilePicture) {
        userObj.profilePicture = `${baseUrl}/uploads/company-users/${userObj.profilePicture}`;
      }
      return userObj;
    });
    res.status(200).json(usersWithUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single company user by ID
exports.getCompanyUserById = async (req, res) => {
  try {
    const companyUser = await CompanyUser.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires');
    if (!companyUser) {
      return res.status(404).json({ message: 'Company user not found' });
    }
    const baseUrl = req.protocol + '://' + req.get('host');
    const userObj = companyUser.toObject();
    if (userObj.profilePicture) {
      userObj.profilePicture = `${baseUrl}/uploads/company-users/${userObj.profilePicture}`;
    }
    res.status(200).json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new company user
exports.createCompanyUser = async (req, res) => {
  try {
    const companyUser = new CompanyUser(req.body);
    const newCompanyUser = await companyUser.save();
    const userResponse = newCompanyUser.toObject();
    delete userResponse.password;
    delete userResponse.resetPasswordToken;
    delete userResponse.resetPasswordExpires;
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update company user
exports.updateCompanyUser = async (req, res) => {
  try {
    const companyUser = await CompanyUser.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');
    
    if (!companyUser) {
      return res.status(404).json({ message: 'Company user not found' });
    }
    res.status(200).json(companyUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete company user
exports.deleteCompanyUser = async (req, res) => {
  try {
    const companyUser = await CompanyUser.findById(req.params.id);
    if (!companyUser) {
      return res.status(404).json({ message: 'Company user not found' });
    }
    companyUser.name = 'deleted';
    await companyUser.save();
    res.status(200).json({ message: 'Company user anonymized successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login company user
exports.login = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;
    
    // Find company user by mobile number
    const companyUser = await CompanyUser.findOne({ mobileNumber });
    if (!companyUser) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await companyUser.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: companyUser._id, role: 'company' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: companyUser._id,
        companyName: companyUser.companyName,
        companyType: companyUser.companyType,
        mobileNumber: companyUser.mobileNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 