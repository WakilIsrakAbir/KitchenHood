var API_URL = window.location.origin + '/api';

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function handleHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('hidden');
      navLinks.classList.toggle('flex');
      navLinks.classList.toggle('flex-col');
      navLinks.classList.toggle('absolute');
      navLinks.classList.toggle('top-20');
      navLinks.classList.toggle('left-0');
      navLinks.classList.toggle('w-full');
      navLinks.classList.toggle('glass-nav');
      navLinks.classList.toggle('p-4');
      navLinks.classList.toggle('shadow-lg');
      navLinks.classList.toggle('items-start');
    });
  }
}

function loadNavbarAndFooter() {
}

async function fetchAPI(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message);
  }
  return res.json();
}

function formatPrice(price) {
  return '৳' + Number(price).toLocaleString('bn-IN');
}

function getCategoryBadge(category) {
  const badges = {
    repair: 'badge-repair',
    cleaning: 'badge-cleaning',
    installation: 'badge-installation',
    maintenance: 'badge-maintenance',
    chimney: 'badge-installation',
    hood: 'badge-repair',
    filter: 'badge-cleaning',
    accessory: 'badge-maintenance',
    part: 'badge-repair'
  };
  return badges[category] || 'badge-repair';
}

function getCategoryLabel(category) {
  const labels = {
    repair: 'Repair',
    cleaning: 'Cleaning',
    installation: 'Installation',
    maintenance: 'Maintenance',
    chimney: 'Chimney',
    hood: 'Kitchen Hood',
    filter: 'Filter',
    accessory: 'Accessory',
    part: 'Spare Part'
  };
  return labels[category] || category;
}

document.addEventListener('DOMContentLoaded', () => {
  handleHamburger();
  initChatWidget();
});

function initChatWidget() {
  if (window.location.pathname.startsWith('/admin')) return;

  // Ensure only logged-in users can use the chat system
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user')); } catch(e){}
  
  if (!user || !user._id) {
    return; // Do not initialize chat widget for non-logged in users
  }

  const script = document.createElement('script');
  script.src = '/socket.io/socket.io.js';
  script.onload = () => {
    let chatSocket = io(window.location.origin);
    
    let convId = user._id;
    
    chatSocket.emit('join-room', convId);

    // Inject CSS
    const style = document.createElement('style');
    style.innerHTML = `
      .chat-widget{position:fixed;bottom:1.5rem;right:1.5rem;z-index:50}
      .chat-btn{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#D4A853,#B8922F);color:#0A1628;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(212,168,83,0.3);cursor:pointer;transition:transform 0.3s}
      .chat-btn:hover{transform:scale(1.05)}
      .chat-box{position:absolute;bottom:54px;right:0;width:280px;height:380px;background:#111D35;border:1px solid rgba(255,255,255,0.08);border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.5);display:none;flex-direction:column;overflow:hidden;z-index:51}
      .chat-box.active{display:flex;animation:fadeIn 0.2s}
      .chat-header{padding:12px 16px;background:#0A1628;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center}
      .chat-messages{flex:1;padding:12px;overflow-y:auto;display:flex;flex-direction:column;gap:8px}
      .msg{max-width:80%;padding:6px 10px;border-radius:8px;font-size:0.75rem;line-height:1.3}
      .msg-user{background:rgba(212,168,83,0.1);border:1px solid rgba(212,168,83,0.2);color:#F1F5F9;align-self:flex-end;border-bottom-right-radius:2px}
      .msg-admin{background:#0A1628;border:1px solid rgba(255,255,255,0.08);color:#F1F5F9;align-self:flex-start;border-bottom-left-radius:2px}
      .chat-input{padding:10px;border-top:1px solid rgba(255,255,255,0.08);display:flex;gap:6px;background:#0A1628}
      .chat-input input{flex:1;background:#111D35;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:6px 12px;color:white;font-size:0.75rem;outline:none}
      .chat-input button{width:32px;height:32px;border-radius:50%;background:#D4A853;color:#0A1628;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer}
      @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    `;
    document.head.appendChild(style);

    // Inject HTML
    const widget = document.createElement('div');
    widget.className = 'chat-widget';
    widget.innerHTML = `
      <div class="chat-btn" id="toggleChatBtn">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
      </div>
      <div class="chat-box" id="globalChatBox">
        <div class="chat-header">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-[#0A1628] font-bold text-xs">CS</div>
            <div><h4 class="font-bold text-sm text-white leading-none m-0">Live Support</h4><span class="text-[10px] text-yellow-400 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> Online</span></div>
          </div>
          <button id="closeChatBtn" class="text-slate-400 hover:text-white bg-transparent border-none cursor-pointer text-lg leading-none">&times;</button>
        </div>
        <div class="chat-messages" id="globalChatMessages">
          <div class="msg msg-admin text-xs text-center !bg-transparent !border-none !text-slate-500 mx-auto w-full max-w-full">Chat secured and encrypted</div>
          <div class="msg msg-admin">Hello! How can we help you with your kitchen hood today?</div>
        </div>
        <form id="globalChatForm" class="chat-input m-0">
          <input type="text" id="globalChatInput" placeholder="Type a message..." required>
          <button type="submit"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg></button>
        </form>
      </div>
    `;
    document.body.appendChild(widget);

    const chatBox = document.getElementById('globalChatBox');
    const msgContainer = document.getElementById('globalChatMessages');
    const input = document.getElementById('globalChatInput');

    const toggleChat = () => {
      chatBox.classList.toggle('active');
    };

    document.getElementById('toggleChatBtn').addEventListener('click', toggleChat);
    document.getElementById('closeChatBtn').addEventListener('click', toggleChat);

    const appendMsg = (msg, scrollToBottom = true) => {
      const div = document.createElement('div');
      const isUser = msg.senderRole === 'user';
      div.className = `msg ${isUser ? 'msg-user' : 'msg-admin'}`;
      div.textContent = msg.message || msg.content || '';
      msgContainer.appendChild(div);
      if(scrollToBottom) msgContainer.scrollTop = msgContainer.scrollHeight;
    };

    chatSocket.on('new-message', (msg) => {
      if (msg.conversationId === convId) {
        appendMsg(msg);
      }
    });

    // Load history
    fetch('/api/chat/' + convId, { headers: { 'Authorization': 'Bearer ' + (typeof getToken === 'function' ? getToken() : '') } })
      .then(r => r.json())
      .then(history => {
        if(Array.isArray(history) && history.length > 0) {
          msgContainer.innerHTML = ''; // Clear default welcome message
          history.forEach(msg => appendMsg(msg, false));
          msgContainer.scrollTop = msgContainer.scrollHeight;
        }
      })
      .catch(() => {});

    document.getElementById('globalChatForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      const senderName = (user && user.name) ? user.name : 'Guest User';
      const senderId = (user && user._id) ? user._id : null;

      chatSocket.emit('send-message', {
        senderId: senderId,
        senderName: senderName,
        senderRole: 'user',
        message: text,
        conversationId: convId
      });

      input.value = '';
    });
  };
  document.head.appendChild(script);
}
