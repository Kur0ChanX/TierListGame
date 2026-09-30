// ---- Triple Triad 2.0 online: account, amici, stanze con codice/QR, sfide, partite in tempo reale, Custodi, classifica, novità ----
// Parla con il server in tools/triad-server (Cloudflare). Il token dell'account sta SOLO in questo telefono (jrpg_triad_acct): non finisce mai nei backup né nel Gist.
(function(){
  'use strict';
  const TT = window.TT; if(!TT || TT.onlineLoaded) return; TT.onlineLoaded = true;
  const {P, LS, $, $$, esc, sleep, cardHtml, V} = TT;
  const AK = 'jrpg_triad_acct', SK = 'jrpg_triad_server', SITE = 'https://kur0chanx.github.io/TierListGame/';
  const AV = ['🦝', '🐱', '🐺', '🦊', '🐸', '🐙', '🦄', '🐲', '🦉', '🐧', '🐼', '🦁'];
  const avOf = id=> AV[TT.hash(String(id)) % AV.length];
  let acct = LS.get(AK, null), me = null, cfg = null, ws = null, want = false, retry = 0, wsTimer = 0, pingT = 0, wsOK = false, board = null, cur = null, waiting = null, lobbyAt = 0, endShown = '';
  const server = ()=> String(LS.get(SK, '') || window.TRIAD_SERVER || '').replace(/\/+$/, '');
  TT.server = server;
  const RANK_EM = {'Recluta': '🔰', 'Cadetto': '🥉', 'SeeD': '🥈', 'SeeD Elite': '🥇', 'Comandante': '💎', 'Maestro Triad': '👑', 'Custode': '🛡️'};

  // ---------------------------------------------------------------- server
  async function api(method, path, body, opt){
    opt = opt || {}; const base = server(); if(!base) throw Object.assign(new Error('Server non impostato'), {nosrv: true});
    const ctl = new AbortController(), to = setTimeout(()=> ctl.abort(), opt.timeout || 12000); let r;
    try{ r = await fetch(base + path, {method, headers: Object.assign({'content-type': 'application/json'}, acct ? {authorization: 'Bearer ' + acct.token} : {}), body: body ? JSON.stringify(body) : undefined, signal: ctl.signal}); }
    catch(e){ throw Object.assign(new Error('Non riesco a raggiungere il server. Controlla la connessione.'), {net: true}); }
    finally{ clearTimeout(to); }
    let d = {}; try{ d = await r.json(); }catch(e){}
    if(!r.ok){ const err = new Error(d.error || ('Errore ' + r.status)); err.status = r.status; err.code = d.code; if(r.status === 401 && acct && !opt.quiet) authLost(); throw err; }
    return d;
  }
  TT.api = api;
  function authLost(){
    if(!acct) return; LS.set(AK, null); acct = null; me = null; disconnectWS(); if(board){ board.destroy(); board = null; } cur = null;
    if(TT.root() && TT.root().classList.contains('show')){ TT.toast('Questo account è stato aperto su un altro telefono. Usa il codice di recupero per riprenderlo qui.', 5000); TT.go(welcomePage); }
  }
  const errToast = e=> TT.toast(e && e.message || 'Qualcosa non ha funzionato');

  // ---------------------------------------------------------------- tempo reale (WebSocket)
  function connectWS(){
    want = true; if(!acct || !server() || (ws && ws.readyState < 2)) return;
    try{ ws = new WebSocket(server().replace(/^http/, 'ws') + '/ws?token=' + encodeURIComponent(acct.token)); }catch(e){ return; }
    ws.onopen = ()=>{ wsOK = true; retry = 0; clearInterval(pingT); pingT = setInterval(()=>{ try{ ws.send('{"t":"ping"}'); }catch(e){} }, 25000); };
    ws.onmessage = e=>{ try{ onPush(JSON.parse(e.data)); }catch(x){ console.log('push', x); } };
    ws.onclose = ()=>{ wsOK = false; clearInterval(pingT); if(want && acct) wsTimer = setTimeout(connectWS, Math.min(15000, 1200 * (++retry))); };
    ws.onerror = ()=>{};
  }
  function disconnectWS(){ want = false; clearTimeout(wsTimer); clearInterval(pingT); try{ ws && ws.close(); }catch(e){} ws = null; wsOK = false; }
  TT.onOnlineLeave = disconnectWS;
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible' && want && acct){ connectWS(); if(cur && cur.status !== 'done') syncMatch(); } });

  function onPush(m){
    if(m.t === 'hello'){ me = m.me; badges(); if(m.me.match && !board) resumeMatch(m.me.match); return; }
    if(m.t === 'news'){ if(me){ me.news = (me.news || 0) + 1; } newsToast(m.item); badges(); return; }
    if(m.t === 'challenge'){ if(board && cur && cur.status === 'active') TT.toast('🎴 ' + m.challenge.from.nick + ' ti sfida! Lo trovi nelle Novità.'); else showChallenge(m.challenge); return; }
    if(m.t === 'challenge_end'){ if(waiting && waiting.id === m.id){ waiting = null; TT.toast(m.reason === 'declined' ? 'Sfida rifiutata' : 'La stanza è scaduta'); TT.back(); } return; }
    if(m.t === 'match'){ const v = m.match; if(cur && cur.id === v.id) handleView(v, m.events); else openMatch(v, m.events); return; }
    if(m.t === 'move'){ if(cur && cur.id === m.id) handleView(m.match, m.events); return; }
    if(m.t === 'emote'){ if(board && cur && cur.id === m.match) board.emote(m.from, m.e); return; }
    if(m.t === 'presence'){ if(m.online) TT.toast(esc(m.nick) + ' è online', 1800); return; }
    if(m.t === 'kick'){ if(m.reason === 'other_device') authLost(); return; }
  }
  function newsToast(it){
    const c = it.data && it.data.cid && TT.CARD[it.data.cid] ? TT.CARD[it.data.cid].name : '';
    const map = {friend_req: `👋 ${it.data.nick} ti ha chiesto l'amicizia`, friend_ok: `🤝 ${it.data.nick} è ora tuo amico`, challenge: `🎴 ${it.data.from} ti sfida!`, stolen: `⚠️ ${it.data.by} ti ha rubato ${c}!`, won: `🏆 Hai preso ${c} a ${it.data.from}`, boss: `👑 Ricompensa del Custode: ${c}`, refill: '🎁 Ti ho dato carte comuni per poter giocare', level: `⭐ Livello ${it.data.lvl}! +${it.data.coins} 🪙${it.data.ticket ? ' e una busta in regalo' : ''}`, ach: `🏅 Traguardo: ${it.data.name} (+${it.data.coins} 🪙)`, set: `🗂️ Collezione completata: ${it.data.name}`};
    if(map[it.kind]){ TT.toast(map[it.kind], 3500); if(it.kind === 'stolen'){ TT.snd('steal'); TT.vib([80, 60, 80]); } else if(it.kind === 'won' || it.kind === 'boss') TT.snd('coin'); }
  }
  function badges(){ const b = $('#ttOnBd'); if(b && me){ const n = (me.news || 0) + (me.requests || 0); b.style.display = n ? '' : 'none'; b.textContent = n; } const l = $('#lbNews'); if(l && me){ l.style.display = me.news ? '' : 'none'; l.textContent = me.news; } const f = $('#lbFr'); if(f && me){ f.style.display = me.requests ? '' : 'none'; f.textContent = me.requests; } }
  TT.onlineBadge = async function(){ if(!acct || !server()) return; try{ me = await api('GET', '/api/me', null, {quiet: true, timeout: 6000}); badges(); }catch(e){} };
  window.TT_ONLINE_BADGE = TT.onlineBadge;

  // ---------------------------------------------------------------- ingresso
  TT.online = async function(){
    if(!server()) return serverPage();
    if(!acct) return welcomePage();
    if(!me || Date.now() - lobbyAt > 20000){
      TT.loading('Mi collego al server…');
      try{ me = await api('GET', '/api/me'); }catch(e){
        if(e.status === 401) return;
        return TT.screen('Online', `<div class="tt2-load"><div>😕<br>${esc(e.message)}<br><br><button class="tt2-btn pri" id="ttRetry">Riprova</button> <button class="tt2-btn" id="ttSrv">Server</button></div></div>`, {back: true}), $('#ttRetry').addEventListener('click', ()=> TT.online()), $('#ttSrv').addEventListener('click', serverPage);
      }
    }
    lobbyAt = Date.now(); connectWS(); if(!TT.onLeave) TT.onLeave = ()=>{ disconnectWS(); if(board){ board.destroy(); board = null; } cur = null; };
    if(TT.invite){ const inv = TT.invite; TT.invite = null; setTimeout(()=> handleInvite(inv), 250); }
    if(me.match && !board && !cur) resumeMatch(me.match);
    lobby(); loadCfg();
  };
  async function loadCfg(){ if(cfg) return cfg; try{ cfg = await api('GET', '/api/config', null, {quiet: true}); }catch(e){} return cfg; }

  function serverPage(){
    TT.screen('Server online', `<p>Per giocare online serve il server del Triple Triad (gratuito, su Cloudflare). ${window.TRIAD_SERVER ? '' : 'Non è ancora collegato a questa app.'}</p>
      <div class="tt2-box"><b>Indirizzo del server</b><input type="text" id="svIn" placeholder="https://frugu-triad.tuonome.workers.dev" value="${esc(LS.get(SK, '') || '')}" autocapitalize="off" autocorrect="off" spellcheck="false"><div class="tt2-row" style="margin-top:8px"><button class="tt2-btn pri" id="svSave">Salva e prova</button>${LS.get(SK, '') ? '<button class="tt2-btn" id="svDef">Usa quello predefinito</button>' : ''}</div><div class="mut" id="svMsg" style="margin-top:6px"></div></div>
      <p class="mut">Se te l'ha dato un amico o l'hai ricevuto con un invito, incollalo qui. Di solito non serve: l'app lo trova da sola.</p>`);
    $('#svSave').addEventListener('click', async ()=>{
      let u = $('#svIn').value.trim().replace(/\/+$/, ''); if(!/^https?:\/\//.test(u)) u = 'https://' + u;
      $('#svMsg').textContent = 'Provo…';
      try{ const r = await fetch(u + '/api/ping'); const d = await r.json(); if(d.service !== 'frugu-triad') throw 0; LS.set(SK, u); $('#svMsg').textContent = '✅ Collegato!'; setTimeout(()=> TT.replaceTop(TT.online), 500); }catch(e){ $('#svMsg').textContent = '❌ Non risponde: controlla l\'indirizzo'; }
    });
    const d = $('#svDef'); if(d) d.addEventListener('click', ()=>{ LS.set(SK, ''); serverPage(); });
  }

  // ---------------------------------------------------------------- account
  function welcomePage(){
    TT.screen('Il tuo account', `<div class="tt2-hero"><div style="font-size:3rem">🦝</div><div class="tt2-title" style="font-size:1.25rem">Entra nel Club</div></div>
      <p>Per sfidare i tuoi amici ti serve un <b>account tutto tuo</b>. È legato a questo telefono e le carte sono solo tue: non si regalano e non si comprano. <b>Si vincono</b>, battendo i Custodi o rubandole agli avversari!</p>
      <div class="tt2-box"><b>Scegli il tuo nome</b><input type="text" id="acNick" maxlength="16" placeholder="Il tuo nome (3-16 lettere)" autocapitalize="off" autocorrect="off" spellcheck="false"><div class="mut" style="margin-top:6px" id="acMsg">Lo vedranno tutti. Non si può cambiare.</div><button class="tt2-btn pri w" id="acGo" style="margin-top:10px">Crea il mio account</button></div>
      <div class="tt2-row c"><button class="tt2-btn" id="acRec">Ho già un account (recupero)</button></div>`);
    $('#acGo').addEventListener('click', async ()=>{
      const nick = $('#acNick').value.trim(); if(nick.length < 3){ $('#acMsg').textContent = 'Il nome è troppo corto'; return; }
      $('#acGo').disabled = true; $('#acMsg').textContent = 'Creo l\'account…';
      try{ const d = await api('POST', '/api/register', {nick}, {quiet: true}); acct = {token: d.token, id: d.me.id, nick: d.me.nick}; LS.set(AK, acct); me = d.me; recoveryPage(d.recovery); }
      catch(e){ $('#acGo').disabled = false; $('#acMsg').textContent = e.message; }
    });
    $('#acRec').addEventListener('click', ()=> TT.go(recoverPage));
  }
  function recoveryPage(code){
    TT.screen('Codice di recupero', `<div class="tt2-hero"><div style="font-size:2.6rem">🔑</div></div><p><b>Salvalo adesso!</b> È l'unico modo per riprendere il tuo account se cambi telefono o perdi i dati. Non lo rivedrai più.</p><div class="tt2-rec" id="recCode">${esc(code)}</div>
      <div class="tt2-row c"><button class="tt2-btn" id="recCopy">📋 Copia</button>${navigator.share ? '<button class="tt2-btn" id="recShare">↗ Condividi</button>' : ''}</div>
      <label class="chk" style="margin-top:12px"><input type="checkbox" id="recOk"> Ho salvato il codice in un posto sicuro</label><button class="tt2-btn pri w" id="recGo" disabled>Continua</button>`, {back: false});
    $('#recOk').addEventListener('change', e=> $('#recGo').disabled = !e.target.checked);
    $('#recCopy').addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(code); TT.toast('Copiato!'); }catch(e){ TT.toast('Tieni premuto sul codice per copiarlo'); } });
    const sh = $('#recShare'); if(sh) sh.addEventListener('click', ()=> navigator.share({title: 'Codice di recupero Triple Triad', text: 'Il mio codice di recupero: ' + code}).catch(()=>{}));
    $('#recGo').addEventListener('click', ()=>{ TT.replaceTop(TT.online); });
  }
  function recoverPage(){
    TT.screen('Recupera l\'account', `<p>Scrivi il nome e il codice di recupero che ti sono stati dati alla creazione. L'account passerà a questo telefono e sull'altro verrà scollegato.</p><div class="tt2-box"><input type="text" id="rcNick" placeholder="Il tuo nome" autocapitalize="off" autocorrect="off"><input type="text" id="rcCode" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" style="margin-top:8px;text-transform:uppercase" autocapitalize="characters" autocorrect="off" spellcheck="false"><div class="mut" id="rcMsg" style="margin-top:6px"></div><button class="tt2-btn pri w" id="rcGo" style="margin-top:10px">Recupera</button></div>`);
    $('#rcGo').addEventListener('click', async ()=>{
      $('#rcGo').disabled = true; $('#rcMsg').textContent = 'Controllo…';
      try{ const d = await api('POST', '/api/recover', {nick: $('#rcNick').value, recovery: $('#rcCode').value}, {quiet: true}); acct = {token: d.token, id: d.me.id, nick: d.me.nick}; LS.set(AK, acct); me = d.me; TT.toast('Bentornato, ' + d.me.nick + '!'); TT.replaceTop(TT.online); }
      catch(e){ $('#rcGo').disabled = false; $('#rcMsg').textContent = e.message; }
    });
  }

  // ---------------------------------------------------------------- sala online
  function rankChip(r){ return `<span class="tt2-chip t">${RANK_EM[r] || ''} ${esc(r)}</span>`; }
  const lvRw = L=> ({coins: 40 + 6 * L, ticket: L % 25 === 0 ? 'leg' : L % 10 === 0 ? 'epica' : L % 5 === 0 ? 'rara' : null});
  const TK = {base: 'Busta Base', rara: 'Busta Rara', epica: 'Busta Epica', leg: 'Busta Leggendaria'};
  const tkName = k=> TK[k] || (String(k).startsWith('exp:') ? 'Busta ' + ((TT.SETS.find(x=> 'exp:' + x.id === k) || {}).name || 'Espansione') : k);
  const tkChips = t=> Object.keys(t || {}).filter(k=> t[k] > 0).map(k=> `<span class="c">🎟️ ${esc(tkName(k))} ×${t[k]}</span>`).join('');
  function curHtml(m){ return `<div class="tt2-cur"><span class="c">🪙 ${m.coins}</span><span class="c">✨ ${m.dust} polvere</span>${tkChips(m.tickets)}</div>`; }
  function lvHtml(m){ const x = m.xp || {cur: 0, need: 100}; return `<div class="tt2-lv" id="lbLv"><b>Lv ${m.level}</b><div class="tt2-bar"><i style="width:${Math.round(x.cur / x.need * 100)}%"></i></div><small>${x.cur}/${x.need} XP</small></div>`; }
  function levelModal(){
    const L = me.level, rows = []; for(let l = L + 1; l <= L + 8; l++){ const r = lvRw(l); rows.push(`<div class="tt2-item" style="cursor:default"><div class="av" style="font-size:1rem;font-weight:900">${l}</div><div class="tx"><b>Livello ${l}</b><small>🪙 ${r.coins}${r.ticket ? ' · 🎟️ ' + esc(TK[r.ticket]) : ''}</small></div></div>`); }
    TT.modal(`<h3 style="margin-top:0">Livello ${L}</h3><p class="mut">Ogni partita, missione e busta dà XP. Ad ogni livello ricevi monete, e ogni 5, 10 e 25 livelli una busta in regalo!</p><div class="tt2-list">${rows.join('')}</div><div class="tt2-row c" style="margin-top:10px"><button class="tt2-btn pri" data-mclose>Ok</button></div>`);
  }
  function lobby(){
    if(!me) return;
    const dailyBtn = me.daily && me.daily.ready ? `<button class="tt2-btn gold w" id="lbDaily">🎁 Ritira la ricompensa di oggi</button>` : `<div class="mut" style="text-align:center">Prossima ricompensa tra ${Math.max(1, Math.ceil(((me.daily ? me.daily.nextAt : 0) - Date.now()) / 3600000))} ore · serie ${me.daily ? me.daily.n : 0}</div>`;
    TT.screen('Online', `
      <div class="tt2-box" style="display:flex;gap:12px;align-items:center"><div class="tt2-item" style="width:auto;padding:0;background:none;border:0"><div class="av" style="width:58px;height:58px;font-size:1.9rem">${avOf(me.id)}</div></div><div style="flex:1;min-width:0"><b style="font-size:1.1rem">${esc(me.nick)}</b><div class="tt2-row" style="margin:4px 0">${rankChip(me.rank)}<span class="tt2-chip r">ELO ${me.elo}</span></div><div class="mut">${me.wins}V ${me.losses}S ${me.draws}P · serie ${me.streak} · ${me.cards} carte</div></div></div>
      ${me.event && me.event.mul > 1 ? `<div class="tt2-event">🎉 ${esc(me.event.name)}</div>` : ''}${curHtml(me)}${lvHtml(me)}
      ${me.match ? `<button class="tt2-btn red w" id="lbResume" style="margin-bottom:8px">▶ Riprendi la partita in corso</button>` : ''}
      ${dailyBtn}
      <div class="tt2-menu">
        <button class="tt2-tile big" data-a="friends"><span class="ic">👥</span><b>Sfida un amico</b><small>Amici, richieste e stanze con codice o QR</small><span class="bd" id="lbFr" style="display:${me.requests ? '' : 'none'}">${me.requests || 0}</span></button>
        <button class="tt2-tile" data-a="shop"><span class="ic">🛍️</span><b>Negozio buste</b><small>Apri le buste: carte rare e foil!</small></button>
        <button class="tt2-tile" data-a="mis"><span class="ic">🎯</span><b>Missioni</b><small>Ogni giorno nuovi premi</small><span class="bd" style="display:${me.missions ? '' : 'none'}">${me.missions || 0}</span></button>
        <button class="tt2-tile" data-a="room"><span class="ic">🚪</span><b>Crea stanza</b><small>Codice e QR da far leggere</small></button>
        <button class="tt2-tile" data-a="join"><span class="ic">🔑</span><b>Entra con codice</b><small>Hai un codice stanza?</small></button>
        <button class="tt2-tile" data-a="boss"><span class="ic">👑</span><b>Custodi</b><small>10 sfide per carte forti</small></button>
        <button class="tt2-tile" data-a="cards"><span class="ic">📚</span><b>Le mie carte</b><small>${me.cards} carte · con le espansioni</small></button>
        <button class="tt2-tile" data-a="sets"><span class="ic">🗂️</span><b>Collezioni</b><small>Completa i set e vinci</small></button>
        <button class="tt2-tile" data-a="work"><span class="ic">⚗️</span><b>Officina</b><small>Smonta le doppie, crea le mancanti</small></button>
        <button class="tt2-tile" data-a="ach"><span class="ic">🏅</span><b>Traguardi</b><small>Medaglie e premi</small></button>
        <button class="tt2-tile" data-a="top"><span class="ic">🏆</span><b>Classifica</b><small>ELO e collezioni</small></button>
        <button class="tt2-tile" data-a="news"><span class="ic">📰</span><b>Novità</b><small>Furti, vittorie, sfide</small><span class="bd" id="lbNews" style="display:${me.news ? '' : 'none'}">${me.news || 0}</span></button>
        <button class="tt2-tile" data-a="acct"><span class="ic">⚙️</span><b>Account</b><small>Codice amico e recupero</small></button>
      </div>`);
    const GO = {friends: friendsPage, shop: shopPage, mis: missionsPage, join: joinPage, boss: bossPage, cards: cardsPage, sets: setsPage, work: workshopPage, ach: achPage, top: topPage, news: newsPage, acct: acctPage};
    $$('[data-a]').forEach(b=> b.addEventListener('click', ()=>{ TT.snd('click'); const a = b.dataset.a; if(a === 'room') TT.go(()=> challengeSetup({})); else TT.go(GO[a]); }));
    const lv = $('#lbLv'); if(lv) lv.addEventListener('click', levelModal);
    const d = $('#lbDaily'); if(d) d.addEventListener('click', async ()=>{ d.disabled = true; try{ const r = await api('POST', '/api/daily'); TT.snd('coin'); me.daily = {ready: false, nextAt: Date.now() + 20 * 3600000, n: r.streak}; me = await api('GET', '/api/me'); lobby(); showNewCard(r.card, 'Ricompensa di oggi', 'Serie: ' + r.streak + (r.streak % 7 === 0 ? ' 🔥 giorno 7: busta in regalo!' : '') + (r.gain ? ' · +' + r.gain.coins + ' 🪙' : '')); }catch(e){ errToast(e); d.disabled = false; } });
    const r = $('#lbResume'); if(r) r.addEventListener('click', ()=> resumeMatch(me.match));
  }
  function showNewCard(c, title, sub){
    if(!c){ TT.toast('Nessuna carta disponibile ora'); return; }
    const m = TT.modal(`<div style="text-align:center"><h3 style="margin-top:0">${esc(title)}</h3><div class="tt2-big">${cardHtml(c.cid, {foil: c.foil})}</div><b>${esc(TT.CARD[c.cid].name)}</b><div class="mut">${TT.RARN[TT.rarKey(TT.CARD[c.cid].lv)]} · livello ${TT.CARD[c.cid].lv}</div>${sub ? `<p class="mut">${esc(sub)}</p>` : ''}<button class="tt2-btn pri" data-mclose>Fantastico!</button></div>`, {center: true});
    return m;
  }

  // ---------------------------------------------------------------- premi, negozio, buste, missioni, collezioni, traguardi, officina
  const RCOL = {c: '#a3a8ba', u: '#4ade80', r: '#60a5fa', e: '#c084fc', l: '#fbbf24', m: '#ff6bd0'};
  function gainText(g){ if(!g) return ''; const p = []; if(g.coins) p.push('+' + g.coins + ' 🪙'); if(g.xp) p.push('+' + g.xp + ' XP'); if(g.dust) p.push('+' + g.dust + ' ✨'); if(g.ticket) p.push('🎟️ ' + tkName(g.ticket)); (g.levels || []).forEach(l=> p.push('⭐ Livello ' + l.lvl + '!' + (l.ticket ? ' 🎟️ ' + tkName(l.ticket) : ''))); return p.join(' · '); }
  function gainModal(title, g){
    TT.snd('coin'); const lv = g && g.levels && g.levels.length;
    TT.modal(`<div style="text-align:center"><div style="font-size:2.4rem">${lv ? '⭐' : '🎁'}</div><h3 style="margin:2px 0">${esc(title)}</h3><p style="font-size:1.1rem;font-weight:800;line-height:1.7">${gainText(g) || 'Fatto!'}</p><button class="tt2-btn pri" data-mclose>Grande!</button></div>`, {center: true});
  }
  const packEmoji = t=> ({base: '🎴', rara: '💎', epica: '🔮', leg: '👑'})[t] || ((TT.SETS.find(x=> 'exp:' + x.id === t) || {}).emoji || '🎁');
  async function shopPage(){
    TT.loading('Apro il negozio…');
    let sh; try{ sh = await api('GET', '/api/shop'); }catch(e){ errToast(e); return TT.back(); }
    me.coins = sh.coins; me.dust = sh.dust; me.tickets = sh.tickets;
    const pk = p=> `<div class="tt2-pk-item"><div class="tt2-pack ${p.type.startsWith('exp') ? 'exp' : p.type}" data-b="${p.type}"><span>${packEmoji(p.type)}</span><b>${esc(p.name)}</b>${p.ticket ? `<i class="tk">${p.ticket}</i>` : ''}</div><div class="mut" style="font-size:.7rem">${p.n} carte · almeno livello ${p.guar}</div><div class="tt2-pity"><i style="width:${Math.round(p.pity / p.pityMax * 100)}%"></i></div><div class="mut" style="font-size:.64rem;margin-top:-3px">Fortuna garantita: ${p.pity}/${p.pityMax}</div>
      <button class="tt2-btn sm ${p.ticket ? 'gold' : 'pri'}" data-buy="${p.type}" style="margin-top:6px">${p.ticket ? '🎟️ Usa biglietto' : '🪙 ' + p.cost}</button>${p.ticket ? `<button class="tt2-btn sm" data-buy="${p.type}" data-coins="1" style="margin:6px 0 0 4px">🪙 ${p.cost}</button>` : ''}</div>`;
    TT.screen('Negozio', `${sh.event.mul > 1 ? `<div class="tt2-event">🎉 ${esc(sh.event.name)}</div>` : ''}${curHtml(sh)}
      <p class="mut" style="text-align:center">Vinci monete giocando, con le missioni e i traguardi. Nelle buste può uscire di tutto, anche carte <b>foil</b> ✨. Ogni busta ha una <b>fortuna garantita</b>: più ne apri senza una carta forte, più diventa sicura!</p>
      <h3>Buste</h3><div class="tt2-packs">${sh.packs.map(p=> pk({...p, name: p.name})).join('')}</div>
      <h3>Espansioni <small>(nuove carte da collezionare)</small></h3>${sh.expansions.map(x=> `<div class="tt2-exp${x.locked ? ' lock' : ''}"><div class="ic">${x.emoji}</div><div class="tx"><b>${esc(x.name)}</b><small>${esc(x.desc)}</small><div class="tt2-bar" style="margin-top:5px;height:6px"><i style="width:${Math.round(x.owned / x.total * 100)}%"></i></div><small>${x.owned}/${x.total} carte · Fortuna ${x.pity}/${x.pityMax}</small></div>${x.locked ? `<span class="tt2-chip r">🔒 Livello ${x.level}</span>` : `<button class="tt2-btn sm ${x.ticket ? 'gold' : 'pri'}" data-buy="exp:${x.id}">${x.ticket ? '🎟️ ×' + x.ticket : '🪙 ' + x.cost}</button>`}</div>`).join('')}`);
    const buy = async (type, coins)=>{ try{ const r = await api('POST', '/api/packs/open', coins ? {type, coins: true} : {type}); me.coins = r.coins; const again = await packFx(r, type); if(again) return buy(type, coins); shopPage(); }catch(e){ errToast(e); shopPage(); } };
    $$('[data-buy]').forEach(b=> b.addEventListener('click', ()=>{ TT.snd('click'); buy(b.dataset.buy, !!b.dataset.coins); }));
    $$('[data-b]').forEach(b=> b.addEventListener('click', ()=>{ const t = b.dataset.b, p = sh.packs.find(x=> x.type === t); if(p) TT.modal(`<div style="text-align:center"><h3 style="margin-top:0">${esc(p.name)}</h3><p>${p.n} carte per busta. L'ultima è almeno di <b>livello ${p.guar}</b>. Ogni carta ha una piccola probabilità di essere <b>foil</b> ✨ (più brillante e più preziosa). Dopo ${p.pityMax} buste senza una carta forte, la prossima la garantisce.</p><button class="tt2-btn pri" data-mclose>Ok</button></div>`, {center: true}); }));
  }
  // apertura animata di una busta: tocca la busta, poi ogni carta per girarla
  function packFx(r, type){
    return new Promise(res=>{
      const R = TT.root(), el = document.createElement('div'), best = r.cards.reduce((m, c)=> Math.max(m, c.lv), 0), rk = TT.rarKey(best);
      el.className = 'tt2-pk'; el.dataset.r = rk;
      el.innerHTML = `<div class="pk-glow"></div><div class="pk-flash"></div><div class="pk-stage"><div class="tt2-pack ${type.startsWith('exp') ? 'exp' : type}"><span>${packEmoji(type)}</span><b>${esc(r.name)}</b></div><div class="pk-hint">Tocca la busta per aprirla!</div></div>`;
      R.appendChild(el);
      const stage = $('.pk-stage', el), flash = $('.pk-flash', el); let started = false, flipped = 0;
      const burst = (host, col, n)=>{ const b = document.createElement('div'); b.className = 'pk-burst'; b.style.setProperty('--pc', col); for(let i = 0; i < n; i++){ const a = Math.random() * 6.28, d = 60 + Math.random() * 130, p = document.createElement('i'); p.style.setProperty('--dx', Math.cos(a) * d + 'px'); p.style.setProperty('--dy', Math.sin(a) * d + 'px'); b.appendChild(p); } host.appendChild(b); setTimeout(()=> b.remove(), 1000); };
      const finish = ()=>{
        const foot = document.createElement('div'); foot.className = 'pk-foot'; const nw = r.cards.filter(c=> c.isNew).length, fo = r.cards.filter(c=> c.foil).length;
        foot.innerHTML = `<b>${nw ? '🆕 ' + nw + (nw === 1 ? ' carta nuova' : ' carte nuove') : 'Tutte doppie: smontale in Officina ✨'}${fo ? ' · ✨ ' + fo + ' foil!' : ''}</b><div class="mut">Fortuna garantita ${r.pity}/${r.pityMax} · 🪙 ${r.coins}</div><div class="tt2-row c"><button class="tt2-btn" id="pkDone">Fatto</button><button class="tt2-btn pri" id="pkAgain">Apri un'altra</button></div>`;
        stage.appendChild(foot); TT.snd('coin');
        $('#pkDone', el).addEventListener('click', ()=>{ el.remove(); res(false); });
        $('#pkAgain', el).addEventListener('click', ()=>{ el.remove(); res(true); });
      };
      const flip = (c, card)=>{
        if(card.classList.contains('on')) return; card.classList.add('on'); flipped++;
        const k = TT.rarKey(c.lv), col = RCOL[k];
        TT.snd(({c: 'flip', u: 'coin', r: 'same', e: 'plus', l: 'combo', m: 'win'})[k]); TT.vib(c.lv >= 8 ? [60, 40, 60] : 20);
        burst(card, col, c.lv >= 8 ? 46 : c.lv >= 5 ? 26 : 12);
        if(c.lv >= 8){ el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); flash.style.background = col; flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go'); }
        if(flipped === r.cards.length) setTimeout(finish, 700);
      };
      const open = ()=>{
        if(started) return; started = true; TT.snd('combo'); TT.vib(30); stage.classList.add('tear'); $('.pk-hint', el).textContent = '';
        setTimeout(()=>{
          flash.classList.add('go'); stage.classList.remove('tear'); stage.innerHTML = `<div class="pk-cards">${r.cards.map((c, i)=> `<div class="pk-c" data-i="${i}" data-r="${TT.rarKey(c.lv)}"><div class="pk-b">★</div><div class="pk-f">${c.isNew ? '<div class="pk-new">NUOVA!</div>' : ''}${cardHtml(c.cid, {foil: c.foil})}<div class="pk-nm">${esc(TT.CARD[c.cid].name)}</div></div></div>`).join('')}</div><div class="pk-hint" id="pkH">Tocca le carte per scoprirle</div><div class="tt2-row c" style="margin-top:14px"><button class="tt2-btn sm" id="pkAll">Rivela tutte</button></div>`;
          $$('.pk-c', el).forEach(cd=> cd.addEventListener('click', ()=> flip(r.cards[+cd.dataset.i], cd)));
          $('#pkAll', el).addEventListener('click', ()=>{ $('#pkAll', el).remove(); $('#pkH', el).textContent = ''; $$('.pk-c', el).forEach((cd, i)=> setTimeout(()=> flip(r.cards[i], cd), i * 420)); });
        }, 560);
      };
      $('.tt2-pack', el).addEventListener('click', open); setTimeout(open, 6000);
      TT.snd('turn');
    });
  }
  async function missionsPage(){
    TT.loading('Carico le missioni…');
    let d; try{ d = await api('GET', '/api/missions'); me = await api('GET', '/api/me'); }catch(e){ errToast(e); return TT.back(); }
    const hrs = t=> { const h = Math.max(1, Math.ceil((t - Date.now()) / 3600000)); return h >= 48 ? Math.round(h / 24) + ' giorni' : h + ' ore'; };
    const card = (m, sc)=> `<div class="tt2-mis${m.prog >= m.t ? (m.claimed ? ' got' : ' done') : ''}"><div class="t"><span>${esc(m.txt)}</span><span>${m.prog}/${m.t}</span></div><div class="tt2-bar"><i style="width:${Math.round(m.prog / m.t * 100)}%"></i></div><div class="tt2-row sb"><span class="rw">🪙 ${m.c} · ${m.xp} XP${m.ticket ? ' · 🎟️ ' + esc(TK[m.ticket]) : ''}</span>${m.claimed ? '<span class="tt2-chip r">✅ Ritirato</span>' : m.prog >= m.t ? `<button class="tt2-btn sm gold" data-c="${sc}:${m.k}">Ritira!</button>` : ''}</div></div>`;
    TT.screen('Missioni', `${curHtml(me)}<h3>Di oggi <small>(nuove tra ${hrs(d.nextDay)})</small></h3>${d.daily.map(m=> card(m, 'daily')).join('')}<h3>Della settimana <small>(nuove tra ${hrs(d.nextWeek)})</small></h3>${d.weekly.map(m=> card(m, 'weekly')).join('')}<p class="mut" style="text-align:center">Le missioni si completano giocando: partite, Custodi, regole speciali, carte prese…</p>`);
    $$('[data-c]').forEach(b=> b.addEventListener('click', async ()=>{ const [sc, k] = b.dataset.c.split(':'); b.disabled = true; try{ const r = await api('POST', '/api/missions/claim', {scope: sc, key: k}); gainModal('Missione completata!', r.gain); missionsPage(); }catch(e){ errToast(e); b.disabled = false; } }));
  }
  const setCards = id=>{ const [k, v] = String(id).split(':'); return k === 'all' ? TT.BASE : k === 'g' ? TT.BASE.filter(c=> c.g === v) : k === 'l' ? TT.BASE.filter(c=> c.lv === +v) : TT.LIST.filter(c=> c.set === v); };
  async function setsPage(){
    TT.loading('Carico le collezioni…');
    let d, col; try{ [d, col] = await Promise.all([api('GET', '/api/sets'), api('GET', '/api/collection')]); }catch(e){ errToast(e); return TT.back(); }
    const own = new Set(col.cards.map(c=> c.cid)), grp = [['l', 'Per livello'], ['g', 'Per genere'], ['x', 'Espansioni'], ['all', 'Album']];
    const item = s=> `<button class="tt2-set${s.ready ? ' ready' : ''}" data-s="${s.id}"><div class="tx"><b>${esc(s.name)}</b><small>${s.n}/${s.total} · 🪙 ${s.reward.coins}${s.reward.ticket ? ' · 🎟️ ' + esc(TK[s.reward.ticket]) : ''}${s.reward.dust ? ' · ✨ ' + s.reward.dust : ''}</small><div class="tt2-bar"><i style="width:${Math.round(s.n / s.total * 100)}%"></i></div></div>${s.claimed ? '<span class="tt2-chip r">✅</span>' : s.ready ? '<span class="tt2-chip on">Ritira!</span>' : ''}</button>`;
    TT.screen('Collezioni', `<p class="mut" style="text-align:center">Completa un set avendo almeno una copia di ogni carta: ricevi un premio (una volta sola).</p>${grp.map(([k, t])=>{ const l = d.sets.filter(s=> k === 'all' ? s.id === 'all' : s.id.startsWith(k + ':')); return l.length ? `<h3>${t}</h3>${l.map(item).join('')}` : ''; }).join('')}`);
    $$('[data-s]').forEach(b=> b.addEventListener('click', ()=>{
      const s = d.sets.find(x=> x.id === b.dataset.s), cs = setCards(s.id).slice().sort((x, y)=> y.lv - x.lv);
      const m = TT.modal(`<h3 style="margin-top:0">${esc(s.name)}</h3><div class="mut">${s.n}/${s.total} · ${s.claimed ? '✅ premio ritirato' : 'premio: 🪙 ' + s.reward.coins + (s.reward.ticket ? ' + 🎟️ ' + esc(TK[s.reward.ticket]) : '')}</div>${s.ready ? '<button class="tt2-btn gold w" id="stClaim" style="margin:8px 0">🎁 Ritira il premio</button>' : ''}<div class="tt2-grid s" style="margin-top:10px">${cs.map(c=> `<div class="cw">${cardHtml(c.id, {lock: own.has(c.id) ? '' : 'x'})}</div>`).join('')}</div><div class="tt2-row c" style="margin-top:10px"><button class="tt2-btn" data-mclose>Chiudi</button></div>`);
      const cl = $('#stClaim', m); if(cl) cl.addEventListener('click', async ()=>{ cl.disabled = true; try{ const r = await api('POST', '/api/sets/claim', {id: s.id}); m.remove(); gainModal('Collezione completata!', r.gain); TT.snd('win'); setsPage(); }catch(e){ errToast(e); cl.disabled = false; } });
    }));
  }
  async function achPage(){
    TT.loading('Carico i traguardi…');
    let d; try{ d = await api('GET', '/api/achievements'); }catch(e){ errToast(e); return TT.back(); }
    const n = d.ach.filter(a=> a.done).length;
    TT.screen('Traguardi', `<div class="tt2-row sb"><span class="mut">${n} di ${d.ach.length} ottenuti</span></div><div class="tt2-bar" style="margin:6px 0 10px"><i style="width:${Math.round(n / d.ach.length * 100)}%"></i></div>${d.ach.slice().sort((a, b)=> (b.done - a.done) || (b.prog / b.target - a.prog / a.target)).map(a=> `<div class="tt2-ach${a.done ? ' done' : ''}"><div class="ic">${a.done ? '🏅' : '🎖️'}</div><div class="tx"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small><div class="tt2-bar"><i style="width:${Math.round(a.prog / a.target * 100)}%"></i></div></div><div class="mut" style="font-size:.7rem;text-align:right">${a.done ? '✅' : a.prog + '/' + a.target}<br>🪙 ${a.coins}${a.ticket ? '<br>🎟️' : ''}</div></div>`).join('')}`);
  }
  async function workshopPage(tab){
    tab = tab === 'craft' ? 'craft' : 'dup'; TT.loading('Apro l\'officina…');
    let col, cf, sh; try{ [col, cf, sh] = await Promise.all([api('GET', '/api/collection'), loadCfg(), api('GET', '/api/shop')]); }catch(e){ errToast(e); return TT.back(); }
    me.dust = sh.dust; const DU = (cf && cf.dust) ? cf.dust.dust : [0, 5, 8, 12, 20, 35, 60, 110, 200, 380, 750], MAXC = cf && cf.dust ? cf.dust.craftMax : 8;
    const by = {}; col.cards.forEach(c=>{ (by[c.cid] = by[c.cid] || []).push(c); });
    const dups = Object.keys(by).filter(k=> by[k].length > 1 && TT.CARD[k]).sort((a, b)=> TT.CARD[b].lv - TT.CARD[a].lv);
    const extra = k=> by[k].filter(c=> !c.lock).sort((a, b)=> (a.foil - b.foil))                 // prima si smontano le non-foil
    const st = TT.workState = TT.workState || {lv: 0};
    let body = `<div class="tt2-cur"><span class="c">✨ ${sh.dust} polvere</span><span class="c">🪙 ${sh.coins}</span></div><div class="tt2-row c" style="margin-bottom:8px"><button class="tt2-chip${tab === 'dup' ? ' on' : ''}" data-t="dup">♻️ Copie doppie (${dups.length})</button><button class="tt2-chip${tab === 'craft' ? ' on' : ''}" data-t="craft">🔨 Crea carte</button></div>`;
    if(tab === 'dup'){
      body += `<p class="mut">Le copie in più si smontano in <b>polvere</b> (le foil valgono il triplo). Ne tieni sempre una. Con la polvere crei le carte che ti mancano, fino al livello ${MAXC}.</p>${dups.length ? `<button class="tt2-btn pri w" id="wkAll">Smonta tutte le doppie (${dups.reduce((n, k)=> n + Math.min(extra(k).length, by[k].length - 1), 0)})</button>` : ''}`;
      body += dups.map(k=>{ const c = TT.CARD[k], ex = Math.min(extra(k).length, by[k].length - 1); return `<div class="tt2-dup"><div class="ttc-w">${cardHtml(k, {})}</div><div class="tx"><b>${esc(c.name)}</b><small>${by[k].length} copie · livello ${c.lv}</small><small>Ogni copia extra: ✨ ${DU[c.lv]}</small></div><button class="tt2-btn sm" data-d="${k}" ${ex ? '' : 'disabled'}>Smonta 1</button></div>`; }).join('') || '<p class="mut" style="text-align:center;margin-top:24px">Non hai copie doppie. Apri qualche busta!</p>';
    } else {
      const have = new Set(Object.keys(by)), miss = TT.BASE.filter(c=> !have.has(c.id) && c.lv <= MAXC && (!st.lv || c.lv === st.lv)).sort((a, b)=> b.lv - a.lv);
      body += `<p class="mut">Tocca una carta che ti manca per crearla con la polvere. Verdi = puoi permettertela.</p><div class="tt2-strip">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(l=> `<button class="tt2-chip${st.lv === l ? ' on' : ''}" data-l="${l}">${l ? 'Liv. ' + l : 'Tutte'}</button>`).join('')}</div><div class="tt2-craft">${miss.slice(0, 60).map(c=> `<div class="cw${sh.dust >= DU[c.lv] * 5 ? ' can' : ''}" data-m="${c.id}">${cardHtml(c.id, {lock: 'x'})}<small>✨ ${DU[c.lv] * 5}</small></div>`).join('') || '<p class="mut" style="grid-column:1/-1;text-align:center">Niente da creare qui: ti mancano solo carte di livello 9-10, che si vincono o si rubano.</p>'}</div>`;
    }
    TT.screen('Officina', body);
    $$('[data-t]').forEach(b=> b.addEventListener('click', ()=> workshopPage(b.dataset.t)));
    $$('[data-l]').forEach(b=> { b.addEventListener('click', ()=>{ st.lv = +b.dataset.l; workshopPage('craft'); }); });
    const dism = async uids=>{ try{ const r = await api('POST', '/api/dust/dismantle', {uids}); TT.snd('coin'); TT.toast('+' + r.dust + ' ✨ polvere (' + r.n + (r.n === 1 ? ' carta' : ' carte') + ')', 2500); workshopPage('dup'); }catch(e){ errToast(e); } };
    $$('[data-d]').forEach(b=> b.addEventListener('click', ()=>{ const k = b.dataset.d, e = extra(k)[0]; if(e) dism([e.uid]); }));
    const all = $('#wkAll'); if(all) all.addEventListener('click', async ()=>{ if(await TT.ask('Smontare tutte le copie doppie in polvere? Di ogni carta ne resta una.', 'Smonta', 'No')){ const u = []; dups.forEach(k=> extra(k).slice(0, by[k].length - 1).forEach(c=> u.push(c.uid))); for(let i = 0; i < u.length; i += 40) await dism(u.slice(i, i + 40)); } });
    $$('[data-m]').forEach(b=> b.addEventListener('click', async ()=>{ const id = b.dataset.m, c = TT.CARD[id], cost = DU[c.lv] * 5; if(sh.dust < cost) return TT.toast('Servono ' + cost + ' ✨ di polvere (ne hai ' + sh.dust + ')'); if(!await TT.ask('Creare <b>' + esc(c.name) + '</b> per ✨ ' + cost + '?', 'Crea', 'No')) return; try{ const r = await api('POST', '/api/dust/craft', {cid: id}); TT.snd('win'); showNewCard(r.card, 'Carta creata!', ''); workshopPage('craft'); }catch(e){ errToast(e); } }));
  }

  // ---------------------------------------------------------------- amici
  async function friendsPage(){
    TT.loading('Carico gli amici…');
    let fr; try{ fr = (await api('GET', '/api/friends')).friends; }catch(e){ errToast(e); return TT.back(); }
    const link = SITE + '#tt=friend:' + me.code + (server() ? ';s=' + encodeURIComponent(server()) : '');
    const inc = fr.filter(f=> f.state === 'incoming'), fs = fr.filter(f=> f.state === 'friend').sort((a, b)=> (b.online - a.online) || (b.elo - a.elo)), sent = fr.filter(f=> f.state === 'sent');
    TT.screen('Amici', `
      <div class="tt2-box"><b>Il tuo codice amico</b><div class="tt2-code">${esc(me.code)}</div><div class="tt2-row c"><button class="tt2-btn sm" id="frQr">QR</button><button class="tt2-btn sm" id="frShare">Invia il link</button></div></div>
      <div class="tt2-box"><b>Aggiungi un amico</b><div class="tt2-row" style="margin-top:6px;flex-wrap:nowrap"><input type="text" id="frIn" placeholder="Codice amico o nome" autocapitalize="off" autocorrect="off" style="flex:1"><button class="tt2-btn pri" id="frAdd">Aggiungi</button></div><div id="frRes"></div></div>
      ${inc.length ? `<h3>Richieste ricevute</h3><div class="tt2-list">${inc.map(f=> `<div class="tt2-item"><div class="av">${avOf(f.id)}</div><div class="tx"><b>${esc(f.nick)}</b><small>${esc(f.rank)} · ELO ${f.elo}</small></div><button class="tt2-btn sm pri" data-ok="${f.id}">Accetta</button><button class="tt2-btn sm" data-no="${f.id}">✕</button></div>`).join('')}</div>` : ''}
      <h3>I tuoi amici <small>(${fs.length})</small></h3>
      <div class="tt2-list">${fs.length ? fs.map(f=> `<button class="tt2-item" data-f="${f.id}"><div class="av${f.online ? ' on' : ''}">${avOf(f.id)}</div><div class="tx"><b>${esc(f.nick)}</b><small>${esc(f.rank)} · ELO ${f.elo} · ${f.online ? 'online' : 'offline'}</small></div><div class="rt">Sfida ›</div></button>`).join('') : '<p class="mut">Ancora nessuno: mostra il QR ai tuoi amici o mandagli il link!</p>'}</div>
      ${sent.length ? `<h3>Richieste inviate</h3><div class="tt2-list">${sent.map(f=> `<div class="tt2-item"><div class="av">${avOf(f.id)}</div><div class="tx"><b>${esc(f.nick)}</b><small>In attesa…</small></div></div>`).join('')}</div>` : ''}`);
    $('#frQr').addEventListener('click', ()=> showQr('Il tuo codice amico', link, me.code));
    $('#frShare').addEventListener('click', ()=> share('Aggiungimi su Triple Triad! Il mio codice amico: ' + me.code, link));
    $('#frAdd').addEventListener('click', async ()=>{ const v = $('#frIn').value.trim(); if(!v) return; try{ const r = await api('POST', '/api/friends/request', {to: v}); $('#frRes').innerHTML = `<p style="color:#7dffa3">${r.state === 'friend' ? '🤝 Siete amici!' : '✅ Richiesta inviata a ' + esc(r.friend.nick)}</p>`; TT.snd('coin'); setTimeout(()=> TT.replaceTop(friendsPage), 900); }catch(e){ $('#frRes').innerHTML = `<p style="color:#ff8f9a">${esc(e.message)}</p>`; } });
    $$('[data-ok]').forEach(b=> b.addEventListener('click', async ()=>{ try{ await api('POST', '/api/friends/accept', {id: b.dataset.ok}); TT.snd('coin'); if(me) me.requests = Math.max(0, (me.requests || 1) - 1); friendsPage(); }catch(e){ errToast(e); } }));
    $$('[data-no]').forEach(b=> b.addEventListener('click', async ()=>{ try{ await api('POST', '/api/friends/remove', {id: b.dataset.no}); friendsPage(); }catch(e){ errToast(e); } }));
    $$('[data-f]').forEach(b=> b.addEventListener('click', ()=> friendMenu(fs.find(x=> x.id === b.dataset.f))));
  }
  function friendMenu(f){
    const m = TT.modal(`<div style="text-align:center"><div class="av" style="width:64px;height:64px;font-size:2.2rem;margin:0 auto 6px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#4c3fb8,#1f6feb)">${avOf(f.id)}</div><b style="font-size:1.1rem">${esc(f.nick)}</b><div class="tt2-row c" style="margin:6px 0">${rankChip(f.rank)}<span class="tt2-chip r">ELO ${f.elo}</span></div></div>
      <div class="tt2-row c"><button class="tt2-btn pri" data-x="ch">⚔️ Sfida</button><button class="tt2-btn" data-x="pr">Profilo</button><button class="tt2-btn sm" data-x="rm">Rimuovi</button></div>`, {});
    $('[data-x="ch"]', m).addEventListener('click', ()=>{ m.remove(); TT.go(()=> challengeSetup({to: f.id, toNick: f.nick})); });
    $('[data-x="pr"]', m).addEventListener('click', ()=>{ m.remove(); showProfile(f.id); });
    $('[data-x="rm"]', m).addEventListener('click', async ()=>{ if(await TT.ask('Togliere ' + esc(f.nick) + ' dagli amici?', 'Rimuovi', 'No')){ m.remove(); try{ await api('POST', '/api/friends/remove', {id: f.id}); TT.replaceTop(friendsPage); }catch(e){ errToast(e); } } });
  }
  async function showProfile(id){
    try{
      const p = await api('GET', '/api/player/' + id);
      TT.modal(`<div style="text-align:center"><b style="font-size:1.15rem">${avOf(p.id)} ${esc(p.nick)}</b><div class="tt2-row c" style="margin:6px 0">${rankChip(p.rank)}<span class="tt2-chip r">ELO ${p.elo}</span><span class="tt2-chip r">${p.online ? '🟢 online' : '⚫ offline'}</span></div><div class="mut">${p.wins}V ${p.losses}S ${p.draws}P · record serie ${p.best} · ${p.cards} carte · potenza ${p.power}</div></div>
        <h3>Le sue carte migliori</h3><div class="tt2-grid s">${p.top.map(c=> `<div class="cw">${cardHtml(c, {})}</div>`).join('')}</div><p class="mut" style="text-align:center">Vinci contro di lui in una Sfida vera per prendertene una!</p>
        <div class="tt2-row c"><button class="tt2-btn pri" data-mclose>Chiudi</button></div>`);
    }catch(e){ errToast(e); }
  }
  async function showQr(title, url, code){
    let svg = ''; try{ if(typeof qrcode === 'undefined') await TT.loadJS('qrcode.min.js'); const q = qrcode(0, 'M'); q.addData(url); q.make(); svg = q.createSvgTag({cellSize: 5, margin: 2, scalable: true}); }catch(e){}
    TT.modal(`<div style="text-align:center"><h3 style="margin-top:0">${esc(title)}</h3><div class="tt2-qr" style="width:250px">${svg || '<div style="color:#000">QR non disponibile</div>'}</div><div class="tt2-code">${esc(code)}</div><p class="mut">Fai leggere il QR con la fotocamera del telefono: si apre il gioco e ti collega.</p><div class="tt2-row c"><button class="tt2-btn" id="qrSh">Invia il link</button><button class="tt2-btn pri" data-mclose>Chiudi</button></div></div>`, {center: true});
    $('#qrSh').addEventListener('click', ()=> share(title + ': ' + code, url));
  }
  async function share(text, url){ try{ if(navigator.share){ await navigator.share({title: 'Triple Triad di Frugu', text, url}); return; } await navigator.clipboard.writeText(text + ' ' + url); TT.toast('Link copiato!'); }catch(e){} }

  // ---------------------------------------------------------------- sfide e stanze
  async function myItems(){
    const c = (await api('GET', '/api/collection')).cards; if(me) me.cards = c.length;
    return c.map(x=> ({key: x.uid, cid: x.cid, lock: x.lock, foil: x.foil}));
  }
  function challengeSetup(o){
    const R = Object.assign({elemental: true, same: true, plus: true, sameWall: false, combo: true, sudden: true, trade: 'one'}, o.rules || {}), st = {mode: o.mode || 'ranked'};
    const draw = ()=>{
      const who = o.to ? `contro <b>${esc(o.toNick || 'il tuo amico')}</b>` : 'con un codice o QR';
      TT.screen(o.to ? 'Sfida' : 'Crea stanza', `<p class="mut" style="text-align:center">Partita ${who}.</p>
        <div class="tt2-row c" style="margin-bottom:8px"><button class="tt2-chip${st.mode === 'ranked' ? ' on' : ''}" data-m="ranked">⚔️ Sfida vera (in palio)</button><button class="tt2-chip${st.mode === 'friendly' ? ' on' : ''}" data-m="friendly">🤝 Amichevole</button></div>
        <p class="mut">${st.mode === 'ranked' ? '<b>In palio ci sono le carte:</b> chi vince prende le carte del rivale secondo la regola di scambio. Conta anche per la classifica ELO.' : 'Nessuna carta in palio e niente ELO: solo per divertirsi.'}</p>
        <div class="tt2-box">${['elemental', 'same', 'sameWall', 'plus', 'combo', 'sudden'].map(k=> `<label class="chk"><input type="checkbox" data-r="${k}" ${R[k] ? 'checked' : ''} ${k === 'sameWall' && !R.same ? 'disabled' : ''}> ${TT.RULE_N[k]}</label>`).join('')}</div>
        ${st.mode === 'ranked' ? `<div class="tt2-box"><b>Regola di scambio</b><div class="tt2-strip" style="margin-top:6px">${Object.keys(TT.TRADE_N).map(k=> `<button class="tt2-chip${R.trade === k ? ' on' : ''}" data-t="${k}">${TT.TRADE_N[k]}</button>`).join('')}</div><p class="mut">${esc(TT.TRADE_D[R.trade])}</p></div>` : ''}
        <button class="tt2-btn pri w" id="chGo">Scegli le 5 carte</button>`);
      $$('[data-m]').forEach(b=> b.addEventListener('click', ()=>{ st.mode = b.dataset.m; draw(); }));
      $$('[data-r]').forEach(b=> b.addEventListener('change', ()=>{ R[b.dataset.r] = b.checked; if(!R.same) R.sameWall = false; draw(); }));
      $$('[data-t]').forEach(b=> b.addEventListener('click', ()=>{ R.trade = b.dataset.t; draw(); }));
      $('#chGo').addEventListener('click', async ()=>{
        let items; try{ items = await myItems(); }catch(e){ return errToast(e); }
        TT.pickDeck({title: st.mode === 'ranked' ? 'Le 5 carte in palio' : 'Le tue 5 carte', sub: st.mode === 'ranked' ? '⚠️ Se perdi, puoi perdere queste carte.' : '', items, ok: o.to ? 'Sfida' : 'Crea la stanza', back: draw, onDone: async uids=>{
          TT.loading('Preparo la sfida…');
          try{ const ch = await api('POST', '/api/challenge', {to: o.to || undefined, mode: st.mode, rules: R, cards: uids}); waitPage(ch, o); }
          catch(e){ errToast(e); TT.back(); }
        }});
      });
    };
    draw();
  }
  function waitPage(ch, o){
    waiting = {id: ch.id};
    const link = SITE + '#tt=room:' + ch.code + (server() ? ';s=' + encodeURIComponent(server()) : '');
    TT.screen(ch.code ? 'La tua stanza' : 'Sfida inviata', `${ch.code ? `<p style="text-align:center">Fai entrare il tuo amico con questo codice:</p><div class="tt2-code">${esc(ch.code)}</div><div class="tt2-row c"><button class="tt2-btn" id="wtQr">Mostra il QR</button><button class="tt2-btn" id="wtSh">Invia il link</button></div>` : `<p style="text-align:center">Aspetto che <b>${esc(o.toNick || 'il tuo amico')}</b> accetti…</p>`}
      <div class="tt2-load" style="height:120px"><div><i></i><span class="mut">In attesa dell'avversario (scade tra 15 minuti)</span></div></div>
      <div class="tt2-row c"><button class="tt2-btn red" id="wtNo">Annulla</button></div>`);
    if(ch.code){ $('#wtQr').addEventListener('click', ()=> showQr('Stanza ' + ch.code, link, ch.code)); $('#wtSh').addEventListener('click', ()=> share('Vieni a sfidarmi a Triple Triad! Codice stanza: ' + ch.code, link)); }
    $('#wtNo').addEventListener('click', async ()=>{ waiting = null; try{ await api('POST', '/api/challenge/' + ch.id + '/cancel'); }catch(e){} TT.back(); });
  }
  function joinPage(prefill){
    TT.screen('Entra con codice', `<p class="mut" style="text-align:center">Scrivi il codice della stanza che ti ha dato il tuo amico.</p><div class="tt2-box"><input type="text" id="jnIn" maxlength="8" placeholder="CODICE" value="${esc(typeof prefill === 'string' ? prefill : '')}" style="text-transform:uppercase;text-align:center;font:900 1.6rem ui-monospace,monospace;letter-spacing:.2em" autocapitalize="characters" autocorrect="off" spellcheck="false"><div class="mut" id="jnMsg" style="margin-top:6px;text-align:center"></div><button class="tt2-btn pri w" id="jnGo" style="margin-top:10px">Scegli le 5 carte ed entra</button></div>`);
    $('#jnGo').addEventListener('click', async ()=>{
      const code = $('#jnIn').value.trim().toUpperCase(); if(code.length < 4) return;
      let items; try{ items = await myItems(); }catch(e){ return errToast(e); }
      TT.pickDeck({title: 'Le tue 5 carte', sub: '⚠️ Se è una Sfida vera, potresti perderle.', items, ok: 'Entra', back: ()=> joinPage(code), onDone: async uids=>{
        TT.loading('Entro nella stanza…');
        try{ const r = await api('POST', '/api/room/join', {code, cards: uids}); openMatch(r.match, []); }
        catch(e){ errToast(e); TT.back(); }
      }});
    });
  }
  function showChallenge(ch){
    TT.snd('turn'); TT.vib([60, 40, 60]);
    const m = TT.modal(`<div style="text-align:center"><div style="font-size:2rem">⚔️</div><h3 style="margin:2px 0">${esc(ch.from.nick)} ti sfida!</h3><div class="tt2-row c">${rankChip(ch.from.rank)}<span class="tt2-chip r">ELO ${ch.from.elo}</span><span class="tt2-chip ${ch.mode === 'ranked' ? 't' : 'r'}">${ch.mode === 'ranked' ? '⚔️ Sfida vera' : '🤝 Amichevole'}</span></div><div class="tt2-row c" style="margin-top:6px">${TT.ruleChips(ch.rules, ch.mode === 'ranked' ? ch.rules.trade : '')}</div>
      <p class="mut">${ch.mode === 'ranked' ? esc(TT.TRADE_D[ch.rules.trade]) + ' Se perdi, perdi carte!' : 'Nessuna carta in palio.'}</p><div class="tt2-grid s" style="margin:6px 0">${ch.cards.map(c=> c ? `<div class="cw">${cardHtml(c, {})}</div>` : '').join('')}</div><div class="tt2-row c"><button class="tt2-btn red" data-no>Rifiuta</button><button class="tt2-btn pri" data-ok>Accetta</button></div></div>`, {center: true, sticky: true});
    $('[data-no]', m).addEventListener('click', async ()=>{ m.remove(); try{ await api('POST', '/api/challenge/' + ch.id + '/decline'); }catch(e){} });
    $('[data-ok]', m).addEventListener('click', async ()=>{
      m.remove(); let items; try{ items = await myItems(); }catch(e){ return errToast(e); }
      TT.pickDeck({title: 'Le tue 5 carte', sub: ch.mode === 'ranked' ? '⚠️ Sfida vera: se perdi, puoi perdere queste carte.' : '', items, ok: 'Gioca', onDone: async uids=>{
        TT.loading('Inizio la partita…');
        try{ const r = await api('POST', '/api/challenge/' + ch.id + '/accept', {cards: uids}); openMatch(r.match, []); }
        catch(e){ errToast(e); TT.back(); }
      }});
    });
  }
  async function handleInvite(inv){
    const [what, rest] = String(inv).split(';s=')[0].split(':'), code = (rest || '').toUpperCase();
    if(what === 'room' && code){ TT.go(()=> joinPage(code)); }
    else if(what === 'friend' && code){
      if(await TT.ask('Vuoi aggiungere agli amici il giocatore con codice <b>' + esc(code) + '</b>?', 'Aggiungi', 'No')){ try{ const r = await api('POST', '/api/friends/request', {to: code}); TT.toast(r.state === 'friend' ? '🤝 Ora siete amici!' : '✅ Richiesta inviata a ' + r.friend.nick); }catch(e){ errToast(e); } }
    }
  }

  // ---------------------------------------------------------------- Custodi, carte, classifica, novità, account
  async function bossPage(){
    const c = await loadCfg(); if(!c) return TT.toast('Server non raggiungibile');
    TT.screen('I Custodi', `<p class="mut" style="text-align:center">Batti il Custode per vincere una carta nuova. Non rischi nessuna carta! Ogni Custode si sblocca battendo il precedente.</p><div class="tt2-list">${c.bosses.map(b=>{
      const wins = (me.boss || {})[b.n] || 0, open = b.n === 1 || ((me.boss || {})[b.n - 1] || 0) > 0;
      return `<button class="tt2-item tt2-boss${open ? '' : ' lock'}" data-b="${b.n}"><div class="n">${open ? '👑' : '🔒'}</div><div class="tx"><b>${b.n}. ${esc(b.name)}</b><small>${esc(b.title)} · IA ${b.ai}</small><div style="margin-top:3px">${TT.ruleChips(b.rules, '')}</div></div><div class="rt">${wins ? '✅ ×' + wins : 'Premio<br>liv. ' + b.reward}</div></button>`;
    }).join('')}</div>`);
    $$('[data-b]').forEach(b=> b.addEventListener('click', async ()=>{
      const n = +b.dataset.b, bo = c.bosses[n - 1];
      if(!(n === 1 || ((me.boss || {})[n - 1] || 0) > 0)) return TT.toast('Prima batti il Custode ' + (n - 1));
      let items; try{ items = await myItems(); }catch(e){ return errToast(e); }
      TT.pickDeck({title: 'Contro ' + bo.name, sub: `${esc(bo.title)}<br>${TT.ruleChips(bo.rules, '')}<br><small>Non rischi carte. Premio: una carta di livello ${bo.reward}.</small>`, items, ok: 'Sfida il Custode', back: bossPage, onDone: async uids=>{
        TT.loading('Il Custode arriva…');
        try{ const r = await api('POST', '/api/boss/start', {n, cards: uids}); openMatch(r.match, []); }
        catch(e){ errToast(e); TT.back(); }
      }});
    }));
  }
  async function cardsPage(){
    TT.loading('Carico le tue carte…');
    try{
      const [col, sup] = await Promise.all([api('GET', '/api/collection'), api('GET', '/api/supply')]);
      const counts = {}, locks = {}, foils = {}; col.cards.forEach(c=>{ counts[c.cid] = (counts[c.cid] || 0) + 1; if(c.lock) locks[c.cid] = (locks[c.cid] || 0) + 1; if(c.foil) foils[c.cid] = 1; });
      TT.albumPage({title: 'Le mie carte online', counts, locks, foils, supply: sup.supply, mode: 'online'});
    }catch(e){ errToast(e); TT.back(); }
  }
  async function topPage(by){
    by = by === 'collection' ? 'collection' : 'elo'; TT.loading('Carico la classifica…');
    try{
      const d = await api('GET', '/api/leaderboard?by=' + by);
      TT.screen('Classifica', `<div class="tt2-row c" style="margin-bottom:8px"><button class="tt2-chip${by === 'elo' ? ' on' : ''}" data-t="elo">⚔️ Sfide (ELO)</button><button class="tt2-chip${by === 'collection' ? ' on' : ''}" data-t="collection">📚 Collezioni</button></div>
        <div class="tt2-list">${d.players.length ? d.players.map((p, i)=> `<button class="tt2-item${p.id === me.id ? '" style="border-color:#ffe27a' : ''}" data-p="${p.id}"><div class="n" style="font:900 1.1rem system-ui;width:30px;text-align:center">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</div><div class="av">${avOf(p.id)}</div><div class="tx"><b>${esc(p.nick)}</b><small>${by === 'elo' ? esc(p.rank) + ' · ' + p.wins + 'V ' + p.losses + 'S' : p.cards + ' carte · migliore livello ' + p.best}</small></div><div class="rt">${by === 'elo' ? p.elo : p.power}</div></button>`).join('') : '<p class="mut" style="text-align:center">Nessuno in classifica: gioca una Sfida vera!</p>'}</div>`);
      $$('[data-t]').forEach(b=> b.addEventListener('click', ()=> topPage(b.dataset.t)));
      $$('[data-p]').forEach(b=> b.addEventListener('click', ()=> showProfile(b.dataset.p)));
    }catch(e){ errToast(e); TT.back(); }
  }
  async function newsPage(){
    TT.loading('Carico le novità…');
    try{
      const d = await api('GET', '/api/news'); if(me){ me.news = 0; }
      const txt = it=>{ const c = it.data.cid && TT.CARD[it.data.cid] ? TT.CARD[it.data.cid].name : '';
        return {friend_req: ['👋', `<b>${esc(it.data.nick)}</b> ti ha chiesto l'amicizia`], friend_ok: ['🤝', `<b>${esc(it.data.nick)}</b> è ora tuo amico`], challenge: ['🎴', `<b>${esc(it.data.from)}</b> ti ha sfidato`], stolen: ['⚠️', `<b>${esc(it.data.by)}</b> ti ha rubato <b>${esc(c)}</b>`], won: ['🏆', `Hai preso <b>${esc(c)}</b> a ${esc(it.data.from)}`], boss: ['👑', `Custode ${it.data.boss} (${esc(it.data.name)}) battuto${it.data.first ? ' per la prima volta' : ''}: <b>${esc(c)}</b>`], refill: ['🎁', 'Ti ho dato ' + it.data.n + ' carte comuni per poter giocare'], level: ['⭐', `Sei al <b>livello ${it.data.lvl}</b>: +${it.data.coins} 🪙${it.data.ticket ? ' e una busta in regalo' : ''}`], ach: ['🏅', `Traguardo <b>${esc(it.data.name)}</b>: +${it.data.coins} 🪙${it.data.ticket ? ' + busta' : ''}`], set: ['🗂️', `Collezione completata: <b>${esc(it.data.name)}</b>`]}[it.kind] || ['•', esc(it.kind)]; };
      TT.screen('Novità', `${d.news.length ? d.news.map(it=>{ const [ic, t] = txt(it); const cls = it.kind === 'stolen' ? 'bad' : (['won', 'boss', 'level', 'ach', 'set'].includes(it.kind)) ? 'good' : ''; return `<div class="tt2-news ${cls}"><span style="font-size:1.4rem">${ic}</span><div style="flex:1">${t}<small>${new Date(it.ts).toLocaleString('it-IT', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}</small>${it.kind === 'stolen' && it.data.byId ? `<button class="tt2-btn sm red" data-rev="${it.data.byId}" data-n="${esc(it.data.by)}" style="margin-top:6px">⚔️ Riprendila!</button>` : ''}</div>${it.data.cid ? cardHtml(it.data.cid, {}) : ''}</div>`; }).join('') : '<p class="mut" style="text-align:center;margin-top:30px">Nessuna novità.</p>'}`);
      $$('[data-rev]').forEach(b=> b.addEventListener('click', ()=> TT.go(()=> challengeSetup({to: b.dataset.rev, toNick: b.dataset.n}))));
    }catch(e){ errToast(e); TT.back(); }
  }
  function acctPage(){
    TT.screen('Account', `<div class="tt2-box"><div class="tt2-kv"><span>Nome</span><span>${esc(me.nick)}</span><span>Codice amico</span><span><b>${esc(me.code)}</b></span><span>Grado</span><span>${esc(me.rank)} · ELO ${me.elo}</span><span>Partite</span><span>${me.wins}V ${me.losses}S ${me.draws}P</span><span>Server</span><span style="word-break:break-all">${esc(server())}</span></div></div>
      <p class="mut">Il tuo account vive su un solo telefono: se lo apri su un altro con il codice di recupero, questo viene scollegato. Le carte non si possono regalare: si vincono.</p>
      <div class="tt2-row"><button class="tt2-btn sm" id="acSrv">Cambia server</button><button class="tt2-btn sm red" id="acOut">Esci da questo telefono</button></div>`);
    $('#acSrv').addEventListener('click', serverPage);
    $('#acOut').addEventListener('click', async ()=>{ if(await TT.ask('Uscire da questo telefono? Per rientrare ti serviranno il nome e il codice di recupero.', 'Esci', 'Annulla')){ LS.set(AK, null); acct = null; me = null; disconnectWS(); TT.toast('Sei uscito'); TT.back(); TT.replaceTop(TT.online); } });
  }

  // ---------------------------------------------------------------- partita online
  const resetHist = ()=>{ const h = TT.hist(); h.length = 0; h.push({fn: TT.home, args: []}, {fn: TT.online, args: []}); };
  async function resumeMatch(id){ try{ const r = await api('GET', '/api/match/' + id); if(r.match) openMatch(r.match, []); }catch(e){} }
  async function syncMatch(){ if(!cur) return; try{ const r = await api('GET', '/api/match/' + cur.id + '?ver=' + cur.ver, null, {quiet: true, timeout: 6000}); if(r.match && r.match.ver > cur.ver) handleView(r.match, null); }catch(e){} }
  const namesOf = v=> v.players.map((p, i)=> ({nick: p.nick, av: p.boss ? '👑' : avOf(p.id), sub: p.boss ? p.title : (p.rank + ' · ' + p.elo)}));
  function openMatch(view, events){
    if(board){ board.destroy(); board = null; }
    waiting = null; endShown = ''; cur = view; resetHist(); TT.ensureRoot();
    const you = view.you;
    board = TT.mountBoard({
      state: view.state, me: you, names: namesOf(view), title: view.boss ? 'Custode: ' + view.players[1].nick : (view.mode === 'ranked' ? 'Sfida vera' : 'Amichevole'),
      hidden: ()=> false, emotes: !view.boss, foil: u=> !!(view.foil && view.foil[Math.floor(u / 5)] && view.foil[Math.floor(u / 5)][u % 5]),
      canPlay: (seat, st)=> !st.over && seat === you && cur && cur.status === 'active',
      onPlay: async (hi, cell)=>{ const r = await api('POST', '/api/match/' + cur.id + '/move', {hi, cell}); cur = r.match; settle(r.match); return {state: r.match.state, events: r.events}; },
      onEmote: e=> { api('POST', '/api/match/' + cur.id + '/emote', {e}).catch(()=>{}); },
      quit: async ()=>{
        if(cur.status !== 'active'){ leave(); return; }
        if(await TT.ask(cur.mode === 'ranked' && !cur.boss ? 'Se abbandoni perdi la partita e le carte in palio! Vuoi arrendersi?' : 'Vuoi arrenderti?', 'Mi arrendo', 'Continua')){ try{ const r = await api('POST', '/api/match/' + cur.id + '/forfeit'); handleView(r.match, [{t: 'end'}]); }catch(e){ errToast(e); } }
      },
      timer: view.status === 'active' ? {deadline: view.deadline, total: view.turnMs} : null
    });
    if(view.status === 'active' && view.state.turn === you) { TT.snd('turn'); }
    if(view.status !== 'active') settle(view);
    TT.onLeave = ()=>{ if(board){ board.destroy(); board = null; } cur = null; disconnectWS(); };
  }
  function handleView(view, events){
    if(!cur || view.id !== cur.id) return;
    if(view.ver <= cur.ver && events == null) return;
    cur = view;
    if(!board) return;
    if(events && events.length){
      events.forEach(e=>{ if(e.t === 'place' && e.auto && e.p === cur.you) TT.toast('⏱ Tempo scaduto: ho giocato io per te'); });
      board.apply(view.state, events);
    } else board.setState(view.state);
    settle(view);
  }
  async function settle(view){
    await sleep(30); while(board && board.busy) await sleep(80);
    if(!board || !cur || cur.id !== view.id) return;
    if(view.status === 'active'){ board.startTimer(view.deadline, view.turnMs); return; }
    const key = view.id + ':' + view.status; if(endShown === key) return; endShown = key;
    $$('.tt2-end', TT.root()).forEach(e=> e.remove());
    await sleep(P.fast ? 100 : 600);
    endScreen(view);
  }
  function leave(){ if(board){ board.destroy(); board = null; } cur = null; waiting = null; lobbyAt = 0; TT.onLeave = null; TT.go(TT.online); }
  function endScreen(v){
    const you = v.you, opp = v.players[1 - you], myId = acct.id, res = v.result || {}, st = v.state;
    const btns = [];
    if(v.status === 'picking'){
      const by = v.pick.by, mine = by === you;
      if(mine){
        const sel = [];
        board.showEnd({kind: 'win', title: 'HAI VINTO!', sub: `${st.result.score[you]} a ${st.result.score[1 - you]}${st.result.forfeit ? ' (abbandono)' : ''}<br>Scegli le carte di ${esc(opp.nick)} da prendere`, pick: {n: v.pick.n, choices: v.pick.choices, sel, by, onPick: async (list, el)=>{
          try{ const r = await api('POST', '/api/match/' + v.id + '/pick', {picks: list}); TT.snd('steal'); cur = r.match; endShown = ''; el.remove(); endShown = r.match.id + ':done'; endScreen(r.match); }
          catch(e){ errToast(e); const b = $('#pkOk', el); if(b) b.disabled = false; }
        }}});
      } else board.showEnd({kind: 'lose', title: 'HAI PERSO', sub: `${st.result.score[you]} a ${st.result.score[1 - you]}<br>${esc(opp.nick)} sta scegliendo le carte…`});
      return;
    }
    const won = res.winner === you, draw = res.winner == null;
    const cards = [];
    (res.transfers || []).forEach(t=>{ if(t.to === myId) cards.push({cid: t.cid, label: 'Rubata a ' + opp.nick + '!'}); else if(t.from === myId) cards.push({cid: t.cid, label: opp.nick + ' te l\'ha presa', cls: 'bad'}); });
    if(res.reward && res.reward.cid) cards.push({cid: res.reward.cid, label: res.first ? 'Premio del Custode!' : 'Premio giornaliero!'});
    const lost = cards.filter(c=> c.cls === 'bad').length, gained = cards.length - lost;
    const elo = res.elo && res.elo[you] != null ? res.elo[you] : null;
    const gn = res.gain && res.gain[you], gnT = gn ? `<br><b style="color:#ffe27a">${gainText(gn)}</b>` : '';
    const sub = `${res.score[you]} a ${res.score[1 - you]}${gnT}${res.forfeit ? (won ? ' · avversario ritirato' : ' · abbandono o tempo scaduto') : ''}${res.round > 1 ? ' · dopo la morte improvvisa' : ''}${elo != null ? `<br>ELO ${elo >= 0 ? '+' : ''}${elo}` : ''}${v.boss && won && !res.reward ? '<br><small>Il premio di oggi l\'hai già ritirato: torna domani!</small>' : ''}${v.boss && !won && !draw ? '<br><small>Contro il Custode non perdi carte. Riprova!</small>' : ''}`;
    if(lost) { TT.snd('steal'); }
    btns.push({label: v.boss ? 'Sfida ancora' : 'Rivincita', cls: 'pri', fn: ()=> rematch(v)}, {label: 'Esci', fn: ()=> leave()});
    board.showEnd({kind: draw ? 'draw' : won ? 'win' : 'lose', title: draw ? 'PAREGGIO' : won ? 'HAI VINTO!' : 'HAI PERSO', sub, cards, buttons: btns});
    TT.onlineBadge();
  }
  async function rematch(v){
    if(board){ board.destroy(); board = null; } cur = null; TT.onLeave = null;
    const opp = v.players[1 - v.you];
    if(v.boss){ lobbyAt = 0; TT.go(bossPage); return; }
    TT.go(()=> challengeSetup({to: opp.id, toNick: opp.nick, rules: v.state.rules, mode: v.mode}));
  }
})();
