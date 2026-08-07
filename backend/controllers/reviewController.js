/* ==========================================================================
   FLEVA — Review Controller
   ========================================================================== */
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * GET /api/v1/reviews/:productId
 */
exports.getProductReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filter = { product: req.params.productId, status: 'approved' };
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)).populate('user', 'name profilePhoto'),
      Review.countDocuments(filter),
    ]);

    res.json({ success: true, reviews, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/reviews/:productId
 */
exports.createReview = async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;
    const productId = req.params.productId;

    // Check if user already reviewed
    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already reviewed this product' });
    }

    // Check if user purchased this product
    const purchased = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      orderStatus: 'delivered',
    });

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating,
      title,
      comment,
      isVerifiedPurchase: !!purchased,
    });

    // Update product average rating
    await recalcProductRating(productId);

    res.status(201).json({ success: true, review });
  } catch (err) { next(err); }
};

/**
 * PUT /api/v1/reviews/:id/moderate (Admin)
 */
exports.moderateReview = async (req, res, next) => {
  try {
    const { status, adminReply } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminReply !== undefined) {
      update.adminReply = adminReply;
      update.adminRepliedAt = new Date();
    }

    const review = await Review.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    // Recalc if status changed
    if (status) await recalcProductRating(review.product);

    res.json({ success: true, review });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/v1/reviews/:id (Admin)
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    await recalcProductRating(review.product);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/reviews/admin/all (Admin)
 */
exports.getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [reviews, total] = await Promise.all([
      Review.find(filter).sort('-createdAt').skip(skip).limit(Number(limit))
        .populate('user', 'name email').populate('product', 'title slug'),
      Review.countDocuments(filter),
    ]);

    res.json({ success: true, reviews, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

/* ---- Helper ---- */
async function recalcProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId, status: 'approved' } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { rating: 0, numReviews: 0 });
  }
}
