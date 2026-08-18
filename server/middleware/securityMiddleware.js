const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// 1. SECURITY HEADERS (Prevents common attacks)
exports.securityHeaders = helmet({
  contentSecurityPolicy: false, // Disabled for API flexibility
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// 2. CORS CONFIGURATION (Allow your frontend to access the API)
exports.corsConfig = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);
    
    // Allow all Vercel domains (your production site + preview deployments)
    if (origin.includes('vercel.app')) return callback(null, true);
    
    // Block everything else
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// 3. RATE LIMITING (Prevents brute force and DDoS)
// General API: 100 requests per 15 minutes per IP
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login: Stricter limit (5 attempts per 15 minutes)
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 login attempts per 15 minutes
  message: {
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register: Even stricter (3 registrations per hour per IP)
exports.registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 new accounts per hour per IP
  message: {
    message: 'Too many registration attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
