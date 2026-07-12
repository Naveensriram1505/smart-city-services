window.Pages = window.Pages || {};

window.Pages.admin = {
  render(root) {
    root.innerHTML = `
      <div class="stat-grid">
        <div class="stat-tile"><div class="stat-value" id="stat-total">–</div><div class="stat-label">Total complaints</div></div>
        <div class="stat-tile"><div class="stat-value" id="stat-open">–</div><div class="stat-label">Open</div></div>
        <div class="stat-tile"><div class="stat-value" id="stat-resolved">–</div><div class="stat-label">Resolved</div></div>
      </div>

      <div class="section-heading">By category</div>
      <div class="card">
        <div class="bar-chart" id="bar-chart"></div>
      </div>

      <div class="section-heading">All complaints</div>
      <div id="admin-list"></div>
    `;
    this.load();
  },

  async load() {
    try {
      const snap = await window.app.db.collection('complaints').get();
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      document.getElementById('stat-total').textContent = docs.length;
      document.getElementById('stat-open').textContent = docs.filter(d => d.status !== 'resolved').length;
      document.getElementById('stat-resolved').textContent = docs.filter(d => d.status === 'resolved').length;

      const byCategory = {};
      docs.forEach(d => { byCategory[d.category || 'other'] = (byCategory[d.category || 'other'] || 0) + 1; });
      const max = Math.max(1, ...Object.values(byCategory));
      const chart = document.getElementById('bar-chart');
      const entries = Object.entries(byCategory);
      chart.innerHTML = entries.length ? entries.map(([cat, count]) => `
        <div class="bar-col">
          <div class="bar" style="height:${Math.max(6, (count / max) * 100)}%;"></div>
          <div class="bar-label">${cat.split('_')[0]}</div>
        </div>`).join('') : '<div class="empty-state" style="width:100%;"><div class="empty-state-title">No data yet</div></div>';

      const list = document.getElementById('admin-list');
      if (!docs.length) {
        list.innerHTML = `<div class="card"><div class="empty-state"><i data-lucide="inbox"></i><div class="empty-state-title">No complaints in the system</div></div></div>`;
      } else {
        list.innerHTML = docs.slice(0, 20).map(d => `
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
              <div>
                <div class="list-row-title" style="font-size:13.5px;">${d.title || 'Untitled'}</div>
                <div class="list-row-meta">#${d.id.slice(0,6).toUpperCase()} · ${(d.category||'other').replace('_',' ')}</div>
              </div>
              <select class="status-select" data-id="${d.id}" style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);background:var(--surface-solid);color:var(--text);font-size:12px;">
                <option value="open" ${d.status==='open'?'selected':''}>Open</option>
                <option value="in_progress" ${d.status==='in_progress'?'selected':''}>In progress</option>
                <option value="resolved" ${d.status==='resolved'?'selected':''}>Resolved</option>
              </select>
            </div>
          </div>`).join('');
      }
      lucide.createIcons();

      document.querySelectorAll('.status-select').forEach(sel => sel.addEventListener('change', async (e) => {
        try {
          await window.app.db.collection('complaints').doc(e.target.dataset.id).update({ status: e.target.value });
          window.app.toast('Status updated', 'success');
        } catch (err) {
          window.app.toast('Update failed — admin writes need a privileged rule/back office', 'error');
        }
      }));
    } catch (e) {
      document.getElementById('admin-list').innerHTML = `<div class="card"><div class="empty-state"><i data-lucide="wifi-off"></i><div class="empty-state-title">Couldn't load admin data</div><div class="empty-state-sub">This view needs an admin-role Firestore rule — see FIREBASE_SETUP.md.</div></div></div>`;
      lucide.createIcons();
    }
  },
};
