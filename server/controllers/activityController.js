const ActivityLog = require('../models/ActivityLog');

exports.getLogs = async (req, res) => {
  try {
    // Get the 50 most recent activities
   const logs = await ActivityLog.find({ companyId: req.user.companyId }).sort({ createdAt: -1 });
    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};