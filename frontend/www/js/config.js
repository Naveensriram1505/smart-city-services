/* ==========================================================================
   config.js — single place for values you'll change per environment.
   ========================================================================== */
window.CONFIG = {
  // Local Flask backend for browser testing.
  API_BASE_URL: 'http://192.168.209.174:5000', // use local Wi-Fi IP for phone testing

  // Google Maps Static API key — used for the lightweight map preview images
  // on Parking/Traffic/Nearby. Get one at https://console.cloud.google.com
  GOOGLE_MAPS_API_KEY: 'REPLACE_WITH_YOUR_GOOGLE_MAPS_API_KEY',
};
