/* ==========================================================================
   FLEVA — Banner Controller
   ========================================================================== */
const Banner = require('../models/Banner');
const fs = require('fs');
const path = require('path');

const ensureUploadDir = () => {
  const dir = path.join(__dirname, '../../assets/uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const saveFileLocally = (file) => {
  return new Promise((resolve, reject) => {
    try {
      ensureUploadDir();
      const filename = `upload-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      const filepath = path.join(__dirname, '../../assets/uploads', filename);
      fs.writeFileSync(filepath, file.buffer);
      resolve({ secure_url: `assets/uploads/${filename}` });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * GET /api/v1/banners — Public (active banners only)
 */
exports.getActiveBanners = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;

    // Filter by schedule
    const now = new Date();
    filter.$or = [
      { startDate: null, endDate: null },
      { startDate: { $lte: now }, endDate: null },
      { startDate: null, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: { $gte: now } },
    ];

    const banners = await Banner.find(filter).sort('sortOrder').populate('product', 'title slug price images');
    res.json({ success: true, banners });
  } catch (err) { next(err); }
};

/** POST /api/v1/banners (Admin) */
exports.createBanner = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      const result = await saveFileLocally(req.file);
      data.image = { url: result.secure_url };
    }
    const banner = await Banner.create(data);
    res.status(201).json({ success: true, banner });
  } catch (err) { next(err); }
};

/** GET /api/v1/banners/admin/all (Admin) */
exports.getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort('-createdAt');
    res.json({ success: true, banners });
  } catch (err) { next(err); }
};

/** GET /api/v1/banners/:id (Admin) */
exports.getBannerById = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, banner });
  } catch (err) { next(err); }
};

/** PUT /api/v1/banners/:id (Admin) */
exports.updateBanner = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      const result = await saveFileLocally(req.file);
      data.image = { url: result.secure_url };
    }
    const banner = await Banner.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, banner });
  } catch (err) { next(err); }
};

/** DELETE /api/v1/banners/:id (Admin) */
exports.deleteBanner = async (req, res, next) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) { next(err); }
};
