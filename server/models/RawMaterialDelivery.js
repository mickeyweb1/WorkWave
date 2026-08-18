const mongoose = require('mongoose');

const rawMaterialDeliverySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  rawMaterialId: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
  quantity: { type: Number, required: true },
  supplier: { type: String, default: '' },
  cost: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('RawMaterialDelivery', rawMaterialDeliverySchema);