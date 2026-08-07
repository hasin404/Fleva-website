/* ==========================================================================
   FLEVA — Product Routes
   ========================================================================== */
const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Public
router.get('/', ctrl.getProducts);
router.get('/categories/list', ctrl.getCategories);
router.get('/:idOrSlug', ctrl.getProduct);

// Admin only
router.post('/', protect, authorize('admin', 'superadmin'), upload.single('image'), ctrl.createProduct);
router.put('/:id', protect, authorize('admin', 'superadmin'), upload.single('image'), ctrl.updateProduct);
router.delete('/:id', protect, authorize('admin', 'superadmin'), ctrl.deleteProduct);
router.post('/:id/duplicate', protect, authorize('admin', 'superadmin'), ctrl.duplicateProduct);

module.exports = router;
