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
  initWhatsAppWidget();
});

function initWhatsAppWidget() {
  if (window.location.pathname.startsWith('/admin')) return;

  const style = document.createElement('style');
  style.innerHTML = `
    .whatsapp-widget {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 999;
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .whatsapp-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #25D366;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
    }
    .whatsapp-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 8px 25px rgba(37, 211, 102, 0.6);
      background: #22bf5b;
    }
    .whatsapp-btn svg {
      width: 34px;
      height: 34px;
      fill: currentColor;
    }
    .whatsapp-pulse {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #25D366;
      opacity: 0.7;
      z-index: -1;
      animation: waPulse 2s infinite ease-out;
    }
    .whatsapp-label {
      background: #0A1628;
      color: #F1F5F9;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      display: none;
      white-space: nowrap;
      pointer-events: none;
    }
    .whatsapp-widget:hover .whatsapp-label {
      display: block;
      animation: fadeIn 0.2s;
    }
    @keyframes waPulse {
      0% { transform: scale(1); opacity: 0.7; }
      100% { transform: scale(1.5); opacity: 0; }
    }
    @media (max-width: 640px) {
      .whatsapp-widget { bottom: 1.25rem; right: 1.25rem; }
      .whatsapp-btn { width: 52px; height: 52px; }
      .whatsapp-btn svg { width: 28px; height: 28px; }
    }
  `;
  document.head.appendChild(style);

  const widget = document.createElement('a');
  widget.className = 'whatsapp-widget';
  widget.href = 'https://wa.me/8801859689106';
  widget.target = '_blank';
  widget.rel = 'noopener noreferrer';
  widget.setAttribute('aria-label', 'Chat with us on WhatsApp');
  widget.innerHTML = `
    <span class="whatsapp-label">WhatsApp Support</span>
    <div class="whatsapp-btn">
      <div class="whatsapp-pulse"></div>
      <svg viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
      </svg>
    </div>
  `;
  document.body.appendChild(widget);
}

function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    {pageLanguage: 'en', includedLanguages: 'en,bn', layout: google.translate.TranslateElement.InlineLayout.SIMPLE}, 
    'google_translate_element'
  );
}


