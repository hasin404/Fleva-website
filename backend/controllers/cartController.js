/* ==========================================================================
   FLEVA — Cart Controller (server-side for logged-in users)
   ========================================================================== */
const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * GET /api/v1/cart
 */
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'title slug price discountPrice images stock availability color accent tag categoryName');

    if (!cart) {
      cart = { items: [] };
    }

    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/cart — Add item or update quantity
 */
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, qty = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.availability === 'out-of-stock' || product.availability === 'upcoming' || product.availability === 'hidden') {
      return res.status(400).json({ success: false, message: 'Product is not available for purchase.' });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    let currentQty = 0;
    if (cart) {
      const existingItem = cart.items.find(i => i.product.toString() === productId);
      if (existingItem) currentQty = existingItem.qty;
    }

    if (product.availability === 'in-stock' && product.stock < (currentQty + qty)) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Only ${product.stock} available.` });
    }

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [{ product: productId, qty }] });
    } else {
      const existingItem = cart.items.find(i => i.product.toString() === productId);
      if (existingItem) {
        existingItem.qty += qty;
      } else {
        cart.items.push({ product: productId, qty });
      }
      await cart.save();
    }

    // Populate for response
    cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'title slug price discountPrice images stock availability color accent tag categoryName');

    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/cart/:productId — Set quantity
 */
exports.updateCartItem = async (req, res, next) => {
  try {
    const { qty } = req.body;
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.find(i => i.product.toString() === productId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    if (product.availability === 'out-of-stock' || product.availability === 'upcoming' || product.availability === 'hidden') {
      return res.status(400).json({ success: false, message: 'Product is not available for purchase.' });
    }

    const newQty = Math.max(1, qty);
    if (product.availability === 'in-stock' && product.stock < newQty) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Only ${product.stock} available.` });
    }

    item.qty = newQty;
    await cart.save();

    const populated = await Cart.findOne({ user: req.user._id }).populate('items.product', 'title slug price discountPrice images stock availability color accent tag categoryName');

    res.json({ success: true, cart: populated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/cart/:productId — Remove item
 */
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(i => i.product.toString() !== productId);
    await cart.save();

    const populated = await Cart.findOne({ user: req.user._id }).populate('items.product', 'title slug price discountPrice images stock availability color accent tag categoryName');

    res.json({ success: true, cart: populated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/cart — Clear entire cart
 */
exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
};
