const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const RestockHistory = require("../models/RestockHistory");
const Notification = require("../models/Notification");

// 1. CREATE MASTER PRODUCT
// 1. CREATE MASTER PRODUCT
exports.createProduct = async (req, res) => {
  try {
    const { name, category, size, unit, costPrice, branchId } = req.body;
    
    const newProduct = await Product.create({
      name,
      category: category || "manufactured",
      size,
      unit: unit || "kg",
      costPrice: costPrice || 0,
      createdBy: req.user._id,
      companyId: req.user.companyId // 👈 This now actually saves!
    });

    // Auto-assign to branch if branchId was provided
    if (branchId) {
      newProduct.branchInventory.push({
        branchId: branchId,
        sellingPrice: 0,  
        stockQuantity: 0  
      });
      await newProduct.save();
    }

    res.status(201).json({
      message: branchId 
        ? "Product created and assigned to branch!" 
        : "Master product created! Now assign it to a branch.",
      product: newProduct,
    });
  } catch (error) {
    // 👇 ALWAYS LOG ERRORS IN THE CATCH BLOCK!
    console.error("❌ CREATE PRODUCT ERROR:", error); 
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 2. GET ALL PRODUCTS
exports.getProducts = async (req, res) => {
  try {
    // ✅ FIX: Use companyId so BOTH Admin and Workers can see the products!
    let query = {};
    if (req.user.companyId) {
      query.companyId = req.user.companyId;
    } else {
      query.createdBy = req.user._id; // Fallback for very old data
    }

    const products = await Product.find(query)
      .populate("branchInventory.branchId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 3. ADD A BRANCH TO A PRODUCT
exports.addBranchToProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { branchId, sellingPrice, stockQuantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Check if branch is already assigned
    const alreadyExists = product.branchInventory.find(
      (b) => b.branchId.toString() === branchId,
    );
    if (alreadyExists) {
      return res.status(400).json({
        message:
          "Already assigned to this branch! Use 'Update' to change price/stock.",
      });
    }

    product.branchInventory.push({ branchId, sellingPrice, stockQuantity });
    await product.save();

    res.status(200).json({ message: "Branch assigned successfully!", product });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 4. UPDATE BRANCH INVENTORY (Edit price/stock for a specific branch)
exports.updateBranchInventory = async (req, res) => {
  try {
    const { productId, branchId } = req.params;
    const { sellingPrice, stockQuantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Find the specific branch inside the array
    const branchEntry = product.branchInventory.find(
      (b) => b.branchId.toString() === branchId,
    );
    if (!branchEntry)
      return res
        .status(404)
        .json({ message: "Branch not found in this product" });

    if (sellingPrice !== undefined) branchEntry.sellingPrice = sellingPrice;
    if (stockQuantity !== undefined) branchEntry.stockQuantity = stockQuantity;

    await product.save();
    res.status(200).json({ message: "Inventory updated!", product });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 5. DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct)
      return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 6. RESTOCK PRODUCT (Worker adds new delivery to their branch)
// ==========================================
exports.restockProduct = async (req, res) => {
  try {
    const { quantityToAdd } = req.body;
    const Product = require("../models/Product");

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find the specific branch inventory
    const userBranchId = req.user.branchId
      ? req.user.branchId.toString()
      : null;
    const branchInv = product.branchInventory.find(
      (inv) => inv.branchId && inv.branchId.toString() === userBranchId,
    );

    if (!branchInv) {
      return res
        .status(404)
        .json({ message: "Branch not assigned to this product" });
    }

    // 1. Update the stock quantity
    branchInv.stockQuantity += Number(quantityToAdd);
    await product.save();

    // 2. Save the Restock History
    await RestockHistory.create({
      companyId: req.user.companyId,
      branchId: req.user.branchId,
      productId: product._id,
      productName: product.name,
      quantityAdded: Number(quantityToAdd),
      restockedBy: req.user._id || req.user.userId,
    });

    // 3. Send Notification to Admin
    await Notification.create({
      companyId: req.user.companyId,
      title: "Inventory Restocked 📦",
      message: `${req.user.name || "A staff member"} added ${quantityToAdd} ${product.unit || "units"} of ${product.name}.`,
      type: "info",
      targetRole: "admin",
    });

    res.json({
      message: `Successfully added ${quantityToAdd} to ${product.name}`,
    });
  } catch (error) {
    console.error("Restock Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
