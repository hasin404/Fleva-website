/* ==========================================================================
   FLEVA — Wishlist Routes
   ========================================================================== */
const router = require('express').Router();
const ctrl = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getWishlist);
router.post('/', ctrl.toggleWishlist);

module.exports = router;
