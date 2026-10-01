// ---- Radar di gusto: i tuoi 8 gusti più forti a ragnatela (animata) e quanti ne tocca ogni gioco ----
// Usa il modello dei gusti di extras3.js («I tuoi gusti»): niente AI, tutto sul dispositivo. Compare nella scheda dei giochi (dopo il verdetto) e in «I tuoi gusti».
(function(){
  'use strict';
  const esc = t=> String(t == null ? '' : t).replace(/[&<>"]/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const ICON = {diff: '🔥', grind: '⏳', storia: '📖', ritmo: '🐢', ore: '🕐'};
  const W = 360, H = 300, CX = 180, CY = 150, R = 84, LR = 98;
  const iconOf = k=>{ const [a, b] = k.split(':'); let t = null; try{ t = typeof TAG_INFO !== 'undefined' ? TAG_INFO : null; }catch(e){} if(a === 'mech' && window.rtMech && window.rtMech[b]) return window.rtMech[b].ic; return a === 'tag' ? ((t && t[b] && t[b].icon) || '•') : (ICON[a] || '•'); };
  const shortLab = s=>{ s = String(s).replace(/\s*\(.*?\)\s*/g, ' ').trim(); return s.length > 19 ? s.slice(0, 18).trim() + '…' : s; };

  function axes(){
    const tm = window.rtTasteModel && window.rtTasteModel(); if(!tm || tm.n < 3) return null;
    const e = Object.entries(tm.wts).filter(([k])=> tm.cnt[k] >= 2 && tm.wts[k] > .2 && k.indexOf('epoca') !== 0).sort((a, b)=> b[1] - a[1]).slice(0, 8);
    if(e.length < 4) return null;
    const hi = e[0][1], lo = e[e.length - 1][1], span = (hi - lo) || 1;
    return {tm, ax: e.map(([k, w])=> ({k, w: .36 + .64 * ((w - lo) / span), label: shortLab(window.rtFLAB(k)), full: String(window.rtFLAB(k)), icon: iconOf(k)}))};
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
  window.rtRadar = function(g){
    let r; try{ r = axes(); }catch(e){ return ''; }
    if(!r) return '';
    const {tm, ax} = r, has = g ? new Set(window.rtFeats(g)) : null;
    let sum = '';
    if(g){
      const hit = ax.filter(a=> has.has(a.k)), neg = Object.entries(tm.wts).filter(([k, w])=> tm.cnt[k] >= 2 && w < -.25 && has.has(k)).sort((a, b)=> a[1] - b[1]).slice(0, 3).map(([k])=> window.rtFLAB(k));
      sum = `<div class="gs-sum">Tocca <b>${hit.length} dei tuoi ${ax.length}</b> gusti più forti${hit.length ? ': ' + hit.slice(0, 4).map(a=> esc(a.full)).join(', ') : ''}.${neg.length ? ` <span class="gs-neg">⚠️ Ha anche cose che di solito eviti: ${neg.map(esc).join(', ')}.</span>` : ''}</div>`;
    }else sum = `<div class="gs-sum">I tuoi ${ax.length} gusti più forti, imparati da ${tm.n} giochi. Più il punto è lontano dal centro, più ti piace.</div>`;
    return `<div class="gs-card" id="gsCard"><div class="gs-head">🕸️ <b>${g ? 'Radar di gusto: tu e questo gioco' : 'Il tuo radar di gusto'}</b></div>${svg(ax, has)}${g ? '<div class="gs-lg"><span class="gs-lg-p"></span> i tuoi gusti <span class="gs-lg-d"></span> li ha questo gioco</div>' : ''}${sum}</div>`;
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
