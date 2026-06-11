const fs = require('fs');
const path = require('path');

const files = ['about.html', 'contact.html', 'services.html', 'login.html', 'register.html', 'products.html'];
const dir = 'e:/Projects/KitchenHood/public';

const correctRightSection = `
        <!-- Actions -->
        <div class="flex items-center gap-4">
          <button class="relative text-slate-400 hover:text-white transition-colors p-2" onclick="openCart()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span class="cart-badge absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-[#0A1628]">0</span>
          </button>
          <div class="auth-btn-container hidden sm:block">
`;

files.forEach(f => {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) return;
    let content = fs.readFileSync(p, 'utf-8');

    // Remove the old button (the one with the shopping bag or un-wrapped cart)
    const buttonStart = content.indexOf('<button class="relative text-slate-400 hover:text-white transition-colors p-2" onclick="openCart()">');
    if (buttonStart !== -1) {
        const buttonEnd = content.indexOf('</button>', buttonStart) + 9;
        
        // Check if it's already wrapped
        const textBeforeBtn = content.substring(Math.max(0, buttonStart - 50), buttonStart);
        if (textBeforeBtn.includes('<div class="flex items-center gap-4">')) {
            // Already wrapped (e.g., products.html if it was correct, or index.html). Just make sure the SVG is correct.
            // Let's replace the whole button block to ensure correct SVG.
            const newBtn = `          <button class="relative text-slate-400 hover:text-white transition-colors p-2" onclick="openCart()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span class="cart-badge absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-[#0A1628]">0</span>
          </button>`;
            content = content.substring(0, buttonStart) + newBtn + content.substring(buttonEnd);
        } else {
            // Unwrapped. We need to remove the button, and wrap the auth-btn-container.
            content = content.substring(0, buttonStart) + content.substring(buttonEnd);
            
            // Now find auth-btn-container and wrap it
            content = content.replace('<div class="auth-btn-container hidden sm:block">', correctRightSection);
            
            // And add the closing div for the wrapper
            // We need to find the end of the auth-btn-container
            const authStart = content.indexOf('<div class="auth-btn-container');
            const navClose = content.indexOf('</nav>', authStart);
            const authEnd = content.lastIndexOf('</div>', navClose - 1); // wait, easier to just replace `      </div>\n    </div>\n  </nav>`
            
            // Let's just find the `</div>` that closes auth-btn-container and add another `</div>`
            const authContainerStr = content.substring(authStart, content.indexOf('</div>', authStart) + 6);
            content = content.replace(authContainerStr, authContainerStr + '\n        </div>');
        }
        
        // Also fix the drawer SVG which was wrong (the shopping bag)
        const wrongSvg = '<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>';
        const rightSvg = '<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>';
        content = content.replace(wrongSvg, rightSvg);

        fs.writeFileSync(p, content);
        console.log('Fixed cart wrapper & SVG in', f);
    }
});
