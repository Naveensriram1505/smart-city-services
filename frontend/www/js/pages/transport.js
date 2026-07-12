window.Pages = window.Pages || {};

window.Pages.transport = {
  tabs: ['Bus', 'Metro', 'Train'],
  active: 'Bus',
  data: {
    Bus: [
      { route: 'Route 12', from: 'Market Sq', to: 'Tech Park', eta: '4 min', icon: 'bus' },
      { route: 'Route 47', from: 'Central Station', to: 'Riverside', eta: '11 min', icon: 'bus' },
      { route: 'Route 8', from: 'City Mall', to: 'Old Town', eta: '18 min', icon: 'bus' },
    ],
    Metro: [
      { route: 'Blue Line', from: 'Downtown', to: 'Airport', eta: '3 min', icon: 'train-front' },
      { route: 'Green Line', from: 'University', to: 'Harbor', eta: '9 min', icon: 'train-front' },
    ],
    Train: [
      { route: 'Suburban 221', from: 'Central Station', to: 'North Yard', eta: '22 min', icon: 'train-track' },
      { route: 'Express 09', from: 'Central Station', to: 'East Terminal', eta: '40 min', icon: 'train-track' },
    ],
  },

  render(root) {
    root.innerHTML = `
      <div class="chip-row" id="transport-tabs">
        ${this.tabs.map(t => `<div class="chip ${t === this.active ? 'selected' : ''}" data-tab="${t}">${t}</div>`).join('')}
      </div>
      <div class="section-heading">Nearby stops</div>
      <div id="transport-list"></div>
    `;
    this.renderList();
    lucide.createIcons();
    root.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
      this.active = chip.dataset.tab;
      root.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      this.renderList();
    }));
  },

  renderList() {
    const list = document.getElementById('transport-list');
    list.innerHTML = this.data[this.active].map(t => `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;gap:12px;align-items:center;">
            <div class="list-row-icon"><i data-lucide="${t.icon}"></i></div>
            <div>
              <div class="list-row-title">${t.route}</div>
              <div class="list-row-meta">${t.from} → ${t.to}</div>
            </div>
          </div>
          <span class="pill pill-go">${t.eta}</span>
        </div>
      </div>`).join('');
    lucide.createIcons();
  },
};
