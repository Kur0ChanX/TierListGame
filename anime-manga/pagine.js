// ---- v210: le sezioni della barra in basso (Scopri, Novità, Mia tier, Saghe, Statistiche) sono PAGINE a tutto schermo ----
// Prima comparivano sotto la parte alta della classifica (logo, ricerca, filtri, Oggi…), come una scheda a metà schermo.
// Ora: entrando in una sezione la parte alta sparisce, in cima c'è una testata con «‹ Classifica» e il nome della sezione,
// la pagina parte dall'inizio e, tornando alla classifica, si ritrova il punto dove eri. Il tasto/gesto «indietro» del telefono
// riporta alla classifica (non esce dal programma). L'animazione di passaggio la fa motion.js (View Transitions);
// dove il browser non le ha, entra comunque con una dissolvenza leggera.
(function(){
  'use strict';
  if(typeof window.setView !== 'function') return;
  const body = document.body, html = document.documentElement, wrap = document.querySelector('.wrap');
  if(!wrap) return;
  const TITLES = {discover: 'Scopri', novita: 'Novità', novitagenere: 'Novità per genere', mytier: 'La mia tier list', saga: 'Saghe', stats: 'Statistiche'};
  const PANEL = {discover: 'discoverPanel', novita: 'novitaPanel', novitagenere: 'novitaGenrePanel', mytier: 'myTierWrap', saga: 'sagaPanel', stats: 'statsPanel'};
  const ICON = {novitagenere: 'novita'};
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

  const head = document.createElement('div');
  head.id = 'rtPageHead'; head.className = 'pg-head'; head.hidden = true;
  head.innerHTML = '<button type="button" class="pg-back" aria-label="Torna alla classifica"><span class="pg-chev" aria-hidden="true">‹</span><span class="pg-bl">Classifica</span></button>' +
    '<div class="pg-title"><span class="pg-ic" aria-hidden="true"></span><b></b></div><button type="button" class="pg-filt" hidden></button>';
  wrap.insertBefore(head, wrap.firstChild);
  const backBtn = head.querySelector('.pg-back'), titleEl = head.querySelector('.pg-title b'), icEl = head.querySelector('.pg-ic'), filtBtn = head.querySelector('.pg-filt');

  const goList = ()=>{
    const v = (typeof state !== 'undefined' && state.view) || 'list';
    const to = v === 'novitagenere' ? 'novita' : 'list';
    const tab = document.querySelector('.view-tab[data-view="' + to + '"]');
    if(tab) tab.click(); else window.setView(to);                 // il clic passa da motion.js: stessa animazione della barra in basso
  };
  backBtn.addEventListener('click', goList);
  filtBtn.addEventListener('click', ()=>{ const rb = document.getElementById('resetBtn'); if(rb) rb.click(); refreshFilt(); });

  // filtri della classifica ancora attivi (contano anche per Saghe e Scopri): lo dico in testata, con «togli» a portata di dito
  function refreshFilt(){
    const fb = document.getElementById('filtersBadge'), n = fb && !fb.hidden ? (fb.textContent || '').trim() : '';
    const v = (typeof state !== 'undefined' && state.view) || 'list';
    const show = !!n && n !== '0' && (v === 'saga' || v === 'discover' || v === 'stats');
    filtBtn.hidden = !show;
    if(show) filtBtn.innerHTML = '⚙️ ' + esc(n) + ' filtri · <u>togli</u>';
  }

  function paint(v){
    const page = v && v !== 'list' && TITLES[v];
    body.classList.toggle('rt-page', !!page);
    head.hidden = !page;
    if(!page) return;
    titleEl.textContent = TITLES[v];
    head.querySelector('.pg-bl').textContent = v === 'novitagenere' ? 'Novità' : 'Classifica';
    const tab = document.querySelector('.view-tab[data-view="' + (ICON[v] || v) + '"] .vt-ic svg');
    icEl.innerHTML = tab ? tab.outerHTML : '';
    refreshFilt();
  }


  // il segno nella cronologia: «indietro» del telefono = torna alla classifica
  // v217: il segno non si toglie più con un «indietro» (arrivava in ritardo e poteva chiudere il titolo appena aperto): lo spengo sul posto e lo riuso
  const markPage = ()=>{ try{ const st = history.state; if(st && st.rtpage) return; if(st && st.rtdead) history.replaceState({rtpage: 1}, ''); else history.pushState({rtpage: 1}, ''); }catch(e){} };
  const unmarkPage = ()=>{ try{ if(history.state && history.state.rtpage) history.replaceState({rtdead: 1}, ''); }catch(e){} };
  // v217: gli «indietro» lanciati dal programma (fx.js, per togliere i segni delle finestre) arrivano un attimo dopo: li riconosco e non chiudono niente.
  // Il primo ascoltatore che vede l'evento decide, gli altri leggono la stessa risposta.
  window.rtSelfPop = e=>{ if(e.__rtSelf === undefined){ e.__rtSelf = (window.__rtSelfPops || 0) > 0; if(e.__rtSelf) window.__rtSelfPops--; } return e.__rtSelf; };
  window.addEventListener('popstate', e=>{
    if(window.rtSelfPop(e)) return;
    const v = (typeof state !== 'undefined' && state.view) || 'list';
    if(v === 'list') return;
    const st = e.state;
    if(st && (st.rtpage || st.rtov)) return;                        // è solo una finestra che si chiude: resto nella pagina
    if(document.querySelector('[id$="Backdrop"].show, .dup-backdrop.show')) return;
    window.setView('list');                                         // v212: subito, senza animazione
  });

  // v212: ogni sezione (anche la Classifica) si apre SEMPRE in cima, di colpo: niente scorrimenti animati, niente posizione ricordata, niente righe che scendono
  const PANELS = ['tableWrap', 'altView', 'myTierWrap', 'statsPanel', 'sagaPanel', 'discoverPanel', 'novitaPanel', 'novitaGenrePanel'];
  function toTop(){
    try{ window.scrollTo({top: 0, left: 0, behavior: 'instant'}); }catch(e){ try{ window.scrollTo(0, 0); }catch(x){} }
    PANELS.forEach(id=>{ const el = document.getElementById(id); if(el && el.offsetParent !== null && el.scrollTop) try{ el.scrollTo({top: 0, behavior: 'instant'}); }catch(e){ el.scrollTop = 0; } });
  }
  window.rtViewTop = toTop;
  let LISTVIS = null;
  const prev = window.setView;
  window.setView = function(v){
    const from = (typeof state !== 'undefined' && state.view) || 'list';
    window.__rtInstantViews = true; window.__rtViewSwitch = true;
    const twE = document.getElementById('tableWrap'), avE = document.getElementById('altView');
    if(from === 'list' && v !== 'list'){ LISTVIS = {tw: !!(twE && twE.style.display !== 'none'), av: !!(avE && avE.style.display !== 'none')}; }
    let r;
    try{ toTop(); r = prev.apply(this, arguments); }
    finally{ window.__rtViewSwitch = false; }
    try{
      // v216: nelle altre pagine la classifica resta «addormentata» al suo posto (vedi CSS body.rt-page #tableWrap): rimetto visibile quella che c'era
      if(v !== 'list' && LISTVIS){ if(twE && LISTVIS.tw) twE.style.display = ''; if(avE && LISTVIS.av) avE.style.display = ''; }
      paint(v);
      try{ if(window.rtAnim && v !== from) rtAnim.section(); }catch(e){}                       // v218: entrata della sezione secondo lo stile scelto
      requestAnimationFrame(toTop);                                 // le sezioni nascoste ripartono già da 0 da sole; qui solo una verifica a disegno fatto (costa zero)                                 // se qualcosa nella pagina nuova prova a spostarla, la rimetto in cima
      if(v !== 'list' && v !== from) markPage();
      else if(v === 'list' && from !== 'list') unmarkPage();
    }catch(e){}
    return r;
  };
  try{ setView = window.setView; }catch(e){}
  try{ if(typeof state !== 'undefined' && state.view && state.view !== 'list'){ paint(state.view); markPage(); } }catch(e){}
  document.addEventListener('change', ()=>{ if(body.classList.contains('rt-page')) refreshFilt(); });

  // scheda del titolo: quando la barra «Per te / Il titolo / Altro» resta ferma in alto, riempio lo spazio sopra di lei (classe .stuck)
  const card = document.getElementById('modalCard');
  if(card){
    let raf = 0;
    const check = ()=>{
      raf = 0;
      const t = card.querySelector('.cd-tabs'); if(!t) return;
      const top = parseFloat(getComputedStyle(t).top) || 0, cs = getComputedStyle(card);
      const lim = card.getBoundingClientRect().top + (parseFloat(cs.paddingTop) || 0) + top + 1;
      t.classList.toggle('stuck', card.scrollTop > 4 && t.getBoundingClientRect().top <= lim);
    };
    let stopT = 0;
    card.addEventListener('scroll', ()=>{
      if(!raf) raf = requestAnimationFrame(check);
      // v216: «sto scorrendo»: le animazioni pesanti della scheda (foto della modalità cinema) si fermano finché non ti fermi
      if(!window.__rtCardScrolling){ window.__rtCardScrolling = true; card.classList.add('scrolling'); }
      clearTimeout(stopT); stopT = setTimeout(()=>{ window.__rtCardScrolling = false; card.classList.remove('scrolling'); }, 220);
    }, {passive: true});
  }
})();
