/* ==========================================================================
   FLEVA — Tracking Controller
   Order tracking for customers
   ========================================================================== */
const Order = require('../models/Order');

// @desc    Track order by order number (public — no auth needed)
// @route   GET /api/v1/tracking/:orderNumber
// @access  Public
exports.trackOrder = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber })
      .select('orderNumber orderStatus trackingHistory shippingAddress.city shippingAddress.name items.title items.qty deliveryFee total createdAt estimatedDelivery')
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Build tracking timeline
    const timeline = (order.trackingHistory || []).map(entry => ({
      status: entry.status,
      message: entry.message,
      timestamp: entry.timestamp,
      location: entry.location || null,
    }));

    res.json({
      success: true,
      tracking: {
        orderNumber: order.orderNumber,
        currentStatus: order.orderStatus,
        timeline,
        destination: order.shippingAddress?.city || '',
        itemCount: order.items?.length || 0,
        total: order.total,
        placedAt: order.createdAt,
        estimatedDelivery: order.estimatedDelivery || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get tracking for logged-in user's order
// @route   GET /api/v1/tracking/my/:orderId
// @access  Private
exports.trackMyOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id,
    })
      .select('orderNumber orderStatus trackingHistory shippingAddress items deliveryFee total createdAt')
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
