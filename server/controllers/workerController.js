const User = require('../models/User');
const Branch = require('../models/Branch'); 
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); 

// ==========================================
// 1. CREATE A NEW WORKER (Admin Only)
// ==========================================
exports.createWorker = async (req, res) => {
  try {
    const { name, email, phone, branchId, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "A user with this email already exists." });
    }

    // LOGIC: 
    // If an Admin is creating the user, use the selected branchId.
    // If a Secretary (worker) is creating the user, automatically use their own branchId.
    const assignedBranch = req.user.role === 'admin' ? branchId : req.user.branchId;

    // LOGIC:
    // If an Admin is creating, they can choose the role. 
    // If a Secretary is creating, the role must be 'factory_worker'.
    const assignedRole = req.user.role === 'admin' ? (role || 'worker') : 'factory_worker';

    const inviteToken = crypto.randomBytes(20).toString('hex');
    const tempPassword = await bcrypt.hash("WorkWave2024!", 10);

       const newWorker = await User.create({
      name,
      email,
      phone,
      branchId: assignedBranch,
      role: assignedRole,
      password: tempPassword,
      inviteToken,
      status: 'active',
      companyId: req.user.companyId,
      createdBy: req.user._id
    });

    res.status(201).json({ message: "Worker added successfully!", worker: newWorker });
  } catch (error) {
    console.error("CREATE WORKER ERROR:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 2. GET ALL WORKERS (SECURITY FIX)
// ==========================================
exports.getWorkers = async (req, res) => {
  try {
    // CRITICAL: Fetch ONLY users that match the logged-in user's companyId
    const workers = await User.find({ 
      role: { $in: ['worker', 'factory_worker'] }, 
      companyId: req.user.companyId 
    })
      .populate('branchId', 'name')
      .select('-password') // Never send the password back to the frontend
      .sort({ createdAt: -1 });
      
    res.status(200).json({ workers });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 3. TOGGLE WORKER STATUS (Active / Inactive)
// ==========================================
exports.toggleWorkerStatus = async (req, res) => {
  try {
    const worker = await User.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    // Verify the worker belongs to the Admin's company
    if (worker.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ message: "Unauthorized action." });
    }

    // Flip the status
    worker.status = worker.status === 'active' ? 'inactive' : 'active';
    await worker.save();

    res.status(200).json({ message: `Worker status changed to ${worker.status}`, worker });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};