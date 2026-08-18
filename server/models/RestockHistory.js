const mongoose = require('mongoose');

const restockHistorySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantityAdded: { type: Number, required: true },
  restockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('RestockHistory', restockHistorySchema);