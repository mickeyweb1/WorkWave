const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// Helper: Get the user's Company filter
const getCompanyFilter = (req) => {
  if (req.user.companyId) return { companyId: req.user.companyId };
  return {}; 
};

// Helper: Map role to targetRole filter
const getRoleFilter = (userRole) => {
  // Admin sees 'admin' + 'all'
  // Worker (Secretary) sees 'worker' + 'all'
  // Factory Worker sees 'factory_worker' + 'all'
  return { targetRole: { $in: [userRole, 'all'] } };
};

// GET all notifications (filtered by company AND role)
router.get('/', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);
    const roleFilter = getRoleFilter(req.user.role);
    
    const notifications = await Notification.find({
      ...companyFilter,
      ...roleFilter
    }).sort({ createdAt: -1 }).limit(50);
    
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// POST create a notification
router.post('/', protect, async (req, res) => {
  try {
    const { title, message, type, targetRole } = req.body;
    const notification = await Notification.create({
      companyId: req.user.companyId,
      title, 
      message, 
      type: type || 'info',
      targetRole: targetRole || 'all'
    });
    res.status(201).json({ notification });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// PUT mark one notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, ...companyFilter },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ notification });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// PUT mark all notifications as read
router.put('/mark-all-read', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);
    await Notification.updateMany(
      { ...companyFilter, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// DELETE clear all notifications
router.delete('/clear-all', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);
    await Notification.deleteMany(companyFilter);
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;