const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ProductRecord = require('../models/ProductRecord');
const { protect } = require('../middleware/authMiddleware');

// Helper: Get the user's Company filter (Multi-Tenancy!)
const getCompanyFilter = (req) => {
  if (req.user.companyId) {
    return { companyId: req.user.companyId };
  }
  return {}; 
};

// GET all records for a product (the "book")
router.get('/product/:productId', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req); // FIXED
    
    const records = await ProductRecord.find({ 
      productId: req.params.productId,
      ...companyFilter  // <--- FIXED: was branchFilter
    })
      .populate('recordedBy', 'name')
      .populate('soldBy', 'name')
      .sort({ dateIn: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// GET summary
router.get('/product/:productId/summary', protect, async (req, res) => {
  try {
    const productId = new mongoose.Types.ObjectId(req.params.productId);
    const companyFilter = getCompanyFilter(req);

    const productionResult = await ProductRecord.aggregate([
      { $match: { productId: productId, ...companyFilter }},
      { $group: { _id: null, totalKg: { $sum: '$kg' } } }
    ]);

    const soldResult = await ProductRecord.aggregate([
      { $match: { productId: productId, status: 'sold', ...companyFilter }},
      { $group: { 
        _id: null, 
        totalKg: { $sum: '$kg' }, 
        totalRevenue: { $sum: '$totalAmount' } 
      }}
    ]);

    const totalProduced = productionResult[0]?.totalKg || 0;
    const totalSold = soldResult[0]?.totalKg || 0;
    const totalRevenue = soldResult[0]?.totalRevenue || 0;
    const currentStock = totalProduced - totalSold;

    res.json({ totalProduced, totalSold, currentStock, totalRevenue });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// GET all credit records (for the Debtors page) - SECURED!
router.get('/credits', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req); // FIXED
    
    const creditRecords = await ProductRecord.find({ 
      paymentType: 'credit',
      ...companyFilter  // <--- FIXED: was branchFilter
    })
      .populate('productId', 'name')
      .populate('soldBy', 'name')
      .sort({ dateOut: -1 });
    res.json(creditRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// POST: Record Production (Goods IN)
router.post('/production', protect, async (req, res) => {
  try {
    const { productId, kg, size, thickness, shift, taskId } = req.body;
    // If the user is admin or supervisor, it goes directly to 'verified'
    const status = req.user.role === 'factory_worker' ? 'pending' : 'verified';

    const record = await ProductRecord.create({
      productId,
      kg,
      size,
      thickness,
      shift,
      dateIn: new Date(),
      status: status,
      recordedBy: req.user._id,
      companyId: req.user.companyId,
      branchId: req.user.branchId || null
    });

    // If this was linked to a task, mark the task as completed
    if (taskId) {
      const ProductionTask = require('../models/ProductionTask');
      await ProductionTask.findOneAndUpdate(
        { _id: taskId, companyId: req.user.companyId },
        { status: 'completed' }
      );
    }

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// PUT: Record Sale (fill the RIGHT side of the row) - SECURED!
router.put('/sell/:recordId', protect, async (req, res) => {
  try {
    const { customerName, pricePerKg, discount, totalAmount, paymentType } = req.body;
    const companyFilter = getCompanyFilter(req);

    const record = await ProductRecord.findOneAndUpdate(
      { _id: req.params.recordId, ...companyFilter },  
      {
        dateOut: new Date(),
        customerName,
        pricePerKg,
        discount: discount || 0,
        totalAmount,
        paymentType,
        paymentStatus: paymentType === 'cash' ? 'paid' : 'pending',
        status: 'sold',
        soldBy: req.user._id
      },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: 'Record not found or unauthorized' });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// PUT: Mark a credit record as PAID - SECURED!
router.put('/:recordId/mark-paid', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);

    const record = await ProductRecord.findOneAndUpdate(
      { _id: req.params.recordId, ...companyFilter },  
      { paymentStatus: 'paid' },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: 'Record not found or unauthorized' });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// GET my own records (for the worker dashboard)
router.get('/my-shifts', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);
    
    // Find records where recordedBy matches the logged-in worker's ID
    const myRecords = await ProductRecord.find({ 
      recordedBy: req.user._id, 
      ...companyFilter 
    })
      .populate('productId', 'name')
      .sort({ dateIn: -1 })
      .limit(20); // Just show the latest 20 records
      
    res.json(myRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// PUT: Approve a pending production record (Supervisor accepts it)
router.put('/:recordId/approve', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);

    const record = await ProductRecord.findOneAndUpdate(
      { _id: req.params.recordId, status: 'pending', ...companyFilter },
      { 
        status: 'verified',
        approvedBy: req.user._id 
      },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: 'Pending record not found or unauthorized' });
    }

    res.json({ record, message: 'Production approved and added to stock!' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// PUT: Approve a pending production record (Admin OR Secretary)
router.put('/:recordId/approve', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);
    const Notification = require('../models/Notification');

    const record = await ProductRecord.findOneAndUpdate(
      { _id: req.params.recordId, status: 'pending', ...companyFilter },
      { 
        status: 'verified',
        approvedBy: req.user._id 
      },
      { new: true }
    ).populate('productId', 'name');

    if (!record) {
      return res.status(404).json({ message: 'Pending record not found or unauthorized' });
    }

    // 👇 SEND NOTIFICATION TO ADMIN (If Secretary approved it) 👇
    if (req.user.role === 'worker') {
      await Notification.create({
        companyId: req.user.companyId,
        title: 'Production Approved by Secretary ✅',
        message: `${req.user.name} approved ${record.kg} kg of ${record.productId?.name || 'production'}.`,
        type: 'success',
        targetRole: 'admin'
      });
    }

    res.json({ record, message: 'Production approved and added to stock!' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// GET: Pending records (for Supervisor to review)
router.get('/pending-review', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);

    const pendingRecords = await ProductRecord.find({
      status: 'pending',
      ...companyFilter
    })
      .populate('productId', 'name')
      .populate('recordedBy', 'name')
      .sort({ dateIn: -1 });

    res.json(pendingRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// POST: Bulk Record Production (Multiple Rolls at Once)
router.post('/production/bulk', protect, async (req, res) => {
  try {
    const { productId, rolls } = req.body;
    // rolls is an array like: [{ kg: 12.5, size: 'Large', thickness: '2mm' }, ...]

    if (!rolls || !Array.isArray(rolls) || rolls.length === 0) {
      return res.status(400).json({ message: 'No rolls provided' });
    }

    const status = req.user.role === 'factory_worker' ? 'pending' : 'verified';

    // Create all rolls at once
    const records = await ProductRecord.insertMany(
      rolls.map(roll => ({
        productId,
        kg: roll.kg,
        size: roll.size || '',
        thickness: roll.thickness || '',
        shift: roll.shift || 'morning',
        dateIn: new Date(),
        status: status,
        recordedBy: req.user._id,
        companyId: req.user.companyId,
        branchId: req.user.branchId || null
      }))
    );

    res.status(201).json({ 
      message: `${records.length} rolls recorded successfully!`,
      records 
    });
  } catch (error) {
    console.error('Bulk production error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;