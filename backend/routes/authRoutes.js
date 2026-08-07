/* ==========================================================================
   FLEVA — Auth Routes
   ========================================================================== */
const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, signupSchema, loginSchema, updateProfileSchema } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/signup', authLimiter, validate(signupSchema), ctrl.signup);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/logout', protect, ctrl.logout);
router.post('/refresh', ctrl.refreshToken);
router.post('/forgot-password', authLimiter, ctrl.forgotPassword);
router.post('/reset-password', authLimiter, ctrl.resetPassword);
router.post('/verify-email', ctrl.verifyEmail);
router.get('/me', protect, ctrl.getMe);
router.put('/profile', protect, validate(updateProfileSchema), ctrl.updateProfile);
router.put('/change-password', protect, ctrl.changePassword);

module.exports = router;
