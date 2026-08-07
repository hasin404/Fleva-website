/* ==========================================================================
   FLEVA — AI Chat Model
   ========================================================================== */
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const aiChatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String, required: true },
  messages: [messageSchema],
  context: { type: String, default: '' }, // Summary context for continuity
  isEscalated: { type: Boolean, default: false },
  escalatedAt: Date,
}, { timestamps: true });

aiChatSchema.index({ user: 1, createdAt: -1 });
aiChatSchema.index({ sessionId: 1 });

module.exports = mongoose.model('AIChat', aiChatSchema);
