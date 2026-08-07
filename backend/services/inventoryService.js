/* ==========================================================================
   FLEVA — Inventory Service
   Automatic stock management
   ========================================================================== */
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

/**
 * Reduce stock when an order is placed
 * @param {Array} items — [{ product: ObjectId, qty: Number }]
 * @param {String} orderId
 */
exports.reduceStock = async (items, orderId) => {
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) continue;

    const previousStock = product.stock;
    product.stock = Math.max(0, product.stock - item.qty);

    // Auto sold-out
    if (product.stock === 0) {
      product.availability = 'out-of-stock';
    }

    await product.save();

    // Log inventory change
    await Inventory.create({
      product: product._id,
      changeType: 'sale',
      quantity: -item.qty,
      previousStock,
      newStock: product.stock,
      reference: orderId,
      reason: `Order placed`,
    });
  }
};

/**
 * Restore stock when an order is cancelled/returned
 * @param {Array} items — [{ product: ObjectId, qty: Number }]
 * @param {String} orderId
 * @param {String} reason
 */
exports.restoreStock = async (items, orderId, reason = 'Order cancelled') => {
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) continue;

    const previousStock = product.stock;
    product.stock += item.qty;

    // Restore availability
    if (product.stock > 0 && product.availability === 'out-of-stock') {
      product.availability = 'in-stock';
    }

    await product.save();

    await Inventory.create({
      product: product._id,
      changeType: 'restock',
      quantity: item.qty,
      previousStock,
      newStock: product.stock,
      reference: orderId,
      reason,
    });
  }
};

/**
 * Check stock levels and return low stock products
 * @param {Number} threshold — stock below this is "low"
 */
exports.getLowStockProducts = async (threshold = 10) => {
  return Product.find({
    stock: { $lte: threshold },
    isActive: { $ne: false },
  })
    .select('title stock sku availability')
    .sort({ stock: 1 })
    .lean();
};

/**
 * Get stock history for a product
 */
exports.getStockHistory = async (productId, limit = 50) => {
  return Inventory.find({ product: productId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};
