const mongoose = require('mongoose');
require('./Product');

const StorefrontSchema = new mongoose.Schema({
  globalId: { type: String, default: 'main', unique: true },
  heroTitle: { type: String, default: 'Real fruits.<br>Crazy good.<span class="stroke">Fleva.</span>' },
  heroSubtitle: { type: String, default: 'From snacking to sharing, we make healthy feel insanely delicious.' },
  heroBtnText: { type: String, default: 'Explore now' },
  heroBtnLink: { type: String, default: 'shop.html' },
  heroImage1: {
    type: String,
    default: 'assets/hero/pouch-front.png'
  },
  heroImage2: {
    type: String,
    default: 'assets/hero/can-front.png'
  },
  heroImage3: {
    type: String,
    default: 'assets/hero/fruit-chips.png'
  },
  cravingImg1: { type: String, default: 'assets/craving/product-1.png' },
  cravingImg2: { type: String, default: 'assets/craving/product-2.png' },
  cravingImg3: { type: String, default: 'assets/craving/product-3.png' },
  cravingImgMain: { type: String, default: 'assets/craving/product-main.png' },
  deliveryFee: { type: Number, default: 80 },
  cravings: {
    energy: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    fruity: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    guiltFree: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    surprise: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
  },
  heroFloat1: { type: String, default: '' },
  heroFloat2: { type: String, default: '' },
  heroFloat3: { type: String, default: '' },
  heroFloat4: { type: String, default: '' },
  heroFloat5: { type: String, default: '' },
  heroFloat6: { type: String, default: '' },
  heroFloat7: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Storefront', StorefrontSchema);
