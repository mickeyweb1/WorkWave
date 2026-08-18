const express = require('express');
const router = express.Router();
const { recordSale, getSales, voidSale } = require('../controllers/saleController');
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// All sales routes require the user to be logged in
router.post('/', protect, recordSale);
router.get('/', protect, getSales);
router.put('/:id/void', protect, voidSale);

module.exports = router;