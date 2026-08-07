/* ==========================================================================
   FLEVA — Product Controller
   ========================================================================== */
const Product = require('../models/Product');
const Category = require('../models/Category');
const Inventory = require('../models/Inventory');
const { AppError } = require('../middleware/errorHandler');
const cloudinary = require('../config/cloudinary');

const path = require('path');
const fs = require('fs');

const uploadToCloudinary = (buffer, folder = 'fleva-products') => {
  return new Promise((resolve, reject) => {
    try {
      const filename = `upload-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;
      const filepath = path.join(__dirname, '..', '..', 'assets', 'uploads', filename);
      fs.writeFileSync(filepath, buffer);
      resolve({
        secure_url: `/assets/uploads/${filename}`,
        public_id: filename
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * GET /api/v1/products
 * Public — list products with filters, sort, pagination, search
 */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      sort = '-createdAt',
      category, brand, minPrice, maxPrice,
      availability, isFeatured, isBestSeller,
      search, tags,
    } = req.query;

    const filter = {};

    if (category) filter.categoryName = category;
    if (brand) filter.brand = brand;
    if (availability) filter.availability = availability;
    else if (req.query.admin !== 'true') filter.availability = { $ne: 'hidden' };

    if (isFeatured === 'true') filter.isFeatured = true;
    if (isBestSeller === 'true') filter.isBestSeller = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (tags) filter.tags = { $in: tags.split(',').map(t => t.trim()) };

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Sort map
    const sortMap = {
      'newest': '-createdAt',
      'oldest': 'createdAt',
      'price-low': 'price',
      'price-high': '-price',
      'popular': '-numReviews',
      'rating': '-rating',
      'discount': '-discountPrice',
    };
    const sortBy = sortMap[sort] || sort;

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortBy).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/products/:idOrSlug
 */
exports.getProduct = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    let product;

    // Try by slug first, then by ID
    product = await Product.findOne({ slug: idOrSlug });
    if (!product) {
      product = await Product.findById(idOrSlug).catch(() => null);
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/products (Admin only)
 */
exports.createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };
    if (req.body.tags && typeof req.body.tags === 'string') {
      productData.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      productData.images = [{ url: result.secure_url, publicId: result.public_id }];
    }

    const product = await Product.create(productData);

    // Log initial inventory
    await Inventory.create({
      product: product._id,
      changeType: 'initial',
      quantityChange: product.stock,
      previousStock: 0,
      newStock: product.stock,
      reference: 'Product created',
      updatedBy: req.user._id,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/products/:id (Admin only)
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const productData = { ...req.body };
    if (req.body.tags && typeof req.body.tags === 'string') {
      productData.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      productData.images = [{ url: result.secure_url, publicId: result.public_id }];
      
      // Optionally delete old image from cloudinary here if oldProduct.images[0].publicId exists
      if (oldProduct.images && oldProduct.images[0] && oldProduct.images[0].publicId) {
        await cloudinary.uploader.destroy(oldProduct.images[0].publicId).catch(() => {});
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true,
    });

    // Log stock changes
    if (req.body.stock !== undefined && req.body.stock !== oldProduct.stock) {
      await Inventory.create({
        product: product._id,
        changeType: 'adjustment',
        quantityChange: req.body.stock - oldProduct.stock,
        previousStock: oldProduct.stock,
        newStock: req.body.stock,
        reference: 'Manual adjustment',
        updatedBy: req.user._id,
      });
    }

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/products/:id (Admin only)
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/products/:id/duplicate (Admin only)
 */
exports.duplicateProduct = async (req, res, next) => {
  try {
    const original = await Product.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const data = original.toObject();
    delete data._id;
    delete data.slug;
    data.title = `${data.title} (Copy)`;
    data.sku = data.sku ? `${data.sku}-COPY` : undefined;

    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/products/categories/list
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('sortOrder');
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};
