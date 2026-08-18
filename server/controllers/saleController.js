const Sale = require("../models/Sale");
const Product = require("../models/Product");
const User = require("../models/User");
const ActivityLog = require('../models/ActivityLog');
const Branch = require('../models/Branch');
const { createNotification } = require('./notificationController');
const Notification = require('../models/Notification');

// ==========================================
// 1. RECORD A NEW SALE (And Auto-Deduct Stock)
// ==========================================
exports.recordSale = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const currentUser = await User.findById(req.user.userId || req.user._id);
    const workerBranchId = currentUser.branchId?.toString();

    if (!workerBranchId) {
      return res
        .status(400)
        .json({ message: "You are not assigned to any branch." });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // FIND THE BRANCH INSIDE THE ARRAY
    const branchEntry = product.branchInventory.find(
      (b) => b.branchId.toString() === workerBranchId,
    );

    if (!branchEntry) {
      return res
        .status(400)
        .json({ message: "This product is not available in your branch." });
    }

    // CHECK STOCK FOR THIS SPECIFIC BRANCH
    if (branchEntry.stockQuantity < quantity) {
      return res.status(400).json({
        message: `Insufficient stock in your branch! Only ${branchEntry.stockQuantity} ${product.unit}(s) remaining.`,
      });
    }

    // Calculate total using THIS branch's selling price
    const totalPrice = quantity * branchEntry.sellingPrice;

    const newSale = await Sale.create({
      productId: product._id,
      productName: product.name,
      branchId: workerBranchId,
      quantity,
      unitPrice: branchEntry.sellingPrice,
      totalPrice,
      buyerName: req.body.buyerName || "Walk-in Customer",
      paymentMethod: req.body.paymentMethod || "Cash",
      soldBy: req.user._id,
    });

    // DEDUCT STOCK FROM THE SPECIFIC BRANCH IN THE ARRAY
    branchEntry.stockQuantity -= quantity;
    await product.save();

    await ActivityLog.create({
      userId: req.user._id || req.user.userId,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'RECORD_SALE',
      details: `Sold ${quantity}x ${product.name} for ₦${totalPrice}.`
    });

    if (branchEntry.stockQuantity <= 20) {
      await createNotification(
        "Low Stock Alert", 
        `${product.name} is running low at ${req.user.branchName || 'a branch'}. Only ${branchEntry.stockQuantity} left!`, 
        "warning", 
        "admin"
      );
    }
    // (All your existing sale logic is above this)

    // 👇 SEND NOTIFICATION TO ADMIN 👇
    await Notification.create({
      companyId: req.user.companyId,
      title: 'New Sale Recorded 💰',
      message: `${req.user.name || 'A staff member'} sold ${req.body.quantity}x ${req.body.productName} for ₦${req.body.totalPrice}.`,
      type: 'success',
      targetRole: 'admin'
    });

    // 👇 YOUR EXISTING SUCCESS RESPONSE 👇
    res.status(201).json({ message: "Sale recorded successfully!", sale: newSale });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 2. GET ALL SALES (Filtered by Branch for Workers)
// ==========================================
exports.getSales = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'admin') {
      // 1. Find all branches owned by this Admin
      const adminBranches = await Branch.find({ createdBy: req.user._id });
      const adminBranchIds = adminBranches.map(b => b._id);
      
      // 2. Only fetch sales that happened in those specific branches
      query = { branchId: { $in: adminBranchIds } };
    } 
    else if (req.user.role === 'worker') {
      // Worker only sees their own branch
      const currentUser = await User.findById(req.user.userId || req.user._id);
      query = { branchId: currentUser.branchId };
    }

    const sales = await Sale.find(query).sort({ createdAt: -1 });
    res.status(200).json({ sales });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 3. VOID A SALE (Admin Only - Restores Stock)
// ==========================================
exports.voidSale = async (req, res) => {
  try {
    // 1. Find the sale
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    // 2. Check if it's already voided
    if (sale.status === "voided") {
      return res
        .status(400)
        .json({ message: "This sale has already been voided." });
    }

    // 3. Change the status to 'voided'
    sale.status = "voided";
    await sale.save();

    // 4. RESTORE THE STOCK!
    // FIX: Only do this if the sale actually had a linked product ID!
    if (sale.productId) {
      await Product.findByIdAndUpdate(sale.productId, {
        $inc: { stockQuantity: sale.quantity },
      });
    }

    const adminUser = await User.findById(req.user.userId || req.user._id);
    await ActivityLog.create({
      userId: adminUser._id,
      userName: adminUser.name,
      userRole: 'admin',
      action: 'VOID_SALE',
      details: `Voided a sale for ${sale.productName} (₦${sale.totalPrice}). Stock restored.`
    });


    res.status(200).json({
      message: "Sale voided successfully.",
      sale,
    });
  } catch (error) {
    // This will print the exact error to your backend terminal so we can see it if it fails again
    console.error("VOID SALE ERROR:", error);
    res
      .status(500)
      .json({
        message: "Server Error while voiding sale.",
        error: error.message,
      });
  }
};
