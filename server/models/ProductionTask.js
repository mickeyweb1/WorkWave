const mongoose = require('mongoose');

const productionTaskSchema = new mongoose.Schema({
  // SaaS Security
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true },

  // What product to make
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },

  // How much to make
  targetKg: { type: Number, required: true },

  // Which shift
  shift: { type: String, enum: ['morning', 'night'], default: 'morning' },

  // Who assigned the task (Supervisor)
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Who is doing the task (Factory Worker)
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Task status
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },

  // Optional notes
  notes: { type: String, default: '' }

}, { timestamps: true });

module.exports = mongoose.model('ProductionTask', productionTaskSchema);