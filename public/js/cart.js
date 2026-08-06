var API_URL = window.location.origin + '/api';

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
  updateCartDrawer();
}

function updateCartBadge() {
  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  });
}

function addToCart(product) {
  const existing = cart.find(item => item._id === product._id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  showToast(`${product.name} added to cart!`, 'success');
}

function removeFromCart(productId) {
  cart = cart.filter(item => item._id !== productId);
  saveCart();
}

function updateQuantity(productId, delta) {
  const item = cart.find(i => i._id === productId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(productId);
    } else {
      saveCart();
    }
  }
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function updateCartDrawer() {
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartCount');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text-secondary);"><div style="display:flex;justify-content:center;margin-bottom:16px;color:#cbd5e1;"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div><p>Your cart is empty</p></div>`;
    if (totalEl) totalEl.textContent = '0';
    if (countEl) countEl.textContent = '0';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-color);">
      <div style="width:60px;height:60px;background:var(--bg-secondary);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#94a3b8;flex-shrink:0;">
        ${item.image ? `<img src="${item.image}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">` : `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>`}
      </div>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:0.9rem;margin-bottom:4px;">${item.name}</div>
        <div style="color:var(--primary);font-weight:700;">৳${item.price.toLocaleString()}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
          <button onclick="updateQuantity('${item._id}', -1)" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border-color);background:none;cursor:pointer;font-weight:700;">−</button>
          <span style="font-weight:600;min-width:20px;text-align:center;">${item.quantity}</span>
          <button onclick="updateQuantity('${item._id}', 1)" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border-color);background:none;cursor:pointer;font-weight:700;">+</button>
          <button onclick="removeFromCart('${item._id}')" style="margin-left:auto;border:none;background:none;cursor:pointer;color:#c62828;font-size:1.1rem;">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');

  if (totalEl) totalEl.textContent = getCartTotal().toLocaleString();
  if (countEl) countEl.textContent = cart.reduce((s, i) => s + i.quantity, 0);
}

function openCart() {
  document.getElementById('cartDrawer')?.classList.add('active');
  document.getElementById('cartOverlay')?.classList.add('active');
  updateCartDrawer();
}

function closeCart() {
  document.getElementById('cartDrawer')?.classList.remove('active');
  document.getElementById('cartOverlay')?.classList.remove('active');
}

