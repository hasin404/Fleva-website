/* ==========================================================================
   FLEVA — Analytics Controller (Admin)
   ========================================================================== */
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

/** GET /api/v1/analytics/dashboard */
exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalOrders, totalCustomers, totalProducts,
      todaysOrders, monthlyOrders,
      revenueAll, revenueToday, revenueMonth,
      recentOrders, topProducts, lowStock,
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: monthStart } }),
      Order.aggregate([{ $match: { orderStatus: 'delivered' } }, { $group: { _id: null, total: { $sum: { $subtract: ['$total', { $ifNull: ['$deliveryFee', 0] }] } } } }]),
      Order.aggregate([{ $match: { orderStatus: 'delivered', createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: { $subtract: ['$total', { $ifNull: ['$deliveryFee', 0] }] } } } }]),
      Order.aggregate([{ $match: { orderStatus: 'delivered', createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: { $subtract: ['$total', { $ifNull: ['$deliveryFee', 0] }] } } } }]),
      Order.find().sort('-createdAt').limit(10).populate('user', 'name email'),
      Product.find().sort('-numReviews').limit(10).select('title price stock numReviews rating images'),
      Product.find({ stock: { $lte: 5 } }).sort('stock').limit(10).select('title stock sku'),
    ]);

    res.json({
      success: true,
      dashboard: {
        totalOrders,
        totalCustomers,
        totalProducts,
        todaysOrders,
        monthlyOrders,
        totalRevenue: revenueAll[0]?.total || 0,
        todaysRevenue: revenueToday[0]?.total || 0,
        monthlyRevenue: revenueMonth[0]?.total || 0,
        recentOrders,
        topProducts,
        lowStock,
      },
    });
  } catch (err) { next(err); }
};

/** GET /api/v1/analytics/sales */
exports.getSalesAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const salesByDay = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: { $in: ['paid', 'pending'] } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const salesByCategory = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'prod' } },
      { $unwind: '$prod' },
      { $group: { _id: '$prod.categoryName', revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } }, qty: { $sum: '$items.qty' } } },
      { $sort: { revenue: -1 } },
    ]);

    res.json({ success: true, salesByDay, salesByCategory });
  } catch (err) { next(err); }
};
