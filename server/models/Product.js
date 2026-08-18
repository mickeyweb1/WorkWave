const mongoose = require('mongoose');

// This is the schema for the "Branch Assignments" inside the product
const branchInventorySchema = new mongoose.Schema({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  sellingPrice: { type: Number, required: true, default: 0 },
  stockQuantity: { type: Number, required: true, default: 0 }
}, { _id: false }); // _id: false keeps the database clean

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'General' },
  size: { type: String, default: '' },
  unit: { type: String, default: 'piece' },
  costPrice: { type: Number, required: true, default: 0 }, 
  
  // THE MAGIC ARRAY: Holds price and stock for each specific branch
  branchInventory: [branchInventorySchema], 
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // 👇 THE MISSING PIECE! Add companyId to the root of the product 👇
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true } 
}, { timestamps: true });

productSchema.index({ companyId: 1 });

module.exports = mongoose.model('Product', productSchema);