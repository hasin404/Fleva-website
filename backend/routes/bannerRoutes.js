/* ==========================================================================
   FLEVA — Banner Routes
   ========================================================================== */
const router = require('express').Router();
const ctrl = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', ctrl.getActiveBanners);
router.get('/admin/all', protect, authorize('admin', 'superadmin'), ctrl.getAllBanners);
router.get('/:id', protect, authorize('admin', 'superadmin'), ctrl.getBannerById);
router.post('/', protect, authorize('admin', 'superadmin'), upload.single('image'), ctrl.createBanner);
router.put('/:id', protect, authorize('admin', 'superadmin'), upload.single('image'), ctrl.updateBanner);
router.delete('/:id', protect, authorize('admin', 'superadmin'), ctrl.deleteBanner);

module.exports = router;
