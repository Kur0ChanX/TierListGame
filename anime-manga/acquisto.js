// ---- Verdetto d'acquisto: «compralo, aspetta, provalo gratis, lascialo stare» ----
// Calcolo tutto locale (nessuna AI, nessuna richiesta): combina voto e fonte, i tuoi gusti (DNA), prezzo su Steam, abbonamenti,
// andamento delle recensioni recenti, ore, lingua e quanti giochi hai già in coda. Ogni verdetto dice PERCHÉ.
(function(){
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const eur = n=> n.toLocaleString('it-IT', {style: 'currency', currency: 'EUR'});
  const ownedSet = ()=>{ try{ return new Set(JSON.parse(localStorage.getItem('atl_owned') || '[]') || []); }catch(e){ return new Set(); } };
  const SRC = {mc: 'Metacritic', oc: 'OpenCritic', rawg: 'RAWG'};

  // Il verdetto: {kind, title, sub, reasons:[{t:'ok'|'warn'|'bad'|'info', text}], target}
  function verdict(g){
    const R = [], l = g.label || {}, e = g.enrich || {};
    let dna = null;
    try{ const pr = buildTasteProfile(); dna = pr.n >= 2 ? dnaForGame(g, pr) : null; }catch(x){}
    const facts = (window.SearchHub && SearchHub.factsFor) ? SearchHub.factsFor(g) : null;
    const steam = facts && facts.s ? facts.s : null, price = steam && steam.p ? steam.p : null;
    const st = (typeof STATUSES !== 'undefined') ? STATUSES[g.id] : null;
    const owned = ownedSet().has(g.id);
    const subs = (g.market || []).filter(m=> typeof subMatchesMine === 'function' && subMatchesMine(m.svc));
    const others = (g.market || []).filter(m=> !(typeof subMatchesMine === 'function' && subMatchesMine(m.svc)));
    const backlog = (typeof STATUSES !== 'undefined') ? Object.values(STATUSES).filter(s=> s === 'backlog' || s === 'playing').length : 0;
    const verified = g.m === 'V' && g.tier !== 'ND';
    const kindSrc = typeof srcKind === 'function' ? srcKind(g) : 'mc';

    // ---- punteggi parziali ----
    let q = 0;                                                   // qualità
    if(verified){ q = g.score >= 88 ? 3 : g.score >= 80 ? 2 : g.score >= 70 ? 1 : g.score >= 60 ? 0 : -2;
      R.push({t: g.score >= 80 ? 'ok' : g.score >= 65 ? 'warn' : 'bad', text: `Voto ${g.score} verificato (${SRC[kindSrc] || 'Metacritic'})`}); }
    else { q = 0; R.push({t: 'warn', text: 'Voto non verificato: nessun Metacritic o OpenCritic trovato, è solo una stima'}); }

    let f = null;                                                // affinità coi tuoi gusti
    if(dna){ f = dna.pct >= 75 ? 3 : dna.pct >= 60 ? 2 : dna.pct >= 45 ? 1 : dna.pct >= 30 ? 0 : -2;
      R.push({t: dna.pct >= 60 ? 'ok' : dna.pct >= 40 ? 'warn' : 'bad', text: `Compatibilità con i tuoi gusti ${dna.pct}%`});
      if(dna.avoidTags.length){ f -= 1; R.push({t: 'bad', text: 'Somiglia a giochi che hai droppato (' + dna.avoidTags.map(t=> TAG_INFO[t] ? TAG_INFO[t].label : t).join(', ') + ')'}); } }
    else R.push({t: 'info', text: 'Segna qualche gioco come preferito o giocato: il verdetto diventerà su misura per te'});

    let p = 0, pr = 'sconosciuto';                               // prezzo
    if(price){
      const d = price.d || 0, fin = price.f, ini = price.i;
      if(fin === 0){ p = 2; pr = 'gratis'; R.push({t: 'ok', text: 'Su Steam è gratis'}); }
      else if(d >= 60){ p = 3; pr = 'ottimo'; R.push({t: 'ok', text: `Prezzo ottimo su Steam: ${eur(fin)} (−${d}%, prima ${eur(ini)})`}); }
      else if(d >= 40){ p = 2; pr = 'buono'; R.push({t: 'ok', text: `Buon prezzo su Steam: ${eur(fin)} (−${d}%, prima ${eur(ini)})`}); }
      else if(d >= 20 || fin <= 12){ p = 1; pr = 'discreto'; R.push({t: 'info', text: `Su Steam ${eur(fin)}${d ? ' (−' + d + '%)' : ''}`}); }
      else { p = fin > 30 ? -1 : 0; pr = 'alto'; R.push({t: 'warn', text: `Su Steam ${eur(fin)} senza sconto importante`}); }
    } else if(l.cost){
      p = l.cost === 'S' ? 1 : l.cost === 'H' ? -1 : 0; pr = l.cost === 'S' ? 'basso' : l.cost === 'H' ? 'alto' : 'medio';
      R.push({t: 'info', text: 'Prezzo indicativo ' + (l.cost === 'S' ? 'sotto i 20 €' : l.cost === 'M' ? 'tra 20 e 40 €' : 'sopra i 40 €') + ': controlla quello di oggi'});
    } else R.push({t: 'info', text: 'Prezzo non disponibile: controllalo con il link qui sotto'});

    let trend = 0;                                               // recensioni recenti Steam
    if(steam && steam.rp != null && steam.ap != null && (steam.rn || 0) >= 30){
      if(steam.rp <= steam.ap - 15){ trend = -2; R.push({t: 'bad', text: `Recensioni recenti in calo: ${steam.rp}% contro ${steam.ap}% di sempre (forse una patch o un port problematico)`}); }
      else if(steam.rp >= steam.ap + 5){ trend = 1; R.push({t: 'ok', text: `Recensioni recenti in crescita: ${steam.rp}% contro ${steam.ap}% di sempre`}); }
    }

    let lang = 0;                                                // lingua
    if(l.it === 'D' || l.it === 'S'){ lang = 1; R.push({t: 'ok', text: l.it === 'D' ? 'Testi e doppiaggio in italiano' : 'Sottotitoli in italiano'}); }
    else if(l.it === 'N'){ lang = -1; R.push({t: 'warn', text: 'Nessun italiano ufficiale'}); }
    else if(l.it === 'F'){ R.push({t: 'info', text: 'Italiano solo con traduzione dei fan'}); }

    let t = 0; const hrs = l.h != null ? l.h : e.hoursMain;      // durata
    if(hrs && hrs >= 80 && (f == null || f < 2)){ t = -1; R.push({t: 'warn', text: `Lungo (circa ${hrs} ore): impegnativo se non ti convince del tutto`}); }
    else if(hrs) R.push({t: 'info', text: `Dura circa ${hrs} ore per la storia`});

    let b = 0;                                                   // coda di giochi
    if(backlog >= 15){ b = -1; R.push({t: 'warn', text: `Hai già ${backlog} giochi da giocare o in corso`}); }

    if(subs.length) R.push({t: 'ok', text: 'Incluso in ' + subs.map(m=> m.svc).join(', ') + ' (tuo abbonamento): non serve comprarlo'});
    else if(others.length) R.push({t: 'info', text: 'Lo trovi in ' + others.map(m=> m.svc).join(', ') + ' (non tra i tuoi abbonamenti)'});
    if(l.demo === true) R.push({t: 'ok', text: 'Ha una demo gratuita per provarlo'});

    // ---- decisione ----
    const sum = q + (f == null ? 0 : f) + p + trend + lang + t + b;
    let kind, title, sub, target = null;
    if(owned || st === 'played' || st === 'playing'){
      kind = 'own'; title = owned ? 'Ce l\'hai già' : st === 'playing' ? 'Lo stai giocando' : 'Già giocato'; sub = 'Non serve comprarlo.';
    } else if(st === 'dropped'){
      kind = 'skip'; title = 'Lo hai già droppato'; sub = 'Lo hai abbandonato una volta: riprovarlo ha senso solo se è cambiato qualcosa.';
    } else if(subs.length){
      kind = 'try'; title = 'Giocalo senza spendere'; sub = 'È incluso nel tuo abbonamento: provalo lì prima di decidere.';
    } else if(l.demo === true && sum >= 1){
      kind = 'try'; title = 'Prima prova la demo'; sub = 'C\'è una demo gratuita: così capisci se fa per te.';
    } else if(verified && q <= -2){
      kind = 'skip'; title = 'Lascialo stare'; sub = 'La critica lo ha bocciato: ci sono giochi migliori per lo stesso tempo.';
    } else if(f != null && f <= -1){
      kind = 'skip'; title = 'Lascialo stare'; sub = 'Non sembra fare per te: assomiglia a ciò che ti piace poco.';
    } else if(!verified && f == null){
      kind = 'unsure'; title = 'Mancano i dati'; sub = 'Voto non verificato e ancora pochi gusti registrati: non posso consigliarti con sicurezza.';
    } else if(sum >= 6 && p >= 2){
      kind = 'buy'; title = 'Compralo'; sub = 'Gioco di qualità, in linea coi tuoi gusti e a un buon prezzo.';
    } else if(sum >= 6 && pr === 'sconosciuto'){
      kind = 'buy'; title = 'Compralo (controlla il prezzo)'; sub = 'Gioco di qualità e in linea con te: verifica solo che il prezzo sia giusto.';
    } else if(sum >= 4){
      kind = 'wait'; title = 'Aspetta uno sconto'; sub = 'Buon gioco per te, ma non c\'è fretta: a un prezzo più basso è molto meglio.';
      if(price && price.i) target = Math.round(price.i * 0.5 * 100) / 100;
    } else if(sum >= 2){
      kind = 'wait'; title = 'Non è urgente'; sub = 'Va bene ma non eccelle per te: compralo solo in forte offerta.';
      if(price && price.i) target = Math.round(price.i * 0.4 * 100) / 100;
    } else {
      kind = 'skip'; title = 'Lascialo stare'; sub = 'Nel complesso ha più motivi contro che a favore.';
    }
    if(kind === 'wait' && target && price && price.f <= target){ kind = 'buy'; title = 'Compralo adesso'; sub = 'È già al prezzo giusto.'; target = null; }

    // ordine dei motivi: prima quelli che pesano di più
    const order = {bad: 0, warn: 1, ok: 2, info: 3};
    const reasons = R.slice().sort((a, b)=> order[a.t] - order[b.t]).slice(0, 6);
    return {kind, title, sub, reasons, target, score: sum};
  }

  const GLYPH = {buy: '✓', wait: '⏳', try: '▶', skip: '✕', unsure: '?', own: '★'};
  function card(g){
    const v = verdict(g);
    const why = v.reasons.map(r=> `<li class="vd-${r.t}">${esc(r.text)}</li>`).join('');
    return `<div class="vd-card vd-${v.kind}" id="vdCard">
      <div class="vd-head"><span class="vd-ic" aria-hidden="true">${GLYPH[v.kind]}</span><div class="vd-ttl"><small>Verdetto d'acquisto</small><b>${esc(v.title)}</b></div></div>
      <div class="vd-sub">${esc(v.sub)}${v.target ? ` <b>Aspetta di vederlo a circa ${eur(v.target)}.</b>` : ''}</div>
      ${v.target ? `<div class="vd-act"><button type="button" class="btn" id="vdAlert">${(()=>{ let t = null; try{ t = (JSON.parse(localStorage.getItem('atl_wishlist') || '{}') || {})[g.id]; }catch(e){} return t && t.th ? '🔔 Avviso a ' + eur(t.th) + ' attivo' : '🔔 Avvisami a ' + eur(v.target); })()}</button></div>` : ''}
      <ul class="vd-why">${why}</ul>
    </div>`;
  }
  const chip = g=>{ const v = verdict(g); return `<div class="vd-chiprow"><span class="vd-chip vd-${v.kind}" title="${esc(v.sub)}"><i>${GLYPH[v.kind]}</i> ${esc(v.title)}</span></div>`; };
  window.rtVerdict = verdict; window.rtVerdictCard = card;

  // nella scheda del gioco: chip sotto il titolo (sempre visibile in alto) e scheda completa prima dei generi
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
