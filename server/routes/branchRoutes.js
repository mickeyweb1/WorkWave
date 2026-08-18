const express = require('express');
const router = express.Router();
const { 
  createBranch, 
  getAllBranches, 
  getSingleBranch, 
  deleteBranch 
} = require('../controllers/branchController');

// 👇 ADD THESE IMPORTS 👇
const User = require('../models/User');
const Branch = require('../models/Branch');

// Import our new Security Guards!
const { protect, adminOnly } = require('../middleware/authMiddleware');

// POST /api/branches -> Create a new branch
// We use 'next' to pass control to createBranch if the limit check passes
router.post('/', protect, async (req, res, next) => {
  try {
    console.log('🔍 Branch creation attempt by:', req.user.email);
    
    const admin = await User.findOne({ companyId: req.user.companyId, role: 'admin' });
    
    if (!admin) {
      return res.status(404).json({ message: 'Company admin not found' });
    }

    // 👇 THE FIX: Default to 1 if branchLimit is undefined 👇
    const branchLimit = admin.branchLimit || 1;
    
    console.log('🔍 Admin found:', admin?.email);
    console.log('🔍 Branch limit:', branchLimit);
    
    const currentBranchCount = await Branch.countDocuments({ companyId: req.user.companyId });
    console.log('🔍 Current branches:', currentBranchCount);
    
    if (currentBranchCount >= branchLimit) {
      const planName = admin.plan === 'free_trial' ? 'Free Trial' : 
                       (admin.plan || 'free_trial').charAt(0).toUpperCase() + (admin.plan || 'free_trial').slice(1);
      console.log('❌ Block! Limit reached');
      return res.status(403).json({ 
        message: `Branch limit reached! Your ${planName} plan allows ${branchLimit} branch${branchLimit > 1 ? 'es' : ''}. Please upgrade to add more.` 
      });
    }

    console.log('✅ Allowing branch creation');
    next();
    
  } catch (error) {
    console.error('❌ Branch limit check error:', error);
    res.status(500).json({ message: 'Server Error checking limit', error: error.message });
  }
}, createBranch);

// GET /api/branches -> Get all branches
router.get('/', protect, getAllBranches);

// GET /api/branches/:id -> Get a single branch
router.get('/:id', protect, getSingleBranch);

// DELETE /api/branches/:id -> Delete a branch
router.delete('/:id', protect, adminOnly, deleteBranch);

module.exports = router;