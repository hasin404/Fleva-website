/* ==========================================================================
   FLEVA — Inventory Model (stock change log)
   ========================================================================== */
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  changeType: {
    type: String,
    enum: ['restock', 'sale', 'return', 'adjustment', 'initial'],
    required: true,
  },
  quantityChange: { type: Number, required: true }, // positive for add, negative for deduct
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  reference: String, // Order ID or note
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

inventorySchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('Inventory', inventorySchema);
