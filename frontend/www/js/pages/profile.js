window.Pages = window.Pages || {};

window.Pages.profile = {
  render(root) {
    const user = window.app.user;
    const name = user?.displayName || 'Citizen';
    const initials = name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

    root.innerHTML = `
      <div class="profile-head">
        <div class="profile-avatar">${initials || 'SC'}</div>
        <div class="profile-name">${name}</div>
        <div class="profile-email">${user?.email || 'No email on file'}</div>
      </div>

      <div class="card menu-list">
        <div class="menu-item" data-route="complaintList"><i data-lucide="clipboard-list"></i><span>Complaint history</span><i data-lucide="chevron-right" class="chevron"></i></div>
        <div class="menu-item"><i data-lucide="map-pin"></i><span>Saved locations</span><i data-lucide="chevron-right" class="chevron"></i></div>
        <div class="menu-item" data-route="emergency"><i data-lucide="siren"></i><span>Emergency contacts</span><i data-lucide="chevron-right" class="chevron"></i></div>
        <div class="menu-item" data-route="settings"><i data-lucide="bell"></i><span>Notification settings</span><i data-lucide="chevron-right" class="chevron"></i></div>
      </div>

      <div class="card menu-list" style="margin-top:12px;">
        <div class="menu-item" data-route="admin"><i data-lucide="layout-dashboard"></i><span>Admin dashboard</span><i data-lucide="chevron-right" class="chevron"></i></div>
        <div class="menu-item" data-route="settings"><i data-lucide="settings"></i><span>Settings</span><i data-lucide="chevron-right" class="chevron"></i></div>
      </div>

      <button class="btn btn-danger" id="btn-signout" style="margin-top:16px;"><i data-lucide="log-out"></i> Sign out</button>
    `;
    lucide.createIcons();

    root.querySelectorAll('[data-route]').forEach(el => el.addEventListener('click', () => window.app.navigate(el.dataset.route)));
    document.getElementById('btn-signout').addEventListener('click', async () => {
      await window.app.signOut();
      window.app.toast('Signed out', 'default', 'log-out');
    });
  },
};
