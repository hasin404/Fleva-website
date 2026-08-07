/* ==========================================================================
   FLEVA — AI Chat Widget
   Include this script on any page to add a floating chat button.
   ========================================================================== */
(function() {
  // CSS
  const style = document.createElement('style');
  style.textContent = `
    #fleva-chat-fab {
      position: fixed; bottom: 28px; right: 28px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%; border: 0;
      background: linear-gradient(135deg, #FF2E77, #6C2BD9); color: #fff;
      font-size: 1.6rem; cursor: pointer; box-shadow: 0 4px 20px rgba(255,46,119,0.35);
      display: flex; align-items: center; justify-content: center;
      transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s;
    }
    #fleva-chat-fab:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(255,46,119,0.5); }
    #fleva-chat-fab.open { transform: rotate(45deg) scale(1.1); }

    #fleva-chat-panel {
      position: fixed; bottom: 96px; right: 28px; z-index: 9998;
      width: 370px; max-width: calc(100vw - 56px); max-height: 520px;
      background: #F1EAD6; border-radius: 20px; overflow: hidden;
      box-shadow: 0 12px 40px rgba(0,0,0,0.18);
      display: none; flex-direction: column;
      animation: chatSlideUp .3s ease;
    }
    #fleva-chat-panel.open { display: flex; }
    @keyframes chatSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

    .chat-header {
      display: flex; align-items: center; gap: 12px; padding: 16px 18px;
      background: #16140F; color: #F1EAD6;
    }
    .chat-header .avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #FF2E77, #6C2BD9); display: flex; align-items: center; justify-content: center; font-size: 1rem; }
    .chat-header .info h4 { font-size: 0.9rem; margin: 0; font-weight: 700; }
    .chat-header .info span { font-size: 0.7rem; opacity: 0.7; }

    .chat-messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px;
      min-height: 260px; max-height: 360px;
    }
    .chat-msg {
      max-width: 80%; padding: 10px 14px; border-radius: 16px; font-size: 0.85rem; line-height: 1.45;
      word-wrap: break-word;
    }
    .chat-msg.bot { background: #F8F3E6; align-self: flex-start; border-bottom-left-radius: 4px; }
    .chat-msg.user { background: #16140F; color: #F1EAD6; align-self: flex-end; border-bottom-right-radius: 4px; }
    .chat-msg.typing { opacity: 0.6; }

    .chat-input-bar {
      display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid rgba(22,20,15,0.1);
    }
    .chat-input-bar input {
      flex: 1; padding: 10px 14px; border: 2px solid rgba(22,20,15,0.12);
      border-radius: 999px; background: #F8F3E6; font-size: 0.85rem; font-family: inherit;
    }
    .chat-input-bar input:focus { border-color: #16140F; outline: none; }
    .chat-input-bar button {
      width: 38px; height: 38px; border-radius: 50%; border: 0;
      background: #16140F; color: #F1EAD6; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .2s;
    }
    .chat-input-bar button:hover { background: #FF2E77; }

    .quick-actions { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 12px; }
    .quick-btn {
      padding: 5px 12px; border-radius: 999px; border: 1.5px solid rgba(22,20,15,0.2);
      background: transparent; font-size: 0.72rem; font-weight: 600; cursor: pointer;
      transition: background .2s, border-color .2s;
    }
    .quick-btn:hover { background: #16140F; color: #F1EAD6; border-color: #16140F; }
  `;
  document.head.appendChild(style);

  // HTML
  const widget = document.createElement('div');
  widget.innerHTML = `
    <div id="fleva-chat-panel">
      <div class="chat-header">
        <div class="avatar">🤖</div>
        <div class="info"><h4>FLEVA Assistant</h4><span>Online · Replies instantly</span></div>
      </div>
      <div class="chat-messages" id="chat-messages">
        <div class="chat-msg bot">Hey there! 👋 I'm FLEVA's AI assistant. Ask me anything about our products, shipping, or orders!</div>
      </div>
      <div class="quick-actions" id="quick-actions">
        <button class="quick-btn" data-q="What are your best sellers?">Best sellers</button>
        <button class="quick-btn" data-q="How much is shipping?">Shipping info</button>
        <button class="quick-btn" data-q="What payment methods do you accept?">Payment options</button>
        <button class="quick-btn" data-q="Can I return an item?">Returns</button>
      </div>
      <div class="chat-input-bar">
        <input type="text" id="chat-input" placeholder="Type a message…" autocomplete="off">
        <button id="chat-send" aria-label="Send">→</button>
      </div>
    </div>
    <button id="fleva-chat-fab" aria-label="Chat with FLEVA">💬</button>
  `;
  document.body.appendChild(widget);

  // Logic
  const fab = document.getElementById('fleva-chat-fab');
  const panel = document.getElementById('fleva-chat-panel');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const messagesEl = document.getElementById('chat-messages');
  let sessionId = sessionStorage.getItem('fleva_chat_session') || '';

  fab.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('open');
    fab.classList.toggle('open', isOpen);
    fab.innerHTML = isOpen ? '✕' : '💬';
    if (isOpen) input.focus();
  });

  function addMessage(text, role) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
    addMessage(text, 'user');
    input.value = '';

    // Hide quick actions after first message
    document.getElementById('quick-actions').style.display = 'none';

    // Show typing indicator
    const typing = addMessage('Thinking…', 'bot typing');

    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();

      typing.remove();

      if (data.success) {
        if (data.sessionId) {
          sessionId = data.sessionId;
          sessionStorage.setItem('fleva_chat_session', sessionId);
        }
        addMessage(data.reply, 'bot');
      } else {
        addMessage("Sorry, I couldn't process that. Try again!", 'bot');
      }
    } catch (err) {
      typing.remove();
      addMessage("I'm having trouble connecting. Please try again later.", 'bot');
    }
  }

  sendBtn.addEventListener('click', () => sendMessage(input.value));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(input.value); });

  // Quick actions
  document.getElementById('quick-actions').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-q]');
    if (btn) sendMessage(btn.dataset.q);
  });
})();
