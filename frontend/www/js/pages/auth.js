window.Pages = window.Pages || {};

window.Pages.auth = {
  mode: 'login', // login | register | forgot

  render(root, mode) {
    this.mode = mode || 'login';
    if (this.mode === 'login') return this.renderLogin(root);
    if (this.mode === 'register') return this.renderRegister(root);
    return this.renderForgot(root);
  },

  shell(inner) {
    return `
      <div class="auth-wrap">
        <div class="auth-mark">
          <div class="brand-mark"><i data-lucide="building-2"></i></div>
          <span style="font-family:var(--font-display);font-weight:800;font-size:18px;">Smart City Services</span>
        </div>
        ${inner}
      </div>`;
  },

  renderLogin(root) {
    root.innerHTML = this.shell(`
      <h1 class="auth-title">Welcome back</h1>
      <p class="auth-sub">Sign in to report issues, track requests, and reach every city service from one place.</p>
      <div class="auth-error" id="auth-error"></div>

      <div class="field"><label>Email</label><input type="email" id="f-email" placeholder="you@example.com" /></div>
      <div class="field"><label>Password</label><input type="password" id="f-password" placeholder="••••••••" /></div>
      <div style="text-align:right;margin-top:-8px;margin-bottom:18px;">
        <span class="auth-switch"><b id="go-forgot">Forgot password?</b></span>
      </div>

      <button class="btn btn-primary" id="btn-login"><i data-lucide="log-in"></i> Sign in</button>

      <div class="auth-divider">or continue with</div>
      <button class="google-btn" id="btn-google">
        <svg viewBox="0 0 48 48" width="18" height="18"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3 5.4-5.8 7.1l6.2 5.2C39.4 37.5 44 31.4 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        Continue with Google
      </button>

      <div class="auth-switch">New here? <b id="go-register">Create an account</b></div>
    `);
    lucide.createIcons();

    document.getElementById('go-forgot').addEventListener('click', () => window.app.showAuth('forgot'));
    document.getElementById('go-register').addEventListener('click', () => window.app.showAuth('register'));
    document.getElementById('btn-google').addEventListener('click', () => this.googleSignIn());

    document.getElementById('btn-login').addEventListener('click', async (e) => {
      const email = document.getElementById('f-email').value.trim();
      const password = document.getElementById('f-password').value;
      this.setError('');
      if (!email || !password) return this.setError('Enter your email and password.');
      this.loading(e.currentTarget, true, 'Signing in…');
      try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
      } catch (err) {
        this.setError(this.friendly(err));
        this.loading(e.currentTarget, false, '<i data-lucide="log-in"></i> Sign in');
      }
    });
  },

  renderRegister(root) {
    root.innerHTML = this.shell(`
      <h1 class="auth-title">Create your account</h1>
      <p class="auth-sub">Takes less than a minute — you'll use it to file reports and track city services.</p>
      <div class="auth-error" id="auth-error"></div>

      <div class="field"><label>Full name</label><input type="text" id="f-name" placeholder="Jordan Rivera" /></div>
      <div class="field"><label>Email</label><input type="email" id="f-email" placeholder="you@example.com" /></div>
      <div class="field"><label>Password</label><input type="password" id="f-password" placeholder="At least 6 characters" /></div>

      <button class="btn btn-primary" id="btn-register"><i data-lucide="user-plus"></i> Create account</button>

      <div class="auth-divider">or continue with</div>
      <button class="google-btn" id="btn-google">
        <svg viewBox="0 0 48 48" width="18" height="18"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3 5.4-5.8 7.1l6.2 5.2C39.4 37.5 44 31.4 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        Continue with Google
      </button>

      <div class="auth-switch">Already have an account? <b id="go-login">Sign in</b></div>
    `);
    lucide.createIcons();

    document.getElementById('go-login').addEventListener('click', () => window.app.showAuth('login'));
    document.getElementById('btn-google').addEventListener('click', () => this.googleSignIn());

    document.getElementById('btn-register').addEventListener('click', async (e) => {
      const name = document.getElementById('f-name').value.trim();
      const email = document.getElementById('f-email').value.trim();
      const password = document.getElementById('f-password').value;
      this.setError('');
      if (!name || !email || password.length < 6) return this.setError('Fill in every field — password needs at least 6 characters.');
      this.loading(e.currentTarget, true, 'Creating account…');
      try {
        const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });
        await firebase.firestore().collection('users').doc(cred.user.uid).set({
          name, email, createdAt: firebase.firestore.FieldValue.serverTimestamp(), role: 'citizen',
        });
      } catch (err) {
        this.setError(this.friendly(err));
        this.loading(e.currentTarget, false, '<i data-lucide="user-plus"></i> Create account');
      }
    });
  },

  renderForgot(root) {
    root.innerHTML = this.shell(`
      <h1 class="auth-title">Reset your password</h1>
      <p class="auth-sub">Enter the email on your account — we'll send a reset link.</p>
      <div class="auth-error" id="auth-error"></div>
      <div class="field"><label>Email</label><input type="email" id="f-email" placeholder="you@example.com" /></div>
      <button class="btn btn-primary" id="btn-reset"><i data-lucide="mail"></i> Send reset link</button>
      <div class="auth-switch">Remembered it? <b id="go-login">Back to sign in</b></div>
    `);
    lucide.createIcons();

    document.getElementById('go-login').addEventListener('click', () => window.app.showAuth('login'));
    document.getElementById('btn-reset').addEventListener('click', async (e) => {
      const email = document.getElementById('f-email').value.trim();
      this.setError('');
      if (!email) return this.setError('Enter your email first.');
      this.loading(e.currentTarget, true, 'Sending…');
      try {
        await firebase.auth().sendPasswordResetEmail(email);
        window.app.toast('Reset link sent — check your inbox', 'success');
        window.app.showAuth('login');
      } catch (err) {
        this.setError(this.friendly(err));
        this.loading(e.currentTarget, false, '<i data-lucide="mail"></i> Send reset link');
      }
    });
  },

  async googleSignIn() {
    // Native Google Sign-In needs the @capacitor-firebase/authentication plugin
    // (google-services.json + SHA-1 fingerprint configured in Android Studio) —
    // the plain Firebase JS SDK popup flow doesn't work reliably inside a
    // Capacitor WebView. See README "Google Sign-In" section.
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseAuthentication) {
      try {
        const { FirebaseAuthentication } = window.Capacitor.Plugins;
        const result = await FirebaseAuthentication.signInWithGoogle();
        const credential = firebase.auth.GoogleAuthProvider.credential(result.credential?.idToken);
        await firebase.auth().signInWithCredential(credential);
      } catch (err) {
        window.app.toast('Google sign-in failed: ' + err.message, 'error');
      }
    } else {
      window.app.toast('Google Sign-In needs the native plugin — works once built in Android Studio (see README).', 'default', 'info');
    }
  },

  setError(msg) {
    const box = document.getElementById('auth-error');
    if (!box) return;
    box.textContent = msg;
    box.classList.toggle('show', !!msg);
  },

  loading(btn, isLoading, label) {
    btn.disabled = isLoading;
    btn.innerHTML = isLoading ? `<i data-lucide="loader-2" style="animation:spin 0.8s linear infinite;"></i> ${label}` : label;
    lucide.createIcons();
  },

  friendly(err) {
    const map = {
      'auth/invalid-email': 'That email address doesn\'t look right.',
      'auth/user-not-found': 'No account found with that email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account already exists with that email.',
      'auth/weak-password': 'Choose a stronger password (6+ characters).',
      'auth/invalid-credential': 'Incorrect email or password.',
    };
    return map[err.code] || err.message;
  },
};
