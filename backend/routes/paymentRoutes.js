const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  processCOD,
  processMobilePayment,
  createStripeIntent,
  initSSLCommerz,
  verifyPayment,
} = require('../controllers/paymentController');

router.post('/cod', protect, processCOD);
router.post('/mobile', protect, processMobilePayment);
router.post('/stripe/create-intent', protect, createStripeIntent);
router.post('/sslcommerz/init', protect, initSSLCommerz);
router.post('/verify', verifyPayment); // Webhook — no auth

module.exports = router;
