const User = require('../models/User');

exports.checkTrial = async (req, res, next) => {
  try {
    // Find the user
    const user = await User.findById(req.user.userId || req.user._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // If user is not admin, check the company's admin trial status
    let trialUser = user;
    if (user.role !== 'admin' && user.companyId) {
      // Find the admin of this company
      trialUser = await User.findOne({ companyId: user.companyId, role: 'admin' });
    }

    if (!trialUser || !trialUser.trialEndDate) {
      return next(); // No trial set, allow access (for upgraded accounts)
    }

    const now = new Date();
    const trialEnd = new Date(trialUser.trialEndDate);
    const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

    // If trial expired, block access
    if (now > trialEnd && trialUser.trialStatus === 'active') {
      // Update status to expired
      trialUser.trialStatus = 'expired';
      await trialUser.save();
      
      return res.status(403).json({ 
        message: 'Your 21-day free trial has expired. Please contact us to upgrade.',
        trialExpired: true,
        daysRemaining: 0
      });
    }

    // Attach trial info to request
    req.trialInfo = {
      daysRemaining,
      trialEndDate: trialEnd,
      trialStatus: trialUser.trialStatus
    };

    next();
  } catch (error) {
    console.error('Trial check error:', error);
    next(); // Allow access if there's an error (don't lock users out by mistake)
  }
};