/* ==========================================================================
   FLEVA — Notification Controller
   ========================================================================== */
const Notification = require('../models/Notification');

/** GET /api/v1/notifications */
exports.getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort('-createdAt').limit(50);
    const unread = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ success: true, notifications, unread });
  } catch (err) { next(err); }
};

/** PUT /api/v1/notifications/read-all */
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) { next(err); }
};

/** PUT /api/v1/notifications/:id/read */
exports.markRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) { next(err); }
};

/** GET /api/v1/notifications/admin (Admin) */
exports.getAdminNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ isAdmin: true })
      .sort('-createdAt').limit(100);
    res.json({ success: true, notifications });
  } catch (err) { next(err); }
};
