window.Pages = window.Pages || {};

window.Pages.parking = {
  lots: [
    { name: 'City Mall Parking', distance: '0.4 km', available: 42, total: 120, fee: '₹20/hr', lat: 12.9716, lon: 77.5946 },
    { name: 'Central Station Lot', distance: '0.9 km', available: 8, total: 80, fee: '₹15/hr', lat: 12.9789, lon: 77.5917 },
    { name: 'Riverside Complex', distance: '1.3 km', available: 65, total: 150, fee: '₹10/hr', lat: 12.9650, lon: 77.6010 },
    { name: 'Tech Park Basement', distance: '2.1 km', available: 0, total: 60, fee: '₹25/hr', lat: 12.9840, lon: 77.5820 },
  ],

  render(root) {
    root.innerHTML = `
      <div class="map-frame">
        <img src="${this.mapUrl()}" alt="Map" onerror="this.src='https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=60'" />
        <div class="map-badge">Live availability</div>
      </div>
      <div class="section-heading">Nearby parking</div>
      <div id="lot-list"></div>
    `;
    document.getElementById('lot-list').innerHTML = this.lots.map((l, i) => {
      const pct = Math.round((l.available / l.total) * 100);
      const pill = l.available === 0 ? 'pill-stop' : pct < 25 ? 'pill-caution' : 'pill-go';
      return `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
            <div>
              <div class="list-row-title" style="font-size:14.5px;">${l.name}</div>
              <div class="list-row-meta">${l.distance} away · ${l.fee}</div>
            </div>
            <span class="pill ${pill}">${l.available === 0 ? 'Full' : l.available + ' free'}</span>
          </div>
          <div style="display:flex;gap:8px;margin-top:14px;">
            <button class="btn btn-ghost btn-sm" data-nav="${i}" style="flex:1;"><i data-lucide="navigation"></i> Navigate</button>
            <button class="btn btn-primary btn-sm" data-book="${i}" style="flex:1;" ${l.available === 0 ? 'disabled' : ''}><i data-lucide="calendar-check"></i> Book spot</button>
          </div>
        </div>`;
    }).join('');
    lucide.createIcons();

    root.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => {
      const l = this.lots[btn.dataset.nav];
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lon}`, '_blank');
    }));
    root.querySelectorAll('[data-book]').forEach(btn => btn.addEventListener('click', () => {
      const l = this.lots[btn.dataset.book];
      window.app.toast(`Spot reserved at ${l.name} — booking sync needs the "parking" Firestore collection wired to a back office.`, 'success');
    }));
  },

  mapUrl() {
    const key = window.CONFIG.GOOGLE_MAPS_API_KEY;
    if (!key || key.startsWith('REPLACE')) return '';
    const markers = this.lots.map(l => `markers=color:blue%7C${l.lat},${l.lon}`).join('&');
    return `https://maps.googleapis.com/maps/api/staticmap?center=${this.lots[0].lat},${this.lots[0].lon}&zoom=13&size=640x300&${markers}&key=${key}`;
  },
};
