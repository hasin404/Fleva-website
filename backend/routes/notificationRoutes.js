/* ==========================================================================
   FLEVA — Notification Routes
   ========================================================================== */
const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, ctrl.getMyNotifications);
router.put('/read-all', protect, ctrl.markAllRead);
router.put('/:id/read', protect, ctrl.markRead);
router.get('/admin', protect, authorize('admin', 'superadmin'), ctrl.getAdminNotifications);

module.exports = router;
