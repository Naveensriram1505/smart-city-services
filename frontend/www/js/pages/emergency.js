window.Pages = window.Pages || {};

window.Pages.emergency = {
  contacts: [
    { label: 'Police', number: '100', icon: 'shield', cls: 'svc-blue' },
    { label: 'Ambulance', number: '108', icon: 'siren', cls: 'svc-red' },
    { label: 'Fire Station', number: '101', icon: 'flame', cls: 'svc-red' },
    { label: 'Women Safety', number: '1091', icon: 'shield-check', cls: 'svc-purple' },
    { label: 'Disaster Mgmt', number: '108', icon: 'triangle-alert', cls: 'svc-amber' },
    { label: 'Child Helpline', number: '1098', icon: 'heart-handshake', cls: 'svc-green' },
  ],

  render(root) {
    root.innerHTML = `
      <button class="sos-button" id="sos-btn"><i data-lucide="siren"></i><span>SOS</span></button>
      <p style="text-align:center;color:var(--text-dim);font-size:12.5px;margin-top:-8px;margin-bottom:20px;">Tap SOS to call emergency services and share your live location</p>

      <div class="section-heading" style="margin-top:0;">One-tap emergency numbers</div>
      <div class="emergency-grid" id="emergency-grid"></div>
    `;
    document.getElementById('emergency-grid').innerHTML = this.contacts.map(c => `
      <div class="emergency-tile" data-tel="${c.number}">
        <div class="emergency-tile-icon ${c.cls}"><i data-lucide="${c.icon}"></i></div>
        <div><span>${c.label}</span><div style="font-size:11px;color:var(--text-faint);font-family:var(--font-mono);">${c.number}</div></div>
      </div>`).join('');
    lucide.createIcons();

    document.getElementById('sos-btn').addEventListener('click', () => this.triggerSOS());
    root.querySelectorAll('[data-tel]').forEach(el => el.addEventListener('click', () => window.location.href = `tel:${el.dataset.tel}`));
  },

  triggerSOS() {
    if (!navigator.geolocation) {
      window.location.href = 'tel:112';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        try {
          await window.app.db.collection('sosAlerts').add({
            uid: window.app.user.uid, geo: { lat: pos.coords.latitude, lon: pos.coords.longitude },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        } catch (e) { /* non-blocking */ }

        if (navigator.share) {
          navigator.share({ title: 'SOS — my live location', text: 'I need help. My location:', url: link }).catch(() => {});
        } else {
          window.location.href = `sms:?body=${encodeURIComponent('SOS — I need help. My location: ' + link)}`;
        }
        window.app.toast('Location shared — calling 112', 'error', 'siren');
        setTimeout(() => window.location.href = 'tel:112', 1200);
      },
      () => { window.location.href = 'tel:112'; },
      { timeout: 6000 }
    );
  },
};
