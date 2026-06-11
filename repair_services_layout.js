const fs = require('fs');

const file = 'e:/Projects/KitchenHood/public/services.html';
let html = fs.readFileSync(file, 'utf8');

const anchor1 = 'data-cat="maintenance">Maintenance</button>';
const idx1 = html.indexOf(anchor1);
const anchor2 = '<div class="glass-card p-5 text-center">';
const idx2 = html.indexOf(anchor2, idx1);
const anchor3 = '<div class="w-16 h-16 rounded-2xl bg-blue-500/10';
const idx3 = html.indexOf(anchor3, idx2);

if (idx1 !== -1 && idx2 !== -1 && idx3 !== -1) {
    const textToReplace = html.substring(idx1, idx3 + anchor3.length);

    const replacement = `data-cat="maintenance">Maintenance</button>
        </div>
      </div>
    </section>

    <!-- Services Grid -->
    <section class="py-16">
      <div class="max-w-6xl mx-auto px-4 sm:px-8 md:px-16 lg:px-24">
        <div class="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="servicesGrid">
          <!-- Cards injected by JS -->
        </div>
      </div>
    </section>

    <!-- Why Choose Us -->
    <section class="py-20">
      <div class="max-w-6xl mx-auto px-4 sm:px-8 md:px-16 lg:px-24">
        <div class="section-sep mb-20"></div>
        <div class="text-center mb-12">
          <span class="text-xs font-bold uppercase tracking-[0.2em] text-yellow-500 mb-3 block">Why KitchenHood Pro</span>
          <h2 class="text-2xl md:text-3xl font-black tracking-tight mb-3">The <span class="gold-text">Smart Choice</span> for Your Kitchen</h2>
        </div>
        <div class="grid md:grid-cols-3 gap-4">
          <div class="glass-card p-5 text-center">
            <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3 text-emerald-400"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div>
            <h3 class="text-sm font-bold text-white mb-2">6-Month Warranty</h3>
            <p class="text-sm text-slate-400 leading-relaxed">Every service comes with a comprehensive 6-month warranty. If any issue recurs, we fix it completely free of charge — no questions asked.</p>
          </div>
          <div class="glass-card p-5 text-center">
            <div class="w-16 h-16 rounded-2xl bg-blue-500/10`;

    html = html.replace(textToReplace, replacement);
    fs.writeFileSync(file, html);
    console.log('Successfully repaired services.html layout');
} else {
    console.log('Failed to find anchors');
}
