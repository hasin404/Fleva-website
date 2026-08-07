/* ==========================================================================
   FLEVA — Analytics Routes (Admin)
   ========================================================================== */
const router = require('express').Router();
const ctrl = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'superadmin'));
router.get('/dashboard', ctrl.getDashboard);
router.get('/sales', ctrl.getSalesAnalytics);

module.exports = router;
