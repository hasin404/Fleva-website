const Storefront = require('../models/Storefront');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const saveFileLocally = (file) => {
  return new Promise((resolve) => {
    try {
      if (file) {
        const buf = file.buffer || (Buffer.isBuffer(file) ? file : Buffer.from(file));
        const b64 = buf.toString('base64');
        const isPng = (file.mimetype && file.mimetype.includes('png')) || (file.originalname && file.originalname.toLowerCase().endsWith('.png'));
        const mime = isPng ? 'image/png' : (file.mimetype || 'image/jpeg');
        return resolve({ secure_url: `data:${mime};base64,${b64}` });
      }
      resolve({ secure_url: '/assets/products/protein-bars.png' });
    } catch (err) {
      resolve({ secure_url: '/assets/products/protein-bars.png' });
    }
  });
};

const DEFAULT_HERO_TITLE = 'Real fruits.<br>Crazy good.<span class="stroke">Fleva.</span>';
const DEFAULT_HERO_SUBTITLE = 'From snacking to sharing, we make healthy feel insanely delicious.';
const DEFAULT_HERO_BTN_TEXT = 'Explore now';
const DEFAULT_HERO_BTN_LINK = 'shop.html';

exports.getStorefront = async (req, res, next) => {
  try {
    let storefront = await Storefront.findOne({ globalId: 'main' })
      .populate('cravings.energy')
      .populate('cravings.fruity')
      .populate('cravings.guiltFree')
      .populate('cravings.surprise');
      
    if (!storefront) {
      storefront = await Storefront.create({ globalId: 'main' });
    }

    let needsSave = false;
    if (!storefront.heroTitle || !storefront.heroTitle.trim()) { storefront.heroTitle = DEFAULT_HERO_TITLE; needsSave = true; }
    if (!storefront.heroSubtitle || !storefront.heroSubtitle.trim()) { storefront.heroSubtitle = DEFAULT_HERO_SUBTITLE; needsSave = true; }
    if (!storefront.heroBtnText || !storefront.heroBtnText.trim()) { storefront.heroBtnText = DEFAULT_HERO_BTN_TEXT; needsSave = true; }
    if (!storefront.heroBtnLink || !storefront.heroBtnLink.trim()) { storefront.heroBtnLink = DEFAULT_HERO_BTN_LINK; needsSave = true; }
    
    // Auto-fill default products for cravings if unassigned
    const products = await Product.find().limit(4);
    if (products.length > 0) {
      if (!storefront.cravings) storefront.cravings = {};
      if (!storefront.cravings.energy && products[0]) { storefront.cravings.energy = products[0]._id; needsSave = true; }
      if (!storefront.cravings.fruity && products[1]) { storefront.cravings.fruity = products[1]._id; needsSave = true; }
      if (!storefront.cravings.guiltFree && products[2]) { storefront.cravings.guiltFree = products[2]._id; needsSave = true; }
      if (!storefront.cravings.surprise && products[3]) { storefront.cravings.surprise = products[3]._id; needsSave = true; }
    if (!storefront.cravingLabels) storefront.cravingLabels = {};
    if (!storefront.cravingLabels.energy) { storefront.cravingLabels.energy = 'I want energy ⚡'; needsSave = true; }
    if (!storefront.cravingLabels.fruity) { storefront.cravingLabels.fruity = 'I want something fruity 🍓'; needsSave = true; }
    if (!storefront.cravingLabels.guiltFree) { storefront.cravingLabels.guiltFree = 'I want guilt-free snacks 😊'; needsSave = true; }
    if (!storefront.cravingLabels.surprise) { storefront.cravingLabels.surprise = 'Surprise me 🎲'; needsSave = true; }

    if (needsSave) {
      try { await storefront.save(); } catch(e) {}
    }

    res.status(200).json({ success: true, storefront });
  } catch (err) {
    console.error('getStorefront error:', err);
    res.status(200).json({
      success: true,
      storefront: {
        globalId: 'main',
        heroTitle: DEFAULT_HERO_TITLE,
        heroSubtitle: DEFAULT_HERO_SUBTITLE,
        heroBtnText: DEFAULT_HERO_BTN_TEXT,
        heroBtnLink: DEFAULT_HERO_BTN_LINK,
        cravings: {}
      }
    });
  }
};

exports.updateStorefront = async (req, res, next) => {
  try {
    let storefront = await Storefront.findOne({ globalId: 'main' });
    if (!storefront) storefront = await Storefront.create({ globalId: 'main' });

    const data = { ...req.body };

    if (!data.heroTitle || !data.heroTitle.trim()) data.heroTitle = DEFAULT_HERO_TITLE;
    if (!data.heroSubtitle || !data.heroSubtitle.trim()) data.heroSubtitle = DEFAULT_HERO_SUBTITLE;
    if (!data.heroBtnText || !data.heroBtnText.trim()) data.heroBtnText = DEFAULT_HERO_BTN_TEXT;
    if (!data.heroBtnLink || !data.heroBtnLink.trim()) data.heroBtnLink = DEFAULT_HERO_BTN_LINK;

    if (req.files) {
      if (req.files.heroImage1 && req.files.heroImage1[0]) {
        const result = await saveFileLocally(req.files.heroImage1[0]);
        data.heroImage1 = result.secure_url;
      }
      if (req.files.heroImage2 && req.files.heroImage2[0]) {
        const result = await saveFileLocally(req.files.heroImage2[0]);
        data.heroImage2 = result.secure_url;
      }
      if (req.files.heroImage3 && req.files.heroImage3[0]) {
        const result = await saveFileLocally(req.files.heroImage3[0]);
        data.heroImage3 = result.secure_url;
      }
      if (req.files.cravingImg1) {
        const result = await saveFileLocally(req.files.cravingImg1[0]);
        data.cravingImg1 = result.secure_url;
      }
      if (req.files.cravingImg2) {
        const result = await saveFileLocally(req.files.cravingImg2[0]);
        data.cravingImg2 = result.secure_url;
      }
      if (req.files.cravingImg3) {
        const result = await saveFileLocally(req.files.cravingImg3[0]);
        data.cravingImg3 = result.secure_url;
      }
      if (req.files.cravingImgMain) {
        const result = await saveFileLocally(req.files.cravingImgMain[0]);
        data.cravingImgMain = result.secure_url;
      }
      
      for (let i = 1; i <= 7; i++) {
        if (req.files[`heroFloat${i}`] && req.files[`heroFloat${i}`][0]) {
          const result = await saveFileLocally(req.files[`heroFloat${i}`][0]);
          data[`heroFloat${i}`] = result.secure_url;
        }
      }
    }

    if (data.cravings && typeof data.cravings === 'string') {
      try { 
        data.cravings = JSON.parse(data.cravings); 
        // Clean up empty values to avoid ObjectId cast errors
        ['energy', 'fruity', 'guiltFree', 'surprise'].forEach(key => {
          if (!data.cravings[key] || data.cravings[key] === 'null' || data.cravings[key] === 'undefined') {
            data.cravings[key] = null; // explicitly set to null instead of empty string or undefined
          }
        });
      } catch(e){}
    }

    if (data.cravingLabels && typeof data.cravingLabels === 'string') {
      try { 
        data.cravingLabels = JSON.parse(data.cravingLabels); 
      } catch(e){}
    }

    storefront = await Storefront.findOneAndUpdate(
      { globalId: 'main' },
      data,
      { new: true, runValidators: true }
    ).populate('cravings.energy').populate('cravings.fruity').populate('cravings.guiltFree').populate('cravings.surprise');

    res.status(200).json({ success: true, storefront });
  } catch (err) {
    next(err);
  }
};
