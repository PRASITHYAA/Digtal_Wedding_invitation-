/* ===== Timeline settings — the ONLY file you edit =====
   Your timeline is stored in this GitHub repo (data/timeline.json) and shown on the live site.
   Daily use: you only type your admin PASSWORD on the admin page.

   One-time setup:
     1. Create a GitHub fine-grained token (only this repo, Contents: Read and write).
     2. Open make-key.html on your computer (double-click), enter the token + your password,
        copy the line it gives you and paste it below as GITHUB_TOKEN_ENC.
   The encrypted value is safe to publish, but choose a strong password (10+ characters). */
window.TL_CONFIG = {
  MODE: 'github',
  GITHUB_OWNER: 'PRASITHYAA',
  GITHUB_REPO: 'Digtal_Wedding_invitation-',
  GITHUB_BRANCH: '',                  // empty = the repo's default branch
  GITHUB_PATH: 'data/timeline.json',
  GITHUB_TOKEN_ENC: ''                // <- paste the value from make-key.html here
};
