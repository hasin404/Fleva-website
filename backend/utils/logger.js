/* ==========================================================================
   FLEVA — Logger Utility
   ========================================================================== */
const ActivityLog = require('../models/ActivityLog');

/**
 * Log an admin/system action for audit trail.
 */
const logActivity = async ({ user, action, resource, resourceId, details, req }) => {
  try {
    await ActivityLog.create({
      user: user || null,
      action,
      resource,
      resourceId: resourceId || null,
      details: details || '',
      ip: req ? (req.ip || req.connection?.remoteAddress) : '',
      userAgent: req ? req.get('User-Agent') : '',
    });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
};

module.exports = { logActivity };
