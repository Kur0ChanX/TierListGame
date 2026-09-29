// ---- Barra di caricamento stile JRPG con Frugu Frugu ----
// Si accende da sola per ogni richiesta all'AI (ricerche, Novità, Aggiorna info, Chiedi, voce, wishlist) avvolgendo askLLM,
// e può essere guidata a mano dove i passi sono contabili: Progress.set(0-100, "testo") con Progress.begin/end.
// Nelle richieste all'AI la percentuale è STIMATA (il tempo di risposta non si conosce: il simbolo ~ lo dice); quando i passi
// sono contati (copertine, verifica generi) è esatta.
(function(){
  const GIF = 'icons/frugu-hd.gif';
  const FLAVOR = ['Frugu Frugu fruga tra i giochi…', 'Consulto le fonti…', 'Leggo le recensioni…', 'Controllo i dettagli…', 'Quasi fatto: metto in ordine il bottino…'];
  let el = null, depth = 0, exact = false, pct = 0, target = 0, label = '', t0 = 0, timer = 0, hideT = 0, raf = 0, manual = 0;

  function build(){
    el = document.createElement('div'); el.className = 'rt-loader'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = `<div class="rt-pet"><img alt="" width="120" height="94" decoding="async"></div>
      <div class="rt-main"><div class="rt-title"></div><div class="rt-sub"></div>
      <div class="rt-row"><span class="rt-tag">PE</span><div class="rt-bar"><i></i></div><b class="rt-pct">0%</b></div></div>
      <button class="rt-x" type="button" aria-label="Nascondi">✕</button>`;
    document.body.appendChild(el);
    el.querySelector('.rt-x').addEventListener('click', ()=> el.classList.remove('show'));
    return el;
  }
  function paint(){
    if(!el) return;
    const shown = Math.max(0, Math.min(100, Math.round(pct)));
    el.querySelector('.rt-bar i').style.width = shown + '%';
    el.querySelector('.rt-pct').textContent = (exact ? '' : '~') + shown + '%';
    const el2 = Math.round((performance.now() - t0) / 1000);
    el.querySelector('.rt-title').textContent = label;
    el.querySelector('.rt-sub').textContent = FLAVOR[Math.min(FLAVOR.length - 1, Math.floor(shown / 22))] + (el2 >= 4 ? ` · ${el2}s` : '');
    el.classList.toggle('done', shown >= 100);
  }
  function tick(){
    raf = 0;
    if(!exact && depth > 0){                       // stima: sale veloce all'inizio e rallenta verso il 95%
      const t = (performance.now() - t0) / 1000;
      target = Math.max(target, 95 * (1 - Math.exp(-t / 9)));
    }
    pct += (target - pct) * 0.12 + (target > pct ? 0.05 : 0);   // scorrimento morbido verso il valore
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
      const fin = ()=>{ if(pct < 99.5 && el.classList.contains('show')){ requestAnimationFrame(fin); return; } setTimeout(()=>{ if(depth === 0 && manual === 0 && el){ el.classList.remove('show'); exact = false; } }, 500); };
      if(!raf) raf = requestAnimationFrame(tick); fin();
    }, 650);
  }
  window.Progress = {
    begin(txt){ manual++; exact = true; open(txt); },
    set(p, txt){ exact = true; target = Math.max(target, Math.min(100, p)); if(txt) label = txt; open(); },
    end(){ manual = Math.max(0, manual - 1); if(!manual) close(); }
  };
  // ogni richiesta all'AI accende la barra (tranne quelle "silent" in background)
  if(typeof window.askLLM === 'function'){
    const orig = window.askLLM;
    window.askLLM = function(input, opts, extra){
      extra = extra || {};
      if(extra.silent) return orig.apply(this, arguments);
      depth++; if(manual === 0) exact = false;
      open(extra.label || (extra.search ? 'Cerco online…' : 'Sto pensando…'));
      let p; try{ p = orig.apply(this, arguments); }catch(e){ depth--; if(!depth) close(); throw e; }
      return Promise.resolve(p).finally(()=>{ depth--; if(depth <= 0){ depth = 0; close(); } });
    };
  }
  // scarica la GIF ad alta risoluzione a riposo, così è già pronta quando serve
  const idle = window.requestIdleCallback || (f=> setTimeout(f, 4000));
  idle(()=>{ try{ if(!(navigator.connection && navigator.connection.saveData)){ const i = new Image(); i.src = GIF; } }catch(e){} });
})();
