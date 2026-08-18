const express = require('express');
const router = express.Router();
const RawMaterial = require('../models/RawMaterial');
const RawMaterialDelivery = require('../models/RawMaterialDelivery');
const Branch = require('../models/Branch');
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// Helper: Company filter for SaaS security
const getCompanyFilter = (req) => {
  if (req.user.companyId) return { companyId: req.user.companyId };
  return {};
};

// GET all raw materials (Branch-aware!)
router.get('/', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);
    
    let query = { ...companyFilter };
    
    // If the user is NOT an admin, they only see their branch's materials
    if (req.user.role !== 'admin') {
      query.branchId = req.user.branchId;
    }
    
    const materials = await RawMaterial.find(query)
      .populate('branchId', 'name') // <-- Fetch the branch name for the Admin view
      .sort({ createdAt: -1 });
      
    res.json({ materials });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// POST create a new raw material
router.post('/', protect, async (req, res) => {
  try {
    const { name, unit, lowStockThreshold } = req.body;
    
    const material = await RawMaterial.create({
      companyId: req.user.companyId,
      branchId: req.user.branchId || null,
      name,
      unit: unit || 'kg',
      lowStockThreshold: lowStockThreshold || 10,
      currentStock: 0
    });

    // 👇 SEND NOTIFICATION TO ADMIN 👇
    await Notification.create({
      companyId: req.user.companyId,
      title: 'New Raw Material Added 📦',
      message: `${req.user.name || 'A staff member'} added a new material to track: ${name}.`,
      type: 'info',
      targetRole: 'admin'
    });
    
    res.status(201).json({ material });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// POST record a delivery (Goods IN from outside) - Branch-aware!
router.post('/:id/delivery', protect, async (req, res) => {
  try {
    const { quantity, supplier, cost, date } = req.body;
    const companyFilter = getCompanyFilter(req);
    
    let query = { _id: req.params.id, ...companyFilter };
    
    // Non-admins can only record deliveries for their own branch
    if (req.user.role !== 'admin') {
      query.branchId = req.user.branchId;
    }

    const material = await RawMaterial.findOne(query);
    if (!material) return res.status(404).json({ message: 'Material not found or unauthorized' });

    material.currentStock += Number(quantity);
    await material.save();

    const delivery = await RawMaterialDelivery.create({
      companyId: req.user.companyId,
      rawMaterialId: material._id,
      quantity,
      supplier: supplier || '',
      cost: cost || 0,
      date: date || Date.now(),
      recordedBy: req.user._id
    });

    res.status(201).json({ material, delivery });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// POST record usage (Goods OUT for production) - Branch-aware!
router.post('/:id/use', protect, async (req, res) => {
  try {
    const { quantity } = req.body;
    const companyFilter = getCompanyFilter(req);
    
    let query = { _id: req.params.id, ...companyFilter };
    
    if (req.user.role !== 'admin') {
      query.branchId = req.user.branchId;
    }

    const material = await RawMaterial.findOne(query);
    if (!material) return res.status(404).json({ message: 'Material not found or unauthorized' });

    if (material.currentStock < Number(quantity)) {
      return res.status(400).json({ message: 'Not enough stock!' });
    }

    material.currentStock -= Number(quantity);
    await material.save();

    res.json({ material });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

const RawMaterialTransaction = require('../models/RawMaterialTransaction');

// GET all transactions for a specific material (The Note Book)
router.get('/:id/transactions', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);
    
    // Verify the material belongs to this company/branch
    let materialQuery = { _id: req.params.id, ...companyFilter };
    if (req.user.role !== 'admin') {
      materialQuery.branchId = req.user.branchId;
    }
    
    const material = await RawMaterial.findOne(materialQuery);
    if (!material) return res.status(404).json({ message: 'Material not found' });
    
    const transactions = await RawMaterialTransaction.find({ rawMaterialId: req.params.id, ...companyFilter })
      .populate('recordedBy', 'name')
      .sort({ date: -1, createdAt: -1 });
      
    res.json({ transactions, material });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// POST record a transaction (IN or OUT)
router.post('/:id/transaction', protect, async (req, res) => {
  try {
    const { type, quantity, details, date } = req.body;
    const companyFilter = getCompanyFilter(req);
    
    let materialQuery = { _id: req.params.id, ...companyFilter };
    if (req.user.role !== 'admin') {
      materialQuery.branchId = req.user.branchId;
    }
    
    const material = await RawMaterial.findOne(materialQuery);
    if (!material) return res.status(404).json({ message: 'Material not found' });
    
    // Update stock based on type
    if (type === 'in') {
      material.currentStock += Number(quantity);
    } else if (type === 'out') {
      if (material.currentStock < Number(quantity)) {
        return res.status(400).json({ message: 'Not enough stock! Current: ' + material.currentStock });
      }
      material.currentStock -= Number(quantity);
    }
    await material.save();
    
    // Save the transaction
    const transaction = await RawMaterialTransaction.create({
      companyId: req.user.companyId,
      rawMaterialId: material._id,
      type,
      quantity: Number(quantity),
      details: details || '',
      recordedBy: req.user._id,
      date: date || Date.now()
    });
    
    res.status(201).json({ transaction, material });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// DELETE a raw material (Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    // Only admins can delete materials
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete materials' });
    }

    const companyFilter = getCompanyFilter(req);
    
    const material = await RawMaterial.findOneAndDelete({ 
      _id: req.params.id, 
      ...companyFilter 
    });

    if (!material) {
      return res.status(404).json({ message: 'Material not found or unauthorized' });
    }

    // Also delete all transaction history for this material
    await RawMaterialTransaction.deleteMany({ 
      rawMaterialId: req.params.id, 
      ...companyFilter 
    });

    res.json({ message: 'Material and all its records deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


module.exports = router;