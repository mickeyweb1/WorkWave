const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null }, // <-- ADD THIS!
  name: { type: String, required: true, trim: true },
  unit: { type: String, default: 'kg' },
  currentStock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
}, { timestamps: true });

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);