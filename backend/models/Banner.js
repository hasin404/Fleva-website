/* ==========================================================================
   FLEVA — Banner Model
   ========================================================================== */
const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: '' },
  type: {
    type: String,
    enum: ['hero', 'flash-sale', 'category', 'offer', 'popup'],
    default: 'hero',
  },
  image: {
    url: String,
    publicId: String,
  },
  link: { type: String, default: '' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isActive: { type: Boolean, default: true },
  startDate: Date,
  endDate: Date,
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

bannerSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
