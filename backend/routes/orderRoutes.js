/* ==========================================================================
   FLEVA — Order Routes
   ========================================================================== */
const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');

router.post('/', optionalAuth, ctrl.createOrder);
router.get('/', protect, ctrl.getMyOrders);
router.get('/admin/all', protect, authorize('admin', 'superadmin'), ctrl.getAllOrders);
router.get('/:id', protect, ctrl.getOrder);
router.put('/:id/status', protect, authorize('admin', 'superadmin'), ctrl.updateOrderStatus);
router.post('/:id/cancel', protect, ctrl.cancelOrder);

module.exports = router;
