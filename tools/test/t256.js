// v256: «Aggiorna tutti i giochi» — salta locandine/schermate scelte dall'utente, rinfresca le altre, pausa e ripresa
const {chromium} = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const ctx = await b.newContext({viewport: {width: 412, height: 915}, isMobile: true, hasTouch: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e=> errs.push(e.message));
  await ctx.route('**/*', r=> r.request().url().startsWith('file:') ? r.continue() : r.abort());
  await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html');
  await p.waitForTimeout(7000);
  const res = await p.evaluate(async()=>{
    const out = {}; const ids = GAMES.slice(0, 6).map(g=> g.id);
    localStorage.setItem('jrpg_media_lock', JSON.stringify({[ids[0]]: {cover: 1}, [ids[1]]: {shots: ['https://x/1.jpg']}}));
    USER_COVERS[String(ids[2])] = 'https://manuale/cover.jpg';                // locandina messa da te (senza auto)
    USER_COVER_AUTO = {};
    const calls = {upd: [], find: [], save: [], rawg: [], lr: []};
    window.updatePlusQuiet = async g=>{ calls.upd.push(g.id); return {ok: g.id !== ids[3]}; };       // il 4° «non risponde»
    XCOVER.find = async g=>({url: 'https://steam/' + g.id + '.jpg', source: 'Steam'});
    const origSave = XCOVER.save; XCOVER.save = async function(g, url, o){ const r = await origSave.call(this, g, url, o); calls.save.push([g.id, r]); return r; };
    window.rtRawgShots = async g=>{ calls.rawg.push(g.id); return ['a', 'b']; };
    XCOVER.lrShots = async g=>{ calls.lr.push(g.id); return []; };
    // limito il giro ai primi 6 giochi: riduco GAMES solo per l'ordine
    const all = GAMES.slice(); GAMES.length = 6;
    rtUpdateAll.open();
    document.querySelector('#uaNew').click();
    const t0 = Date.now(); while(rtUpdateAll.running() && Date.now() - t0 < 60000) await new Promise(r=> setTimeout(r, 300));
    GAMES.length = 0; all.forEach(g=> GAMES.push(g));
    const s = JSON.parse(localStorage.getItem('rt_upall'));
    out.ids = ids; out.calls = calls; out.state = {done: s.done.length, fail: s.fail, cv: s.cv, sh: s.sh, skCv: s.skCv, skSh: s.skSh};
    out.txt = document.querySelector('#uaTxt').textContent; out.btn = [...document.querySelectorAll('#uaBtns button')].map(x=> x.textContent);
    out.manualCoverKept = USER_COVERS[String(ids[2])]; out.lockedCoverChanged = USER_COVERS[String(ids[0])] || null;
    out.userCoverManual = [userCoverManual(GAMES[2]), userCoverManual(GAMES[4])];
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  const ok = res.state.done === 6 && res.state.fail.length === 1 && res.state.skCv === 2 && res.state.skSh === 1
    && res.calls.save.length === 4 && !res.calls.rawg.includes(res.ids[1]) && res.manualCoverKept === 'https://manuale/cover.jpg' && !res.lockedCoverChanged;
  console.log(ok ? 'OK' : 'ERRORE', 'errori pagina:', errs);
  await b.close(); process.exit(ok && !errs.length ? 0 : 1);
})();
