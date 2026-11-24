/* ===== Timeline settings — the ONLY file you edit =====
   Data is saved in a Supabase SQL database through its API. No GitHub token is needed.

   One-time setup (5 minutes):
     1. supabase.com -> New project (free).
     2. SQL Editor -> New query -> paste ALL of supabase-setup.sql -> Run.
     3. Project Settings -> API: copy "Project URL" and the "anon public" key into the two lines below.
     4. Push this file to GitHub. Done — add / edit / delete now work from every device.
   The anon key is meant to be public. Visitors can only READ; changes need the admin password,
   which is checked inside the database (see supabase-setup.sql). */
window.TL_CONFIG = {
  SUPABASE_URL: '',   // e.g. https://abcdxyzcompany.supabase.co
  SUPABASE_KEY: ''    // the long "anon public" key
};
