const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const { protect } = require("../middleware/authMiddleware");
const Notification = require('../models/Notification');

// Helper: Get the user's Company filter (Multi-Tenancy Security!)
const getCompanyFilter = (req) => {
  if (req.user.companyId) {
    return { companyId: req.user.companyId };
  }
  return {};
};

// GET all expenses for the logged-in company
router.get("/", protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);

    const expenses = await Expense.find(companyFilter)
      .populate("recordedBy", "name")
      .sort({ date: -1 }); // Show newest first

    res.json({ expenses });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// POST: Add a new expense
router.post('/', protect, async (req, res) => {
  try {
    const { description, category, amount, paymentMethod, receiptUrl, date } = req.body;

    if (!req.user.companyId) {
      return res.status(400).json({ message: 'User has no company ID.' });
    }

    const expense = await Expense.create({
      companyId: req.user.companyId,
      description,
      category,
      amount,
      paymentMethod: paymentMethod || 'Cash',
      receiptUrl: receiptUrl || '',
      date: date || Date.now(),
      recordedBy: req.user._id
    });

    // 👇 SEND NOTIFICATION TO ADMIN 👇
    await Notification.create({
      companyId: req.user.companyId, // STRICT SAAS SECURITY
      title: 'New Expense Recorded 💸',
      message: `${req.user.name || 'A staff member'} recorded an expense of ₦${amount} for ${category}.`,
      type: 'warning',
      targetRole: 'admin' // Only Admins need to be alerted about money going out
    });

    res.status(201).json({ expense });
  } catch (error) {
    console.error("Expense Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// DELETE an expense
router.delete("/:id", protect, async (req, res) => {
  try {
    const companyFilter = getCompanyFilter(req);

    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      ...companyFilter,
    });

    if (!expense) {
      return res
        .status(404)
        .json({ message: "Expense not found or unauthorized" });
    }

    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;
