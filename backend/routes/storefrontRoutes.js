const router = require('express').Router();
const ctrl = require('../controllers/storefrontController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Public
router.get('/', ctrl.getStorefront);

// Admin only
router.put('/', 
  protect, 
  authorize('admin', 'superadmin'), 
  upload.fields([
    { name: 'heroImage1', maxCount: 1 }, 
    { name: 'heroImage2', maxCount: 1 },
    { name: 'heroImage3', maxCount: 1 },
    { name: 'cravingImg1', maxCount: 1 },
    { name: 'cravingImg2', maxCount: 1 },
    { name: 'cravingImg3', maxCount: 1 },
    { name: 'cravingImgMain', maxCount: 1 },
    { name: 'heroFloat1', maxCount: 1 },
    { name: 'heroFloat2', maxCount: 1 },
    { name: 'heroFloat3', maxCount: 1 },
    { name: 'heroFloat4', maxCount: 1 },
    { name: 'heroFloat5', maxCount: 1 },
    { name: 'heroFloat6', maxCount: 1 },
    { name: 'heroFloat7', maxCount: 1 }
  ]), 
  ctrl.updateStorefront
);

module.exports = router;
