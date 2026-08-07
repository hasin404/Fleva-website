/* ==========================================================================
   FLEVA — Cart Routes
   ========================================================================== */
const router = require('express').Router();
const ctrl = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect); // All cart routes require auth
router.get('/', ctrl.getCart);
router.post('/', ctrl.addToCart);
router.put('/:productId', ctrl.updateCartItem);
router.delete('/:productId', ctrl.removeFromCart);
router.delete('/', ctrl.clearCart);

module.exports = router;
