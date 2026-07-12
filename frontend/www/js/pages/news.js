window.Pages = window.Pages || {};

window.Pages.news = {
  render(root) {
    root.innerHTML = `
      <div class="section-heading" style="margin-top:0;">City news & notices</div>
      <div id="news-list"></div>
    `;
    this.load();
  },

  async load() {
    const list = document.getElementById('news-list');
    list.innerHTML = `<div class="card"><div class="empty-state"><i data-lucide="loader-2" style="animation:spin 0.9s linear infinite;"></i><div class="empty-state-title">Loading notices…</div></div></div>`;
    lucide.createIcons();
    try {
      const snap = await window.app.db.collection('notices').orderBy('publishedAt', 'desc').get();
      if (snap.empty) {
        list.innerHTML = `<div class="card"><div class="empty-state"><i data-lucide="megaphone"></i><div class="empty-state-title">No notices posted</div><div class="empty-state-sub">Seed the "notices" Firestore collection — see FIREBASE_SETUP.md.</div></div></div>`;
        lucide.createIcons();
        return;
      }
      list.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        const date = d.publishedAt?.toDate ? d.publishedAt.toDate().toLocaleDateString() : '—';
        return `
          <div class="card">
            <div style="display:flex;gap:12px;align-items:flex-start;">
              <div class="list-row-icon"><i data-lucide="${d.icon || 'megaphone'}"></i></div>
              <div style="flex:1;">
                <div class="list-row-title" style="font-size:14px;">${d.title || 'Notice'}</div>
                <div style="font-size:12.5px;color:var(--text-dim);line-height:1.5;margin:6px 0;">${d.body || ''}</div>
                <div class="list-row-meta">${date}${d.department ? ' · ' + d.department : ''}</div>
              </div>
              ${d.urgent ? '<span class="pill pill-stop">Urgent</span>' : ''}
            </div>
          </div>`;
      }).join('');
      lucide.createIcons();
    } catch (e) {
      list.innerHTML = `<div class="card"><div class="empty-state"><i data-lucide="wifi-off"></i><div class="empty-state-title">Couldn't load notices</div></div></div>`;
      lucide.createIcons();
    }
  },
};
