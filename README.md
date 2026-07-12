# Smart City Services

A citizen portal for city services — reporting issues, an AI assistant,
waste classification, parking, transport, traffic, emergency access, and
more — built as a web app (HTML/CSS/JS + Firebase) with a Python backend,
wrapped into a native Android app via Capacitor.

```
smartcity-services/
├── frontend/www/        the actual app (HTML/CSS/JS) — this is what runs
│                         in the browser and inside the Android WebView
├── backend/              Python (Flask) API for AI chat + waste classification
├── capacitor.config.json Android wrapper config
├── package.json          npm scripts for the Capacitor/Android side
└── FIREBASE_SETUP.md      Firebase project setup (auth, Firestore, storage)
```

## What's real vs. what's a placeholder

Being upfront so nothing surprises you in a demo:

| Feature | Status |
|---|---|
| Auth (email/password, register, forgot password) | Fully working via Firebase Auth |
| Google Sign-In | Wired up, needs native config once in Android Studio (see FIREBASE_SETUP.md) |
| Complaint system (photo, GPS, priority, tracking) | Fully working — Firestore + Storage |
| Home dashboard, service grid, dark/light mode | Fully working |
| Weather | Real data via free Open-Meteo API (through the Python backend) |
| AI chatbot | Rule-based answers for the topics the app promises; optional Gemini fallback if you add an API key |
| Waste classifier | Real upload/analyze/display flow, but the classification itself is a color heuristic, not a trained model — see `backend/README.md` for how to swap in a real one |
| Parking / Transport / Traffic / Nearby | Polished UI with realistic mock data — swap in Google Places/Directions/Maps API calls to go live |
| Admin dashboard | Real Firestore reads/writes, gated by an `admins/{uid}` allowlist doc you create by hand |
| Push notifications | Not implemented — needs a Cloud Function or backend job, noted in FIREBASE_SETUP.md |

## 1. Set up Firebase

Follow `FIREBASE_SETUP.md` end to end — auth providers, Firestore rules,
Storage rules, and the sample `bills`/`notices` documents. Paste your config
into `frontend/www/js/firebase-config.js`.

## 2. Run the Python backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```
This serves on `http://localhost:5000`. Health check: `curl localhost:5000/api/health`.

## 3. Try the frontend in a browser first

Since it's plain HTML/CSS/JS, you can preview it without touching Android
Studio at all:
```bash
cd frontend/www
python -m http.server 8080
```
Open `http://localhost:8080`. (Camera/GPS work best over `https` or
`localhost`, which this satisfies.)

## 4. Wrap it for Android Studio

From the project root (not `frontend/`):
```bash
npm install
npx cap add android      # first time only — generates the android/ folder
npx cap sync android
npx cap open android      # launches Android Studio
```
In Android Studio: let Gradle sync, pick a device/emulator, hit ▶ Run.

Two things to update before running on Android:
1. **Backend URL** — the emulator can't reach `localhost` on your laptop;
   `frontend/www/js/config.js` already defaults to `10.0.2.2:5000` for that
   reason. For a real device or release build, deploy the backend (see
   `backend/README.md`) and point `API_BASE_URL` at the public URL.
2. **Google Maps key** (optional) — if you want the static map previews on
   Parking/Traffic to render real maps instead of a placeholder image, add
   a key in `frontend/www/js/config.js` (`GOOGLE_MAPS_API_KEY`).

Any time you edit files under `frontend/www/`, re-run `npx cap sync android`
before rebuilding in Android Studio — Capacitor copies the web assets into
the native project rather than reading them live.

## 5. App icon / splash (optional polish)

Capacitor's default icon/splash generator works from a single 1024×1024 PNG:
```bash
npm install @capacitor/assets --save-dev
npx capacitor-assets generate
```
Drop your logo at `resources/icon.png` and `resources/splash.png` first.

## Architecture notes

- **Routing** is a tiny hand-rolled router in `js/app.js` — no framework,
  so it's easy to read and extend. Every screen is a `window.Pages.<name>`
  object with a `render(root)` method.
- **State** lives in Firebase (Firestore/Auth/Storage) plus whatever the
  Python backend computes on the fly (weather, chat replies, waste
  classification) — there's no client-side database, so the app is
  simple to reason about but does need connectivity for anything beyond
  the static UI.
- **Styling** is one file, `css/app.css`, using CSS custom properties for
  the whole light/dark theme — flip `data-theme` on `<html>` and every
  component follows.
