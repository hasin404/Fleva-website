/* ==========================================================================
   FLEVA — Input Validation Middleware (Joi)
   ========================================================================== */
const Joi = require('joi');

/**
 * Generic validator factory.
 * Usage: validate(signupSchema) as Express middleware.
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map(d => d.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
    }
    next();
  };
};

/* ---- Schemas ---- */

const signupSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  phone: Joi.string().allow('').optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  phone: Joi.string().allow('').optional(),
  profilePhoto: Joi.string().allow('').optional(),
});

const productSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().max(5000).required(),
  price: Joi.number().min(0).required(),
  discountPrice: Joi.number().min(0).optional(),
  categoryName: Joi.string().allow('').optional(),
  subcategory: Joi.string().allow('').optional(),
  brand: Joi.string().allow('').optional(),
  stock: Joi.number().min(0).optional(),
  sku: Joi.string().allow('').optional(),
  weight: Joi.string().allow('').optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isFeatured: Joi.boolean().optional(),
  isBestSeller: Joi.boolean().optional(),
  color: Joi.string().allow('').optional(),
  accent: Joi.string().allow('').optional(),
  tag: Joi.string().allow('').optional(),
});

const orderSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    product: Joi.string().required(),
    qty: Joi.number().min(1).required(),
  })).min(1).required(),
  shippingAddress: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().allow('').optional(),
    street: Joi.string().required(),
    city: Joi.string().required(),
    zip: Joi.string().required(),
    country: Joi.string().optional(),
  }).required(),
  paymentMethod: Joi.string().valid('bkash', 'nagad', 'cod', 'stripe', 'sslcommerz').required(),
  couponCode: Joi.string().allow('').optional(),
  notes: Joi.string().allow('').optional(),
});

const reviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  title: Joi.string().max(200).allow('').optional(),
  comment: Joi.string().max(2000).required(),
});

const couponSchema = Joi.object({
  code: Joi.string().trim().min(3).max(30).required(),
  type: Joi.string().valid('percentage', 'fixed', 'free-shipping').required(),
  value: Joi.number().min(0).required(),
  minOrderAmount: Joi.number().min(0).optional(),
  maxDiscount: Joi.number().min(0).optional(),
  expiryDate: Joi.date().required(),
  usageLimit: Joi.number().min(0).optional(),
  customerLimit: Joi.number().min(0).optional(),
  autoApply: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  description: Joi.string().allow('').optional(),
});

module.exports = {
  validate,
  signupSchema,
  loginSchema,
  updateProfileSchema,
  productSchema,
  orderSchema,
  reviewSchema,
  couponSchema,
};
