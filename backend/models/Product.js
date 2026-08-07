/* ==========================================================================
   FLEVA — Product Model
   ========================================================================== */
const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: 200,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: 5000,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  discountPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  categoryName: {
    type: String,
    default: '',
  },
  subcategory: {
    type: String,
    trim: true,
    default: '',
  },
  brand: {
    type: String,
    trim: true,
    default: 'FLEVA',
  },
  images: [{
    url: String,
    publicId: String, // Cloudinary public ID
    alt: String,
  }],
  gallery: [{
    url: String,
    publicId: String,
    alt: String,
  }],
  stock: {
    type: Number,
    required: true,
    default: 100,
    min: 0,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  weight: {
    type: String,
    default: '',
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
  tags: [{ type: String, trim: true }],
  isFeatured: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  availability: {
    type: String,
    enum: ['in-stock', 'out-of-stock', 'pre-order', 'upcoming', 'hidden'],
    default: 'in-stock',
  },
  advancePaymentPercentage: {
    type: Number,
    default: 20,
    min: 0,
    max: 100,
  },

  // Display helpers (from existing frontend)
  color: { type: String, default: '#16140F' },
  accent: { type: String, default: 'var(--lime)' },
  tag: { type: String, default: '' },

  // SEO
  metaTitle: String,
  metaDescription: String,
}, {
  timestamps: true,
});

// Text search index
productSchema.index({ title: 'text', description: 'text', tags: 'text', categoryName: 'text', brand: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isBestSeller: 1 });

// Auto-generate slug before saving
productSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  // Auto mark out-of-stock only if it was supposed to be in-stock
  if (this.stock <= 0 && this.availability === 'in-stock') {
    this.availability = 'out-of-stock';
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
