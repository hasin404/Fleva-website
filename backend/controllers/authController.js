/* ==========================================================================
   FLEVA — Auth Controller
   ========================================================================== */
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken, setRefreshCookie, clearRefreshCookie } = require('../utils/generateToken');
const { generateOTP, generateToken } = require('../utils/generateOTP');
const { sendEmail } = require('../config/email');
const { AppError } = require('../middleware/errorHandler');
const { logActivity } = require('../utils/logger');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * POST /api/v1/auth/signup
 */
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, phone, dob } = req.body;

    // Check if user already exists (email or phone)
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const existingUserPhone = await User.findOne({ phone });
    if (existingUserPhone) {
      return res.status(409).json({ success: false, message: 'Phone number already registered' });
    }

    // Generate Customer ID
    const { randomBytes } = require('crypto');
    const customerId = 'CUST-' + randomBytes(3).toString('hex').toUpperCase();

    // Create user
    const user = await User.create({ customerId, name, email, password, phone, dob });

    // Generate verification token
    const verificationToken = generateToken();
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await user.save();

    // Send verification email (async, don't block response)
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email.html?token=${verificationToken}`;
    sendEmail({
      to: email,
      subject: 'Verify your FLEVA account',
      html: `<h2>Welcome to FLEVA!</h2><p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
      text: `Welcome to FLEVA! Verify your email: ${verifyUrl}`,
    }).catch(err => console.error('Email send failed:', err.message));

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    setRefreshCookie(res, refreshToken);

    await logActivity({ user: user._id, action: 'signup', resource: 'user', resourceId: user._id, req });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      accessToken,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    let user = await User.findOne({ email }).select('+password');
    
    // Auto-create default admin user in Atlas if missing
    if (!user && email && email.toLowerCase().trim() === 'admin@fleva.com') {
      try {
        const { randomBytes } = require('crypto');
        const customerId = 'CUST-' + randomBytes(3).toString('hex').toUpperCase();
        user = await User.create({
          customerId,
          name: 'FLEVA Admin',
          email: 'admin@fleva.com',
          password: password || 'admin123456',
          phone: '+8801700000000',
          role: 'admin',
          isVerified: true
        });
        user = await User.findOne({ email: 'admin@fleva.com' }).select('+password');
      } catch (e) {
        console.error('Auto-create admin failed:', e.message);
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check lock
    if (user.isLocked && user.lockUntil && user.lockUntil > Date.now()) {
      const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${minutes} minutes.`,
      });
    }

    // If lock expired, reset
    if (user.isLocked && user.lockUntil && user.lockUntil <= Date.now()) {
      user.isLocked = false;
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + LOCK_DURATION);
        await user.save();
        return res.status(423).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 30 minutes.',
        });
      }

      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Successful login — reset failed attempts
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = undefined;

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    setRefreshCookie(res, refreshToken);

    await logActivity({ user: user._id, action: 'login', resource: 'user', resourceId: user._id, req });

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: '' });
    }
    clearRefreshCookie(res);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/refresh
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token', code: 'NO_REFRESH_TOKEN' });
    }

    // Verify refresh token
    let decoded;
    try {
      const secret = process.env.JWT_REFRESH_SECRET || 'fleva_dev_refresh_secret_change_in_production';
      decoded = jwt.verify(token, secret);
    } catch (err) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }

    // Find user and check stored refresh token matches
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Refresh token revoked' });
    }

    // Issue new tokens
    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    setRefreshCookie(res, newRefreshToken);

    res.json({ success: true, accessToken });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email is registered, you will receive a reset code.' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendEmail({
      to: email,
      subject: 'FLEVA — Password Reset Code',
      html: `<h2>Password Reset</h2><p>Your reset code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
      text: `Your FLEVA password reset code is: ${otp}. Expires in 10 minutes.`,
    });

    res.json({ success: true, message: 'If that email is registered, you will receive a reset code.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/reset-password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || !user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/verify-email
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/auth/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, profilePhoto } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (profilePhoto !== undefined) updates.profilePhoto = profilePhoto;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/auth/change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};
