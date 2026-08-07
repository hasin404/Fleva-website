/* ==========================================================================
   FLEVA — Payment Controller
   Handles payment processing (Stripe, SSLCommerz, COD)
   ========================================================================== */
const Order = require('../models/Order');

// @desc    Process Cash on Delivery
// @route   POST /api/v1/payments/cod
// @access  Private
exports.processCOD = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentMethod = 'cod';
    order.paymentStatus = 'pending'; // COD is pending until delivery
    order.orderStatus = 'confirmed';
    order.trackingHistory.push({
      status: 'confirmed',
      message: 'Order confirmed — Cash on Delivery',
      timestamp: new Date(),
    });

    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc    Process bKash / Nagad payment (stub — webhook placeholder)
// @route   POST /api/v1/payments/mobile
// @access  Private
exports.processMobilePayment = async (req, res, next) => {
  try {
    const { orderId, provider, transactionId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // In production, verify the transaction with the provider's API
    order.paymentMethod = provider; // 'bkash' or 'nagad'
    order.paymentStatus = 'paid';
    order.paymentDetails = { transactionId, provider, paidAt: new Date() };
    order.orderStatus = 'confirmed';
    order.trackingHistory.push({
      status: 'confirmed',
      message: `Payment received via ${provider.toUpperCase()} — Transaction: ${transactionId}`,
      timestamp: new Date(),
    });

    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc    Stripe payment intent (stub — requires STRIPE_SECRET_KEY)
// @route   POST /api/v1/payments/stripe/create-intent
// @access  Private
exports.createStripeIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured. Add STRIPE_SECRET_KEY to .env',
      });
    }

    // In production: create a real Stripe PaymentIntent
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(order.total * 100),
    //   currency: 'bdt',
    //   metadata: { orderId: order._id.toString() },
    // });

    res.json({
      success: true,
      message: 'Stripe integration ready — add STRIPE_SECRET_KEY to enable',
      // clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    SSLCommerz payment init (stub — requires credentials)
// @route   POST /api/v1/payments/sslcommerz/init
// @access  Private
exports.initSSLCommerz = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!process.env.SSLCOMMERZ_STORE_ID || !process.env.SSLCOMMERZ_STORE_PASSWORD) {
      return res.status(503).json({
        success: false,
        message: 'SSLCommerz is not configured. Add credentials to .env',
      });
    }

    // In production: initialize SSLCommerz session
    res.json({
      success: true,
      message: 'SSLCommerz integration ready — add credentials to enable',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify payment (webhook or callback)
// @route   POST /api/v1/payments/verify
// @access  Public (webhook)
exports.verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentStatus, transactionId, provider } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (paymentStatus === 'paid' || paymentStatus === 'success') {
      order.paymentStatus = 'paid';
      order.paymentDetails = { transactionId, provider, paidAt: new Date() };
      order.orderStatus = 'confirmed';
      order.trackingHistory.push({
        status: 'confirmed',
        message: `Payment verified via ${provider || 'gateway'}`,
        timestamp: new Date(),
      });
    } else {
      order.paymentStatus = 'failed';
      order.trackingHistory.push({
        status: 'payment-failed',
        message: 'Payment failed — please retry',
        timestamp: new Date(),
      });
    }

    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
