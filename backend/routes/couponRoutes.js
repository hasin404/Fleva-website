/* ==========================================================================
   FLEVA — Coupon Routes
   ========================================================================== */
const router = require('express').Router();
const ctrl = require('../controllers/couponController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');

router.post('/validate', optionalAuth, ctrl.validateCoupon);
router.post('/', protect, authorize('admin', 'superadmin'), ctrl.createCoupon);
router.get('/', protect, authorize('admin', 'superadmin'), ctrl.getCoupons);
router.get('/:id', protect, authorize('admin', 'superadmin'), ctrl.getCoupon);
router.put('/:id', protect, authorize('admin', 'superadmin'), ctrl.updateCoupon);
router.delete('/:id', protect, authorize('admin', 'superadmin'), ctrl.deleteCoupon);

module.exports = router;
