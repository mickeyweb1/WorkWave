const mongoose = require('mongoose');

const rawMaterialTransactionSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  rawMaterialId: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
  
  type: { type: String, enum: ['in', 'out'], required: true },
  quantity: { type: Number, required: true },
  
  details: { type: String, default: '' },
  
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('RawMaterialTransaction', rawMaterialTransactionSchema);