// ---- Sintonia con i tuoi gusti (v198) ----
// Quanto un gioco fa per te, in %. Due ingredienti:
//  1) i tuoi gusti più forti che il gioco ha (generi, tratti del DNA, struttura) — «copertura»;
//  2) quanto somiglia ai giochi che AMI davvero (preferiti, voti alti) — «somiglianza»: così un gioco fuori genere ma vicino a un tuo amato sale.
// Un gioco che ami già (preferito o voto alto) non viene «indovinato»: lo dico chiaramente e la % lo rispecchia.
// Usa il modello dei gusti di extras3.js e la somiglianza di dna.js (window.rtSimNorm). Niente AI, tutto sul dispositivo.
(function(){
  'use strict';
  if(window.RT_OFF && window.RT_OFF.gusto) return;
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const cap = s=>{ s = String(s || ''); return s ? s[0].toUpperCase() + s.slice(1) : s; };
  const ICON = {diff: '🔥', grind: '⏳', storia: '📖', ritmo: '🐢', ore: '🕐'};
  const iconOf = k=>{ const [a, b] = k.split(':'); let t = null; try{ t = typeof TAG_INFO !== 'undefined' ? TAG_INFO : null; }catch(e){} if(a === 'mech' && window.rtMech && window.rtMech[b]) return window.rtMech[b].ic; if(a === 'mine') return '✍️'; return a === 'tag' ? ((t && t[b] && t[b].icon) || '•') : (ICON[a] || '•'); };
  const labOf = k=> cap(String(window.rtFLAB ? window.rtFLAB(k) : k));
  // coppie che dicono la stessa cosa: ne tengo una sola (prima «Storia che coinvolge» e «storia forte» comparivano entrambe)
  const SAME = {'storia:forte': 'mech:STORY'};

  let AXtm = null, AXc = null, SINT = new Map();
  function axes(){
    const tm = window.rtTasteModel && window.rtTasteModel(); if(!tm || tm.n < 3) return null;
    if(tm === AXtm) return AXc;                      // stesso modello dei gusti: riuso il calcolo (serve quando si ordinano centinaia di giochi)
    SINT = new Map();
    let e = Object.entries(tm.wts).filter(([k])=> tm.cnt[k] >= 2 && tm.wts[k] > .2 && k.indexOf('epoca') !== 0).sort((a, b)=> b[1] - a[1]);
    const keys = new Set(e.map(x=> x[0])); e = e.filter(([k])=> !(SAME[k] && keys.has(SAME[k]))).slice(0, 10);
    if(e.length < 4){ AXtm = tm; AXc = null; return null; }
    const hi = e[0][1], lo = e[e.length - 1][1], span = (hi - lo) || 1;
    AXtm = tm; AXc = {tm, ax: e.map(([k, w])=> ({k, w: .36 + .64 * ((w - lo) / span), full: labOf(k), icon: iconOf(k)}))}; return AXc;
  }
  // i giochi che ami (per la somiglianza): preferiti, voti alti, in cima alla tua tier
  const loved = tm=> tm.sig.filter(x=> x.w >= .9).sort((a, b)=> b.w - a.w).slice(0, 60);
  window.rtSintonia = function(g){
    let r; try{ r = axes(); }catch(e){ return null; } if(!r || !g) return null;
    if(SINT.has(g.id)) return SINT.get(g.id);
    const {tm, ax} = r, has = new Set(window.rtFeats(g));
    const raw = a=> Math.max(0, tm.wts[a.k] || 0), tot = ax.reduce((s, a)=> s + raw(a), 0) || 1, got = ax.filter(a=> has.has(a.k)).reduce((s, a)=> s + raw(a), 0);
    const cov = got / tot;
    const neg = Object.entries(tm.wts).filter(([k, w])=> tm.cnt[k] >= 2 && w < -.25 && has.has(k)).sort((a, b)=> a[1] - b[1]).slice(0, 3);
    const penalty = neg.reduce((s, [, w])=> s + Math.min(.6, -w), 0) / tot;
    // somiglianza con i giochi che ami (i 3 più vicini, pesati per quanto li ami)
    let near = [], sim = 0;
    if(window.rtSimNorm){
      near = loved(tm).filter(x=> x.g.id !== g.id).map(x=> ({g: x.g, s: window.rtSimNorm(g, x.g) * Math.min(1, .55 + x.w / 5)})).sort((a, b)=> b.s - a.s).slice(0, 3);
      sim = near.length ? (near[0].s * .5 + (near[1] ? near[1].s : 0) * .3 + (near[2] ? near[2].s : 0) * .2) : 0;
    }
    let pct = Math.round(100 * ((window.rtSimNorm ? .4 * cov + .6 * Math.min(1, sim * 1.35) : cov) - penalty * .5));
    // qualità: la sintonia è per consigliare, quindi un gioco mediocre non può risultare «perfetto per te» (non essere permissivo)
    const sc = +g.score || 0, q = sc >= 85 ? 1 : sc >= 78 ? .94 : sc >= 70 ? .84 : sc >= 60 ? .72 : sc ? .6 : .9;
    pct = Math.round(pct * q);
    // quello che SAI già: un gioco che ami non va indovinato, uno che hai mollato nemmeno
    const own = (tm.sig.find(x=> x.g.id === g.id) || {}).w || 0;
    let known = '';
    if(own >= 1.8){ known = 'love'; pct = Math.max(pct, Math.min(99, 90 + Math.round(own * 2))); }
    else if(own <= -1){ known = 'drop'; pct = Math.min(pct, 30); }
    pct = Math.max(0, Math.min(100, pct));
    const approved = pct >= 85 && !neg.length && tm.n >= 6 && known !== 'drop';
    const out = {pct, neg, tm, ax, has, approved, known, near: near.filter(x=> x.s >= .35), n: ax.filter(a=> has.has(a.k)).length, cov};
    SINT.set(g.id, out); return out;
  };
  function symbols(g, tm){
    const e = (g && g.enrich) || {}, out = [];
    let info = null; try{ info = typeof STORY_TAG_INFO !== 'undefined' ? STORY_TAG_INFO : null; }catch(x){}
    const likeStory = ['storia:forte', 'mech:STORY', 'mech:CHAR', 'tag:JRPG', 'tag:VN'].some(k=> (tm.wts[k] || 0) > .2), likeDopa = ['mech:DOPA', 'mech:LOOT', 'mech:POWER'].some(k=> (tm.wts[k] || 0) > .2);
    if(e.storyTag && info && info[e.storyTag]) out.push(`<div class="gs2-sym"><span class="gs2-si">${info[e.storyTag].icon}</span><span><b>${esc(info[e.storyTag].label)}</b>${e.storyTagNote ? ' — ' + esc(e.storyTagNote) : ''}${likeStory ? '<small>✓ in linea con te: ami le storie che lasciano il segno</small>' : ''}</span></div>`);
    if(e.dopamine === true) out.push(`<div class="gs2-sym"><span class="gs2-si">💉</span><span><b>Loop di ricompense molto coinvolgente</b> (effetto dopamina)${likeDopa ? '<small>✓ in linea con te: loot, progressi visibili e ricompense ti agganciano</small>' : ''}</span></div>`);
    return out.length ? `<div class="gs2-syms">${out.join('')}</div>` : '';
  }
  const bar = (a, on)=> `<div class="gs2-row${on === false ? ' off' : on ? ' on' : ''}"><span class="gs2-ic">${a.icon}</span><span class="gs2-lab">${esc(a.full)}</span><span class="gs2-bar"><i style="width:${Math.round(a.w * 100)}%"></i></span></div>`;
  window.rtRadar = function(g){
    let r; try{ r = axes(); }catch(e){ return ''; }
    if(!r) return '';
    const {tm, ax} = r;
    if(!g){
      return `<div class="gs-card gs2" id="gsCard"><div class="gs-head">🎯 <b>I tuoi gusti più forti</b></div><div class="gs2-list">${ax.map(a=> bar(a)).join('')}</div><div class="gs2-sub">Imparati da ${tm.n} giochi (preferiti, voti, stati, tier e i tratti che segni con 🧬): più la barra è lunga, più ti piace.</div></div>`;
    }
    const s = window.rtSintonia(g); if(!s) return '';
    const {pct, neg, has, approved, known, near} = s;
    const word = known === 'love' ? 'È uno dei giochi che ami' : known === 'drop' ? 'L\'hai mollato' : pct >= 85 ? 'Sintonia altissima' : pct >= 70 ? 'Sintonia alta' : pct >= 50 ? 'Sintonia buona' : pct >= 30 ? 'Sintonia parziale' : 'Sintonia bassa';
    const hits = ax.filter(a=> has.has(a.k)), miss = ax.filter(a=> !has.has(a.k));
    const sub2 = known === 'love' ? 'La % rispecchia quello che sai già: lo uso per imparare i tuoi gusti' : `Ha ${hits.length} dei tuoi ${ax.length} gusti più forti`;
    const top = `<div class="gs2-top${approved ? ' appr' : ''}"><div class="gs2-ring" style="--p:${pct}"><b>${pct}%</b></div><div class="gs2-verd"><b>${approved && known !== 'love' ? 'Approvato dal procione!' : word}</b><span>${sub2}</span>${approved ? '<small>Sintonia altissima con il tuo DNA di giocatore</small>' : ''}</div>${approved ? '<img class="gs2-appr" src="icons/approved.webp" alt="Approvato" width="86" height="91" loading="lazy">' : ''}</div>`;
    const nearHtml = near.length ? `<div class="gs2-near">💞 Somiglia a giochi che ami: ${near.map(x=> `<b>${esc(x.g.name)}</b>`).join(', ')}</div>` : '';
    const hitHtml = hits.length ? `<div class="gs2-h">✓ Ha queste cose che ami</div><div class="gs2-list">${hits.map(a=> bar(a, true)).join('')}</div>` : '';
    const missHtml = miss.length ? `<div class="gs2-h dim">Cose che ami ma che qui non ci sono (non è un difetto del gioco)</div><div class="gs2-miss">${miss.map(a=> `<span>${a.icon} ${esc(a.full)}</span>`).join('')}</div>` : '';
    const negHtml = neg.length ? `<div class="gs2-neg">⚠️ Ha anche cose che di solito eviti: ${neg.map(([k])=> esc(labOf(k))).join(', ')}.</div>` : '';
    return `<div class="gs-card gs2" id="gsCard"><div class="gs-head">🎯 <b>Sintonia con i tuoi gusti</b></div>${top}${nearHtml}${symbols(g, tm)}${hitHtml}${missHtml}${negHtml}<div class="gs2-sub">Barre = quanto ti piace ogni cosa, imparato dai tuoi giochi e dai tratti che segni con 🧬 qui sotto.</div></div>`;
  };
  // nella scheda del gioco, subito dopo il verdetto d'acquisto
  if(typeof window.openModal === 'function'){
    const prev = window.openModal;
    window.openModal = function(g){
      const out = prev.apply(this, arguments);
      try{
        const card = document.getElementById('modalCard'); if(card && g && g.id != null){
          card.querySelectorAll('#gsCard').forEach(n=> n.remove());
          const h = window.rtRadar(g);
          if(h){ const vd = card.querySelector('#vdCard'), tags = card.querySelector('.modal-tags'); if(vd) vd.insertAdjacentHTML('afterend', h); else if(tags) tags.insertAdjacentHTML('beforebegin', h); }
        }
      }catch(e){ try{ console.error(e); }catch(x){} }
      return out;
    };
    try{ openModal = window.openModal; }catch(e){}
  }
})();
