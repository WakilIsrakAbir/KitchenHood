var API_URL = window.location.origin + '/api';

let currentUser = null;

function getToken() {
  return localStorage.getItem('token');
}

function isLoggedIn() {
  return !!getToken();
}

function getUser() {
  const user = localStorage.getItem('user');
  if (!user || user === 'undefined') return null;
  try {
    return JSON.parse(user);
  } catch (e) {
    return null;
  }
}

function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

async function fetchProfile() {
  try {
    const token = getToken();
    if (!token) return null;
    const res = await fetch(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      // Token expired or invalid
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
      }
      throw new Error('Not authorized');
    }
    const data = await res.json();
    currentUser = data;
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  } catch (err) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
}

async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }
  // API returns { token, user: { ... } }
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  currentUser = data.user;
  return data;
}

async function register(name, email, password, phone) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  // API returns { token, user: { ... } }
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  currentUser = data.user;
  return data;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  window.location.href = '/';
}

function requireRole(role) {
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
    return false;
  }
  const user = getUser();
  if (role && user.role !== role) {
    window.location.href = '/';
    return false;
  }
  return true;
}

function updateAuthUI() {
  const user = getUser();

  // Hide User-specific UI for Admins (Cart, Add to Cart, Chat)
  if (user && user.role === 'admin') {
    if (!document.getElementById('adminHiddenStyles')) {
      const style = document.createElement('style');
      style.id = 'adminHiddenStyles';
      style.textContent = `
        button[onclick*="openCart"],
        button[onclick*="addToCart"],
        button[onclick*="openBooking"],
        .btn-gold[onclick*="addToCart"],
        .chat-widget,
        .cart-badge,
        .cart-drawer,
        .cart-overlay { display: none !important; pointer-events: none !important; }
      `;
      document.head.appendChild(style);
    }
  } else {
    const adminStyles = document.getElementById('adminHiddenStyles');
    if (adminStyles) adminStyles.remove();
  }
  const authBtns = document.querySelectorAll('.auth-btn-container');
  authBtns.forEach(container => {
    if (user) {
      const dashboardLink = user.role === 'admin' ? '/admin/index.html' : '/user/dashboard.html';
      container.innerHTML = `
        <div class="relative inline-block group" id="userMenuDropdown">
          <button class="flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors" onclick="toggleUserMenu(event)">
            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-[11px] font-black text-navy">${user.name.charAt(0).toUpperCase()}</div>
            ${user.name.split(' ')[0]}
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          <div id="userMenu" class="absolute right-0 mt-2 w-52 bg-[#111D35] rounded-xl shadow-2xl border border-white/10 hidden z-50 overflow-hidden">
            <div class="px-4 py-3 border-b border-white/5">
              <p class="text-sm font-bold text-white">${user.name}</p>
              <p class="text-xs text-slate-500 truncate">${user.email}</p>
              ${user.role === 'admin' ? '<span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Admin</span>' : ''}
            </div>
            <div class="p-1.5 space-y-0.5">
              ${user.role === 'admin' ? `
              <a href="${dashboardLink}" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium">
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"></path></svg>
                Dashboard
              </a>` : ''}
              ${user.role !== 'admin' ? `
              <a href="/user/dashboard.html#profile" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium">
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                Profile
              </a>` : ''}
            </div>
            <div class="p-1.5 border-t border-white/5">
              <a href="#" onclick="logout(); return false;" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors font-bold">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Logout
              </a>
            </div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <a href="/login.html" class="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Login</a>
      `;
    }
  });
}

function toggleUserMenu(e) {
  if (e) e.stopPropagation();
  const menus = document.querySelectorAll('#userMenu');
  menus.forEach(menu => menu.classList.toggle('hidden'));
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('#userMenuDropdown')) {
    const menus = document.querySelectorAll('#userMenu');
    menus.forEach(menu => menu.classList.add('hidden'));
  }
});

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  if (isLoggedIn()) {
    fetchProfile().then(() => updateAuthUI());
  }
});
