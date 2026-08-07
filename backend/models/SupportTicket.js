/* ==========================================================================
   FLEVA — Support Ticket Model
   ========================================================================== */
const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['customer', 'admin', 'ai'], required: true },
  senderUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  attachments: [{ url: String, name: String }],
  timestamp: { type: Date, default: Date.now },
});

const supportTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  subject: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['order-issue', 'payment', 'return', 'product', 'account', 'other'],
    default: 'other',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'waiting-customer', 'resolved', 'closed'],
    default: 'open',
  },
  messages: [ticketMessageSchema],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
}, { timestamps: true });

supportTicketSchema.index({ user: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
