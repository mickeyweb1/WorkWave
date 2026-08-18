const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'worker', 'factory_worker'], 
    default: 'worker' 
  },
  companyId: { type: mongoose.Schema.Types.ObjectId, default: null },
  
  phone: { type: String, default: '' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  inviteToken: { type: String, default: null },
  
  // Trial fields
  trialStartDate: { type: Date, default: null },
  trialEndDate: { type: Date, default: null },
  trialStatus: { type: String, enum: ['active', 'expired', 'upgraded'], default: 'active' },
  
  // 👇 ADD THESE NEW PLAN FIELDS 👇
  plan: { 
    type: String, 
    enum: ['free_trial', 'starter', 'business', 'enterprise'], 
    default: 'free_trial' 
  },
  branchLimit: { type: Number, default: 1 }, // Max branches allowed
  planExpiry: { type: Date, default: null }, // When paid plan expires
  
  hasSeenWelcome: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);