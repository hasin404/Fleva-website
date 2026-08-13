/* ==========================================================================
   FLEVA — Express Server
   Main entry point for the backend API.
   ========================================================================== */
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const searchRoutes = require('./routes/searchRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const storefrontRoutes = require('./routes/storefrontRoutes');

const app = express();

/* ---------- Security middleware ---------- */
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts in frontend
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: true,
  credentials: true,
}));

// Automatic DB connection middleware for serverless API routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn('Database connection warning (continuing request):', err.message);
  }
  next();
});

app.use(mongoSanitize()); // Prevent NoSQL injection

/* ---------- Body parsing ---------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/* ---------- Logging & compression ---------- */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(compression());

/* ---------- Rate limiting ---------- */
app.use('/api', apiLimiter);

/* ---------- API Routes ---------- */
const mountRoutes = (prefix) => {
  app.use(`${prefix}/v1/auth`, authRoutes);
  app.use(`${prefix}/v1/products`, productRoutes);
  app.use(`${prefix}/v1/orders`, orderRoutes);
  app.use(`${prefix}/v1/cart`, cartRoutes);
  app.use(`${prefix}/v1/wishlist`, wishlistRoutes);
  app.use(`${prefix}/v1/reviews`, reviewRoutes);
  app.use(`${prefix}/v1/coupons`, couponRoutes);
  app.use(`${prefix}/v1/banners`, bannerRoutes);
  app.use(`${prefix}/v1/notifications`, notificationRoutes);
  app.use(`${prefix}/v1/analytics`, analyticsRoutes);
  app.use(`${prefix}/v1/admin`, adminRoutes);
  app.use(`${prefix}/v1/ai`, aiRoutes);
  app.use(`${prefix}/v1/search`, searchRoutes);
  app.use(`${prefix}/v1/tracking`, trackingRoutes);
  app.use(`${prefix}/v1/payments`, paymentRoutes);
  app.use(`${prefix}/v1/storefront`, storefrontRoutes);
};

mountRoutes('/api');
mountRoutes('');

/* ---------- Health check ---------- */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ---------- Serve frontend static files ---------- */
// Serve the frontend directory (parent folder)
const frontendPath = path.join(__dirname, '..');
app.use('/assets', express.static(path.join(frontendPath, 'assets')));
app.use(express.static(frontendPath, {
  extensions: ['html'],
  index: 'index.html',
}));

// Admin panel
const adminPath = path.join(__dirname, '..', 'admin');
app.use('/admin', express.static(adminPath, {
  extensions: ['html'],
  index: 'index.html',
}));

// SPA fallback: serve index.html for any unmatched frontend routes
app.get('*', (req, res, next) => {
  // Don't serve HTML for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/* ---------- Error handler (must be last) ---------- */
app.use(errorHandler);

/* ---------- Export app / Start server ---------- */
if (process.env.VERCEL) {
  // On Vercel serverless, lazily ensure DB connection on incoming requests
  app.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      next(err);
    }
  });
} else {
  const PORT = process.env.PORT || 3000;
  const startServer = async () => {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 FLEVA server running on http://localhost:${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api/v1`);
      console.log(`   Frontend: http://localhost:${PORT}`);
      console.log(`   Admin: http://localhost:${PORT}/admin`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  };
  startServer();
}

module.exports = app;
