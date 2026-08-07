/* ==========================================================================
   FLEVA — Tracking History Model
   ========================================================================== */
const mongoose = require('mongoose');

const trackingHistorySchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  status: { type: String, required: true },
  message: { type: String, default: '' },
  location: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

trackingHistorySchema.index({ order: 1, createdAt: 1 });

module.exports = mongoose.model('TrackingHistory', trackingHistorySchema);
