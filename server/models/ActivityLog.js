const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  userRole: { 
    type: String, 
    enum: ['admin', 'worker', 'factory_worker'] 
  },
  action: { 
    type: String, 
    required: true 
  },
  details: { 
    type: String, 
    required: true 
  }
}, { 
  timestamps: true 
});

// 👇 CORRECT: Use the exact schema variable name 👇
activityLogSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
