// ---- Verdetto «vale la pena?» (versione Anime: da vedere/leggere subito, in lista, non urgente, lascia stare) ----
// Calcolo tutto locale (nessuna AI, nessuna richiesta): combina voto e fonte, i tuoi gusti (DNA), prezzo su Steam, abbonamenti,
// andamento delle recensioni recenti, ore, lingua e quanti titoli hai già in coda. Ogni verdetto dice PERCHÉ.
(function(){
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const eur = n=> n.toLocaleString('it-IT', {style: 'currency', currency: 'EUR'});
  const ownedSet = ()=>{ try{ return new Set(JSON.parse(localStorage.getItem('atl_owned') || '[]') || []); }catch(e){ return new Set(); } };
  const SRC = {mc: 'Metacritic', oc: 'OpenCritic', rawg: 'RAWG'};

  // Il verdetto (versione Anime: «vale la pena guardarlo/leggerlo?», niente prezzi né negozi): {kind, title, sub, reasons:[{t:'ok'|'warn'|'bad'|'info', text}], target}
  function verdict(g){
    const R = [], l = g.label || {}, e = g.enrich || {}, K = kw(g), watch = isWatch(g);
    let dna = null;
    try{ const pr = buildTasteProfile(); dna = pr.n >= 2 ? dnaForGame(g, pr) : null; }catch(x){}
    const st = (typeof STATUSES !== 'undefined') ? STATUSES[g.id] : null;
    const subs = (g.market || []).filter(m=> typeof subMatchesMine === 'function' && subMatchesMine(m.svc));
    const backlog = (typeof STATUSES !== 'undefined') ? Object.values(STATUSES).filter(s=> s === 'backlog' || s === 'playing').length : 0;
    const verified = g.m === 'V' && g.tier !== 'ND';

    // ---- punteggi parziali ----
    let q = 0;                                                   // qualità
    if(verified){ q = g.score >= 88 ? 3 : g.score >= 80 ? 2 : g.score >= 70 ? 1 : g.score >= 60 ? 0 : -2;
      R.push({t: g.score >= 80 ? 'ok' : g.score >= 65 ? 'warn' : 'bad', text: `Voto ${g.score} verificato (${g.vs || 'AniList'})`}); }
    else { q = 0; R.push({t: 'warn', text: 'Voto non verificato: è solo una stima'}); }

    let f = null;                                                // affinità coi tuoi gusti
    if(dna){ f = dna.pct >= 75 ? 3 : dna.pct >= 60 ? 2 : dna.pct >= 45 ? 1 : dna.pct >= 30 ? 0 : -2;
      R.push({t: dna.pct >= 60 ? 'ok' : dna.pct >= 40 ? 'warn' : 'bad', text: `Compatibilità con i tuoi gusti ${dna.pct}%`});
      if(dna.avoidTags.length){ f -= 1; R.push({t: 'bad', text: 'Somiglia a titoli che hai mollato (' + dna.avoidTags.map(t=> TAG_INFO[t] ? TAG_INFO[t].label : t).join(', ') + ')'}); } }
    else R.push({t: 'info', text: 'Segna qualche titolo come preferito o ' + K.done_l + ': il verdetto diventerà su misura per te'});

    let lang = 0;                                                // italiano
    if(l.it === 'D' || l.it === 'S'){ lang = 1; R.push({t: 'ok', text: watch ? (l.it === 'D' ? 'Doppiato in italiano' : 'Sottotitoli in italiano') : 'Pubblicato in italiano'}); }
    else if(l.it === 'N'){ lang = -1; R.push({t: 'warn', text: 'Niente edizione italiana ufficiale'}); }
    else if(l.it === 'F'){ R.push({t: 'info', text: watch ? 'In italiano solo con i fansub' : 'In italiano solo con le scan amatoriali'}); }

    let t = 0; const hrs = l.h != null ? l.h : e.hoursMain;      // durata
    if(hrs && hrs >= 80 && (f == null || f < 2)){ t = -1; R.push({t: 'warn', text: `Lungo (circa ${hrs} ore): impegnativo se non ti convince del tutto`}); }
    else if(hrs) R.push({t: 'info', text: `Si ${watch ? 'guarda' : 'legge'} in circa ${hrs} ${hrs === 1 ? 'ora' : 'ore'}`});
    if(l.g >= 4) R.push({t: 'warn', text: 'Tanti filler: si possono saltare'});

    let b = 0;                                                   // coda
    if(backlog >= 15){ b = -1; R.push({t: 'warn', text: `Hai già ${backlog} titoli da vedere/leggere o in corso`}); }
    if(subs.length) R.push({t: 'ok', text: 'È su ' + subs.map(m=> m.svc).join(', ') + ' (un tuo servizio)'});

    // ---- decisione ----
    const sum = q + (f == null ? 0 : f) + lang + t + b;
    let kind, title, sub;
    if(st === 'played' || st === 'playing'){
      kind = 'own'; title = st === 'playing' ? (watch ? 'Lo stai guardando' : 'Lo stai leggendo') : 'Già ' + K.done_l; sub = 'Ce l\'hai già fatta: dagli il tuo voto se non l\'hai ancora fatto.';
    } else if(st === 'dropped'){
      kind = 'skip'; title = 'L\'hai già mollato'; sub = 'Lo hai abbandonato una volta: riprovarci ha senso solo se ti hanno detto che migliora più avanti.';
    } else if(verified && q <= -2){
      kind = 'skip'; title = 'Lascia stare'; sub = 'Il pubblico lo ha bocciato: ci sono titoli migliori per lo stesso tempo.';
    } else if(f != null && f <= -1){
      kind = 'skip'; title = 'Lascia stare'; sub = 'Non sembra fare per te: assomiglia a ciò che ti piace poco.';
    } else if(!verified && f == null){
      kind = 'unsure'; title = 'Mancano i dati'; sub = 'Voto non verificato e ancora pochi gusti registrati: non posso consigliarti con sicurezza.';
    } else if(sum >= 6){
      kind = 'buy'; title = 'Da ' + K.verb.replace('guardare', 'vedere') + ' subito'; sub = 'Titolo di qualità e in linea coi tuoi gusti.';
    } else if(sum >= 4){
      kind = subs.length ? 'try' : 'wait'; title = 'Mettilo in lista'; sub = 'Buon titolo per te: quando hai tempo, vale la pena.';
    } else if(sum >= 2){
      kind = 'wait'; title = 'Non è urgente'; sub = 'Va bene ma non eccelle per te: tienilo per quando cerchi qualcosa di diverso.';
    } else {
      kind = 'skip'; title = 'Lascia stare'; sub = 'Nel complesso ha più motivi contro che a favore.';
    }
    const order = {bad: 0, warn: 1, ok: 2, info: 3};
    const reasons = R.slice().sort((a, b)=> order[a.t] - order[b.t]).slice(0, 6);
    return {kind, title, sub, reasons, target: null, score: sum};
  }

  const GLYPH = {buy: '✓', wait: '⏳', try: '▶', skip: '✕', unsure: '?', own: '★'};
  function card(g){
    const v = verdict(g);
    const why = v.reasons.map(r=> `<li class="vd-${r.t}">${esc(r.text)}</li>`).join('');
    return `<div class="vd-card vd-${v.kind}" id="vdCard">
      <div class="vd-head"><span class="vd-ic" aria-hidden="true">${GLYPH[v.kind]}</span><div class="vd-ttl"><small>Vale la pena?</small><b>${esc(v.title)}</b></div></div>
      <div class="vd-sub">${esc(v.sub)}${v.target ? ` <b>Aspetta di vederlo a circa ${eur(v.target)}.</b>` : ''}</div>
      ${v.target ? `<div class="vd-act"><button type="button" class="btn" id="vdAlert">${(()=>{ let t = null; try{ t = (JSON.parse(localStorage.getItem('atl_wishlist') || '{}') || {})[g.id]; }catch(e){} return t && t.th ? '🔔 Avviso a ' + eur(t.th) + ' attivo' : '🔔 Avvisami a ' + eur(v.target); })()}</button></div>` : ''}
      <ul class="vd-why">${why}</ul>
    </div>`;
  }
  const chip = g=>{ const v = verdict(g); return `<div class="vd-chiprow"><span class="vd-chip vd-${v.kind}" title="${esc(v.sub)}"><i>${GLYPH[v.kind]}</i> ${esc(v.title)}</span></div>`; };
  window.rtVerdict = verdict; window.rtVerdictCard = card;

  // nella scheda del titolo: chip sotto il titolo (sempre visibile in alto) e scheda completa prima dei generi
  const origOpen = window.openModal;
  function put(g, onlyMissing){
    const cardEl = document.getElementById('modalCard'); if(!cardEl || !g) return;
    if(onlyMissing && cardEl.querySelector('#vdCard') && cardEl.querySelector('.vd-chiprow')) return;
    cardEl.querySelectorAll('#vdCard, .vd-chiprow').forEach(n=> n.remove());
    const head = cardEl.querySelector('.modal-head'), tags = cardEl.querySelector('.modal-tags');
    if(head) head.insertAdjacentHTML('afterend', chip(g));
    if(tags) tags.insertAdjacentHTML('beforebegin', card(g));
    const ab = cardEl.querySelector('#vdAlert');
    if(ab) ab.addEventListener('click', ()=>{ const v = verdict(g); if(window.rtWishThreshold && v.target){ window.rtWishThreshold(g, v.target); ab.textContent = '🔔 Avviso a ' + eur(v.target) + ' attivo'; if(window.rtHaptic) window.rtHaptic('success'); } });
  }
  window.openModal = function(g){
    const r = origOpen.apply(this, arguments);
    try{
      put(g, false);
      // se la scheda viene ridisegnata da un altro pezzo dell'app (copertina o dettagli che arrivano), rimetto il verdetto che è sparito
      const again = ()=>{ try{ if(typeof currentModalGame !== 'undefined' && currentModalGame && currentModalGame.id === g.id && document.getElementById('modalBackdrop').classList.contains('show')) put(g, true); }catch(e){} };
      setTimeout(again, 900); setTimeout(again, 3200);
    }catch(e){ try{ console.error(e); }catch(x){} }
    return r;
  };
  try{ openModal = window.openModal; }catch(e){}

  // anche Chiedi ragiona con lo stesso verdetto (così a voce/foto ti dice la stessa cosa della scheda)
  try{
    if(typeof askToolGetGameDetails === 'function'){
      const o = askToolGetGameDetails;
      askToolGetGameDetails = function(input){ const out = o.apply(this, arguments); try{ const g = GAMES.find(x=> x.id === parseInt(input && input.id, 10)); if(g && out && !out.error){ const v = verdict(g); out.verdictAcquisto = {esito: v.title, spiegazione: v.sub, motivi: v.reasons.map(x=> x.text), prezzoObiettivo: v.target}; } }catch(e){} return out; };
    }
    if(typeof askGameCard === 'function'){
      const o2 = askGameCard;
      askGameCard = function(g){ const out = o2.apply(this, arguments); try{ const v = verdict(g); out.verdictAcquisto = v.title; }catch(e){} return out; };
    }
  }catch(e){}
})();
