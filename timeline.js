/* Shared by timeline.html and timeline-admin.html */
const TL = {
  API: '/api/timeline',
  LOCAL: 'timelineLocal',
  SEED: [
    ['old3', '', 'Gym meeting'],
    ['old4', '', 'Our first bike ride'],
    ['old5', '', 'Our first movie date'],
    ['seed0', '', 'The first time I came to Santhosh’s house ❤️'],
    ['old1', '2025-11-11', 'Our first phone call'],
    ['old2', '2025-11-17', 'Our first meeting at the temple'],
    ['old6', '2026-03-14', 'Ooty trip'],
    ['old7', '2026-07-03', 'Chennai trip'],
    ['old8', '2026-08-10', 'Our first kiss on the long bike ride'],
    ['old9', '2026-08-14', 'Car kiss'],
    ['seed1', '2026-08-30', 'The first time Prasithya bought a wish for me ❤️'],
    ['seed2', '2026-09-12', 'Our first honeymoon in Vallapi ❤️'],
    ['seed3', '2026-09-28', 'Our first night of separation after marriage — I was in Tiruppur, missing you'],
    ['seed4', '2026-10-16', 'Took Ammachi to the hospital, spent the night apart, and sent each other “Miss you” messages ❤️'],
    ['seed5', '2026-10-26', 'The day Santhosh stood up for me during a fight with my mother']
  ].map(([id, date, text]) => ({ id, date, text })),
  esc: s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])),
  fmt(d) {
    if (!d) return 'Where it all began';
    const [y, m, day] = d.split('-').map(Number);
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] + ' ' + day + ', ' + y;
  },
  local() { try { return JSON.parse(localStorage.getItem(TL.LOCAL) || '[]'); } catch { return []; } },
  saveLocal(item) { const a = TL.local(); a.push(item); try { localStorage.setItem(TL.LOCAL, JSON.stringify(a)); } catch {} },
  sort: a => a.slice().sort((x, y) => (x.date || '').localeCompare(y.date || '')),
  async load() {   /* server items + anything saved only on this device, so nothing disappears */
    const local = TL.local();
    try {
      const r = await fetch(TL.API); if (!r.ok) throw 0;
      const server = (await r.json()).items || [];
      const extra = local.filter(l => !server.some(s => s.date === l.date && s.text === l.text));
      return { items: TL.sort(server.concat(extra)), online: true, localCount: extra.length };
    } catch { return { items: TL.sort(TL.SEED.concat(local)), online: false, localCount: local.length }; }
  },
  async add(date, text, key) {
    try {
      const r = await fetch(TL.API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': key || '' }, body: JSON.stringify({ date, text }) });
      if (r.status === 401) return { ok: false, msg: 'Wrong admin key.' };
      if (!r.ok) return { ok: false, msg: (await r.json()).error || 'Could not save.' };
      return { ok: true, msg: 'Added to the timeline ✓' };
    } catch {
      TL.saveLocal({ id: 'local' + Date.now(), date, text });
      return { ok: true, msg: 'API not reachable — saved on this device only.' };
    }
  },
  setLocal(a) { try { localStorage.setItem(TL.LOCAL, JSON.stringify(a)); } catch {} },
  async update(id, date, text, key) {
    if (String(id).startsWith('local')) {
      const a = TL.local(), it = a.find(x => x.id === id); if (!it) return { ok: false, msg: 'Not found.' };
      it.date = date; it.text = text; TL.setLocal(a); return { ok: true, msg: 'Updated on this device ✓' };
    }
    try {
      const r = await fetch(TL.API + '?id=' + encodeURIComponent(id), { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-key': key || '' }, body: JSON.stringify({ date, text }) });
      if (r.status === 401) return { ok: false, msg: 'Wrong admin key.' };
      if (!r.ok) return { ok: false, msg: (await r.json()).error || 'Could not update.' };
      return { ok: true, msg: 'Updated ✓' };
    } catch { return { ok: false, msg: 'API not reachable — start server.js to edit.' }; }
  },
  async remove(id, key) {
    if (String(id).startsWith('local')) { TL.setLocal(TL.local().filter(x => x.id !== id)); return 'Deleted.'; }
    try {
      const r = await fetch(TL.API + '?id=' + encodeURIComponent(id), { method: 'DELETE', headers: { 'x-admin-key': key || '' } });
      return r.ok ? 'Deleted.' : (r.status === 401 ? 'Wrong admin key.' : 'Could not delete.');
    } catch { return 'API not reachable.'; }
  },
  async syncLocal(key) {   /* push device-only moments to the server */
    let rest = TL.local(), done = 0;
    for (const it of TL.local()) {
      const r = await fetch(TL.API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': key || '' }, body: JSON.stringify({ date: it.date, text: it.text }) }).catch(() => null);
      if (!r || !r.ok) return { ok: false, msg: (!r ? 'API not reachable.' : r.status === 401 ? 'Wrong admin key.' : 'Could not sync.') + ' Synced ' + done + '.' };
      rest = rest.filter(x => x.id !== it.id); TL.setLocal(rest); done++;
    }
    return { ok: true, msg: done + ' moment(s) synced to the server ✓' };
  },
  syncBanner(box, keyEl, done) {
    if (!box) return; const n = TL.local().length;
    box.innerHTML = n ? `<div class="sync-bar">${n} moment${n > 1 ? 's are' : ' is'} saved only on this device (not on the server yet). <button type="button">Sync to server</button></div>` : '';
    if (n) box.querySelector('button').onclick = async () => { const r = await TL.syncLocal(keyEl.value); alert(r.msg); done(); };
  },
  item: (i, hl) => `<li class="tl-item${hl ? ' hl' : ''}"><span class="tl-dot"></span><div class="tl-date">${TL.esc(TL.fmt(i.date))}</div><p>${TL.esc(i.text)}</p></li>`,
  MONTHS: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  NAV: [['Invitation', 'index.html'], ['Our Love Story', 'lovestory.html'], ['View Timeline', 'timeline.html'], ['Add Timeline', 'timeline-admin.html'], ['Admin', 'timeline-manage.html']],
  /* Undated moments on top, then Year (open/close) > Month (open/close) > moments. */
  group(items, openAll, hlId) {
    const li = i => TL.item(i, i.id === hlId);
    const undated = items.filter(i => !i.date), years = {};
    TL.sort(items.filter(i => i.date)).forEach(i => { const [y, m] = i.date.split('-'); ((years[y] = years[y] || {})[m] = years[y][m] || []).push(i); });
    const ys = Object.keys(years).sort(), lastY = ys[ys.length - 1];
    let h = undated.length ? '<ol class="tl tl-start">' + undated.map(li).join('') + '</ol>' : '';
    ys.forEach(y => {
      const ms = Object.keys(years[y]).sort(), lastM = ms[ms.length - 1];
      const count = ms.reduce((n, m) => n + years[y][m].length, 0);
      h += `<details class="tl-year"${openAll || y === lastY ? ' open' : ''}><summary><span>${y}</span><em>${count} moment${count > 1 ? 's' : ''}</em></summary>`;
      ms.forEach(m => {
        h += `<details class="tl-month"${openAll || (y === lastY && m === lastM) ? ' open' : ''}><summary><span>${TL.MONTHS[+m - 1]}</span><em>${years[y][m].length}</em></summary><ol class="tl">${years[y][m].map(li).join('')}</ol></details>`;
      });
      h += '</details>';
    });
    return h || '<ol class="tl"><li class="tl-item"><p>No moments yet.</p></li></ol>';
  },
  mountNav() {
    const el = document.getElementById('siteNav'); if (!el) return;
    const cur = location.pathname.split('/').pop() || 'index.html';
    el.innerHTML = '<nav class="site-nav" aria-label="Explore">' + TL.NAV.map(([t, h]) => `<a href="${h}"${h === cur ? ' aria-current="page"' : ''}>${t}</a>`).join('') + '</nav>';
  }
};
const TL_CSS = `.site-nav{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;padding:26px 16px 34px;background:#081C16}.site-nav a{padding:10px 18px;border:1px solid #C6A15B;color:#E7CE94;text-decoration:none;font:500 12.5px 'EB Garamond',serif;letter-spacing:.16em;text-transform:uppercase;transition:.25s}.site-nav a:hover,.site-nav a[aria-current]{background:#C6A15B;color:#0B0B0D}
details>summary{list-style:none;cursor:pointer}details>summary::-webkit-details-marker{display:none}
.tl-year{margin:0 0 16px;border:1px solid rgba(198,161,91,.55);border-radius:14px;background:#fffdf7;overflow:hidden}
.tl-year>summary{display:flex;align-items:center;gap:12px;padding:14px 18px;background:#3A0F1B;color:#E7CE94;font-size:26px}
.tl-year>summary em,.tl-month>summary em{margin-left:auto;font-size:13px;letter-spacing:.15em;text-transform:uppercase;font-style:normal;opacity:.85}
.tl-month{margin:12px 12px 0;border:1px solid rgba(198,161,91,.45);border-radius:10px;background:#F1E9D8}
.tl-month:last-child{margin-bottom:12px}
.tl-month>summary{display:flex;align-items:center;gap:10px;padding:11px 14px;color:#3A0F1B;font-size:20px;font-weight:500}
.tl-month>summary em{color:#8A6E3B}
.tl-month>.tl{padding:10px 14px 4px 38px}
summary::before{content:"";width:9px;height:9px;border-right:2px solid #C6A15B;border-bottom:2px solid #C6A15B;transform:rotate(-45deg);transition:transform .25s;flex:0 0 auto;margin-right:2px}
details[open]>summary::before{transform:rotate(45deg)}
.tl-month .tl-item{background:#fffdf7}
.tl-start{margin-bottom:22px}
.sync-bar{background:#fff3d6;border:1px solid #C6A15B;border-radius:10px;padding:10px 14px;margin:0 0 16px;font-size:16px;color:#3A0F1B}.sync-bar button{margin-left:8px;padding:4px 12px;border:1px solid #3A0F1B;background:#3A0F1B;color:#E7CE94;border-radius:6px;font:inherit;font-size:14px;cursor:pointer}`;
document.head.insertAdjacentHTML('beforeend', '<style>' + TL_CSS + '</style>');
TL.mountNav();
