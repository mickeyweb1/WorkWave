const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const ProductRecord = require('../models/ProductRecord');
const { protect } = require('../middleware/authMiddleware');

// ==========================================
// 1. EXISTING DAILY REPORT ROUTE (DO NOT DELETE)
// ==========================================
router.get('/daily', protect, async (req, res) => {
  try {
    const { date } = req.query; // Format: YYYY-MM-DD
    const companyId = req.user.companyId;
    
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Sales for the day
    const sales = await Sale.find({
      companyId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const totalSalesRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const salesCount = sales.length;
    
    const cashSales = sales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.totalPrice, 0);
    const transferSales = sales.filter(s => s.paymentMethod === 'Transfer').reduce((sum, s) => sum + s.totalPrice, 0);
    const posSales = sales.filter(s => s.paymentMethod === 'POS').reduce((sum, s) => sum + s.totalPrice, 0);

    // 2. Expenses for the day
    const expenses = await Expense.find({
      companyId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 3. Net Profit
    const netProfit = totalSalesRevenue - totalExpenses;

    // 4. Production for the day
    const production = await ProductRecord.find({
      companyId,
      status: 'verified',
      dateIn: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const totalProductionKg = production.reduce((sum, p) => sum + p.kg, 0);

    // 5. Sales by product
    const productBreakdown = {};
    sales.forEach(sale => {
      const name = sale.productName || 'Unknown Product';
      productBreakdown[name] = (productBreakdown[name] || 0) + sale.totalPrice;
    });

    // 6. Expenses by category
    const expenseBreakdown = {};
    expenses.forEach(exp => {
      const category = exp.category || 'Other';
      expenseBreakdown[category] = (expenseBreakdown[category] || 0) + exp.amount;
    });

    res.json({
      date: targetDate.toISOString().split('T')[0],
      totalSalesRevenue,
      totalExpenses,
      netProfit,
      salesCount,
      totalProductionKg,
      productionCount: production.length,
      cashSales,
      transferSales,
      posSales,
      expenses: expenses.map(e => ({ 
        description: e.description || e.category, 
        category: e.category, 
        amount: e.amount 
      })),
      productBreakdown: Object.entries(productBreakdown)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total),
      expenseBreakdown: Object.entries(expenseBreakdown)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total)
    });

  } catch (error) {
    console.error('Daily Report Error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// ==========================================
// 2. NEW REPORTS & ANALYTICS ROUTES
// ==========================================

// Helper to get date range based on period
const getDateRange = (period) => {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case '30days':
      startDate.setDate(now.getDate() - 30);
      break;
    case '3months':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
      startDate.setFullYear(2020); 
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  return { startDate, endDate: now };
};

// GET /api/reports/summary?period=30days
router.get('/summary', protect, async (req, res) => {
  try {
    const period = req.query.period || '30days';
    const { startDate, endDate } = getDateRange(period);
    const companyFilter = { companyId: req.user.companyId };

    const salesResult = await Sale.aggregate([
      { $match: { ...companyFilter, createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, totalSales: { $sum: 1 } } }
    ]);

    const expensesResult = await Expense.aggregate([
      { $match: { ...companyFilter, createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, totalExpenses: { $sum: '$amount' }, totalExpensesCount: { $sum: 1 } } }
    ]);

    const totalRevenue = salesResult[0]?.totalRevenue || 0;
    const totalExpenses = expensesResult[0]?.totalExpenses || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
    const periodLength = endDate - startDate;
    previousStartDate.setTime(previousStartDate.getTime() - periodLength);
    previousEndDate.setTime(previousEndDate.getTime() - 1);

    const previousSalesResult = await Sale.aggregate([
      { $match: { ...companyFilter, createdAt: { $gte: previousStartDate, $lte: previousEndDate } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
    ]);

    const previousExpensesResult = await Expense.aggregate([
      { $match: { ...companyFilter, createdAt: { $gte: previousStartDate, $lte: previousEndDate } } },
      { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
    ]);

    const previousRevenue = previousSalesResult[0]?.totalRevenue || 0;
    const previousExpenses = previousExpensesResult[0]?.totalExpenses || 0;
    const previousProfit = previousRevenue - previousExpenses;

    const revenueTrend = previousRevenue > 0 ? (((totalRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1) : 0;
    const expensesTrend = previousExpenses > 0 ? (((totalExpenses - previousExpenses) / previousExpenses) * 100).toFixed(1) : 0;
    const profitTrend = previousProfit > 0 ? (((netProfit - previousProfit) / previousProfit) * 100).toFixed(1) : 0;

    res.json({
      period,
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: parseFloat(profitMargin),
        totalSales: salesResult[0]?.totalSales || 0,
        totalExpensesCount: expensesResult[0]?.totalExpensesCount || 0
      },
      trends: {
        revenue: parseFloat(revenueTrend),
        expenses: parseFloat(expensesTrend),
        profit: parseFloat(profitTrend)
      }
    });
  } catch (error) {
    console.error('Reports summary error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// GET /api/reports/trend?period=6months
router.get('/trend', protect, async (req, res) => {
  try {
    const period = req.query.period || '6months';
    const { startDate, endDate } = getDateRange(period);
    const companyFilter = { companyId: req.user.companyId };

    const salesTrend = await Sale.aggregate([
      { $match: { ...companyFilter, createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          sales: { $sum: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const expensesTrend = await Expense.aggregate([
      { $match: { ...companyFilter, createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          expenses: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const monthMap = {};
    salesTrend.forEach(item => {
      monthMap[item._id] = { sales: item.sales, expenses: 0 };
    });
    expensesTrend.forEach(item => {
      if (monthMap[item._id]) {
        monthMap[item._id].expenses = item.expenses;
      } else {
        monthMap[item._id] = { sales: 0, expenses: item.expenses };
      }
    });

    const trendData = Object.keys(monthMap).map(month => {
      const data = monthMap[month];
      const monthName = new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' });
      return {
        month: monthName,
        sales: data.sales,
        expenses: data.expenses,
        profit: data.sales - data.expenses
      };
    });

    res.json({ trendData });
  } catch (error) {
    console.error('Reports trend error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// GET /api/reports/top-products?period=30days
router.get('/top-products', protect, async (req, res) => {
  try {
    const period = req.query.period || '30days';
    const { startDate, endDate } = getDateRange(period);
    const companyFilter = { companyId: req.user.companyId };

    const topProducts = await Sale.aggregate([
      { $match: { ...companyFilter, createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$productName',
          unitsSold: { $sum: '$quantity' },
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    const formattedProducts = topProducts.map((product, index) => ({
      rank: index + 1,
      name: product._id || 'Unknown Product',
      unitsSold: product.unitsSold,
      revenue: product.revenue,
      count: product.count
    }));

    res.json({ topProducts: formattedProducts });
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;