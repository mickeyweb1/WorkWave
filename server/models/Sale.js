const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    // We save the name here too, so if the product is deleted later, the sale record still makes sense
    type: String,
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true // quantity * unitPrice
  },
  buyerName: {
    type: String,
    default: 'Walk-in Customer'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Transfer', 'POS'],
    default: 'Cash'
  },
    status: {
    type: String,
    enum: ['completed', 'voided'],
    default: 'completed'
  },
  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true 
});

saleSchema.index({ companyId: 1, createdAt: -1 });
saleSchema.index({ branchId: 1, createdAt: -1 });
saleSchema.index({ productName: 1 });

module.exports = mongoose.model('Sale', saleSchema);
