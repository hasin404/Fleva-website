/* ==========================================================================
   FLEVA — AI Assistant Routes
   ========================================================================== */
const router = require('express').Router();
const ctrl = require('../controllers/aiController');
const { optionalAuth, protect } = require('../middleware/auth');

router.post('/chat', optionalAuth, ctrl.chat);
router.get('/history', protect, ctrl.getChatHistory);
router.post('/escalate', optionalAuth, ctrl.escalateToHuman);

module.exports = router;
