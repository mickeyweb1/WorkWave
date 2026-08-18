const Branch = require('../models/Branch');

// ==========================================
// 1. CREATE A NEW BRANCH (SECURITY FIX)
// ==========================================
exports.createBranch = async (req, res) => {
  try {
    const { name, location, managerId } = req.body;

    // Check if branch already exists
    const existingBranch = await Branch.findOne({ name });
    if (existingBranch) {
      return res.status(400).json({ message: "A branch with this name already exists" });
    }

    // Create the new branch AND tag it with the Admin's ID and Company ID!
    const newBranch = await Branch.create({
      name,
      location,
      managerId: managerId || null,
      createdBy: req.user._id,
      companyId: req.user.companyId  // 👈 ADD THIS LINE
    });

    res.status(201).json({ 
      message: "Branch created successfully!",
      branch: newBranch 
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 2. GET ALL BRANCHES (SECURITY FIX)
// ==========================================
exports.getAllBranches = async (req, res) => {
  try {
    // SECURITY FIX: Only find branches where 'createdBy' matches the logged-in Admin's ID
    const branches = await Branch.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ branches });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 3. GET A SINGLE BRANCH
// ==========================================
exports.getSingleBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.status(200).json({ branch });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 4. DELETE A BRANCH
// ==========================================
exports.deleteBranch = async (req, res) => {
  try {
    const deletedBranch = await Branch.findByIdAndDelete(req.params.id);
    
    if (!deletedBranch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.status(200).json({ message: "Branch deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};