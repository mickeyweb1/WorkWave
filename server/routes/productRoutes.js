const express = require('express');
const RestockHistory = require('../models/RestockHistory');
const router = express.Router();

// 1. Import ALL required controller functions
const { 
  createProduct, 
  getProducts, 
  addBranchToProduct, 
  updateBranchInventory, 
  deleteProduct,
  restockProduct // <--- MAKE SURE THIS LINE IS EXACTLY HERE WITH A COMMA BEFORE IT
} = require('../controllers/productController');

// 2. Import middleware
const { protect } = require('../middleware/authMiddleware');

// 3. Routes
router.post('/', protect, createProduct);
router.get('/', protect, getProducts);

// PUT /api/products/:id/restock
router.put('/:id/restock', protect, restockProduct);

router.post('/:productId/branches', protect, addBranchToProduct); 
router.put('/:productId/branches/:branchId', protect, updateBranchInventory); 
router.delete('/:id', protect, deleteProduct);

// GET a single product by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// GET restock history for the logged-in user's branch
router.get('/restock-history', protect, async (req, res) => {
  try {
    const userBranchId = req.user.branchId ? req.user.branchId.toString() : null;
    
    const history = await RestockHistory.find({
      companyId: req.user.companyId,
      branchId: userBranchId
    })
    .populate('restockedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(100);
    
    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
