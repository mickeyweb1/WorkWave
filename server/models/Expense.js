const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  
  // 👇 REMOVED THE 'enum' RESTRICTION HERE 👇
  // Now the Secretary can type ANY category name!
  category: { type: String, required: true }, 
  
  description: { type: String, default: '' },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'Cash' },
  receiptUrl: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

expenseSchema.index({ companyId: 1, createdAt: -1 });
expenseSchema.index({ branchId: 1, createdAt: -1 });

module.exports = mongoose.model('Expense', expenseSchema);