/* ==========================================================================
   FLEVA — Review Routes
   ========================================================================== */
const router = require('express').Router();
const ctrl = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.get('/admin/all', protect, authorize('admin', 'superadmin'), ctrl.getAllReviews);
router.get('/:productId', ctrl.getProductReviews);
router.post('/:productId', protect, ctrl.createReview);
router.put('/:id/moderate', protect, authorize('admin', 'superadmin'), ctrl.moderateReview);
router.delete('/:id', protect, authorize('admin', 'superadmin'), ctrl.deleteReview);

module.exports = router;
