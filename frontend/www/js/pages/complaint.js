window.Pages = window.Pages || {};

/* ---------------------------- Complaint list / tracking ---------------------------- */
window.Pages.complaintList = {
  render(root) {
    root.innerHTML = `
      <div class="section-heading" style="margin-top:0;">Your complaints<span class="link" id="new-complaint-link">+ New</span></div>
      <div id="complaint-list"></div>
    `;
    document.getElementById('new-complaint-link').addEventListener('click', () => window.app.navigate('newComplaint'));
    this.load(root);
  },

  async load() {
    const list = document.getElementById('complaint-list');
    list.innerHTML = `<div class="card"><div class="empty-state"><i data-lucide="loader-2" style="animation:spin 0.9s linear infinite;"></i><div class="empty-state-title">Loading…</div></div></div>`;
    lucide.createIcons();
    try {
      const snap = await window.app.db.collection('complaints').where('uid', '==', window.app.user.uid).orderBy('createdAt', 'desc').get();
      if (snap.empty) {
        list.innerHTML = `<div class="card"><div class="empty-state"><i data-lucide="clipboard-list"></i><div class="empty-state-title">No complaints filed</div><div class="empty-state-sub">Report road damage, garbage overflow, leaks and more — track every step here.</div></div></div>`;
        lucide.createIcons();
        return;
      }
      const order = ['open', 'in_progress', 'resolved'];
      list.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        const status = d.status || 'open';
        const idx = order.indexOf(status);
        const steps = [{ label: 'Reported' }, { label: 'Team assigned' }, { label: 'Resolved' }];
        const priorityPill = d.priority === 'high' ? 'pill-stop' : d.priority === 'medium' ? 'pill-caution' : 'pill-go';
        return `
          <div class="card">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
              <div>
                <div class="list-row-title" style="font-size:14.5px;">${d.title}</div>
                <div class="list-row-meta">#${doc.id.slice(0,6).toUpperCase()} · ${d.location || 'Location captured'}</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:5px;align-items:flex-end;">
                <span class="pill ${status === 'resolved' ? 'pill-go' : status === 'in_progress' ? 'pill-caution' : 'pill-info'}">${status.replace('_',' ')}</span>
                <span class="pill ${priorityPill}">${d.priority || 'low'}</span>
              </div>
            </div>
            ${d.photoUrl ? `<img src="${d.photoUrl}" class="upload-preview" style="max-height:140px;" />` : ''}
            <div class="timeline" style="margin-top:16px;">
              ${steps.map((s,i) => `<div class="timeline-step ${i < idx ? 'done' : i === idx ? 'current' : ''}"><div class="timeline-dot"></div><div class="timeline-title">${s.label}</div></div>`).join('')}
            </div>
          </div>`;
      }).join('');
      lucide.createIcons();
    } catch (e) {
      list.innerHTML = `<div class="card"><div class="empty-state"><i data-lucide="wifi-off"></i><div class="empty-state-title">Couldn't load complaints</div><div class="empty-state-sub">Check Firestore rules and connection.</div></div></div>`;
      lucide.createIcons();
    }
  },
};

