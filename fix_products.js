const fs = require('fs');

const target = `    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          const fetched = data.products || data;
          if (Array.isArray(fetched) && fetched.length > 0) { allProducts = fetched; } else { allProducts = fallbackProducts; }
        } else { allProducts = fallbackProducts; }
      } catch (e) { allProducts = fallbackProducts; }
      renderProducts();
    }`;

const replacement = `    async function loadProducts() {
      // Instantly load fallback data
      allProducts = fallbackProducts;
      renderProducts();

      try {
        const res = await fetch('/api/products', { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          const fetched = data.products || data;
          if (Array.isArray(fetched) && fetched.length > 0) {
            allProducts = fetched;
            renderProducts();
          }
        }
      } catch (e) {
        // Silently fail
      }
    }`;

let html = fs.readFileSync('e:/Projects/KitchenHood/public/products.html', 'utf8');

if (html.includes(target)) {
    html = html.replace(target, replacement);
    fs.writeFileSync('e:/Projects/KitchenHood/public/products.html', html);
    console.log('Successfully applied optimistic loading to products.html');
} else {
    console.log('Target string not found in products.html. Cannot replace.');
}
