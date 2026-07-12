window.Pages = window.Pages || {};

window.Pages.nearby = {
  categories: [
    { id: 'hospital', label: 'Hospitals', icon: 'cross' },
    { id: 'pharmacy', label: 'Pharmacies', icon: 'pill' },
    { id: 'atm', label: 'ATMs', icon: 'landmark' },
    { id: 'fuel', label: 'Petrol', icon: 'fuel' },
    { id: 'restaurant', label: 'Restaurants', icon: 'utensils' },
    { id: 'mall', label: 'Malls', icon: 'shopping-bag' },
    { id: 'bus_stop', label: 'Bus stops', icon: 'bus' },
    { id: 'police', label: 'Police', icon: 'shield' },
  ],
  active: 'hospital',
  mock: {
    hospital: [{ name: 'City General Hospital', dist: '0.6 km' }, { name: 'Sunrise Multispecialty', dist: '1.4 km' }, { name: 'St. Mary\'s Clinic', dist: '2.0 km' }],
    pharmacy: [{ name: 'Apollo Pharmacy', dist: '0.3 km' }, { name: 'MedPlus', dist: '0.9 km' }],
    atm: [{ name: 'State Bank ATM', dist: '0.2 km' }, { name: 'HDFC ATM', dist: '0.5 km' }],
    fuel: [{ name: 'Indian Oil Station', dist: '0.7 km' }, { name: 'Shell Station', dist: '1.6 km' }],
    restaurant: [{ name: 'Spice Route', dist: '0.4 km' }, { name: 'Green Bowl Cafe', dist: '0.8 km' }],
    mall: [{ name: 'City Center Mall', dist: '1.1 km' }, { name: 'Riverside Plaza', dist: '2.3 km' }],
    bus_stop: [{ name: 'Market Square Stop', dist: '0.2 km' }, { name: 'Tech Park Stop', dist: '1.0 km' }],
    police: [{ name: 'Sector 5 Police Station', dist: '0.9 km' }],
  },

  render(root) {
    root.innerHTML = `
      <div class="chip-row" id="nearby-tabs">
        ${this.categories.map(c => `<div class="chip ${c.id === this.active ? 'selected' : ''}" data-cat="${c.id}"><i data-lucide="${c.icon}"></i>${c.label}</div>`).join('')}
      </div>
      <div class="map-frame" style="margin-top:16px;">
        <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=60" alt="Map" />
        <div class="map-badge">Wire up Places API for live results</div>
      </div>
      <div class="section-heading">Results</div>
      <div id="nearby-list"></div>
    `;
    this.renderList();
    lucide.createIcons();
    root.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
      this.active = chip.dataset.cat;
      root.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      this.renderList();
    }));
  },

  renderList() {
    const list = document.getElementById('nearby-list');
    const items = this.mock[this.active] || [];
    list.innerHTML = items.map(i => `
      <div class="list-row">
        <div class="list-row-icon"><i data-lucide="map-pin"></i></div>
        <div class="list-row-body"><div class="list-row-title">${i.name}</div><div class="list-row-meta">${i.dist} away</div></div>
        <button class="btn btn-ghost btn-sm" data-name="${encodeURIComponent(i.name)}"><i data-lucide="navigation"></i></button>
      </div>`).join('') || `<div class="empty-state"><i data-lucide="map-pin-off"></i><div class="empty-state-title">Nothing found</div></div>`;
    lucide.createIcons();
    list.querySelectorAll('[data-name]').forEach(btn => btn.addEventListener('click', () =>
      window.open(`https://www.google.com/maps/search/?api=1&query=${btn.dataset.name}`, '_blank')));
  },
};
