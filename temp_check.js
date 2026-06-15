
    var fallbackServices = [
      { _id: 's1', name: 'Kitchen Hood Deep Cleaning', description: 'Complete deep cleaning using industrial-grade eco-friendly solutions to remove 100% of accumulated grease and restore full suction power.', price: 1500, category: 'cleaning', estimatedTime: '2-3 hours', features: ['Filter soaking & degreasing', 'Fan blade cleaning', 'Exterior polishing', 'Grease trap cleaning', 'Eco-friendly chemicals', 'Before/after photos'] },
      { _id: 's2', name: 'Kitchen Hood Motor Repair', description: 'Expert diagnosis and repair for all motor issues, including rewinding and bearing replacement for optimal performance.', price: 2000, category: 'repair', estimatedTime: '1-2 hours', features: ['Full diagnostic check', 'Motor rewinding', 'Bearing replacement', 'Capacitor upgrade', 'Wiring inspection', '6-month warranty'] },
      { _id: 's3', name: 'New Hood Installation', description: 'Professional hood installation with wall mounting, core cutting, duct routing, and comprehensive testing.', price: 3000, category: 'installation', estimatedTime: '3-4 hours', features: ['Wall mounting', 'Core cutting', 'Duct installation', 'Electrical connection', 'Testing & demo', '1 year warranty'] },
      { _id: 's4', name: 'Filter Replacement Service', description: 'Replace clogged or damaged filters with brand-new high-quality baffle, mesh, or carbon replacements.', price: 800, category: 'maintenance', estimatedTime: '30 minutes', features: ['Old filter removal', 'Size measurement', 'Brand matching', 'New filter installation', 'Old filter disposal', 'Performance check'] },
      { _id: 's5', name: 'Emergency Same-Day Repair', description: 'Urgent same-day repair service for hood emergencies, including motor failures and electrical faults.', price: 3500, category: 'repair', estimatedTime: '1-2 hours', features: ['Same day dispatch', 'Priority technician', 'Full diagnostic', 'On-site repair', '24/7 phone support', 'Emergency parts stock'] },
      { _id: 's6', name: 'Annual Maintenance Contract (AMC)', description: 'Comprehensive AMC plan including 4 quarterly cleanings, priority repairs, and parts discounts for long-term care.', price: 5000, category: 'maintenance', estimatedTime: 'Yearly contract', features: ['4 quarterly cleanings', 'Priority scheduling', 'Free annual inspection', '10% parts discount', 'Free filter replacement', 'Dedicated support line'] }
    ];

    let allServices = [];
    let currentCategory = 'all';

    async function loadServices() {
      
      allServices = fallbackServices;
      renderServices();
      
      try {
        const res = await fetch('/api/services', { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          const fetched = data.services || data;
          if (Array.isArray(fetched) && fetched.length > 0) { 
            allServices = fetched; 
            renderServices();
          }
        }
      } catch (e) {
        
      }
    }

    function renderServices() {
      const grid = document.getElementById('servicesGrid');
      const filtered = currentCategory === 'all' ? allServices : allServices.filter(s => s.category === currentCategory);
      if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-16 text-slate-500">No services found in this category.</div>';
        return;
      }
      grid.innerHTML = filtered.map(s => {
        const catColors = { cleaning: 'blue', repair: 'red', installation: 'emerald', maintenance: 'amber' };
        const color = catColors[s.category] || 'blue';
        return '<div class="glass-card p-4 flex flex-col">' +
          '<div class="flex items-start justify-between mb-2">' +
            '<div class="service-icon !w-8 !h-8"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg></div>' +
            '<span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-' + color + '-500/10 text-' + color + '-400 border border-' + color + '-500/20">' + s.category + '</span>' +
          '</div>' +
          '<h3 class="text-[13px] font-bold text-white mb-1.5 leading-tight">' + s.name + '</h3>' +
          '<p class="text-[11px] text-slate-400 leading-snug mb-2.5 flex-1 line-clamp-3">' + s.description + '</p>' +
          (s.features ? '<div class="space-y-1 mb-2.5">' + s.features.slice(0, 3).map(function(f) { return '<div class="flex items-center gap-1.5 text-[10px] text-slate-300"><div class="feature-check !w-3 !h-3"><svg class="w-2 h-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></div>' + f + '</div>'; }).join('') + '</div>' : '') +
          '<div class="flex items-center justify-between mt-auto pt-3 border-t border-white/5">' +
            '<div><span class="text-base font-black gold-text">৳' + s.price.toLocaleString() + '</span><span class="text-[9px] text-slate-500 ml-1.5">' + (s.estimatedTime || '') + '</span></div>' +
            '<button onclick="openBooking(\'' + s._id + '\', \'' + s.name.replace(/\'/g, "\\'") + '\')" class="btn-gold !py-1.5 !px-3 !text-[10px]">Book Now</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    // Category filter
    document.getElementById('categoryFilter').addEventListener('click', function(e) {
      if (e.target.classList.contains('category-pill')) {
        document.querySelectorAll('.category-pill').forEach(function(p) { p.classList.remove('active'); });
        e.target.classList.add('active');
        currentCategory = e.target.dataset.cat;
        renderServices();
      }
    });

    // Booking Modal
    function openBooking(serviceId, serviceName) {
      if (!typeof isLoggedIn === 'function' || !isLoggedIn()) {
        if(typeof showToast === 'function') showToast('Please login to book a service', 'info');
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return;
      }
      document.getElementById('bookServiceId').value = serviceId;
      document.getElementById('bookServiceName').textContent = serviceName;
      document.getElementById('modalTitle').textContent = 'Book: ' + serviceName;
      document.getElementById('bookingModal').classList.add('active');
    }
    function closeBookingModal() { document.getElementById('bookingModal').classList.remove('active'); }

    document.getElementById('bookingForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      try {
        const token = getToken();
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({
            service: document.getElementById('bookServiceId').value,
            date: document.getElementById('bookDate').value,
            timeSlot: document.getElementById('bookTime').value,
            address: document.getElementById('bookAddress').value,
            phone: document.getElementById('bookPhone').value
          })
        });
        if (!res.ok) throw new Error('Booking failed');
        closeBookingModal();
        if(typeof showToast === 'function') showToast('Service booked successfully! Check your dashboard for details.', 'success');
        document.getElementById('bookingForm').reset();
      } catch (err) {
        if(typeof showToast === 'function') showToast(err.message || 'Failed to book service', 'error');
      }
    });

    document.addEventListener('DOMContentLoaded', loadServices);
  