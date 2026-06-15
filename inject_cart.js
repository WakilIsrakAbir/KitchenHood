const fs = require('fs');
const path = require('path');

const files = ['about.html', 'contact.html', 'services.html', 'login.html', 'register.html'];
const dir = 'e:/Projects/KitchenHood/public';

const cssSnippet = `
    /* Cart Drawer */
    .cart-overlay { opacity: 0; pointer-events: none; transition: opacity 0.3s; background: rgba(0,0,0,0.6); }
    .cart-overlay.active { opacity: 1; pointer-events: auto; }
    .cart-drawer { transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.4,0,0.2,1); background: var(--navy-light); border-left: 1px solid var(--border); }
    .cart-drawer.active { transform: translateX(0); }
`;

const btnSnippet = `
          <button class="relative text-slate-400 hover:text-white transition-colors p-2" onclick="openCart()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <span class="cart-badge absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-[#0A1628]">0</span>
          </button>
`;

const drawerSnippet = `
  <!-- Cart Drawer -->
  <div id="cartOverlay" class="cart-overlay fixed inset-0 z-[100]" onclick="closeCart()"></div>
  <div id="cartDrawer" class="cart-drawer fixed top-0 right-0 h-full w-96 max-w-full z-[101] flex flex-col shadow-2xl">
    <div class="p-4 border-b border-white/5 flex items-center justify-between">
      <h3 class="text-sm font-bold text-white flex items-center gap-2"><svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>Cart (<span id="cartCount">0</span>)</h3>
      <button onclick="closeCart()" class="text-slate-400 hover:text-white text-lg">&times;</button>
    </div>
    <div class="flex-1 overflow-y-auto p-4" id="cartItems">
      <div class="text-center text-slate-500 text-sm mt-10">Your cart is empty</div>
    </div>
    <div class="p-4 border-t border-white/5 bg-black/20">
      <div class="flex justify-between items-center mb-4">
        <span class="text-sm text-slate-400">Subtotal</span>
        <span class="font-bold text-white text-lg">৳<span id="cartTotal">0</span></span>
      </div>
      <button class="btn-gold w-full justify-center">Checkout Now</button>
    </div>
  </div>
`;

files.forEach(f => {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) return;
    let content = fs.readFileSync(p, 'utf-8');

    
    if (!content.includes('/* Cart Drawer */') && !content.includes('.cart-drawer')) {
        content = content.replace('</style>', cssSnippet + '</style>');
    }

    
    if (!content.includes('openCart()')) {
        content = content.replace('<div class="auth-btn-container', btnSnippet + '\n          <div class="auth-btn-container');
    }

    
    if (!content.includes('id="cartDrawer"')) {
        content = content.replace('<footer', drawerSnippet + '\n  <footer');
    }

    
    if (!content.includes('cart.js')) {
        content = content.replace('<script src="/js/main.js"></script>', '<script src="/js/main.js"></script>\n  <script src="/js/cart.js"></script>');
    }

    fs.writeFileSync(p, content);
    console.log('Injected cart into', f);
});
