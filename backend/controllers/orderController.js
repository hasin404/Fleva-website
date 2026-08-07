/* ==========================================================================
   FLEVA — Order Controller
   ========================================================================== */
const Order = require('../models/Order');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');
const Coupon = require('../models/Coupon');
const Storefront = require('../models/Storefront');
const { sendEmail } = require('../config/email');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/v1/orders
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode, notes } = req.body;

    // Validate items and calculate prices
    let subtotal = 0;
    const orderItems = [];
    let hasPreOrder = false;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.product} not found` });
      }
      
      if (product.availability !== 'in-stock' && product.availability !== 'pre-order') {
        return res.status(400).json({ success: false, message: `${product.title} is currently unavailable for order.` });
      }

      if (product.availability === 'in-stock' && product.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title}. Available: ${product.stock}`,
        });
      }

      if (product.availability === 'pre-order') {
        hasPreOrder = true;
      }

      const price = product.discountPrice > 0 ? product.discountPrice : product.price;
      subtotal += price * item.qty;

      orderItems.push({
        product: product._id,
        title: product.title,
        image: product.images?.[0]?.url || '',
        price,
        qty: item.qty,
        advancePaymentPercentage: product.advancePaymentPercentage || 20,
      });
    }

    const storefront = await Storefront.findOne({ globalId: 'main' });
    const configDeliveryFee = storefront?.deliveryFee ?? 80;
    const deliveryFee = subtotal >= 1500 ? 0 : configDeliveryFee; // Free delivery over ৳1500
    let discountAmount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon && (!coupon.expiryDate || coupon.expiryDate > new Date()) && subtotal >= (coupon.minOrderAmount || 0)) {
        if (coupon.type === 'percentage') {
          discountAmount = Math.floor(subtotal * (coupon.value / 100));
        } else {
          discountAmount = coupon.value;
        }
        if (discountAmount > subtotal) discountAmount = subtotal;
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const total = subtotal - discountAmount + deliveryFee;
    
    let advancePayment = 0;
    let remainingBalance = 0;
    if (hasPreOrder && total > 0) {
      // Calculate advance based on the sum of each pre-order item's requirement
      for (const item of orderItems) {
        const product = await Product.findById(item.product);
        if (product.availability === 'pre-order') {
          advancePayment += (item.price * item.qty) * ((product.advancePaymentPercentage || 20) / 100);
        }
      }
      advancePayment = Math.ceil(advancePayment);
      // Ensure advance doesn't exceed total (e.g., if there's a huge discount)
      if (advancePayment > total) advancePayment = total;
      
      remainingBalance = total - advancePayment;
    }

    const order = await Order.create({
      user: req.user ? req.user._id : undefined,
      guestEmail: shippingAddress.email || '',
      guestName: shippingAddress.name || '',
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      deliveryFee,
      discount: discountAmount,
      total,
      advancePayment,
      remainingBalance,
      couponCode,
      notes,
      trackingHistory: [{ status: 'pending', message: 'Order placed', timestamp: new Date() }],
    });

    // Reduce stock for in-stock products only
    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (product.availability === 'in-stock') {
        const prevStock = product.stock;
        product.stock -= item.qty;
        if (product.stock <= 0) {
          product.availability = 'out-of-stock';
        }
        await product.save();

        await Inventory.create({
          product: product._id,
          changeType: 'sale',
          quantityChange: -item.qty,
          previousStock: prevStock,
          newStock: product.stock,
          reference: order.orderNumber,
        });

        // Low stock notification
        if (product.stock <= 5 && product.stock > 0) {
          await Notification.create({
            type: 'low-stock',
            title: 'Low Stock Alert',
            message: `${product.title} is low on stock (${product.stock} left)`,
            isAdmin: true,
          });
        }
      }
    }

    // Send order confirmation email
    const emailTo = req.user?.email || shippingAddress.email;
    if (emailTo) {
      sendEmail({
        to: emailTo,
        subject: `FLEVA — Order Confirmed #${order.orderNumber}`,
        html: `<h2>Order Confirmed!</h2><p>Your order <strong>#${order.orderNumber}</strong> has been placed.</p><p>Total: ৳${total}</p><p>Payment: ${paymentMethod.toUpperCase()}</p>`,
        text: `Order #${order.orderNumber} confirmed. Total: ৳${total}.`,
      }).catch(err => console.error('Order email failed:', err.message));
    }

    // Admin notification
    await Notification.create({
      type: 'order-update',
      title: 'New Order',
      message: `New order #${order.orderNumber} — ৳${total}`,
      isAdmin: true,
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/orders
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('items.product', 'title slug images');

    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/orders/:id
 */
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'title slug images price');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Users can only see their own orders
    if (req.user.role === 'user' && order.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/orders/:id/status (Admin only)
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, message } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;
    order.trackingHistory.push({
      status,
      message: message || `Order ${status}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });

    if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'paid';
    }
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      order.cancelledAt = new Date();
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.qty;
          if (product.stock > 0 && product.availability === 'out-of-stock') {
            product.availability = 'in-stock';
          }
          await product.save();
          await Inventory.create({
            product: product._id,
            changeType: 'restock',
            quantityChange: item.qty,
            previousStock: product.stock - item.qty,
            newStock: product.stock,
            reference: `Order #${order.orderNumber} cancelled`,
            updatedBy: req.user._id,
          });
        }
      }
    }

    await order.save();

    // Notify customer
    if (order.user) {
      await Notification.create({
        user: order.user,
        type: 'order-update',
        title: 'Order Update',
        message: `Your order #${order.orderNumber} is now ${status}`,
        link: `/account.html`,
      });
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/orders/admin/all (Admin only)
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, sort = '-createdAt' } = req.query;
    const filter = {};
    if (status) filter.orderStatus = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('user', 'name email'),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      orders,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/orders/:id/cancel
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role === 'user' && order.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['shipped', 'out-for-delivery', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel — order already shipped' });
    }

    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.trackingHistory.push({ status: 'cancelled', message: 'Order cancelled by customer', timestamp: new Date() });

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const prevStock = product.stock;
        product.stock += item.qty;
        if (product.stock > 0) product.availability = 'in-stock';
        await product.save();

        await Inventory.create({
          product: product._id,
          changeType: 'return',
          quantityChange: item.qty,
          previousStock: prevStock,
          newStock: product.stock,
          reference: order.orderNumber,
        });
      }
    }

    await order.save();
    res.json({ success: true, message: 'Order cancelled', order });
  } catch (err) {
    next(err);
  }
};
