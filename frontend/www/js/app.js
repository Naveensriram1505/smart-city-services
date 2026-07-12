/* ==========================================================================
   app.js — shell controller. Each page module lives at window.Pages.<name>
   with a render(root) function; app.navigate() swaps #main-content.
   ========================================================================== */

window.app = (function () {
  const state = { user: null, route: 'home', history: [] };

  const TITLES = {
    home: '', chatbot: 'AI Assistant', complaintList: 'My complaints', newComplaint: 'Report an issue',
    waste: 'Waste classifier', parking: 'Smart parking', transport: 'Public transport', traffic: 'Traffic',
    emergency: 'Emergency', nearby: 'Nearby services', news: 'City news', profile: 'Profile',
    settings: 'Settings', admin: 'Admin dashboard',
  };
  const NAV_ROUTES = { home: 'nav-home', chatbot: 'nav-chatbot', complaintList: 'nav-complaint', emergency: 'nav-emergency', profile: 'nav-profile' };

  function boot() {
    lucide.createIcons();
    initTheme();

    document.getElementById('theme-btn').addEventListener('click', toggleTheme);

    firebase.auth().onAuthStateChanged((user) => {
      if (user) { state.user = user; onSignedIn(user); }
      else showAuth('login');
    });
  }

  /* --------------------------------- theme --------------------------------- */
  function initTheme() {
    const saved = localStorage.getItem('sc-theme');
    const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(saved || (preferDark ? 'dark' : 'light'));
  }
  function setTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('sc-theme', mode);
    const btn = document.getElementById('theme-btn');
    if (btn) { btn.innerHTML = `<i data-lucide="${mode === 'dark' ? 'sun' : 'moon'}"></i>`; lucide.createIcons(); }
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    setTheme(cur === 'dark' ? 'light' : 'dark');
  }

  /* --------------------------------- auth screens --------------------------- */
  function showAuth(mode) {
    document.getElementById('splash-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
    window.Pages.auth.render(document.getElementById('auth-root'), mode);
  }

  function onSignedIn(user) {
    document.getElementById('splash-screen').classList.add('hidden');
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');

    const name = user.displayName || user.email || 'Citizen';
    const initials = name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('avatar-initials').textContent = initials || 'SC';

    state.history = [];
    navigate('home', true);
  }

  /* --------------------------------- router --------------------------------- */
  function navigate(route, replace) {
    if (!window.Pages[route]) return console.warn('Unknown route:', route);
    if (!replace) state.history.push(state.route);
    state.route = route;

    document.getElementById('page-title').textContent = TITLES[route] ?? '';
    document.getElementById('brand').classList.toggle('hidden', route !== 'home');
    document.getElementById('back-btn').classList.toggle('hidden', route === 'home');

    Object.values(NAV_ROUTES).forEach(id => document.getElementById(id)?.classList.remove('active'));
    if (NAV_ROUTES[route]) document.getElementById(NAV_ROUTES[route])?.classList.add('active');

    const main = document.getElementById('main-content');
    main.innerHTML = '<div class="page" id="page-root"></div>';
    window.Pages[route].render(document.getElementById('page-root'));
    main.scrollTop = 0;
    lucide.createIcons();
  }

  function goBack() {
    const prev = state.history.pop() || 'home';
    navigate(prev, true);
  }

  /* --------------------------------- toast ----------------------------------- */
  function toast(message, type = 'default', iconName) {
    const icon = iconName || (type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
    document.getElementById('toast-container').appendChild(el);
    lucide.createIcons();
    setTimeout(() => { el.style.transition = 'opacity 0.2s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 200); }, 2800);
  }

  async function signOut() { await firebase.auth().signOut(); }

  return {
    boot, navigate, goBack, toast, showAuth, signOut,
    get user() { return state.user; },
    get db() { return firebase.firestore(); },
    get storage() { return firebase.storage(); },
    apiUrl(path) { return window.CONFIG.API_BASE_URL.replace(/\/$/, '') + path; },
  };
})();

document.addEventListener('DOMContentLoaded', () => window.app.boot());
