/* ===== Timeline production settings — edit ONLY this file =====
   GitHub Pages is static hosting: it cannot run server.js. Use ONE of:
   A) Supabase (recommended, free): run supabase-setup.sql, then fill in the two values below.
   B) Your own hosted Node server (Render/Railway/etc. running server.js): set API_BASE to its https URL.
   Leave all empty only for local use (node server.js on http://localhost:3000). */
window.TL_CONFIG = {
  SUPABASE_URL: '',   // e.g. https://abcdxyz.supabase.co
  SUPABASE_KEY: '',   // the "anon public" key (safe to publish)
  API_BASE: ''        // e.g. https://my-timeline.onrender.com   (only if not using Supabase)
};
