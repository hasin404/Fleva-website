const router = require('express').Router();
const { trackOrder, trackMyOrder } = require('../controllers/trackingController');
const { protect } = require('../middleware/auth');

router.get('/:orderNumber', trackOrder);        // Public — track by order number
router.get('/my/:orderId', protect, trackMyOrder); // Private — logged-in user

module.exports = router;
