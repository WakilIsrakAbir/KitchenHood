var API_URL = window.location.origin + '/api';
const socket = io(window.location.origin, { transports: ['websocket', 'polling'] });

let conversationId = null;
let chatName = '';

function initChat(name) {
  chatName = name || 'Guest';
  conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function toggleChat() {
  const chatBox = document.getElementById('chatBox');
  if (!chatBox) return;
  chatBox.classList.toggle('hidden');
  chatBox.classList.toggle('flex');
  const isActive = !chatBox.classList.contains('hidden');
  if (isActive && !conversationId) {
    const user = getUser();
    initChat(user ? user.name : 'Guest');
  }
  if (isActive) {
    socket.emit('join-chat', conversationId);
  }
}

function sendMessage() {
  sendChatMessage();
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;

  const user = getUser();
  const sender = user ? { sender: user._id, senderName: user.name, senderRole: user.role } : { senderName: chatName, senderRole: 'user' };

  socket.emit('send-message', {
    ...sender,
    message: msg,
    conversationId: conversationId
  });

  input.value = '';
}

socket.on('new-message', (msg) => {
  appendChatMessage(msg);
});

function appendChatMessage(msg) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const user = getUser();
  const isSent = (user && msg.sender === user._id) || (!user && msg.senderName === chatName);

  const div = document.createElement('div');
  div.className = `chat-msg ${isSent ? 'sent' : 'received'}`;
  div.innerHTML = `
    <div>${msg.message}</div>
    <div class="time">${msg.senderName} • ${new Date(msg.createdAt).toLocaleTimeString()}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  initChat(user ? user.name : 'Guest');
});
