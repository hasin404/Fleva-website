/* ==========================================================================
   FLEVA — Notification Model
   ========================================================================== */
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['order-update', 'low-stock', 'new-customer', 'refund-request', 'promo', 'system', 'review'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: String,
  isRead: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }, // Admin-only notification
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ isAdmin: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
