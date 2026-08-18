const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Branch = require('../models/Branch');
const { protect } = require('../middleware/authMiddleware');

// SUPER ADMIN EMAIL (Only this email can access billing)
const SUPER_ADMIN_EMAIL = 'welcome@gmail.com';

// Middleware to check if user is super admin
const isSuperAdmin = (req, res, next) => {
  if (req.user.email !== SUPER_ADMIN_EMAIL) {
    return res.status(403).json({ message: 'Access denied. Super admin only.' });
  }
  next();
};

// Plan configurations
const PLAN_CONFIGS = {
  free_trial: { name: 'Free Trial', branchLimit: 1, price: 0 },
  starter: { name: 'Starter', branchLimit: 1, price: 5000 },
  business: { name: 'Business', branchLimit: 3, price: 10000 },
  enterprise: { name: 'Enterprise', branchLimit: 999, price: 20000 } // 999 = unlimited
};

// GET all companies (for billing dashboard)
router.get('/companies', protect, isSuperAdmin, async (req, res) => {
  try {
    // Get all admin users (each admin = one company)
    const companies = await User.find({ role: 'admin' })
      .select('-password -inviteToken')
      .sort({ createdAt: -1 });

    // For each company, count their branches
    const companiesWithBranchCount = await Promise.all(
      companies.map(async (company) => {
        const branchCount = await Branch.countDocuments({ companyId: company.companyId });
        
        // Calculate days remaining
        let daysRemaining = null;
        if (company.trialEndDate && company.plan === 'free_trial') {
          const now = new Date();
          const trialEnd = new Date(company.trialEndDate);
          daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        } else if (company.planExpiry && company.plan !== 'free_trial') {
          const now = new Date();
          const planEnd = new Date(company.planExpiry);
          daysRemaining = Math.ceil((planEnd - now) / (1000 * 60 * 60 * 24));
        }

        return {
          _id: company._id,
          companyId: company.companyId,
          name: company.name,
          email: company.email,
          plan: company.plan,
          branchLimit: company.branchLimit,
          branchCount: branchCount,
          trialEndDate: company.trialEndDate,
          planExpiry: company.planExpiry,
          daysRemaining: daysRemaining,
          status: company.status,
          createdAt: company.createdAt
        };
      })
    );

    res.json({ companies: companiesWithBranchCount, planConfigs: PLAN_CONFIGS });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// UPDATE company plan (extend trial or upgrade)
router.put('/companies/:companyId/plan', protect, isSuperAdmin, async (req, res) => {
  try {
    const { plan, extendDays } = req.body;
    const { companyId } = req.params;

    // Find the admin user for this company
    const admin = await User.findOne({ companyId: companyId, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const planConfig = PLAN_CONFIGS[plan];
    if (!planConfig) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    // Update the plan
    admin.plan = plan;
    admin.branchLimit = planConfig.branchLimit;
    admin.trialStatus = plan === 'free_trial' ? 'active' : 'upgraded';

    // Set expiry date
    if (extendDays && extendDays > 0) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + extendDays);
      
      if (plan === 'free_trial') {
        admin.trialEndDate = expiryDate;
      } else {
        admin.planExpiry = expiryDate;
      }
    }

    await admin.save();

    res.json({ 
      message: `Company updated to ${planConfig.name} plan`,
      admin 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// BLOCK/UNBLOCK company
router.put('/companies/:companyId/status', protect, isSuperAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { companyId } = req.params;

    // Update all users in this company
    await User.updateMany(
      { companyId: companyId },
      { status: status }
    );

    res.json({ message: `Company ${status === 'active' ? 'unblocked' : 'blocked'}` });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;