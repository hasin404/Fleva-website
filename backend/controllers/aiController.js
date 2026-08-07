/* ==========================================================================
   FLEVA — AI Assistant Controller
   ========================================================================== */
const AIChat = require('../models/AIChat');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { v4: uuidv4 } = require('uuid');

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are FLEVA's friendly AI assistant. FLEVA sells freeze-dried fruits, protein bars, fruit chips, fruit powders, chocolate fruits, gift boxes, and bundles. You help customers with:
- Product questions and recommendations
- Order tracking and status
- Return and refund policies (14-day return policy, full refund for defective items)
- Shipping information (delivers across Bangladesh, 2-5 business days, free shipping over ৳1500)
- Payment options (bKash, Nagad, Cash on Delivery)

Be concise, helpful, and match FLEVA's fun, youthful brand voice. Use emojis occasionally. If you can't help, offer to escalate to human support.`;

/**
 * POST /api/v1/ai/chat
 * Works with or without OpenAI key — falls back to rule-based responses.
 */
exports.chat = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    const sid = sessionId || uuidv4();

    // Find or create chat session
    let chat = await AIChat.findOne({ sessionId: sid });
    if (!chat) {
      chat = await AIChat.create({
        user: req.user?._id || null,
        sessionId: sid,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }],
      });
    }

    // Add user message
    chat.messages.push({ role: 'user', content: message });

    let reply;

    // Try OpenAI if configured
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: chat.messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        reply = data.choices?.[0]?.message?.content || getFallbackReply(message);
      } catch (err) {
        console.error('OpenAI error:', err.message);
        reply = getFallbackReply(message);
      }
    } else {
      // Simulate realistic "typing" delay for the fallback so it feels like a real agent
      const delay = Math.floor(Math.random() * 600) + 800; // 800ms - 1400ms delay
      await new Promise(resolve => setTimeout(resolve, delay));
      reply = getFallbackReply(message);
    }

    // Add assistant reply
    chat.messages.push({ role: 'assistant', content: reply });
    await chat.save();

    res.json({
      success: true,
      sessionId: sid,
      reply,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ai/history
 */
exports.getChatHistory = async (req, res, next) => {
  try {
    const chats = await AIChat.find({ user: req.user._id }).sort('-updatedAt').limit(20);
    res.json({ success: true, chats });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/ai/escalate
 */
exports.escalateToHuman = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const chat = await AIChat.findOne({ sessionId });
    if (chat) {
      chat.isEscalated = true;
      chat.escalatedAt = new Date();
      await chat.save();
    }
    res.json({ success: true, message: 'Escalated to human support. We will get back to you shortly.' });
  } catch (err) { next(err); }
};

/* ---- Fallback rule-based replies ---- */
function getFallbackReply(message) {
  const msg = message.toLowerCase();

  if (msg.includes('track') || msg.includes('order status') || msg.includes('where is my order')) {
    return "📦 I can certainly help you track your order! To check your real-time order status, simply head over to your Account page and click on 'My Orders'. If you're having trouble finding it, just give me your Order ID and I'll look it up for you!";
  }
  if (msg.includes('return') || msg.includes('refund')) {
    return "🔄 Not totally satisfied? No worries! We offer a hassle-free 14-day return policy. If your product arrived defective or isn't what you expected, we will give you a full refund. You can request a return directly from your Account dashboard!";
  }
  if (msg.includes('shipping') || msg.includes('delivery') || msg.includes('deliver')) {
    return "🚚 Great question! We deliver anywhere across Bangladesh within 2 to 5 business days. Our standard delivery fee is ৳80, but if your order is over ৳1500, shipping is completely FREE! 🎉";
  }
  if (msg.includes('payment') || msg.includes('pay') || msg.includes('bkash') || msg.includes('nagad')) {
    return "💳 We want to make checkout as easy as possible! We currently accept secure payments via bKash, Nagad, and traditional Cash on Delivery. Your payment information is always encrypted and safe with us.";
  }
  if (msg.includes('contact') || msg.includes('support') || msg.includes('phone') || msg.includes('email') || msg.includes('call')) {
    return "📞 We're always here to help! You can reach our human support team via email at support@flevaworld.com, or call us at +880-1234-567890 between 9 AM and 6 PM. Alternatively, I can escalate this chat to a human agent right now if you'd like!";
  }
  if (msg.includes('recommend') || msg.includes('suggest') || msg.includes('best') || msg.includes('popular')) {
    return "🔥 Ooh, looking for recommendations? Our absolute best sellers right now are the Freeze-Dried Strawberries 🍓 and the Protein Bar Chocolate Nut Crunch! If you love a tropical vibe, our Tropical Fruit Chips are also a huge hit. Check out our 'Shop' page for the full lineup!";
  }
  if (msg.includes('protein') || msg.includes('bar')) {
    return "💪 Let's talk gains! Our Protein Bar — Chocolate Nut Crunch is packed with 25g of high-quality protein, real nuts, and rich dark chocolate. It's the perfect post-workout snack with zero guilt. They are only ৳350 each!";
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return "Hey there! 👋 Welcome to FLEVA! I'm your virtual assistant, and I'd love to help you find the perfect snack or answer any questions you have about shipping, orders, or our brand. How can I assist you today?";
  }
  if (msg.includes('thanks') || msg.includes('thank you')) {
    return "You're so very welcome! 😊 It was a pleasure helping you. Let me know if anything else comes up, and have a fantastic day snacking!";
  }

  // A more conversational default fallback
  return "Hmm, that's an interesting question! 🤔 As an AI assistant, I'm still learning about that specific topic. But I'd love to help you with anything related to our products, shipping, returns, or your current order status! What would you like to know?";
}
