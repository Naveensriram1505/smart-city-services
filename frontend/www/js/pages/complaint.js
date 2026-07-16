window.Pages = window.Pages || {};

/* ─────────────────────────────────────────────────────────────────────────────
   Shared helpers
───────────────────────────────────────────────────────────────────────────── */
const PROBLEM_ICONS = {
  'Road Damage':        'construction',
  'Garbage Overflow':   'trash-2',
  'Water Leakage':      'droplets',
  'Streetlight Failure':'lamp',
  'Illegal Parking':    'square-parking',
  'Drainage Problem':   'waves',
  'Air Pollution':      'wind',
  'Noise Pollution':    'volume-2',
  'Power Outage':       'zap-off',
  'Sewage Issue':       'git-branch',
  'Park / Public Space':'trees',
  'Other':              'alert-circle',
};

function apiUrl(path) {
  return window.app.apiUrl(path);
}

function statusInfo(status) {
  switch (status) {
    case 'open':        return { label: 'Open',        cls: 'pill-info',    step: 0 };
    case 'in_progress': return { label: 'In Progress', cls: 'pill-caution', step: 1 };
    case 'resolved':    return { label: 'Resolved',    cls: 'pill-go',      step: 2 };
    default:            return { label: status,        cls: 'pill-info',    step: 0 };
  }
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch { return iso; }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Complaint list page
───────────────────────────────────────────────────────────────────────────── */
window.Pages.complaintList = {
  render(root) {
    root.innerHTML = `
      <div class="complaint-list-header">
        <div class="complaint-list-info">
          <i data-lucide="clipboard-list"></i>
          <span>All submitted complaints are listed below</span>
        </div>
        <button class="btn btn-primary btn-sm" id="new-complaint-btn">
          <i data-lucide="plus"></i> New complaint
        </button>
      </div>
      <div id="complaint-cards"></div>
    `;
    lucide.createIcons();
    document.getElementById('new-complaint-btn')
      .addEventListener('click', () => window.app.navigate('newComplaint'));
    this.load();
  },

  async load() {
    const container = document.getElementById('complaint-cards');
    container.innerHTML = `
      <div class="card"><div class="empty-state">
        <i data-lucide="loader-2" class="spin-icon"></i>
        <div class="empty-state-title">Loading complaints…</div>
      </div></div>`;
    lucide.createIcons();

    try {
      const res  = await fetch(apiUrl('/api/complaints'));
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || 'API error');

      if (!data.complaints || data.complaints.length === 0) {
        container.innerHTML = `
          <div class="card"><div class="empty-state">
            <i data-lucide="clipboard-list"></i>
            <div class="empty-state-title">No complaints filed yet</div>
            <div class="empty-state-sub">Report road damage, garbage, power outages and more — track status right here.</div>
          </div></div>`;
        lucide.createIcons();
        return;
      }

      const steps = ['Reported', 'Team Assigned', 'Resolved'];
      container.innerHTML = data.complaints.map(c => {
        const si  = statusInfo(c.status);
        const icon = PROBLEM_ICONS[c.problem_type] || 'alert-circle';
        return `
          <div class="complaint-card card">
            <div class="complaint-card-top">
              <div class="complaint-icon-wrap">
                <i data-lucide="${icon}"></i>
              </div>
              <div class="complaint-card-meta">
                <div class="complaint-card-type">${c.problem_type}</div>
                <div class="complaint-card-id">
                  #${String(c.id).padStart(4,'0')} · ${fmtDate(c.created_at)}
                </div>
              </div>
              <span class="pill ${si.cls} complaint-status-pill">${si.label}</span>
            </div>

            <div class="complaint-card-body">
              <div class="complaint-field-row">
                <i data-lucide="user" class="field-icon"></i>
                <span>${c.name}</span>
              </div>
              <div class="complaint-field-row">
                <i data-lucide="phone" class="field-icon"></i>
                <span>${c.phone}</span>
              </div>
              ${c.location ? `
              <div class="complaint-field-row">
                <i data-lucide="map-pin" class="field-icon"></i>
                <span>${c.location}</span>
              </div>` : ''}
              <div class="complaint-description">${c.description}</div>
            </div>

            <div class="timeline">
              ${steps.map((s, i) => `
                <div class="timeline-step ${i < si.step ? 'done' : i === si.step ? 'current' : ''}">
                  <div class="timeline-dot"></div>
                  <div class="timeline-title">${s}</div>
                </div>`).join('')}
            </div>
          </div>`;
      }).join('');
      lucide.createIcons();
    } catch (e) {
      container.innerHTML = `
        <div class="card"><div class="empty-state">
          <i data-lucide="wifi-off"></i>
          <div class="empty-state-title">Couldn't load complaints</div>
          <div class="empty-state-sub">Make sure the backend is running at ${apiUrl('')}</div>
        </div></div>`;
      lucide.createIcons();
    }
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   New complaint form page
───────────────────────────────────────────────────────────────────────────── */
window.Pages.newComplaint = {
  problemTypes: [],
  coords: null,

  render(root) {
    this.coords = null;
    root.innerHTML = `
      <!-- ── HERO BANNER ── -->
      <div class="complaint-form-hero">
        <div class="complaint-form-hero-icon"><i data-lucide="flag"></i></div>
        <div>
          <div class="complaint-form-hero-title">Report a City Issue</div>
          <div class="complaint-form-hero-sub">Help us keep your city safe and clean</div>
        </div>
      </div>

      <!-- ── PROBLEM TYPE CHIPS ── -->
      <div class="section-heading" style="margin-top:20px;">
        <span>What's the problem?</span>
        <span class="pill pill-info" id="type-required-badge">Required</span>
      </div>
      <div class="problem-chip-grid" id="problem-chips">
        <div class="empty-state" style="padding:20px 0;">
          <i data-lucide="loader-2" class="spin-icon"></i>
          <div class="empty-state-sub">Loading categories…</div>
        </div>
      </div>

      <!-- ── CONTACT DETAILS ── -->
      <div class="section-heading">Contact Details</div>
      <div class="card complaint-form-card">
        <div class="field">
          <label for="c-name">
            <i data-lucide="user" class="label-icon"></i> Full Name
          </label>
          <input type="text" id="c-name" placeholder="e.g. Naveen Kumar" maxlength="80" autocomplete="name" />
        </div>
        <div class="field">
          <label for="c-phone">
            <i data-lucide="phone" class="label-icon"></i> Phone Number
          </label>
          <input type="tel" id="c-phone" placeholder="e.g. 9876543210" maxlength="15" autocomplete="tel" />
        </div>
      </div>

      <!-- ── ISSUE DETAILS ── -->
      <div class="section-heading">Issue Details</div>
      <div class="card complaint-form-card">
        <div class="field" style="margin-bottom:0;">
          <label for="c-desc">
            <i data-lucide="file-text" class="label-icon"></i> Description
          </label>
          <textarea id="c-desc" placeholder="Describe the problem clearly — street name, landmark, severity, etc." rows="4"></textarea>
        </div>
      </div>

      <!-- ── LOCATION ── -->
      <div class="section-heading">Location</div>
      <div class="card complaint-form-card">
        <div class="field" style="margin-bottom:0;">
          <label><i data-lucide="map-pin" class="label-icon"></i> Your Location</label>
          <div class="location-options">
            <div class="upload-well" id="gps-btn">
              <i data-lucide="navigation"></i>
              <div id="gps-status">Tap to capture GPS location</div>
            </div>
            <div class="location-or">— or type it —</div>
            <input type="text" id="c-location" placeholder="e.g. MG Road, Near Bus Stand, Chennai" />
          </div>
        </div>
      </div>

      <!-- ── SUBMIT ── -->
      <button class="btn btn-primary complaint-submit-btn" id="c-submit" disabled>
        <i data-lucide="send"></i> Submit Complaint
      </button>
      <p class="complaint-note">Your complaint will be tracked and addressed by the city team.</p>
    `;
    lucide.createIcons();
    this._loadTypes(root);
    this._bindEvents(root);
  },

  async _loadTypes(root) {
    const grid = document.getElementById('problem-chips');
    try {
      const res  = await fetch(apiUrl('/api/complaints/problem-types'));
      const data = await res.json();
      this.problemTypes = data.types || [];
    } catch {
      this.problemTypes = Object.keys(PROBLEM_ICONS);
    }

    grid.innerHTML = this.problemTypes.map(t => {
      const icon = PROBLEM_ICONS[t] || 'alert-circle';
      return `
        <div class="problem-chip" data-type="${t}">
          <div class="problem-chip-icon"><i data-lucide="${icon}"></i></div>
          <span>${t}</span>
        </div>`;
    }).join('');
    lucide.createIcons();

    grid.querySelectorAll('.problem-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        grid.querySelectorAll('.problem-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        document.getElementById('type-required-badge').textContent = chip.dataset.type;
        document.getElementById('type-required-badge').className = 'pill pill-go';
        this._checkReady();
      });
    });
  },

  _bindEvents(root) {
    document.getElementById('gps-btn').addEventListener('click', () => this._captureGps());
    document.getElementById('c-location').addEventListener('input', () => this._checkReady());
    ['c-name', 'c-phone', 'c-desc'].forEach(id =>
      document.getElementById(id).addEventListener('input', () => this._checkReady())
    );
    document.getElementById('c-submit').addEventListener('click', () => this._submit());
  },

  _captureGps() {
    const status = document.getElementById('gps-status');
    status.textContent = 'Locating…';
    document.getElementById('gps-btn').classList.add('locating');
    if (!navigator.geolocation) {
      status.textContent = 'GPS not supported — type location below';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        const locStr = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        status.textContent = `📍 ${locStr}`;
        document.getElementById('gps-btn').classList.remove('locating');
        document.getElementById('gps-btn').classList.add('located');
        // Also fill text input so user can see / edit
        document.getElementById('c-location').value = locStr;
        this._checkReady();
      },
      () => {
        status.textContent = 'Permission denied — type location below';
        document.getElementById('gps-btn').classList.remove('locating');
      },
      { timeout: 8000 }
    );
  },

  _selectedType() {
    const sel = document.querySelector('.problem-chip.selected');
    return sel ? sel.dataset.type : null;
  },

  _checkReady() {
    const name  = (document.getElementById('c-name')?.value || '').trim();
    const phone = (document.getElementById('c-phone')?.value || '').trim();
    const desc  = (document.getElementById('c-desc')?.value || '').trim();
    const type  = this._selectedType();
    const btn   = document.getElementById('c-submit');
    if (btn) btn.disabled = !(name.length > 1 && phone.length >= 7 && desc.length > 5 && type);
  },

  async _submit() {
    const btn  = document.getElementById('c-submit');
    const name  = document.getElementById('c-name').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    const desc  = document.getElementById('c-desc').value.trim();
    const type  = this._selectedType();
    const locInput = document.getElementById('c-location').value.trim();
    const location = locInput || (this.coords ? `${this.coords.lat.toFixed(4)}, ${this.coords.lon.toFixed(4)}` : '');

    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin-icon"></i> Submitting…';
    lucide.createIcons();

    try {
      const res = await fetch(apiUrl('/api/complaints'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          problem_type: type,
          description: desc,
          location,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Server error');

      window.app.toast('✅ Complaint submitted! You can track it below.', 'success');
      window.app.navigate('complaintList');
    } catch (e) {
      window.app.toast(`❌ Couldn't submit: ${e.message}`, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="send"></i> Submit Complaint';
      lucide.createIcons();
    }
  },
};
