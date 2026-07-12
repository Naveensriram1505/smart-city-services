window.Pages = window.Pages || {};

window.Pages.home = {
  services: [
    { id: 'hospitals', label: 'Hospitals', icon: 'cross', cls: 'svc-red', route: 'nearby' },
    { id: 'police', label: 'Police', icon: 'shield', cls: 'svc-blue', route: 'emergency' },
    { id: 'fire', label: 'Fire Station', icon: 'flame', cls: 'svc-red', route: 'emergency' },
    { id: 'ambulance', label: 'Ambulance', icon: 'siren', cls: 'svc-red', route: 'emergency' },
    { id: 'transport', label: 'Transport', icon: 'bus', cls: 'svc-blue', route: 'transport' },
    { id: 'traffic', label: 'Traffic', icon: 'traffic-cone', cls: 'svc-amber', route: 'traffic' },
    { id: 'parking', label: 'Parking', icon: 'square-parking', cls: 'svc-blue', route: 'parking' },
    { id: 'water', label: 'Water Supply', icon: 'droplets', cls: 'svc-teal', route: 'complaintList' },
    { id: 'electricity', label: 'Electricity', icon: 'zap', cls: 'svc-amber', route: 'complaintList' },
    { id: 'waste', label: 'Waste Mgmt', icon: 'recycle', cls: 'svc-green', route: 'waste' },
    { id: 'parks', label: 'Public Parks', icon: 'trees', cls: 'svc-green', route: 'nearby' },
    { id: 'announcements', label: 'Announcements', icon: 'megaphone', cls: 'svc-purple', route: 'news' },
    { id: 'nearby', label: 'Nearby', icon: 'map-pin', cls: 'svc-teal', route: 'nearby' },
    { id: 'emergency', label: 'Emergency', icon: 'phone-call', cls: 'svc-red', route: 'emergency' },
  ],

  render(root) {
    const user = window.app.user;
    const firstName = (user?.displayName || 'Citizen').split(' ')[0];

    root.innerHTML = `
      <div class="search-bar" id="search-bar">
        <i data-lucide="search"></i>
        <span>Search services, complaints, routes…</span>
      </div>

      <div class="glass hero-card">
        <div class="hero-row">
          <div>
            <div class="eyebrow">Good to see you</div>
            <h1 style="font-size:19px;margin-top:4px;">${firstName}</h1>
            <div class="hero-loc" style="margin-top:6px;"><i data-lucide="map-pin"></i><span id="loc-text">Locating…</span></div>
          </div>
          <div class="weather-chip">
            <div class="weather-icon" id="weather-icon"><i data-lucide="loader-2" style="animation:spin 1s linear infinite;"></i></div>
            <div>
              <div class="weather-temp" id="weather-temp">--°</div>
              <div style="font-size:11px;color:var(--text-faint);" id="weather-desc">—</div>
            </div>
          </div>
        </div>

        <div class="ai-shortcut" id="ai-shortcut">
          <div class="ai-shortcut-icon"><i data-lucide="sparkles"></i></div>
          <div>
            <div class="ai-shortcut-title">Ask the City AI Assistant</div>
            <div class="ai-shortcut-sub">Bus timings, complaint status, water schedules & more</div>
          </div>
        </div>
      </div>

      <div class="section-heading">All services</div>
      <div class="service-grid" id="service-grid"></div>

      <div class="section-heading">Recent complaints <span class="link" id="see-all-complaints">See all</span></div>
      <div class="card" id="recent-complaints" style="padding:6px 12px;">
        <div class="empty-state">
          <i data-lucide="loader-2" style="animation:spin 0.9s linear infinite;"></i>
          <div class="empty-state-title">Loading…</div>
        </div>
      </div>
    `;

    document.getElementById('service-grid').innerHTML = this.services.map(s => `
      <div class="service-tile" data-route="${s.route}" data-service-id="${s.id}">
        <div class="service-tile-icon ${s.cls}"><i data-lucide="${s.icon}"></i></div>
        <span>${s.label}</span>
      </div>`).join('');

    lucide.createIcons();

    document.getElementById('search-bar').addEventListener('click', () => window.app.navigate('chatbot'));
    document.getElementById('ai-shortcut').addEventListener('click', () => window.app.navigate('chatbot'));
    document.getElementById('see-all-complaints').addEventListener('click', () => window.app.navigate('complaintList'));
    root.querySelectorAll('.service-tile').forEach(el => el.addEventListener('click', () => {
      if (el.dataset.serviceId === 'police') {
        window.app.toast('Police number: 100', 'info', 'shield');
        window.app.navigate('emergency');
        return;
      }
      window.app.navigate(el.dataset.route);
    }));

    this.loadLocationAndWeather();
    this.loadRecentComplaints();
  },

  loadLocationAndWeather() {
    const locText = document.getElementById('loc-text');
    if (!navigator.geolocation) { locText.textContent = 'Location unavailable'; return this.loadWeather(null, null); }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locText.textContent = `${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`;
        this.loadWeather(pos.coords.latitude, pos.coords.longitude);
      },
      () => { locText.textContent = 'Location permission denied'; this.loadWeather(null, null); },
      { timeout: 6000 }
    );
  },

  async loadWeather(lat, lon) {
    const iconEl = document.getElementById('weather-icon');
    const tempEl = document.getElementById('weather-temp');
    const descEl = document.getElementById('weather-desc');
    try {
      const url = lat != null
        ? window.app.apiUrl(`/api/weather?lat=${lat}&lon=${lon}`)
        : window.app.apiUrl('/api/weather');
      const res = await fetch(url);
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      tempEl.textContent = `${Math.round(data.temp)}°`;
      descEl.textContent = data.description || '—';
      iconEl.innerHTML = `<i data-lucide="${data.icon || 'sun'}"></i>`;
      lucide.createIcons();
    } catch (e) {
      tempEl.textContent = '--°';
      descEl.textContent = 'Backend not connected';
      iconEl.innerHTML = `<i data-lucide="cloud-off"></i>`;
      lucide.createIcons();
    }
  },

  async loadRecentComplaints() {
    const box = document.getElementById('recent-complaints');
    try {
      const snap = await window.app.db.collection('complaints')
        .where('uid', '==', window.app.user.uid).orderBy('createdAt', 'desc').limit(3).get();
      if (snap.empty) {
        box.innerHTML = `<div class="empty-state"><i data-lucide="clipboard-check"></i><div class="empty-state-title">No complaints yet</div><div class="empty-state-sub">Report a road, water, or garbage issue and track it here.</div></div>`;
        lucide.createIcons();
        return;
      }
      box.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        const pc = d.status === 'resolved' ? 'pill-go' : d.status === 'in_progress' ? 'pill-caution' : 'pill-info';
        return `<div class="list-row" data-id="${doc.id}">
          <div class="list-row-icon"><i data-lucide="${d.icon || 'alert-triangle'}"></i></div>
          <div class="list-row-body"><div class="list-row-title">${d.title}</div><div class="list-row-meta">#${doc.id.slice(0,6).toUpperCase()}</div></div>
          <span class="pill ${pc}">${(d.status || 'open').replace('_',' ')}</span>
        </div>`;
      }).join('');
      lucide.createIcons();
      box.querySelectorAll('.list-row').forEach(el => el.addEventListener('click', () => window.app.navigate('complaintList')));
    } catch (e) {
      box.innerHTML = `<div class="empty-state"><i data-lucide="wifi-off"></i><div class="empty-state-title">Couldn't load complaints</div><div class="empty-state-sub">Check Firestore rules/connection.</div></div>`;
      lucide.createIcons();
    }
  },
};
