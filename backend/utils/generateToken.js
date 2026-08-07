/* ==========================================================================
   FLEVA — JWT Token Utilities
   ========================================================================== */
const jwt = require('jsonwebtoken');

const getJwtSecret = () => (process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) ? process.env.JWT_SECRET : 'fleva_dev_jwt_secret_change_in_production';
const getJwtRefreshSecret = () => (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.trim()) ? process.env.JWT_REFRESH_SECRET : 'fleva_dev_refresh_secret_change_in_production';

/**
 * Generate a short-lived access token.
 */
const generateAccessToken = (userId) => {
  const idStr = (userId && userId._id) ? userId._id.toString() : String(userId);
  return jwt.sign(
    { id: idStr },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
};

/**
 * Generate a long-lived refresh token.
 */
const generateRefreshToken = (userId) => {
  const idStr = (userId && userId._id) ? userId._id.toString() : String(userId);
  return jwt.sign(
    { id: idStr },
    getJwtRefreshSecret(),
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

/**
 * Set refresh token as HTTP-only cookie on the response.
 */
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

/**
 * Clear the refresh token cookie.
 */
const clearRefreshCookie = (res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
};
