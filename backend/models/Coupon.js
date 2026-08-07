/* ==========================================================================
   FLEVA — Coupon Model
   ========================================================================== */
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'free-shipping'],
    required: true,
  },
  value: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 }, // Max discount cap for percentage
  expiryDate: { type: Date, required: true },
  usageLimit: { type: Number, default: 0 }, // 0 = unlimited
  usedCount: { type: Number, default: 0 },
  customerLimit: { type: Number, default: 1 }, // Per customer usage limit
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  autoApply: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  description: String,
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

couponSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
