const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// Security imports
const { securityHeaders, corsConfig, generalLimiter } = require('./middleware/securityMiddleware');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'atlas-credentials.env') });

// ==========================================
// 1. SECURITY MIDDLEWARE (Applied to ALL routes)
// ==========================================
app.use(securityHeaders);
app.use(corsConfig);
app.use(express.json({ limit: '10kb' })); // Limit payload size (prevents large attacks)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Apply rate limiting to all API routes
app.use('/api/', generalLimiter);

// ==========================================
// 2. DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Stop server if DB fails
  });

// Handle MongoDB connection drops gracefully
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

// ==========================================
// 3. ROUTES
// ==========================================
const authRoutes = require('./routes/authRoutes');
const branchRoutes = require('./routes/branchRoutes');
const productRoutes = require('./routes/productRoutes');
const productRecordRoutes = require('./routes/productRecordRoutes');
const saleRoutes = require('./routes/saleRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const workerRoutes = require('./routes/workerRoutes');
const activityRoutes = require('./routes/activityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-records', productRecordRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/super-admin', superAdminRoutes);

// ==========================================
// 4. ERROR HANDLING (Must be LAST)
// ==========================================
app.use(notFound);
app.use(errorHandler);

// ==========================================
// 5. PREVENT UNHANDLED CRASHES
// ==========================================
process.on('unhandledRejection', (err) => {
  console.error('🚨 UNHANDLED REJECTION:', err.message);
  // Don't crash the server, just log it
});

process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err.message);
  // Give the server time to respond to ongoing requests, then restart
  process.exit(1);
});

// ==========================================
// 6. START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // 👈 Bind to all interfaces (Required for Render)

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
