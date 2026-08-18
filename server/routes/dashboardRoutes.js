const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import ALL required models
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Branch = require('../models/Branch');
const Product = require('../models/Product');
const ProductRecord = require('../models/ProductRecord');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/authMiddleware');

// ==========================================
// 1. EXISTING DASHBOARD STATS ROUTE (DO NOT DELETE)
// ==========================================
router.get('/overview', protect, async (req, res) => {
  try {
    const period = req.query.period || 'today';
    const companyId = req.user.companyId;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'today': startDate.setHours(0, 0, 0, 0); break;
      case 'week':
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
      case 'all': startDate = new Date(2020, 0, 1); break;
      default: startDate.setHours(0, 0, 0, 0);
    }

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const dateFilter = {
      companyId,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // 👇 SAFE PARALLEL QUERIES - Each one handles its own errors 👇
    const [salesResult, expensesResult, activityResult, productsResult, branchResult] = await Promise.all([
      Sale.find(dateFilter).populate('branchId', 'name').lean().catch(() => []),
      Expense.find(dateFilter).populate('branchId', 'name').lean().catch(() => []),
      ActivityLog.find({ companyId }).sort({ createdAt: -1 }).limit(10).lean().catch(() => []),
      Product.find({ companyId }).lean().catch(() => []),
      Branch.countDocuments({ companyId }).catch(() => 0)
    ]);

    const sales = salesResult || [];
    const expenses = expensesResult || [];
    const recentActivity = activityResult || [];
    const products = productsResult || [];
    const branchCount = branchResult || 0;

    // Calculate totals safely
    const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.totalPrice) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const salesCount = sales.length;

    // Branch performance
    const branchPerformance = {};
    sales.forEach(sale => {
      const branchName = sale.branchId?.name || 'Unknown';
      if (!branchPerformance[branchName]) {
        branchPerformance[branchName] = { revenue: 0, salesCount: 0 };
      }
      branchPerformance[branchName].revenue += Number(sale.totalPrice) || 0;
      branchPerformance[branchName].salesCount += 1;
    });

    const topBranches = Object.entries(branchPerformance)
      .map(([name, data]) => ({ name, revenue: data.revenue, salesCount: data.salesCount }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top products
    const productSales = {};
    sales.forEach(sale => {
      const name = sale.productName || 'Unknown';
      if (!productSales[name]) {
        productSales[name] = { revenue: 0, units: 0 };
      }
      productSales[name].revenue += Number(sale.totalPrice) || 0;
      productSales[name].units += Number(sale.quantity) || 1;
    });

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, revenue: data.revenue, units: data.units }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Low stock products
    const lowStock = products
      .map(p => {
        const totalStock = p.branchInventory
          ? p.branchInventory.reduce((sum, inv) => sum + (Number(inv.stockQuantity) || 0), 0)
          : 0;
        return { ...p, totalStock };
      })
      .filter(p => p.totalStock <= 20)
      .sort((a, b) => a.totalStock - b.totalStock)
      .slice(0, 5);

    res.json({
      period,
      stats: { totalRevenue, totalExpenses, netProfit, salesCount },
      topBranches,
      topProducts,
      recentActivity,
      lowStock,
      infrastructure: {
        branches: branchCount,
        totalProducts: products.length
      }
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    // 👇 Return default empty data instead of crashing 👇
    res.status(200).json({
      period: req.query.period || 'today',
      stats: { totalRevenue: 0, totalExpenses: 0, netProfit: 0, salesCount: 0 },
      topBranches: [],
      topProducts: [],
      recentActivity: [],
      lowStock: [],
      infrastructure: { branches: 0, totalProducts: 0 }
    });
  }
});

// ==========================================
// 2. NEW ADMIN HOME DASHBOARD OVERVIEW ROUTE
// ==========================================
router.get('/overview', protect, async (req, res) => {
  try {
    const period = req.query.period || 'today';
    const companyId = req.user.companyId;

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        startDate = new Date(2020, 0, 1);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // 1. Fetch Sales for the period (from the direct Sales page)
    const sales = await Sale.find({
      companyId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('branchId', 'name');

    // 2. Fetch Expenses for the period
    const expenses = await Expense.find({
      companyId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('branchId', 'name');

    // 3. Calculate totals
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const salesCount = sales.length;

    // 4. Branch performance (top 5)
    const branchPerformance = {};
    sales.forEach(sale => {
      const branchName = sale.branchId?.name || 'Unknown';
      if (!branchPerformance[branchName]) {
        branchPerformance[branchName] = { revenue: 0, salesCount: 0 };
      }
      branchPerformance[branchName].revenue += sale.totalPrice;
      branchPerformance[branchName].salesCount += 1;
    });

    const topBranches = Object.entries(branchPerformance)
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        salesCount: data.salesCount
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 5. Top products (top 5)
    const productSales = {};
    sales.forEach(sale => {
      const name = sale.productName || 'Unknown';
      if (!productSales[name]) {
        productSales[name] = { revenue: 0, units: 0 };
      }
      productSales[name].revenue += sale.totalPrice;
      productSales[name].units += sale.quantity || 1;
    });

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        units: data.units
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 6. Recent activity (last 10)
    const recentActivity = await ActivityLog.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 7. Low stock products
    const products = await Product.find({ companyId });
    const lowStock = products
      .map(p => {
        const totalStock = p.branchInventory
          ? p.branchInventory.reduce((sum, inv) => sum + (inv.stockQuantity || 0), 0)
          : 0;
        return { ...p.toObject(), totalStock };
      })
      .filter(p => p.totalStock <= 20)
      .sort((a, b) => a.totalStock - b.totalStock)
      .slice(0, 5);

    // 8. Infrastructure stats
    const branches = await Branch.countDocuments({ companyId });
    const totalProducts = products.length;

    res.json({
      period,
      stats: {
        totalRevenue,
        totalExpenses,
        netProfit,
        salesCount
      },
      topBranches,
      topProducts,
      recentActivity,
      lowStock,
      infrastructure: {
        branches,
        totalProducts
      }
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;