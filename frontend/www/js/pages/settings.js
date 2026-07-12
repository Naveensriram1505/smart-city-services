window.Pages = window.Pages || {};

window.Pages.settings = {
  render(root) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    root.innerHTML = `
      <div class="section-heading" style="margin-top:0;">Appearance</div>
      <div class="card">
        <div class="menu-item">
          <i data-lucide="moon"></i><span>Dark mode</span>
          <div class="switch ${isDark ? 'on' : ''}" id="dark-switch"></div>
        </div>
      </div>

      <div class="section-heading">Preferences</div>
      <div class="card">
        <div class="field" style="margin-bottom:0;">
          <label>Language</label>
          <select id="lang-select">
            <option>English</option><option>Hindi</option><option>Spanish</option><option>French</option>
          </select>
        </div>
      </div>

      <div class="section-heading">Notifications</div>
      <div class="card menu-list">
        <div class="menu-item"><i data-lucide="bell"></i><span>Complaint status updates</span><div class="switch on" data-toggle></div></div>
        <div class="menu-item"><i data-lucide="megaphone"></i><span>City announcements</span><div class="switch on" data-toggle></div></div>
        <div class="menu-item"><i data-lucide="cloud-lightning"></i><span>Weather alerts</span><div class="switch" data-toggle></div></div>
      </div>

      <div class="section-heading">Privacy & support</div>
      <div class="card menu-list">
        <div class="menu-item"><i data-lucide="shield"></i><span>Privacy controls</span><i data-lucide="chevron-right" class="chevron"></i></div>
        <div class="menu-item"><i data-lucide="circle-help"></i><span>Help center</span><i data-lucide="chevron-right" class="chevron"></i></div>
        <div class="menu-item"><i data-lucide="info"></i><span>About Smart City Services</span><i data-lucide="chevron-right" class="chevron"></i></div>
      </div>
    `;
    lucide.createIcons();

    document.getElementById('dark-switch').addEventListener('click', (e) => {
      const nowDark = document.documentElement.getAttribute('data-theme') !== 'dark';
      document.documentElement.setAttribute('data-theme', nowDark ? 'dark' : 'light');
      localStorage.setItem('sc-theme', nowDark ? 'dark' : 'light');
      e.currentTarget.classList.toggle('on', nowDark);
      const themeBtn = document.getElementById('theme-btn');
      themeBtn.innerHTML = `<i data-lucide="${nowDark ? 'sun' : 'moon'}"></i>`;
      lucide.createIcons();
    });

    root.querySelectorAll('[data-toggle]').forEach(sw => sw.addEventListener('click', () => sw.classList.toggle('on')));
  },
};
