const Manager = require('../models/Manager');
const CompanyUser = require('../models/CompanyUser');
const SecurityUser = require('../models/SecurityUser');

// Generate Manager ID (MN101, MN102, etc.)
async function generateManagerId() {
  try {
    const lastManager = await Manager.findOne().sort({ managerId: -1 });
    let nextNumber = 1;
    
    if (lastManager && lastManager.managerId) {
      const lastNumber = parseInt(lastManager.managerId.replace('MN', ''));
      nextNumber = lastNumber + 1;
    }
    
    return `MN${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating manager ID:', error);
    throw error;
  }
}

// Generate Company ID (CPM101, CPM102, etc.)
async function generateCompanyId() {
  try {
    const lastCompany = await CompanyUser.findOne().sort({ companyId: -1 });
    let nextNumber = 1;
    
    if (lastCompany && lastCompany.companyId) {
      const lastNumber = parseInt(lastCompany.companyId.replace('CPM', ''));
      nextNumber = lastNumber + 1;
    }
    
    return `CPM${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating company ID:', error);
    throw error;
  }
}

// Generate Security ID (SCU101, SCU102, etc.)
async function generateSecurityId() {
  try {
    const lastSecurity = await SecurityUser.findOne().sort({ securityId: -1 });
    let nextNumber = 1;
    
    if (lastSecurity && lastSecurity.securityId) {
      const lastNumber = parseInt(lastSecurity.securityId.replace('SCU', ''));
      nextNumber = lastNumber + 1;
    }
    
    return `SCU${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating security ID:', error);
    throw error;
  }
}

module.exports = {
  generateManagerId,
  generateCompanyId,
  generateSecurityId
}; 