const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/activityController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Only Admins can see the security logs!
router.get('/', protect, adminOnly, getLogs);

module.exports = router;
