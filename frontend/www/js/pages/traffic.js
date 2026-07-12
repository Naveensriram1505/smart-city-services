window.Pages = window.Pages || {};

window.Pages.traffic = {
  segments: [
    { name: 'Ring Road — North', level: 'heavy', note: 'Accident reported near Exit 4', lat: 12.99, lon: 77.61 },
    { name: 'Main Street', level: 'moderate', note: 'Slow-moving, no incidents', lat: 12.975, lon: 77.60 },
    { name: 'Riverside Expressway', level: 'clear', note: 'Flowing freely', lat: 12.965, lon: 77.605 },
    { name: 'Old Town Bypass', level: 'closed', note: 'Road closed for maintenance until 6pm', lat: 12.98, lon: 77.58 },
  ],

  render(root) {
    root.innerHTML = `
      <div class="map-frame">
        <img src="${this.mapUrl()}" alt="Traffic map" onerror="this.src='https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=60'" />
        <div class="map-badge">Live traffic</div>
      </div>
      <div class="section-heading">Road conditions</div>
      <div id="traffic-list"></div>
    `;
    document.getElementById('traffic-list').innerHTML = this.segments.map(s => {
      const pill = s.level === 'clear' ? 'pill-go' : s.level === 'moderate' ? 'pill-caution' : 'pill-stop';
      const label = s.level === 'closed' ? 'Closed' : s.level.charAt(0).toUpperCase() + s.level.slice(1);
      return `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div class="list-row-title" style="font-size:14px;">${s.name}</div>
              <div class="list-row-meta" style="margin-top:3px;">${s.note}</div>
            </div>
            <span class="pill ${pill}">${label}</span>
          </div>
          ${s.level === 'heavy' || s.level === 'closed' ? `<button class="btn btn-ghost btn-sm" style="margin-top:12px;" data-alt="${s.lat},${s.lon}"><i data-lucide="route"></i> Alternative route</button>` : ''}
        </div>`;
    }).join('');
    lucide.createIcons();
    root.querySelectorAll('[data-alt]').forEach(btn => btn.addEventListener('click', () => {
      const [lat, lon] = btn.dataset.alt.split(',');
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&dir_action=navigate&avoid=highways`, '_blank');
    }));
  },

  mapUrl() {
    const key = window.CONFIG.GOOGLE_MAPS_API_KEY;
    if (!key || key.startsWith('REPLACE')) return '';
    const path = this.segments.map(s => `${s.lat},${s.lon}`).join('|');
    return `https://maps.googleapis.com/maps/api/staticmap?size=640x300&path=color:0x2F6FEDaa|weight:5|${path}&key=${key}`;
  },
};
