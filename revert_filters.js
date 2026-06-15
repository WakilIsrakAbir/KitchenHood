const fs = require('fs');
const path = require('path');

const dir = 'e:/Projects/KitchenHood/public';
const files = ['services.html', 'products.html'];

files.forEach(f => {
    const p = path.join(dir, f);
    let html = fs.readFileSync(p, 'utf8');

    
    const doctypeIdx = html.indexOf('<!DOCTYPE html>');
    if (doctypeIdx > 0) {
        let filterBlock = html.substring(0, doctypeIdx);
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        let rebuiltFilterBlock = '';
        if (f === 'services.html') {
            rebuiltFilterBlock = `        <!-- Category Filter -->
        <div class="flex flex-wrap justify-center gap-3" id="categoryFilter">
          <button class="category-pill active" data-cat="all">All Services</button>
          <button class="category-pill" data-cat="cleaning">Cleaning</button>
          <button class="category-pill" data-cat="repair">Repair</button>
          <button class="category-pill" data-cat="installation">Installation</button>
          <button class="category-pill" data-cat="maintenance">Maintenance</button>
        </div>`;
        } else {
            rebuiltFilterBlock = `        <div class="flex flex-wrap justify-center gap-3" id="categoryFilter">
          <button class="category-pill active" data-cat="all">All Products</button>
          <button class="category-pill" data-cat="chimney">Chimneys</button>
          <button class="category-pill" data-cat="hood">Kitchen Hoods</button>
          <button class="category-pill" data-cat="filter">Filters</button>
          <button class="category-pill" data-cat="part">Spare Parts</button>
        </div>`;
        }
        
        
        html = html.substring(doctypeIdx);
        
        
        let insertionText = '';
        if (f === 'services.html') {
            insertionText = '<p class="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">Expert kitchen hood cleaning, repair, installation, and maintenance services with genuine parts and a 6-month service warranty. Serving all major brands across Dhaka.</p>';
        } else {
            insertionText = '<p class="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">Original manufacturer kitchen hood chimneys, filters, motors, and accessories. Fast delivery within Dhaka. Every product comes with authenticity guarantee.</p>';
        }
        
        const insertIdx = html.indexOf(insertionText);
        if (insertIdx !== -1) {
            html = html.substring(0, insertIdx + insertionText.length) + '\n' + rebuiltFilterBlock + html.substring(insertIdx + insertionText.length);
        }
        
        fs.writeFileSync(p, html);
        console.log('Reverted category filter perfectly in', f);
    }
});
