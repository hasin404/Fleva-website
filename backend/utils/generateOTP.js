/* ==========================================================================
   FLEVA — OTP Generator
   ========================================================================== */
const crypto = require('crypto');

/**
 * Generate a 6-digit numeric OTP.
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Generate a secure random token (hex string).
 */
const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

module.exports = { generateOTP, generateToken };
