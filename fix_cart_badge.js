const fs = require('fs');
const path = require('path');
const dir = 'e:/Projects/KitchenHood/public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
    const p = path.join(dir, f);
    let c = fs.readFileSync(p, 'utf-8');
    
    // Replace the specific cart-badge classes globally
    // We will find `w-4.5 h-4.5` and `text-[9px]`
    const target = 'class="cart-badge absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold text-white bg-red-500 rounded-full ring-2 ring-[#0A1628]"';
    const replacement = 'class="cart-badge absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-[#0A1628]"';
    
    if (c.includes(target)) {
        c = c.replace(new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        fs.writeFileSync(p, c);
        console.log('Updated cart badge in ' + f);
    }
});
