const Expense = require('../models/Expense');
const User = require('../models/User'); // Make sure User is imported at the top!
const cloudinary = require('../config/cloudinary'); // Make sure Cloudinary is imported!
const Branch = require('../models/Branch');

// ==========================================
// 1. RECORD EXPENSE (Admin & Worker Safe)
// ==========================================
exports.recordExpense = async (req, res) => {
  try {
    // 1. Get data from the form (including the branchId selected by the Admin)
    const { category, amount, paymentMethod, description, branchId: bodyBranchId } = req.body;

    // 2. Determine the branchId
    // If the Admin selected a branch in the form, use that (bodyBranchId).
    // Otherwise, it's a Worker, so fetch their assigned branch from the database.
    let branchId = bodyBranchId;
    if (!branchId) {
      const currentUser = await User.findById(req.user.userId || req.user._id);
      branchId = currentUser.branchId;
    }

    // If neither worked, block the request
    if (!branchId) {
      return res.status(400).json({ message: "Please select a branch for this expense." });
    }

    let receiptUrl = '';

    // 3. If an image was uploaded, send it to Cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'workwave_receipts', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      
      receiptUrl = result.secure_url; // Get the secure link from Cloudinary
    }

    // 4. Save the expense with the image link and the correct branchId
    const newExpense = await Expense.create({
      category, 
      amount, 
      paymentMethod, 
      description,
      receiptUrl,
      branchId, // <-- This now correctly uses the Admin's choice OR the Worker's branch!
      recordedBy: req.user.userId || req.user._id // Safe fallback for user ID
    });
    
    res.status(201).json({ message: "Expense recorded!", expense: newExpense });

  } catch (error) {
    console.error("EXPENSE ERROR:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 2. GET EXPENSES (Leave your existing function exactly as it is below!)
// ==========================================
exports.getExpenses = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'admin') {
      // 1. Find all branches owned by this Admin
      const adminBranches = await Branch.find({ createdBy: req.user._id });
      const adminBranchIds = adminBranches.map(b => b._id);
      
      // 2. Only fetch expenses from those branches
      query = { branchId: { $in: adminBranchIds } };
    } 
    else if (req.user.role === 'worker') {
      // Worker only sees their own branch
      const currentUser = await User.findById(req.user.userId || req.user._id);
      query = { branchId: currentUser.branchId };
    }

    const expenses = await Expense.find(query).sort({ createdAt: -1 });
    res.status(200).json({ expenses });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