/* ---------------------------------- New complaint ---------------------------------- */
window.Pages.newComplaint = {
  categories: [
    { id: 'road_damage', label: 'Road damage', icon: 'construction' },
    { id: 'garbage_overflow', label: 'Garbage overflow', icon: 'trash-2' },
    { id: 'water_leakage', label: 'Water leakage', icon: 'droplets' },
    { id: 'streetlight', label: 'Streetlight failure', icon: 'lamp' },
    { id: 'illegal_parking', label: 'Illegal parking', icon: 'square-parking' },
    { id: 'drainage', label: 'Drainage problem', icon: 'waves' },
    { id: 'air_pollution', label: 'Air pollution', icon: 'wind' },
    { id: 'noise_pollution', label: 'Noise pollution', icon: 'volume-2' },
  ],
  selectedCategory: null,
  selectedPriority: 'medium',
  photoDataUrl: null,
  coords: null,

  render(root) {
    this.selectedCategory = null; this.selectedPriority = 'medium'; this.photoDataUrl = null; this.coords = null;
    root.innerHTML = `
      <div class="section-heading" style="margin-top:0;">What's the issue?</div>
      <div class="chip-row" id="cat-chips">
        ${this.categories.map(c => `<div class="chip" data-cat="${c.id}" data-icon="${c.icon}"><i data-lucide="${c.icon}"></i>${c.label}</div>`).join('')}
      </div>

      <div class="section-heading">Details</div>
      <div class="card">
        <div class="field"><label>Title</label><input type="text" id="c-title" placeholder="e.g. Broken streetlight on Main St" maxlength="80" /></div>
        <div class="field"><label>Description</label><textarea id="c-desc" placeholder="Anything that helps a field team fix it faster"></textarea></div>

        <div class="field">
          <label>Location</label>
          <div class="upload-well" id="loc-well"><i data-lucide="map-pin"></i><div id="loc-status">Tap to capture your GPS location</div></div>
        </div>

        <div class="field">
          <label>Photo</label>
          <div class="upload-well" id="photo-well"><i data-lucide="camera"></i><div>Tap to attach a photo</div></div>
          <input type="file" id="photo-input" accept="image/*" capture="environment" class="hidden" />
          <img id="photo-preview" class="upload-preview hidden" />
        </div>

        <div class="field" style="margin-bottom:0;">
          <label>Priority</label>
          <div class="priority-row" id="priority-row">
            <div class="priority-chip" data-p="low">Low</div>
            <div class="priority-chip selected" data-p="medium">Medium</div>
            <div class="priority-chip" data-p="high">High</div>
          </div>
        </div>
      </div>

      <button class="btn btn-primary" id="c-submit" style="margin-top:18px;" disabled><i data-lucide="send"></i> Submit complaint</button>
    `;
    lucide.createIcons();

    root.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
      root.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      this.selectedCategory = { id: chip.dataset.cat, icon: chip.dataset.icon };
      this.checkReady();
    }));

    root.querySelectorAll('.priority-chip').forEach(chip => chip.addEventListener('click', () => {
      root.querySelectorAll('.priority-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      this.selectedPriority = chip.dataset.p;
    }));

    document.getElementById('loc-well').addEventListener('click', () => this.captureLocation());
    document.getElementById('photo-well').addEventListener('click', () => document.getElementById('photo-input').click());
    document.getElementById('photo-input').addEventListener('change', (e) => this.handlePhoto(e));
    ['c-title', 'c-desc'].forEach(id => document.getElementById(id).addEventListener('input', () => this.checkReady()));
    document.getElementById('c-submit').addEventListener('click', () => this.submit());
  },

  captureLocation() {
    const status = document.getElementById('loc-status');
    status.textContent = 'Locating…';
    if (!navigator.geolocation) { status.textContent = 'Location not supported on this device'; return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        status.textContent = `Captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        this.checkReady();
      },
      () => { status.textContent = 'Permission denied — you can still submit without it'; },
      { timeout: 6000 }
    );
  },

  handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.photoDataUrl = reader.result;
      const img = document.getElementById('photo-preview');
      img.src = this.photoDataUrl;
      img.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  },

  checkReady() {
    const title = document.getElementById('c-title').value.trim();
    document.getElementById('c-submit').disabled = !(this.selectedCategory && title.length > 2);
  },

  async submit() {
    const btn = document.getElementById('c-submit');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" style="animation:spin 0.8s linear infinite;"></i> Submitting…';
    lucide.createIcons();

    try {
      let photoUrl = null;
      if (this.photoDataUrl) {
        const uid = window.app.user.uid;
        const ref = window.app.storage.ref().child(`complaints/${uid}/${Date.now()}.jpg`);
        await ref.putString(this.photoDataUrl, 'data_url');
        photoUrl = await ref.getDownloadURL();
      }

      await window.app.db.collection('complaints').add({
        uid: window.app.user.uid,
        category: this.selectedCategory.id,
        icon: this.selectedCategory.icon,
        title: document.getElementById('c-title').value.trim(),
        description: document.getElementById('c-desc').value.trim(),
        location: this.coords ? `${this.coords.lat.toFixed(4)}, ${this.coords.lon.toFixed(4)}` : '',
        geo: this.coords || null,
        priority: this.selectedPriority,
        photoUrl,
        status: 'open',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      window.app.toast('Complaint submitted — track it below', 'success');
      window.app.navigate('complaintList');
    } catch (e) {
      window.app.toast('Couldn\'t submit — check Storage/Firestore rules', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="send"></i> Submit complaint';
      lucide.createIcons();
    }
  },
};
