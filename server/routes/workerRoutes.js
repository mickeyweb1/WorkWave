const express = require('express');
const router = express.Router();
const { createWorker, getWorkers, toggleWorkerStatus } = require('../controllers/workerController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ALL routes require the user to be logged in (protect) AND be an Admin (adminOnly)
router.post('/', protect, createWorker); 
router.get('/', protect, getWorkers);
router.put('/:id/status', protect, adminOnly, toggleWorkerStatus);

module.exports = router;