const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, default: null }, // <-- ADDED FOR SAAS SECURITY
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'success', 'danger'], default: 'info' },
  isRead: { type: Boolean, default: false },
  targetRole: { type: String, enum: ['admin', 'worker', 'factory_worker', 'all'], default: 'admin' } 
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);