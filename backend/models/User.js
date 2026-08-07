/* ==========================================================================
   FLEVA — User Model
   ========================================================================== */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label:   { type: String, default: 'Home' },
  name:    String,
  phone:   String,
  street:  String,
  city:    String,
  zip:     String,
  country: { type: String, default: 'Bangladesh' },
}, { _id: true });

const userSchema = new mongoose.Schema({
  customerId: {
    type: String,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
  },
  dob: {
    type: Date,
    required: [true, 'Date of Birth is required'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false, // Don't include in queries by default
  },
  profilePhoto: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user',
  },

  // Addresses
  shippingAddresses: [addressSchema],
  billingAddress: addressSchema,

  // Verification
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpiry: Date,

  // OTP
  otp: String,
  otpExpiry: Date,

  // Account security
  isLocked: { type: Boolean, default: false },
  lockUntil: Date,
  failedLoginAttempts: { type: Number, default: 0 },

  // Refresh token
  refreshToken: { type: String, select: false },

  // Social auth
  googleId: String,
  facebookId: String,

  // Rewards
  rewardPoints: { type: Number, default: 0 },

  // Password reset
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
}, {
  timestamps: true,
});

// Additional indexes for lookups
userSchema.index({ phone: 1 });
userSchema.index({ googleId: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.otp;
  delete obj.otpExpiry;
  delete obj.verificationToken;
  delete obj.verificationTokenExpiry;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpiry;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