async function checkout() {
  const user = typeof getUser === 'function' ? getUser() : null;
  if (cart.length === 0) {
    showToast('Cart is empty', 'error');
    return;
  }

  closeCart();

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all opacity-0';
  modalOverlay.style.background = 'rgba(15, 23, 42, 0.85)';
  modalOverlay.style.backdropFilter = 'blur(8px)';
  modalOverlay.style.animation = 'fadeIn 0.2s forwards';

  const modalContent = document.createElement('div');
  modalContent.className = 'bg-slate-800 border border-white/10 rounded-xl w-full overflow-hidden shadow-2xl transform scale-95 transition-transform';
  modalContent.style.maxWidth = '360px';
  modalContent.style.animation = 'scaleIn 0.2s 0.1s forwards';

  const totalAmount = getCartTotal();

  // Guest gets Name field; logged-in user doesn't need it
  const nameField = !user ? `
      <div>
        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Name <span class="text-red-400">*</span></label>
        <input type="text" id="checkoutName" required placeholder="আপনার নাম" class="w-full bg-slate-900 border border-slate-700 focus:border-yellow-500 rounded-md px-3 py-1.5 text-xs text-white outline-none transition-colors">
      </div>` : '';

  modalContent.innerHTML = `
    <div class="p-3 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
      <h3 class="text-sm font-bold text-white flex items-center gap-1.5"><svg class="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> Checkout</h3>
      <button id="closeCheckoutBtn" class="text-slate-400 hover:text-white transition-colors text-xl leading-none">&times;</button>
    </div>
    <form id="checkoutForm" class="p-4 flex flex-col gap-3">
      ${nameField}
      <div>
        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number <span class="text-red-400">*</span></label>
        <input type="tel" id="checkoutPhone" required placeholder="01XXXXXXXXX" value="${user && user.phone ? user.phone : ''}" class="w-full bg-slate-900 border border-slate-700 focus:border-yellow-500 rounded-md px-3 py-1.5 text-xs text-white outline-none transition-colors">
      </div>
      <div>
        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">City</label>
        <select id="checkoutCity" required class="w-full bg-slate-900 border border-slate-700 focus:border-yellow-500 rounded-md px-3 py-1.5 text-xs text-white outline-none transition-colors appearance-none">
          <option value="Dhaka" class="bg-slate-900 text-white">Dhaka</option>
          <option value="Chittagong" class="bg-slate-900 text-white">Chittagong</option>
          <option value="Sylhet" class="bg-slate-900 text-white">Sylhet</option>
          <option value="Rajshahi" class="bg-slate-900 text-white">Rajshahi</option>
          <option value="Khulna" class="bg-slate-900 text-white">Khulna</option>
          <option value="Barisal" class="bg-slate-900 text-white">Barisal</option>
          <option value="Rangpur" class="bg-slate-900 text-white">Rangpur</option>
          <option value="Mymensingh" class="bg-slate-900 text-white">Mymensingh</option>
        </select>
      </div>
      <div>
        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Address <span class="text-red-400">*</span></label>
        <textarea id="checkoutAddress" required placeholder="House, Road, Area..." rows="2" class="w-full bg-slate-900 border border-slate-700 focus:border-yellow-500 rounded-md px-3 py-1.5 text-xs text-white outline-none transition-colors resize-none">${user && user.address ? user.address : ''}</textarea>
      </div>
      
      <div class="mt-1 bg-slate-900/50 p-2.5 rounded-md border border-white/5 flex justify-between items-center">
        <span class="text-slate-400 text-[10px] font-medium uppercase">Total</span>
        <span class="text-lg font-black text-yellow-500">৳${totalAmount.toLocaleString('bn-IN')}</span>
      </div>

      <button type="submit" id="confirmOrderBtn" class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-900 font-bold py-2 text-sm rounded-md mt-1 shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-1.5">
        Confirm Order <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      </button>
    </form>
  `;

  if (!document.getElementById('checkoutStyles')) {
    const style = document.createElement('style');
    style.id = 'checkoutStyles';
    style.innerHTML = `
      @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      #checkoutForm input, #checkoutForm select, #checkoutForm textarea { 
        background-color: #0f172a !important; 
        color: #ffffff !important; 
        border: 1px solid #334155 !important; 
      }
      #checkoutForm input:focus, #checkoutForm select:focus, #checkoutForm textarea:focus {
        border-color: #eab308 !important;
      }
      #checkoutForm input::placeholder, #checkoutForm textarea::placeholder { color: #94a3b8 !important; }
      select { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-position: right 1rem center; background-repeat: no-repeat; background-size: 1.2em 1.2em; padding-right: 2.5rem; }
    `;
    document.head.appendChild(style);
  }

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  const closeModal = () => {
    modalOverlay.style.opacity = '0';
    setTimeout(() => modalOverlay.remove(), 200);
  };
  document.getElementById('closeCheckoutBtn').addEventListener('click', closeModal);

  document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const guestName = document.getElementById('checkoutName')?.value?.trim() || '';
    const phone = document.getElementById('checkoutPhone').value.trim();
    const city = document.getElementById('checkoutCity').value.trim();
    const address = document.getElementById('checkoutAddress').value.trim();

    const confirmBtn = document.getElementById('confirmOrderBtn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...';

    const items = cart.map(item => ({
      product: item._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || ''
    }));

    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = typeof getToken === 'function' ? getToken() : null;
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      const bodyData = {
        items,
        totalAmount,
        shippingAddress: { address: address, phone: phone, city: city },
        paymentMethod: 'cod'
      };

      // Add guest info if not logged in
      if (!user) {
        bodyData.guestName = guestName;
        bodyData.guestPhone = phone;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Order failed');
      
      cart = [];
      saveCart();
      closeCart();
      closeModal();

      // Show post-order prompt
      if (!user) {
        showGuestSuccessModal('order', guestName, phone);
      } else {
        showToast('Order placed successfully! 🎉 Check your dashboard for details.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to place order', 'error');
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = 'Confirm Order <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>';
    }
  });
}

// Post-order/booking success modal for guest users
function showGuestSuccessModal(type, name, phone) {
  const typeLabel = type === 'order' ? 'Order' : 'Booking';
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[200] flex items-center justify-center p-4';
  overlay.style.background = 'rgba(15, 23, 42, 0.9)';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.style.animation = 'fadeIn 0.3s forwards';

  overlay.innerHTML = `
    <div class="bg-slate-800 border border-white/10 rounded-2xl w-full shadow-2xl text-center p-6" style="max-width:380px; animation: scaleIn 0.3s forwards;">
      <div class="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
      </div>
      <h3 class="text-xl font-black text-white mb-2">${typeLabel} Confirmed! 🎉</h3>
      <p class="text-sm text-slate-400 mb-6 leading-relaxed">আপনার ${typeLabel.toLowerCase()} সফলভাবে সম্পন্ন হয়েছে।<br>Account তৈরি করলে order track করতে পারবেন।</p>
      
      <div class="space-y-2.5">
        <a href="/register.html?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}" class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-900 font-bold py-2.5 text-sm rounded-xl shadow-lg shadow-yellow-500/20 transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
          Create Account
        </a>
        <a href="/login.html" class="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold py-2.5 text-sm rounded-xl transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
          Already have an account? Login
        </a>
        <button id="skipRegistrationBtn" class="w-full text-slate-500 hover:text-slate-300 font-medium py-2 text-xs transition-colors">
          Skip for now →
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById('skipRegistrationBtn').addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 200);
    showToast(`${typeLabel} placed successfully! 🎉`, 'success');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
});
