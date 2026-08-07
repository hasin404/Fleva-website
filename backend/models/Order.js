/* ==========================================================================
   FLEVA — Order Model
   ========================================================================== */
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: String,
  image: String,
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Guest checkout support
  guestEmail: String,
  guestName: String,

  orderNumber: {
    type: String,
    unique: true,
  },
  items: [orderItemSchema],

  shippingAddress: {
    name: String,
    phone: String,
    email: String,
    street: String,
    city: String,
    zip: String,
    country: { type: String, default: 'Bangladesh' },
  },
  billingAddress: {
    name: String,
    phone: String,
    street: String,
    city: String,
    zip: String,
    country: { type: String, default: 'Bangladesh' },
  },

  paymentMethod: {
    type: String,
    enum: ['bkash', 'nagad', 'cod', 'stripe', 'sslcommerz'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentId: String, // External payment reference

  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'packed', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned', 'refunded'],
    default: 'pending',
  },

  trackingHistory: [{
    status: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],

  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 80 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  couponCode: String,
  total: { type: Number, required: true },
  
  advancePayment: { type: Number, default: 0 },
  remainingBalance: { type: Number, default: 0 },

  notes: String,
  invoiceUrl: String,

  deliveredAt: Date,
  cancelledAt: Date,
}, {
  timestamps: true,
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

// Generate order number before saving
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `FLV-${ts}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
