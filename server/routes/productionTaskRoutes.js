const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ProductionTask = require('../models/ProductionTask');
const { protect } = require('../middleware/authMiddleware');

// Helper: Get the user's Company filter
const getCompanyFilter = (req) => {
  if (req.user.companyId) {
    return { companyId: req.user.companyId };
  }
  return {};
};

// GET all tasks for the logged-in company
router.get('/', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);

    const tasks = await ProductionTask.find(companyFilter)
      .populate('productId', 'name')
      .populate('assignedBy', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// GET pending tasks (for Factory Worker to see what to do)
router.get('/pending', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);

    const tasks = await ProductionTask.find({
      ...companyFilter,
      status: 'pending'
    })
      .populate('productId', 'name')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// POST: Create a new task (Supervisor assigns work)
router.post('/', protect, async (req, res) => {
  try {
    const { productId, targetKg, shift, assignedTo, notes } = req.body;

    if (!req.user.companyId) {
      return res.status(400).json({ message: 'User has no company ID.' });
    }

    const task = await ProductionTask.create({
      companyId: req.user.companyId,
      productId,
      targetKg,
      shift,
      assignedTo: assignedTo || null,
      assignedBy: req.user._id,
      notes: notes || '',
      status: 'pending'
    });

    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// PUT: Mark task as completed
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);

    const task = await ProductionTask.findOneAndUpdate(
      { _id: req.params.id, ...companyFilter },
      { status: 'completed' },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// DELETE a task
router.delete('/:id', protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);

    const task = await ProductionTask.findOneAndDelete({
      _id: req.params.id,
      ...companyFilter
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;