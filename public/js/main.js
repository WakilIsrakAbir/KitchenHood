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

function initTheme() {
  if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.add('light-mode');
  }
}
initTheme(); 

function toggleTheme() {
  document.documentElement.classList.toggle('light-mode');
  const isLight = document.documentElement.classList.contains('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
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
      navLinks.classList.toggle('bg-slate-900');
      navLinks.classList.toggle('p-6');
      navLinks.classList.toggle('shadow-2xl');
      navLinks.classList.toggle('items-center');
      navLinks.classList.toggle('border-b');
      navLinks.classList.toggle('border-white/10');
      
      const isHidden = navLinks.classList.contains('hidden');
      if (isHidden) {
        hamburger.innerHTML = '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>';
        hamburger.classList.remove('text-red-500', 'hover:text-red-400');
        hamburger.classList.add('text-slate-400', 'hover:text-white');
      } else {
        hamburger.innerHTML = '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>';
        hamburger.classList.remove('text-slate-400', 'hover:text-white');
        hamburger.classList.add('text-red-500', 'hover:text-red-400');
      }
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

  
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user')); } catch(e){}
  
  if (!user || !user._id || user.role === 'admin') {
    return; 
  }

  const script = document.createElement('script');
  script.src = '/socket.io/socket.io.js';
  script.onload = () => {
    let chatSocket = io(window.location.origin);
    
    let convId = user._id;
    
    chatSocket.emit('join-room', convId);

    
    const style = document.createElement('style');
    style.innerHTML = `
      .chat-widget{position:fixed;bottom:2rem;right:2rem;z-index:50}
      .chat-btn{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#D4A853,#B8922F);color:#0A1628;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(212,168,83,0.3);cursor:pointer;transition:transform 0.3s}
      .chat-btn svg{width:32px;height:32px}
      .chat-btn:hover{transform:scale(1.05)}
      .chat-box{position:absolute;bottom:80px;right:0;width:400px;height:520px;max-width:calc(100vw - 4rem);max-height:calc(100vh - 8rem);background:#111D35;border:1px solid rgba(255,255,255,0.08);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.6);display:none;flex-direction:column;overflow:hidden;z-index:51}
      .chat-box.active{display:flex;animation:fadeIn 0.2s}
      .chat-header{padding:20px 24px;background:#0A1628;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center}
      .chat-messages{flex:1;padding:20px;overflow-y:auto;display:flex;flex-direction:column;gap:16px}
      .msg{max-width:85%;padding:12px 18px;border-radius:12px;font-size:1rem;line-height:1.5}
      .msg-user{background:rgba(212,168,83,0.1);border:1px solid rgba(212,168,83,0.2);color:#F1F5F9;align-self:flex-end;border-bottom-right-radius:2px}
      .msg-admin{background:#0A1628;border:1px solid rgba(255,255,255,0.08);color:#F1F5F9;align-self:flex-start;border-bottom-left-radius:2px}
      .chat-input{padding:16px;border-top:1px solid rgba(255,255,255,0.08);display:flex;gap:12px;background:#0A1628}
      .chat-input input{flex:1;background:#111D35;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:12px 20px;color:white;font-size:1rem;outline:none}
      .chat-input button{width:48px;height:48px;border-radius:50%;background:#D4A853;color:#0A1628;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer}
      .chat-input button svg{width:24px;height:24px}
      @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    `;
    document.head.appendChild(style);

    
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

    const showUnreadBadge = () => {
      let badge = document.getElementById('userMsgBadge');
      if(!badge) {
        badge = document.createElement('span');
        badge.id = 'userMsgBadge';
        badge.className = 'absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full';
        badge.textContent = 'New';
        document.getElementById('toggleChatBtn').appendChild(badge);
      }
      badge.classList.remove('hidden');
      
      const navBadge = document.getElementById('navUserMsgBadge');
      if(navBadge) navBadge.classList.remove('hidden');
    };

    const hideUnreadBadge = () => {
      const badge = document.getElementById('userMsgBadge');
      if(badge) badge.classList.add('hidden');
      
      const navBadge = document.getElementById('navUserMsgBadge');
      if(navBadge) navBadge.classList.add('hidden');
    };

    const markChatAsRead = () => {
      const t = typeof getToken === 'function' ? getToken() : '';
      if(t) {
        fetch('/api/chat/read/' + convId, { method: 'PUT', headers: { 'Authorization': 'Bearer ' + t } });
      }
      hideUnreadBadge();
    };

    const toggleChat = () => {
      chatBox.classList.toggle('active');
      if(chatBox.classList.contains('active')) {
        markChatAsRead();
        setTimeout(() => {
          msgContainer.scrollTop = msgContainer.scrollHeight;
        }, 10);
      }
    };

    document.getElementById('toggleChatBtn').addEventListener('click', toggleChat);
    document.getElementById('closeChatBtn').addEventListener('click', toggleChat);

    const appendMsg = (msg, scrollToBottom = true) => {
      const div = document.createElement('div');
      const isUser = msg.senderRole === 'user';
      div.className = `msg ${isUser ? 'msg-user' : 'msg-admin'}`;
      div.textContent = msg.message || msg.content || '';
      msgContainer.appendChild(div);
      if(scrollToBottom) {
        setTimeout(() => {
          msgContainer.scrollTop = msgContainer.scrollHeight;
        }, 10);
      }
    };

    chatSocket.on('new-message', (msg) => {
      if (msg.conversationId === convId) {
        appendMsg(msg);
        if(!chatBox.classList.contains('active') && msg.senderRole === 'admin') {
          showUnreadBadge();
        } else if(chatBox.classList.contains('active') && msg.senderRole === 'admin') {
          markChatAsRead();
        }
      }
    });

    
    fetch('/api/chat/' + convId, { headers: { 'Authorization': 'Bearer ' + (typeof getToken === 'function' ? getToken() : '') } })
      .then(r => r.json())
      .then(history => {
        if(Array.isArray(history) && history.length > 0) {
          msgContainer.innerHTML = ''; 
          history.forEach(msg => appendMsg(msg, false));
          msgContainer.scrollTop = msgContainer.scrollHeight;
          
          const unreadCount = history.filter(m => !m.isRead && m.senderRole === 'admin').length;
          if(unreadCount > 0 && !chatBox.classList.contains('active')) {
            showUnreadBadge();
          } else if(chatBox.classList.contains('active') && unreadCount > 0) {
            markChatAsRead();
          }
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

function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    {pageLanguage: 'en', includedLanguages: 'en,bn', layout: google.translate.TranslateElement.InlineLayout.SIMPLE}, 
    'google_translate_element'
  );
}


