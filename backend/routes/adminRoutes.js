/* ==========================================================================
   FLEVA — Admin Routes (Customer management, activity logs)
   ========================================================================== */
const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'superadmin'));
router.get('/customers', ctrl.getCustomers);
router.get('/customers/:id', ctrl.getCustomer);
router.put('/customers/:id', ctrl.updateCustomer);
router.delete('/customers/:id', ctrl.deleteCustomer);
router.get('/activity-logs', ctrl.getActivityLogs);

module.exports = router;
