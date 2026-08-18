const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');
const Branch = require('../models/Branch');

// ==========================================
// 1. REGISTER A NEW USER (Admin or Worker)
// ==========================================
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const companyId = (role === 'admin' || !req.user) 
      ? new mongoose.Types.ObjectId() 
      : req.user.companyId;

    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 21);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'worker',
      companyId: companyId,
      createdBy: req.user ? (req.user._id || req.user.userId) : null,
      
      trialStartDate: role === 'admin' ? trialStartDate : null,
      trialEndDate: role === 'admin' ? trialEndDate : null,
      trialStatus: role === 'admin' ? 'active' : 'active',
      
      // 👇 ADD THESE TWO LINES 👇
      plan: role === 'admin' ? 'free_trial' : 'free_trial',
      branchLimit: role === 'admin' ? 1 : 1  // Free trial = 1 branch
    });

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role, companyId: newUser.companyId }, 
      process.env.JWT_SECRET || "workwave_super_secret_key_123", 
      { expiresIn: "7d" } 
    );

    res.status(201).json({ 
      message: "User registered successfully!",
      token, 
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        companyId: newUser.companyId,
        trialEndDate: newUser.trialEndDate,
        trialStatus: newUser.trialStatus,
        hasSeenWelcome: newUser.hasSeenWelcome,
        plan: newUser.plan,
        branchLimit: newUser.branchLimit // 👈 ADD THIS
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 2. LOGIN USER
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 2. Check if the account is active (Security!)
    if (user.status === 'inactive') {
      return res.status(403).json({ message: "Your account has been deactivated. Contact your admin." });
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 4. Generate Token
        // ... (after password check) ...

    // Add companyId to the token!
    const token = jwt.sign(
      { userId: user._id, role: user.role, companyId: user.companyId }, 
      process.env.JWT_SECRET || "workwave_super_secret_key_123", 
      { expiresIn: "7d" }
    );

    await ActivityLog.create({
      companyId: user.companyId,
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      companyId: user.companyId, // <--- LOG THE COMPANY
      action: 'LOGIN',
      details: `${user.name} logged into the system.`
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        companyId: user.companyId, // <--- SEND TO FRONTEND
        trialEndDate: user.trialEndDate,
    hasSeenWelcome: user.hasSeenWelcome
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 3. GET INVITE DETAILS (Checks if token is valid)
// ==========================================
exports.getInviteDetails = async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({ inviteToken: token }).select('-password');
    
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired invite link." });
    }

    // If they already set a password, the token should be null
    if (!user.inviteToken) {
      return res.status(400).json({ message: "This invite has already been used. Please log in normally." });
    }

    res.status(200).json({ 
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      } 
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 4. ACCEPT INVITE (Sets new password & logs them in)
// ==========================================
exports.acceptInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // 1. Find the user by the invite token
    const user = await User.findOne({ inviteToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid invite link." });
    }

    // 2. Scramble the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update user: set new password, remove the invite token so it can't be used again
    user.password = hashedPassword;
    user.inviteToken = null; 
    await user.save();

        // 4. Generate a real JWT Token (WITH COMPANY ID FOR SAAS SECURITY!)
    const jwtToken = jwt.sign(
      { userId: user._id, role: user.role, companyId: user.companyId }, // <-- ADDED companyId!
      process.env.JWT_SECRET || "workwave_super_secret_key_123", 
      { expiresIn: "7d" }
    );

    // 5. Send back the token and user data
    res.status(200).json({
      message: "Account activated successfully!",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        companyId: user.companyId // <-- ADDED companyId here too!
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide both current and new passwords." });
    }

    // 1. Find the logged-in user
    const user = await User.findById(req.user.userId || req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 2. Verify the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Your current password is incorrect." });
    }

    // 3. Scramble the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Save the new password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully!" });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 6. UPDATE USER PROFILE (Change name)
// ==========================================
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters." });
    }

    // 1. Find the logged-in user
    const user = await User.findById(req.user.userId || req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 2. Update the name
    user.name = name.trim();
    await user.save();

    // 3. Return updated user info
    res.status(200).json({ 
      message: "Profile updated successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        companyId: user.companyId
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
