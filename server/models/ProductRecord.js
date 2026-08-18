const mongoose = require('mongoose');

const productRecordSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  // Production info (filled when goods come IN)
  kg: { type: Number, required: true },
  size: { type: String, default: '' },
  thickness: { type: String, default: '' },
  shift: { type: String, enum: ['morning', 'night'], default: 'morning' },
  dateIn: { type: Date, default: Date.now },
  companyId: { type: mongoose.Schema.Types.ObjectId, default: null }, 

  // Sale info (filled when goods go OUT)
  dateOut: { type: Date, default: null },
  customerName: { type: String, default: '' },
  pricePerKg: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paymentType: { type: String, enum: ['cash', 'credit', ''], default: '' },
  discount: { type: Number, default: 0 },          
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' }, 

  // Status
  status: { type: String, enum: ['pending', 'verified', 'sold'], default: 'pending' },

  // Who recorded it
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Who approved this production?
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }

}, { timestamps: true });

module.exports = mongoose.model('ProductRecord', productRecordSchema);