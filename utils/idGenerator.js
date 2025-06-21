const Manager = require('../models/Manager');
const CompanyUser = require('../models/CompanyUser');
const SecurityUser = require('../models/SecurityUser');

// Generate Manager ID (MN101, MN102, etc.)
async function generateManagerId() {
  const maxRetries = 5;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const lastManager = await Manager.findOne().sort({ managerId: -1 });
      let nextNumber = 1;
      
      if (lastManager && lastManager.managerId) {
        const lastNumber = parseInt(lastManager.managerId.replace('MN', ''));
        nextNumber = lastNumber + 1;
      }
      
      const newId = `MN${nextNumber.toString().padStart(3, '0')}`;
      
      // Check if this ID already exists (double-check for race conditions)
      const existingManager = await Manager.findOne({ managerId: newId });
      if (!existingManager) {
        return newId;
      }
      
      retries++;
      // Small delay to avoid immediate retry
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error generating manager ID:', error);
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error('Failed to generate unique manager ID after maximum retries');
}

// Generate Company ID (CPM101, CPM102, etc.)
async function generateCompanyId() {
  const maxRetries = 5;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const lastCompany = await CompanyUser.findOne().sort({ companyId: -1 });
      let nextNumber = 1;
      
      if (lastCompany && lastCompany.companyId) {
        const lastNumber = parseInt(lastCompany.companyId.replace('CPM', ''));
        nextNumber = lastNumber + 1;
      }
      
      const newId = `CPM${nextNumber.toString().padStart(3, '0')}`;
      
      // Check if this ID already exists (double-check for race conditions)
      const existingCompany = await CompanyUser.findOne({ companyId: newId });
      if (!existingCompany) {
        return newId;
      }
      
      retries++;
      // Small delay to avoid immediate retry
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error generating company ID:', error);
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error('Failed to generate unique company ID after maximum retries');
}

// Generate Security ID (SCU101, SCU102, etc.)
async function generateSecurityId() {
  const maxRetries = 5;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const lastSecurity = await SecurityUser.findOne().sort({ securityId: -1 });
      let nextNumber = 1;
      
      if (lastSecurity && lastSecurity.securityId) {
        const lastNumber = parseInt(lastSecurity.securityId.replace('SCU', ''));
        nextNumber = lastNumber + 1;
      }
      
      const newId = `SCU${nextNumber.toString().padStart(3, '0')}`;
      
      // Check if this ID already exists (double-check for race conditions)
      const existingSecurity = await SecurityUser.findOne({ securityId: newId });
      if (!existingSecurity) {
        return newId;
      }
      
      retries++;
      // Small delay to avoid immediate retry
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error generating security ID:', error);
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error('Failed to generate unique security ID after maximum retries');
}

module.exports = {
  generateManagerId,
  generateCompanyId,
  generateSecurityId
}; 