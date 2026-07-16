/* ==========================================================================
   config.js — single place for values you'll change per environment.
   ========================================================================== */
window.CONFIG = {
  // Local Flask backend for browser testing.
  // On a real phone, use your computer's LAN IP, e.g. http://192.168.209.174:5000.
  // If running on the Android emulator, use http://10.0.2.2:5000 instead.
  API_BASE_URL: 'http://localhost:5000',

  // Google Maps Static API key — used for the lightweight map preview images
  // on Parking/Traffic/Nearby. Get one at https://console.cloud.google.com
  GOOGLE_MAPS_API_KEY: 'REPLACE_WITH_YOUR_GOOGLE_MAPS_API_KEY',
};
