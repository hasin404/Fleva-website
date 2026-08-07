/* ==========================================================================
   FLEVA — Coupon Controller
   ========================================================================== */
const Coupon = require('../models/Coupon');

/**
 * POST /api/v1/coupons/validate
 */
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, orderTotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }
    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }
    if (req.user && coupon.customerLimit > 0) {
      const userUses = coupon.usedBy.filter(u => u.toString() === req.user._id.toString()).length;
      if (userUses >= coupon.customerLimit) {
        return res.status(400).json({ success: false, message: 'You have already used this coupon' });
      }
    }
    if (coupon.minOrderAmount > 0 && orderTotal < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order ৳${coupon.minOrderAmount} required` });
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.round(orderTotal * (coupon.value / 100));
      if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    }
    // free-shipping handled by order controller

    res.json({
      success: true,
      coupon: { 
        code: coupon.code, 
        type: coupon.type, 
        value: coupon.value, 
        discount,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount
      },
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/coupons (Admin)
 */
exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/coupons/:id (Admin)
 */
exports.getCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, coupon });
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/coupons (Admin)
 */
exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    res.json({ success: true, coupons });
  } catch (err) { next(err); }
};

/**
 * PUT /api/v1/coupons/:id (Admin)
 */
exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, coupon });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/v1/coupons/:id (Admin)
 */
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) { next(err); }
};
