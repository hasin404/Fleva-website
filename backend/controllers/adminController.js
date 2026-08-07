/* ==========================================================================
   FLEVA — Admin Controller (customer management, activity logs)
   ========================================================================== */
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

/** GET /api/v1/admin/customers */
exports.getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

/** GET /api/v1/admin/customers/:id */
exports.getCustomer = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

/** PUT /api/v1/admin/customers/:id */
exports.updateCustomer = async (req, res, next) => {
  try {
    const { role, isLocked, rewardPoints } = req.body;
    const updates = {};
    if (role !== undefined) updates.role = role;
    if (isLocked !== undefined) {
      updates.isLocked = isLocked;
      if (!isLocked) {
        updates.failedLoginAttempts = 0;
        updates.lockUntil = undefined;
      }
    }
    if (rewardPoints !== undefined) updates.rewardPoints = rewardPoints;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

/** DELETE /api/v1/admin/customers/:id */
exports.deleteCustomer = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
};

/** GET /api/v1/admin/activity-logs */
exports.getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      ActivityLog.find().sort('-createdAt').skip(skip).limit(Number(limit)).populate('user', 'name email'),
      ActivityLog.countDocuments(),
    ]);
    res.json({ success: true, logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};
