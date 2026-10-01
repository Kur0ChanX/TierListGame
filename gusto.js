// ---- Sintonia di gusto (prima «radar» a ragnatela): % di sintonia con un cerchio, poi i tuoi 10 gusti più forti come barre ordinate, ✓ su quelli che ha il gioco ----
// Dentro ci sono anche i simboli del gioco legati ai tuoi gusti (💕 🤝 ✨ storia, 💉 dopamina).
// Usa il modello dei gusti di extras3.js («I tuoi gusti»): niente AI, tutto sul dispositivo. Compare nella scheda dei giochi (dopo il verdetto) e in «I tuoi gusti».
(function(){
  'use strict';
  if(window.RT_OFF && window.RT_OFF.gusto) return;
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const ICON = {diff: '🔥', grind: '⏳', storia: '📖', ritmo: '🐢', ore: '🕐'};
  const W = 360, H = 300, CX = 180, CY = 150, R = 84, LR = 98;
  const iconOf = k=>{ const [a, b] = k.split(':'); let t = null; try{ t = typeof TAG_INFO !== 'undefined' ? TAG_INFO : null; }catch(e){} if(a === 'mech' && window.rtMech && window.rtMech[b]) return window.rtMech[b].ic; return a === 'tag' ? ((t && t[b] && t[b].icon) || '•') : (ICON[a] || '•'); };
  const shortLab = s=>{ s = String(s).replace(/\s*\(.*?\)\s*/g, ' ').trim(); return s.length > 19 ? s.slice(0, 18).trim() + '…' : s; };

  let AXtm = null, AXc = null;
  function axes(){
    const tm = window.rtTasteModel && window.rtTasteModel(); if(!tm || tm.n < 3) return null;
    if(tm === AXtm) return AXc;                      // stesso modello dei gusti: riuso il calcolo (serve quando si ordinano centinaia di giochi)
    const e = Object.entries(tm.wts).filter(([k])=> tm.cnt[k] >= 2 && tm.wts[k] > .2 && k.indexOf('epoca') !== 0).sort((a, b)=> b[1] - a[1]).slice(0, 10);
    if(e.length < 4){ AXtm = tm; AXc = null; return null; }
    const hi = e[0][1], lo = e[e.length - 1][1], span = (hi - lo) || 1;
    AXtm = tm; AXc = {tm, ax: e.map(([k, w])=> ({k, w: .36 + .64 * ((w - lo) / span), label: shortLab(window.rtFLAB(k)), full: String(window.rtFLAB(k)), icon: iconOf(k)}))}; return AXc;
  }
  function svg(ax, has){
    const n = ax.length, ang = i=> -Math.PI / 2 + i * 2 * Math.PI / n, pt = (i, r)=> [CX + Math.cos(ang(i)) * r, CY + Math.sin(ang(i)) * r];
    const f1 = v=> v.toFixed(1);
    const rings = [.25, .5, .75, 1].map(f=> `<polygon class="gs-ring" points="${ax.map((_, i)=> pt(i, R * f).map(f1).join(',')).join(' ')}"/>`).join('');
    const spokes = ax.map((_, i)=>{ const [x, y] = pt(i, R); return `<line class="gs-spoke" x1="${CX}" y1="${CY}" x2="${f1(x)}" y2="${f1(y)}"/>`; }).join('');
    const poly = ax.map((a, i)=> pt(i, R * a.w).map(f1).join(',')).join(' ');
    const dots = ax.map((a, i)=>{ const [x, y] = pt(i, R * a.w), on = has && has.has(a.k); return `<circle class="gs-dot${on ? ' on' : ''}" style="--i:${i}" cx="${f1(x)}" cy="${f1(y)}" r="${on ? 5.4 : 3}"/>`; }).join('');
    const labels = ax.map((a, i)=>{ const [x, y] = pt(i, LR), c = Math.cos(ang(i)), anchor = c > .3 ? 'start' : c < -.3 ? 'end' : 'middle', on = has && has.has(a.k); return `<text class="gs-lab${on ? ' on' : ''}" x="${f1(x)}" y="${f1(y + 4)}" text-anchor="${anchor}">${a.icon} ${esc(a.label)}</text>`; }).join('');
    return `<svg class="gs-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Radar di gusto">${rings}${spokes}<polygon class="gs-poly" points="${poly}"/>${dots}${labels}</svg>`;
  }
  // g = gioco da confrontare (oppure null: solo il tuo profilo)
  function symbols(g, tm){
    const e = (g && g.enrich) || {}, out = [];
    let info = null; try{ info = typeof STORY_TAG_INFO !== 'undefined' ? STORY_TAG_INFO : null; }catch(x){}
    const likeStory = ['storia:forte', 'tag:JRPG', 'tag:VN', 'tag:ADV'].some(k=> (tm.wts[k] || 0) > .2), likeDopa = (tm.wts['mech:DOPA'] || 0) > .2 || (tm.wts['mech:LOOT'] || 0) > .2;
    if(e.storyTag && info && info[e.storyTag]) out.push(`<div class="gs2-sym"><span class="gs2-si">${info[e.storyTag].icon}</span><span><b>${esc(info[e.storyTag].label)}</b>${e.storyTagNote ? ' — ' + esc(e.storyTagNote) : ''}${likeStory ? '<small>✓ in linea con te: ami le storie che lasciano il segno</small>' : ''}</span></div>`);
    if(e.dopamine === true) out.push(`<div class="gs2-sym"><span class="gs2-si">💉</span><span><b>Loop di ricompense molto coinvolgente</b> (effetto dopamina)${likeDopa ? '<small>✓ in linea con te: loot, progressi visibili e ricompense ti agganciano</small>' : ''}</span></div>`);
    return out.length ? `<div class="gs2-syms">${out.join('')}</div>` : '';
  }
  // % di sintonia di un gioco con i tuoi gusti (usata anche da giochi simili e consigli). null se il profilo è ancora troppo debole.
  window.rtSintonia = function(g){
    let r; try{ r = axes(); }catch(e){ return null; } if(!r || !g) return null;
    const {tm, ax} = r, has = new Set(window.rtFeats(g));
    const raw = a=> Math.max(0, tm.wts[a.k] || 0), tot = ax.reduce((s, a)=> s + raw(a), 0) || 1, got = ax.filter(a=> has.has(a.k)).reduce((s, a)=> s + raw(a), 0);
    const neg = Object.entries(tm.wts).filter(([k, w])=> tm.cnt[k] >= 2 && w < -.25 && has.has(k)).sort((a, b)=> a[1] - b[1]).slice(0, 3);
    const penalty = neg.reduce((s, [, w])=> s + Math.min(.6, -w), 0) / tot;
    const pct = Math.max(0, Math.min(100, Math.round(100 * (got / tot - penalty * .5))));
    // «approvato dal procione»: sintonia molto alta, nessuna cosa che eviti e un profilo con abbastanza giochi per fidarsi
    const approved = pct >= 80 && !neg.length && tm.n >= 6;
    return {pct, neg, tm, ax, has, approved, n: ax.filter(a=> has.has(a.k)).length};
  };
  window.rtRadar = function(g){
    let r; try{ r = axes(); }catch(e){ return ''; }
    if(!r) return '';
    const {tm, ax} = r, has = g ? new Set(window.rtFeats(g)) : null;
    let top = '', neg = [];
    if(g){
      const raw = a=> Math.max(0, tm.wts[a.k] || 0), tot = ax.reduce((s, a)=> s + raw(a), 0) || 1, got = ax.filter(a=> has.has(a.k)).reduce((s, a)=> s + raw(a), 0);
      neg = Object.entries(tm.wts).filter(([k, w])=> tm.cnt[k] >= 2 && w < -.25 && has.has(k)).sort((a, b)=> a[1] - b[1]).slice(0, 3);
      const penalty = neg.reduce((s, [, w])=> s + Math.min(.6, -w), 0) / tot;
      const pct = Math.max(0, Math.min(100, Math.round(100 * (got / tot - penalty * .5))));
      const word = pct >= 75 ? 'Altissima' : pct >= 50 ? 'Buona' : pct >= 30 ? 'Parziale' : 'Bassa';
      const n = ax.filter(a=> has.has(a.k)).length;
      const appr = pct >= 80 && !neg.length && tm.n >= 6;
      top = `<div class="gs2-top${appr ? ' appr' : ''}"><div class="gs2-ring" style="--p:${pct}"><b>${pct}%</b></div><div class="gs2-verd"><b>${appr ? 'Approvato dal procione!' : 'Sintonia ' + word.toLowerCase()}</b><span>Ha <b>${n} dei tuoi ${ax.length}</b> gusti più forti</span>${appr ? '<small>Sintonia altissima con il tuo DNA di giocatore</small>' : ''}</div>${appr ? '<img class="gs2-appr" src="icons/approved.webp" alt="Approvato" width="86" height="91" loading="lazy">' : ''}</div>`;
    }
    const rows = ax.map(a=>{ const on = has && has.has(a.k);
      return `<div class="gs2-row${has ? (on ? ' on' : ' off') : ''}"><span class="gs2-ic">${a.icon}</span><span class="gs2-lab">${esc(a.full)}</span><span class="gs2-bar"><i style="width:${Math.round(a.w * 100)}%"></i></span><span class="gs2-ok">${has ? (on ? '✓' : '·') : ''}</span></div>`; }).join('');
    const negHtml = neg.length ? `<div class="gs2-neg">⚠️ Ha anche cose che di solito eviti: ${neg.map(([k])=> esc(window.rtFLAB(k))).join(', ')}.</div>` : '';
    const sub = g ? 'Barre = quanto ti piace ogni cosa (imparato dai tuoi voti e preferiti) · ✓ = questo gioco ce l\'ha' : `I tuoi ${ax.length} gusti più forti, imparati da ${tm.n} giochi: più la barra è lunga, più ti piace.`;
    return `<div class="gs-card gs2" id="gsCard"><div class="gs-head">🎯 <b>${g ? 'Sintonia con i tuoi gusti' : 'I tuoi gusti più forti'}</b></div>${top}${g ? symbols(g, tm) : ''}<div class="gs2-list">${rows}</div>${negHtml}<div class="gs2-sub">${sub}</div></div>`;
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
