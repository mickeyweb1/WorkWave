const Notification = require('../models/Notification');

// 1. Get Notifications (Admin sees everything, Workers see only their role)
exports.getNotifications = async (req, res) => {
  try {
    let query = {};
    
    // If the user is a worker, only show notifications for 'worker' or 'all'
    if (req.user.role === 'worker') {
      query.targetRole = { $in: ['worker', 'all'] };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(20); // Only get the latest 20

    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({ message: "All notifications marked as read." });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 2. Mark Notification as Read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id, 
      { isRead: true }, 
      { new: true }
    );
    res.status(200).json({ notification });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 3. Create a Notification (Internal helper function for other controllers to use)
exports.createNotification = async (title, message, type, targetRole = 'admin') => {
  try {
    await Notification.create({ title, message, type, targetRole });
  } catch (error) {
    console.error("Notification creation failed:", error);
  }
};