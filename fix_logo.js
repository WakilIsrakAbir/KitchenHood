const fs = require('fs');
const path = require('path');
const dir = 'e:/Projects/KitchenHood/public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
    const p = path.join(dir, f);
    let c = fs.readFileSync(p, 'utf-8');
    
    
    
    
    
    const regex = /<span class="text-[a-z]+ font-black[^>]*>Kitchen<span class="gold-text">Hood<\/span><\/span>/g;
    const replacement = '<span class="text-xl font-black tracking-tight text-white">Kitchen<span class="gold-text">Hood</span></span>';
    
    c = c.replace(regex, replacement);
    fs.writeFileSync(p, c);
    console.log('Updated ' + f);
});
