/* ==========================================================================
   FLEVA — Search Controller
   Full-text search with filters, sorting, and pagination
   ========================================================================== */
const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Search products
// @route   GET /api/v1/search
// @access  Public
exports.searchProducts = async (req, res, next) => {
  try {
    const {
      q,           // search query
      category,    // category slug or ID
      brand,
      minPrice,
      maxPrice,
      rating,
      availability,
      tags,
      sort = 'relevance',
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { isActive: { $ne: false } };

    // Text search
    if (q && q.trim()) {
      filter.$text = { $search: q.trim() };
    }

    // Category filter
    if (category) {
      const cat = await Category.findOne({
        $or: [{ slug: category }, { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }],
      });
      if (cat) filter.category = cat._id;
    }

    // Brand filter
    if (brand) {
      filter.brand = { $regex: brand, $options: 'i' };
    }

    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating) {
      filter.rating = { $gte: Number(rating) };
    }

    // Availability
    if (availability === 'in-stock') {
      filter.stock = { $gt: 0 };
    } else if (availability === 'out-of-stock') {
      filter.stock = 0;
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      filter.tags = { $in: tagArray };
    }

    // Sorting
    let sortObj = {};
    switch (sort) {
      case 'newest': sortObj = { createdAt: -1 }; break;
      case 'oldest': sortObj = { createdAt: 1 }; break;
      case 'price-asc': sortObj = { price: 1 }; break;
      case 'price-desc': sortObj = { price: -1 }; break;
      case 'popularity': sortObj = { numReviews: -1 }; break;
      case 'rating': sortObj = { rating: -1 }; break;
      case 'discount': sortObj = { discountPrice: 1 }; break;
      case 'relevance':
      default:
        if (q) sortObj = { score: { $meta: 'textScore' } };
        else sortObj = { createdAt: -1 };
        break;
    }

    const skip = (Number(page) - 1) * Number(limit);

    let query = Product.find(filter)
      .populate('category', 'name slug');

    // Add text score for relevance sort
    if (q && sort === 'relevance') {
      query = query.select({ score: { $meta: 'textScore' } });
    }

    const [products, total] = await Promise.all([
      query.sort(sortObj).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(filter),
    ]);

    // Get available filters for sidebar
    const categories = await Category.find({ isActive: true }).select('name slug').lean();
    const brands = await Product.distinct('brand', { isActive: { $ne: false } });

    res.json({
      success: true,
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      filters: {
        categories,
        brands: brands.filter(Boolean),
        priceRange: { min: 0, max: 10000 },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Search suggestions / autocomplete
// @route   GET /api/v1/search/suggest
// @access  Public
exports.searchSuggest = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ suggestions: [] });

    const products = await Product.find({
      title: { $regex: q, $options: 'i' },
      isActive: { $ne: false },
    })
      .select('title slug categoryName price')
      .limit(8)
      .lean();

    res.json({ suggestions: products });
  } catch (err) {
    next(err);
  }
};
