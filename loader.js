// ---- Barra di caricamento stile JRPG con Frugu Frugu ----
// Si accende da sola per ogni richiesta all'AI (ricerche, Novità, Aggiorna info, Chiedi, voce, wishlist) avvolgendo askLLM,
// e può essere guidata a mano dove i passi sono contabili: Progress.set(0-100, "testo") con Progress.begin/end.
// Nelle richieste all'AI la percentuale è STIMATA (il tempo di risposta non si conosce: il simbolo ~ lo dice); quando i passi
// sono contati (copertine, verifica generi) è esatta.
(function(){
  const GIF = 'icons/frugu-hd.gif';
  const FLAVOR = ['Frugu Frugu fruga tra i giochi…', 'Consulto le fonti…', 'Leggo le recensioni…', 'Controllo i dettagli…', 'Quasi fatto: metto in ordine il bottino…'];
  let logText = '', cnt = null, stopFn = null, el = null, depth = 0, exact = false, pct = 0, target = 0, label = '', t0 = 0, timer = 0, hideT = 0, raf = 0, manual = 0;

  function build(){
    el = document.createElement('div'); el.className = 'rt-loader'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = `<div class="rt-pet"><img alt="" width="120" height="94" decoding="async"></div>
      <div class="rt-main"><div class="rt-title"></div><div class="rt-sub"></div>
      <div class="rt-count" hidden></div>
      <div class="rt-row"><span class="rt-tag">PE</span><div class="rt-bar"><i></i></div><b class="rt-pct">0%</b></div>
      <button class="rt-stop" type="button" hidden>Basta frugare! Mostra bottino</button></div>
      <button class="rt-x" type="button" aria-label="Nascondi">✕</button>`;
    document.body.appendChild(el);
    el.querySelector('.rt-x').addEventListener('click', ()=> el.classList.remove('show'));
    el.querySelector('.rt-stop').addEventListener('click', ()=>{ const f = stopFn; if(f){ el.querySelector('.rt-stop').disabled = true; try{ f(); }catch(e){} } });
    return el;
  }
  function paint(){
    if(!el) return;
    const shown = Math.max(0, Math.min(100, Math.round(pct)));
    el.querySelector('.rt-bar i').style.width = shown + '%';
    const waiting = overdue && !exact && depth > 0;
    el.querySelector('.rt-pct').textContent = waiting ? Math.round((performance.now() - t0) / 1000) + 's' : (exact ? '' : '~') + shown + '%';
    el.classList.toggle('waiting', waiting);
    const el2 = Math.round((performance.now() - t0) / 1000);
    el.querySelector('.rt-title').textContent = label;
    const cEl = el.querySelector('.rt-count'); cEl.hidden = !cnt; if(cnt) cEl.textContent = `🗑️ Giochi trovati nel bidone: ${cnt.n} / ${cnt.max}`;
    const sEl = el.querySelector('.rt-stop'); sEl.hidden = !stopFn;
    el.querySelector('.rt-sub').textContent = logText ? logText : waiting ? 'Ci sta mettendo più del solito: sto ancora aspettando la risposta…' : FLAVOR[Math.min(FLAVOR.length - 1, Math.floor(shown / 22))] + (el2 >= 4 ? ` · ${el2}s` : '');
    el.classList.toggle('done', shown >= 100);
  }
  // Stima calibrata: per ogni richiesta uso la durata media REALE delle volte scorse (salvata per tipo di ricerca).
  // Con più richieste in parallelo la percentuale sale davvero quando una finisce. Se una richiesta supera il tempo abituale
  // non resto fermo su un numero finto: passo a "sto ancora cercando…" con i secondi e la barra che scorre.
  const AVG_KEY = 'jrpg_rt_avg';
  const avgs = ()=>{ try{ return JSON.parse(localStorage.getItem(AVG_KEY) || '{}') || {}; }catch(e){ return {}; } };
  const expectedFor = (lb, search)=> avgs()[lb] || (search ? 14 : 7);
  const learn = (lb, sec)=>{ try{ const m = avgs(); m[lb] = m[lb] ? Math.round((m[lb] * 0.6 + sec * 0.4) * 10) / 10 : sec; localStorage.setItem(AVG_KEY, JSON.stringify(m)); }catch(e){} };
  let calls = [], sessionDone = 0, overdue = false;
  function estimate(){
    const now = performance.now(); let partial = 0; overdue = false;
    calls.forEach(c=>{
      const el = (now - c.t0) / 1000, ex = c.expected;
      const p = el <= ex ? 0.9 * (el / ex) : 0.9 + 0.05 * (1 - Math.exp(-(el - ex) / ex));
      partial += Math.min(0.95, p);
      if(el > ex * 1.15) overdue = true;
    });
    const total = calls.length + sessionDone;
    return total ? (sessionDone + partial) / total * 100 : 0;
  }
  function tick(){
    raf = 0;
    if(!exact && depth > 0) target = Math.max(target, estimate());
    pct += (target - pct) * 0.12 + (target > pct ? 0.05 : 0);
    if(pct > target) pct = target;
    paint();
    if(el && el.classList.contains('show') && (depth > 0 || manual > 0 || pct < 100)) raf = requestAnimationFrame(tick);
  }
  function open(txt){
    clearTimeout(hideT);
    if(!el) build();
    const img = el.querySelector('img'); if(!img.getAttribute('src')) img.src = GIF;
    if(!el.classList.contains('show')){ pct = 0; target = 0; t0 = performance.now(); }
    if(txt) label = txt;
    el.classList.add('show'); el.classList.remove('done');
    paint(); if(!raf) raf = requestAnimationFrame(tick);
  }
  function close(){
    clearTimeout(hideT);
    hideT = setTimeout(()=>{                       // piccola attesa: se parte subito un'altra richiesta la barra continua (niente lampeggi)
      if(depth > 0 || manual > 0) return;
      target = 100; exact = true;
      const fin = ()=>{ if(pct < 99.5 && el.classList.contains('show')){ requestAnimationFrame(fin); return; } setTimeout(()=>{ if(depth === 0 && manual === 0 && el){ el.classList.remove('show'); exact = false; logText = ''; cnt = null; stopFn = null; } }, 500); };
      if(!raf) raf = requestAnimationFrame(tick); fin();
    }, 650);
  }
  window.Progress = {
    begin(txt){ manual++; exact = true; open(txt); },
    set(p, txt){ exact = true; target = Math.max(target, Math.min(100, p)); if(txt) label = txt; open(); },
    end(){ manual = Math.max(0, manual - 1); if(!manual) close(); },
    log(t){ logText = t || ''; if(el) paint(); },                       // riga di log a tema Frugu Frugu (fonte attuale, giochi trovati…)
    counter(n, max){ cnt = (n == null) ? null : {n, max}; if(el) paint(); },
    onStop(fn){ stopFn = fn || null; if(el){ const b = el.querySelector('.rt-stop'); if(b){ b.disabled = false; b.hidden = !fn; } } },
    reset(){ logText = ''; cnt = null; stopFn = null; if(el) paint(); }
  };
  // ogni richiesta all'AI accende la barra (tranne quelle "silent" in background)
  if(typeof window.askLLM === 'function'){
    const orig = window.askLLM;
    window.askLLM = function(input, opts, extra){
      extra = extra || {};
      if(extra.silent) return orig.apply(this, arguments);
      const lb = extra.label || (extra.search ? 'Cerco online…' : 'Sto pensando…');
      const rec = {t0: performance.now(), label: lb, expected: expectedFor(lb, !!extra.search)};
      if(depth === 0){ calls = []; sessionDone = 0; target = Math.max(0, pct < 100 ? target : 0); }
      calls.push(rec); depth++; if(manual === 0) exact = false;
      open(lb);
      const finish = ok=>{
        if(ok) learn(lb, (performance.now() - rec.t0) / 1000);
        calls = calls.filter(c=> c !== rec); sessionDone++; depth--;
        if(depth <= 0){ depth = 0; close(); }
      };
      let p; try{ p = orig.apply(this, arguments); }catch(e){ finish(false); throw e; }
      return Promise.resolve(p).then(r=>{ finish(true); return r; }, e=>{ finish(false); throw e; });
    };
  }
  // scarica la GIF ad alta risoluzione a riposo, così è già pronta quando serve
  const idle = window.requestIdleCallback || (f=> setTimeout(f, 4000));
  idle(()=>{ try{ if(!(navigator.connection && navigator.connection.saveData)){ const i = new Image(); i.src = GIF; } }catch(e){} });
})();
