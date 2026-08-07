/* ==========================================================================
   FLEVA — Wishlist Controller
   ========================================================================== */
const Wishlist = require('../models/Wishlist');

/**
 * GET /api/v1/wishlist
 */
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('products', 'title slug price discountPrice images categoryName color accent tag');

    if (!wishlist) wishlist = { products: [] };
    res.json({ success: true, wishlist });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/wishlist — Toggle product in wishlist
 */
exports.toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [productId] });
      return res.json({ success: true, added: true, wishlist });
    }

    const idx = wishlist.products.findIndex(p => p.toString() === productId);
    if (idx > -1) {
      wishlist.products.splice(idx, 1);
      await wishlist.save();
      return res.json({ success: true, added: false, wishlist });
    } else {
      wishlist.products.push(productId);
      await wishlist.save();
      return res.json({ success: true, added: true, wishlist });
    }
  } catch (err) { next(err); }
};
