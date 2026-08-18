const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { register, login, getInviteDetails, acceptInvite, changePassword, updateProfile } = require('../controllers/authController');
const { loginLimiter, registerLimiter } = require('../middleware/securityMiddleware');

// Apply rate limiting to sensitive routes
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);

router.get('/invite/:token', getInviteDetails);
router.post('/invite/:token', acceptInvite);
router.put('/change-password', protect, changePassword);
router.put('/update-profile', protect, updateProfile);
router.put('/mark-welcome-seen', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.userId || req.user._id, {
      hasSeenWelcome: true
    });
    res.json({ message: 'Welcome marked as seen' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.get('/trial-status', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.userId || req.user._id);
    
    let trialUser = user;
    if (user.role !== 'admin' && user.companyId) {
      trialUser = await User.findOne({ companyId: user.companyId, role: 'admin' });
    }

    if (!trialUser || !trialUser.trialEndDate) {
      return res.json({ trialStatus: 'upgraded', daysRemaining: null });
    }

    const now = new Date();
    const trialEnd = new Date(trialUser.trialEndDate);
    const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

    if (now > trialEnd && trialUser.trialStatus === 'active') {
      return res.status(403).json({ 
        trialStatus: 'expired', 
        daysRemaining: 0,
        trialExpired: true 
      });
    }

    res.json({
      trialStatus: trialUser.trialStatus,
      daysRemaining,
      trialEndDate: trialEnd
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.get('/ping', (req, res) => {
  res.json({ message: "Auth routes are alive and working!" });
});

module.exports = router;