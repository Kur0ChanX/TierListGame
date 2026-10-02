// ---- Frugu, il procione da compagnia (Tamagotchi 3.0) ----
// Vive nell'app: ha fame, sete, sonno, si sporca, si ammala, vuole coccole e giocare. Cresce (uovo → cucciolo → ragazzo → adulto → saggio)
// e da adulto prende una forma che dipende dai TUOI giochi (il tuo genere preferito). Il tempo passa anche ad app chiusa (al massimo 2 giorni
// alla volta, così non lo ritrovi mai disperato), non muore mai: se lo trascuri si intristisce o si ammala e guarisce con le cure.
// Guadagna monete con i minigiochi e con quello che fai nell'app (finire un giochi, Update+, aggiungere giochi) e le spendi nel negozio.
// Stato in localStorage «jrpg_pet» (quindi sincronizzato con il Gist come gli altri dati).
(function(){
  'use strict';
  if(window.RT_OFF && window.RT_OFF.pet) return;
  const U = window.XUI; if(!U) return;
  const {sheet, toast, esc, LS} = U;
  const gi = n=> (typeof giIcon === 'function') ? giIcon(n) : '';
  const KEY = 'jrpg_pet', H = 3600e3;
  const STATS = [['food', 'Sazietà', '#f59e0b'], ['drink', 'Sete', '#38bdf8'], ['clean', 'Pulizia', '#a78bfa'], ['energy', 'Energia', '#22c55e'], ['fun', 'Allegria', '#f472b6'], ['love', 'Affetto', '#ef4444'], ['health', 'Salute', '#10b981']];
  const DECAY = {food: 4, drink: 5, clean: 2.2, energy: 3, fun: 3.2, love: 1.6};           // punti persi all'ora
  const FOODS = [
    {id: 'mela', n: 'Mela', e: '🍎', food: 18, health: 3, cost: 0},
    {id: 'onigiri', n: 'Onigiri', e: '🍙', food: 30, fun: 3, cost: 0},
    {id: 'ramen', n: 'Ramen', e: '🍜', food: 45, drink: 8, fun: 5, cost: 6},
    {id: 'pizza', n: 'Pizza', e: '🍕', food: 40, fun: 10, health: -3, cost: 8},
    {id: 'torta', n: 'Torta', e: '🍰', food: 20, fun: 18, health: -5, cost: 10},
    {id: 'pozione', n: 'Pozione', e: '🧪', health: 35, energy: 10, cost: 15},
    {id: 'etere', n: 'Etere', e: '💠', energy: 45, fun: 5, cost: 18}
  ];
  const DRINKS = [
    {id: 'acqua', n: 'Acqua', e: '💧', drink: 30, cost: 0},
    {id: 'latte', n: 'Latte', e: '🥛', drink: 25, health: 4, cost: 0},
    {id: 'succo', n: 'Succo', e: '🧃', drink: 30, fun: 6, cost: 4},
    {id: 'te', n: 'Tè caldo', e: '🍵', drink: 25, energy: 6, love: 3, cost: 5}
  ];
  const SHOP = [
    {id: 'cappello', n: 'Cappello da mago', e: '🎩', cost: 40}, {id: 'corona', n: 'Corona', e: '👑', cost: 120}, {id: 'occhiali', n: 'Occhiali da sole', e: '🕶️', cost: 35},
    {id: 'cuffie', n: 'Cuffie da gamer', e: '🎧', cost: 50}, {id: 'spada', n: 'Spada leggendaria', e: '🗡️', cost: 90}, {id: 'fiocco', n: 'Fiocco', e: '🎀', cost: 25},
    {id: 'sciarpa', n: 'Sciarpa', e: '🧣', cost: 30}, {id: 'joypad', n: 'Joypad', e: '🎮', cost: 60}
  ];
  const STAGES = [['uovo', 'Uovo', 0], ['cucciolo', 'Cucciolo', 0], ['ragazzo', 'Ragazzo', 2], ['adulto', 'Adulto', 7], ['saggio', 'Saggio', 30]];
  // forma da adulto: dal genere che giochi di più
  const FORMS = {TAC: ['Stratega', '#5b6cff'], TUR: ['Eroe classico', '#e0a100'], ACT: ['Guerriero', '#ef4444'], DUN: ['Esploratore', '#8b5cf6'], MON: ['Domatore', '#22c55e'], CARD: ['Giocatore di carte', '#0ea5e9'], SOUL: ['Cavaliere oscuro', '#475569'], ROG: ['Avventuriero', '#f97316'], HOR: ['Cacciatore di fantasmi', '#64748b'], VN: ['Poeta', '#ec4899'], LIFE: ['Contadino', '#84cc16'], MECH: ['Pilota', '#94a3b8']};

  const now = ()=> Date.now();
  const clamp = v=> Math.max(0, Math.min(100, v));
  function fresh(){ return {name: 'Frugu', born: now(), last: now(), food: 80, drink: 80, clean: 90, energy: 90, fun: 80, love: 70, health: 100, xp: 0, coins: 20, asleep: false, sick: false, poop: 0, wear: [], owned: [], hatched: false, log: [], shown: true, games: 0}; }
  let P = Object.assign(fresh(), LS.get(KEY, {}) || {});
  const save = ()=>{ P.last = now(); LS.set(KEY, P); };
  // il tempo che passa (anche ad app chiusa)
  function tick(){
    const dtH = Math.min(48, Math.max(0, (now() - (P.last || now())) / H));
    if(dtH <= 0) return;
    Object.entries(DECAY).forEach(([k, r])=>{
      if(k === 'energy'){ P.energy = clamp(P.energy + (P.asleep ? 14 : -r) * dtH); return; }
      P[k] = clamp(P[k] - r * (P.asleep ? .45 : 1) * dtH);
    });
    if(!P.asleep && Math.random() < dtH * .18) P.poop = Math.min(4, P.poop + 1);
    const low = ['food', 'drink', 'clean'].filter(k=> P[k] < 20).length + (P.poop >= 3 ? 1 : 0);
    P.health = clamp(P.health - low * 3 * dtH + (low ? 0 : 1.5 * dtH));
    if(!P.sick && P.health < 35 && Math.random() < .5) P.sick = true;
    if(P.asleep && P.energy >= 100){ P.asleep = false; addLog('Si è svegliato riposato'); }
    save();
  }
  const ageDays = ()=> (now() - P.born) / 864e5;
  function stage(){ let s = STAGES[0]; STAGES.forEach(x=>{ if(ageDays() >= x[2]) s = x; }); if(!P.hatched) s = STAGES[0]; return s; }
  function form(){
    if(!['adulto', 'saggio'].includes(stage()[0])) return null;
    const c = {}; GAMES.forEach(g=>{ const s = STATUSES[g.id]; if(s === 'played' || FAVS.has(g.id)) (g.tags || []).forEach(t=>{ if(FORMS[t]) c[t] = (c[t] || 0) + 1; }); });
    const top = Object.entries(c).sort((a, b)=> b[1] - a[1])[0];
    return top ? FORMS[top[0]] : ['Frugatore', '#8b6d4d'];
  }
  const level = ()=> 1 + Math.floor(Math.sqrt(P.xp / 20));
  function mood(){
    if(P.asleep) return 'sleep';
    if(P.sick) return 'sick';
    const worst = Math.min(P.food, P.drink, P.clean, P.fun, P.love, P.energy);
    if(worst < 15) return 'cry';
    if(worst < 35) return 'sad';
    if(P.fun > 75 && P.love > 70) return 'happy';
    return 'ok';
  }
  function need(){
    if(P.asleep) return null;
    if(P.sick) return 'È malato: dagli la medicina';
    if(P.poop >= 2) return 'Ha sporcato: pulisci';
    const m = [['food', 'Ha fame'], ['drink', 'Ha sete'], ['energy', 'Ha sonno'], ['clean', 'Vuole un bagno'], ['fun', 'Si annoia'], ['love', 'Vuole le coccole']].filter(x=> P[x[0]] < 30).sort((a, b)=> P[a[0]] - P[b[0]])[0];
    return m ? m[1] : null;
  }
  function addLog(t){ P.log = [{t: now(), x: t}].concat(P.log || []).slice(0, 20); }
  function reward(xp, coins, why){ P.xp += xp; P.coins += coins; const lv0 = level(); save(); if(why && (()=>{ const x = document.getElementById('xPet'); return x && x.classList.contains('show'); })()) toast('🦝 ' + P.name + ': ' + why + (coins ? ' (+' + coins + ' monete)' : ''), 3500); if(level() > lv0 && (()=>{ const x = document.getElementById('xPet'); return x && x.classList.contains('show'); })()){ toast('🦝 ' + P.name + ' è salito al livello ' + level() + '!', 4000); try{ window.rtSfx && rtSfx('success'); }catch(e){} } }

  // ---------- disegno (SVG che cambia con umore, età, forma e accessori) ----------
  function svg(big){
    const st = stage()[0], m = mood(), f = form(), col = f ? f[1] : '#8b6d4d';
    if(st === 'uovo') return `<svg viewBox="0 0 120 120" class="pet-svg egg"><ellipse cx="60" cy="70" rx="34" ry="42" fill="#f4ecd8" stroke="#c9b48a" stroke-width="3"/><path d="M34 62l10 8 10-9 10 9 10-8 10 8" fill="none" stroke="#b08850" stroke-width="3"/><circle cx="48" cy="48" r="5" fill="#e6d3a8"/><circle cx="70" cy="86" r="7" fill="#e6d3a8"/></svg>`;
    const sc = st === 'cucciolo' ? .78 : st === 'ragazzo' ? .9 : 1;
    const eyes = m === 'sleep' ? '<path d="M44 58q6 5 12 0M64 58q6 5 12 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : m === 'happy' ? '<path d="M44 60q6-8 12 0M64 60q6-8 12 0" stroke="#222" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
      : m === 'sick' ? '<path d="M45 55l10 8M55 55l-10 8M65 55l10 8M75 55l-10 8" stroke="#222" stroke-width="3" stroke-linecap="round"/>'
      : `<g class="pet-eyes"><circle cx="50" cy="58" r="5.5" fill="#222"/><circle cx="70" cy="58" r="5.5" fill="#222"/><circle cx="52" cy="56" r="1.8" fill="#fff"/><circle cx="72" cy="56" r="1.8" fill="#fff"/></g>`;
    const mouth = m === 'happy' ? '<path d="M53 74q7 8 14 0" fill="#e05c7a" stroke="#222" stroke-width="2"/>' : (m === 'sad' || m === 'cry') ? '<path d="M53 78q7-6 14 0" fill="none" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>' : m === 'sleep' ? '<circle cx="60" cy="75" r="3" fill="#222"/>' : '<path d="M55 74q5 4 10 0" fill="none" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>';
    const tears = m === 'cry' ? '<path d="M46 64q-3 8 0 10q3-2 0-10M74 64q-3 8 0 10q3-2 0-10" fill="#7dd3fc"/>' : '';
    const blush = (m === 'happy' || m === 'ok') ? '<ellipse cx="42" cy="68" rx="5" ry="3" fill="#f9a8b8" opacity=".7"/><ellipse cx="78" cy="68" rx="5" ry="3" fill="#f9a8b8" opacity=".7"/>' : '';
    const sickTint = m === 'sick' ? ' filter="url(#petSick)"' : '';
    const wear = (P.wear || []).map(w=>{ const it = SHOP.find(s=> s.id === w); if(!it) return ''; const pos = {cappello: [60, 10, 26], corona: [60, 14, 22], occhiali: [60, 60, 22], cuffie: [60, 36, 30], spada: [100, 80, 24], fiocco: [80, 22, 18], sciarpa: [60, 92, 24], joypad: [20, 92, 20]}[w] || [60, 20, 20]; return `<text x="${pos[0]}" y="${pos[1]}" font-size="${pos[2]}" text-anchor="middle" dominant-baseline="middle">${it.e}</text>`; }).join('');
    const poop = Array.from({length: P.poop || 0}, (_, i)=> `<text x="${14 + i * 18}" y="116" font-size="14">💩</text>`).join('');
    return `<svg viewBox="0 0 120 120" class="pet-svg m-${m}${big ? ' big' : ''}"><defs><filter id="petSick"><feColorMatrix type="matrix" values=".7 .3 0 0 0  .2 .9 0 0 .05  .2 .3 .6 0 0  0 0 0 1 0"/></filter></defs>
      <g transform="translate(60 72) scale(${sc}) translate(-60 -72)"${sickTint}>
      <g class="pet-tail"><path d="M88 92q26-4 24-28q-2-12-12-8q6 12-4 22q-6 6-14 6z" fill="${col}"/><path d="M104 60q4 6 1 12M110 72q-2 6-8 10M96 84q-4 2-8 3" stroke="#2b2118" stroke-width="4" fill="none" stroke-linecap="round"/></g>
      <ellipse cx="60" cy="92" rx="28" ry="22" fill="${col}"/><ellipse cx="60" cy="96" rx="16" ry="14" fill="#efe3cf"/>
      <g class="pet-head"><path d="M32 40l-6-20 18 10zM88 40l6-20-18 10z" fill="${col}" stroke="#2b2118" stroke-width="2" stroke-linejoin="round"/><path d="M31 35l-2-9 7 5zM89 35l2-9-7 5z" fill="#2b2118"/>
      <ellipse cx="60" cy="60" rx="32" ry="27" fill="${col}"/><path d="M34 58q10-12 26-4q16-8 26 4q-6 10-14 8q-6-2-12 2q-6-4-12-2q-8 2-14-8z" fill="#2b2118"/>
      <ellipse cx="60" cy="72" rx="14" ry="10" fill="#efe3cf"/><ellipse cx="60" cy="66" rx="4" ry="3" fill="#222"/>${eyes}${blush}${tears}${mouth}</g>
      ${wear}</g>${poop}${m === 'sleep' ? '<g class="pet-z"><text x="92" y="30" font-size="14" font-weight="800" fill="#6b7cff">Z</text><text x="102" y="18" font-size="10" font-weight="800" fill="#6b7cff">z</text></g>' : ''}</svg>`;
  }

  // ---------- avatar nell'app (angolo) ----------
  function avatar(){
    // Frugu vive nel menu ✨ (non più come icona sospesa sullo schermo)
    let a = document.getElementById('petAvatar'); if(a) a.remove(); if(!window.RT_PET_FLOATING) return;
    if(!P.shown){ if(a) a.remove(); return; }
    if(!a){ a = document.createElement('button'); a.id = 'petAvatar'; a.type = 'button'; a.className = 'pet-av'; a.setAttribute('aria-label', 'Il tuo procione'); document.body.appendChild(a); a.addEventListener('click', openPet); }
    const n = need();
    a.innerHTML = svg(false) + (n ? '<span class="pet-need">!</span>' : '');
    a.title = P.name + (n ? ' · ' + n : ' sta bene');
  }

  // ---------- azioni ----------
  function fx(kind){ const s = document.querySelector('.pet-stage'); if(!s) return; const el = document.createElement('div'); el.className = 'pet-fx fx-' + kind; el.textContent = {eat: '😋', drink: '💦', wash: '🫧', love: '💖', heal: '✨', play: '⭐', clean: '🧹', sleep: '🌙'}[kind] || '✨'; s.appendChild(el); setTimeout(()=> el.remove(), 1400); }
  function act(a, it){
    tick();
    if(!P.hatched && a !== 'hatch') return;
    if(P.asleep && !['sleep', 'love'].includes(a)){ toast('🦝 ' + P.name + ' dorme… svegliarlo? Tocca «Sveglia»', 2500); return; }
    const pay = c=>{ if((c || 0) > P.coins){ toast('Servono ' + c + ' monete (ne hai ' + P.coins + ')', 2500); return false; } P.coins -= (c || 0); return true; };
    if(a === 'hatch'){ P.hatched = true; P.born = now(); addLog('È nato! Benvenuto ' + P.name); reward(5, 0, 'è uscito dall\'uovo!'); }
    else if(a === 'eat'){ if(P.food > 95){ toast('🦝 È sazio, non ne vuole più', 2000); return; } if(!pay(it.cost)) return; ['food', 'drink', 'fun', 'health', 'energy'].forEach(k=>{ if(it[k]) P[k] = clamp(P[k] + it[k]); }); P.xp += 2; fx('eat'); addLog('Ha mangiato: ' + it.n); }
    else if(a === 'drink'){ if(P.drink > 95){ toast('🦝 Non ha sete', 2000); return; } if(!pay(it.cost)) return; ['drink', 'fun', 'health', 'energy', 'love'].forEach(k=>{ if(it[k]) P[k] = clamp(P[k] + it[k]); }); P.xp += 1; fx('drink'); addLog('Ha bevuto: ' + it.n); }
    else if(a === 'wash'){ P.clean = 100; P.fun = clamp(P.fun + 5); P.xp += 2; fx('wash'); addLog('Bagnetto con le bolle'); }
    else if(a === 'clean'){ if(!P.poop){ toast('È tutto pulito', 1800); return; } P.poop = 0; P.health = clamp(P.health + 5); P.xp += 2; fx('clean'); addLog('Hai pulito'); }
    else if(a === 'heal'){ if(!P.sick && P.health > 80){ toast('🦝 Sta benissimo, niente medicine', 2000); return; } P.sick = false; P.health = clamp(P.health + 40); P.fun = clamp(P.fun - 5); P.xp += 3; fx('heal'); addLog('Medicina presa: guarito'); }
    else if(a === 'love'){ P.love = clamp(P.love + 18); P.fun = clamp(P.fun + 4); P.xp += 1; fx('love'); addLog('Coccole'); }
    else if(a === 'sleep'){ P.asleep = !P.asleep; fx('sleep'); addLog(P.asleep ? 'Buonanotte' : 'Svegliato'); }
    try{ window.rtSfx && rtSfx(a === 'love' ? 'fav' : 'tap'); }catch(e){}
    save(); paint(); avatar();
  }

  // ---------- minigiochi ----------
  function gameCoins(){   // 20 secondi: tocca le monete che cadono, evita le bombe
    const box = document.querySelector('.pet-play'); if(!box) return;
    if(P.energy < 10){ toast('🦝 È troppo stanco per giocare', 2000); return; }
    box.innerHTML = '<div class="pg-top"><b>Acchiappa le monete!</b> <span class="pg-sc">0</span> · <span class="pg-t">20</span>s</div><div class="pg-area"></div>';
    const area = box.querySelector('.pg-area'); let sc = 0, t = 20, alive = true;
    const spawn = ()=>{ if(!alive) return; const bomb = Math.random() < .18; const d = document.createElement('button'); d.type = 'button'; d.className = 'pg-it'; d.textContent = bomb ? '💣' : (Math.random() < .12 ? '💎' : '🪙'); d.style.left = (5 + Math.random() * 85) + '%'; d.style.animationDuration = (1.8 + Math.random() * 1.4) + 's'; area.appendChild(d);
      d.addEventListener('pointerdown', ()=>{ if(!alive) return; sc += bomb ? -3 : d.textContent === '💎' ? 5 : 1; box.querySelector('.pg-sc').textContent = sc; d.classList.add('hit'); try{ window.rtSfx && rtSfx(bomb ? 'error' : 'fav'); }catch(e){} setTimeout(()=> d.remove(), 200); });
      d.addEventListener('animationend', ()=> d.remove()); setTimeout(spawn, 380 + Math.random() * 420); };
    spawn();
    const iv = setInterval(()=>{ t--; const el = box.querySelector('.pg-t'); if(el) el.textContent = t; if(t <= 0){ clearInterval(iv); alive = false; const c = Math.max(0, sc); P.fun = clamp(P.fun + 20); P.energy = clamp(P.energy - 10); P.food = clamp(P.food - 4); addLog('Minigioco monete: ' + sc + ' punti'); reward(4 + Math.floor(c / 3), c, 'ha giocato con te: ' + sc + ' punti'); paint(); } }, 1000);
  }
  function gameTier(){    // indovina il tier di un gioco del database
    const box = document.querySelector('.pet-play'); if(!box) return;
    let round = 0, ok = 0;
    const next = ()=>{
      if(round >= 5){ P.fun = clamp(P.fun + 15); addLog('Quiz dei tier: ' + ok + '/5'); reward(3 + ok * 2, ok * 3, 'quiz dei tier: ' + ok + ' su 5'); paint(); return; }
      round++; const g = GAMES[Math.floor(Math.random() * GAMES.length)];
      const opts = [...new Set([g.tier, ...['S+', 'S', 'A', 'B', 'C', 'D'].sort(()=> Math.random() - .5)])].slice(0, 4).sort(()=> Math.random() - .5);
      box.innerHTML = `<div class="pg-top"><b>Quiz dei tier</b> ${round}/5 · giuste ${ok}</div><div class="pg-q">In che tier è <b>${esc(g.name)}</b>?<small>${esc(g.plat)} · ${esc(g.year || '')}</small></div><div class="pg-opts">${opts.map(o=> `<button class="btn" type="button" data-o="${o}"><span class="badge ${TIER_LABEL[o]}">${o}</span></button>`).join('')}</div>`;
      box.querySelectorAll('[data-o]').forEach(b=> b.addEventListener('click', ()=>{ const right = b.dataset.o === g.tier; if(right) ok++; b.classList.add(right ? 'ok' : 'ko'); try{ window.rtSfx && rtSfx(right ? 'fav' : 'error'); }catch(e){} setTimeout(next, 650); }));
    };
    next();
  }
  function gameRps(){     // morra cinese
    const box = document.querySelector('.pet-play'); if(!box) return;
    const H3 = [['✊', 'sasso'], ['✋', 'carta'], ['✌️', 'forbici']]; let me = 0, him = 0;
    const draw = msg=>{ box.innerHTML = `<div class="pg-top"><b>Morra cinese</b> · tu ${me} – ${him} ${esc(P.name)} (al meglio di 5)</div><div class="pg-q">${msg || 'Scegli!'}</div><div class="pg-opts">${H3.map((h, i)=> `<button class="btn big" type="button" data-h="${i}">${h[0]}</button>`).join('')}</div>`;
      box.querySelectorAll('[data-h]').forEach(b=> b.addEventListener('click', ()=>{ const a = +b.dataset.h, c = Math.floor(Math.random() * 3), r = (a - c + 3) % 3; if(r === 1) me++; else if(r === 2) him++;
        const txt = `${H3[a][0]} contro ${H3[c][0]} · ${r === 0 ? 'pari' : r === 1 ? 'vinci tu' : 'vince lui'}`;
        if(me >= 3 || him >= 3){ P.fun = clamp(P.fun + 18); addLog('Morra cinese ' + me + '-' + him); reward(3, me >= 3 ? 8 : 3, me >= 3 ? 'hai vinto a morra cinese' : 'ha vinto lui a morra cinese e ride tutto contento'); paint(); return; }
        draw(txt); })); };
    draw();
  }

  // ---------- schermata ----------
  let tab = 'cura';
  function paint(){
    const el = document.getElementById('xPet'); if(!el || !el.classList.contains('show')) return;
    const body = el.querySelector('.x-body'); if(!body) return;
    tick();
    const st = stage(), f = form(), n = need();
    const bars = STATS.map(([k, l, c])=> `<div class="pet-st"><span>${l}</span><i><b style="width:${Math.round(P[k])}%;background:${c}"></b></i></div>`).join('');
    const items = (arr, a)=> arr.map(it=> `<button class="btn pet-it" type="button" data-a="${a}" data-i="${it.id}">${it.e} ${esc(it.n)}${it.cost ? ` <small>${it.cost}🪙</small>` : ''}</button>`).join('');
    let panel = '';
    if(!P.hatched) panel = `<div class="pet-hatch"><p>Un uovo misterioso è caduto nel bidone di Frugu…</p><button class="btn primary" type="button" data-a="hatch">🥚 Fallo schiudere</button></div>`;
    else if(tab === 'cura') panel = `<div class="pet-acts"><h4>Mangia</h4>${items(FOODS, 'eat')}<h4>Bevi</h4>${items(DRINKS, 'drink')}<h4>Cure</h4>
      <button class="btn pet-it" type="button" data-a="wash">🛁 Bagnetto</button><button class="btn pet-it" type="button" data-a="clean">🧹 Pulisci</button><button class="btn pet-it" type="button" data-a="heal">💊 Medicina</button>
      <button class="btn pet-it" type="button" data-a="love">🤗 Coccole</button><button class="btn pet-it" type="button" data-a="sleep">${P.asleep ? '☀️ Sveglia' : '🌙 A nanna'}</button></div>`;
    else if(tab === 'gioca') panel = `<div class="pet-play"><div class="pg-menu"><button class="btn" type="button" data-g="coins">🪙 Acchiappa le monete</button><button class="btn" type="button" data-g="tier">🏆 Quiz dei tier</button><button class="btn" type="button" data-g="rps">✊ Morra cinese</button></div></div>`;
    else if(tab === 'negozio') panel = `<div class="pet-shop"><p class="lp-sub">Hai <b>${P.coins}</b> monete. Le guadagni con i minigiochi e usando l'app: gioco finito +25, gioco aggiunto +5, Update+ +2.</p>${SHOP.map(s=>{ const own = (P.owned || []).includes(s.id), on = (P.wear || []).includes(s.id); return `<button class="btn pet-it${on ? ' primary' : ''}" type="button" data-shop="${s.id}">${s.e} ${esc(s.n)} <small>${own ? (on ? 'indossato' : 'indossa') : s.cost + '🪙'}</small></button>`; }).join('')}</div>`;
    else panel = `<div class="pet-diary"><label class="gs-row">Nome <input id="petName" value="${esc(P.name)}" maxlength="14"></label>
      <p class="lp-sub">Nato il ${new Date(P.born).toLocaleDateString('it-IT')} · ${Math.floor(ageDays())} giorni · ${P.games || 0} giochi finiti insieme</p>${(P.log || []).map(l=> `<div class="hist-row"><small>${new Date(l.t).toLocaleString('it-IT', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})}</small> ${esc(l.x)}</div>`).join('')}</div>`;
    body.innerHTML = `<div class="pet-stage">${svg(true)}</div>
      <div class="pet-id"><b>${esc(P.name)}</b> · ${st[1]}${f ? ' ' + esc(f[0]) : ''} · liv. ${level()} · ${P.coins}🪙${n ? `<div class="pet-needtx">${esc(n)}</div>` : ''}</div>
      <div class="pet-stats">${bars}</div>
      <div class="lp-tools pet-tabs">${[['cura', 'Cura'], ['gioca', 'Gioca'], ['negozio', 'Negozio'], ['diario', 'Diario']].map(t=> `<button class="btn${tab === t[0] ? ' primary' : ''}" type="button" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>${panel}`;
    body.querySelectorAll('[data-tab]').forEach(b=> b.addEventListener('click', ()=>{ tab = b.dataset.tab; paint(); }));
    body.querySelectorAll('[data-a]').forEach(b=> b.addEventListener('click', ()=>{ const a = b.dataset.a, it = [...FOODS, ...DRINKS].find(x=> x.id === b.dataset.i); act(a, it); }));
    body.querySelectorAll('[data-g]').forEach(b=> b.addEventListener('click', ()=> ({coins: gameCoins, tier: gameTier, rps: gameRps})[b.dataset.g]()));
    body.querySelectorAll('[data-shop]').forEach(b=> b.addEventListener('click', ()=>{ const s = SHOP.find(x=> x.id === b.dataset.shop); P.owned = P.owned || []; P.wear = P.wear || [];
      if(!P.owned.includes(s.id)){ if(P.coins < s.cost){ toast('Servono ' + s.cost + ' monete', 2000); return; } P.coins -= s.cost; P.owned.push(s.id); P.wear.push(s.id); addLog('Comprato: ' + s.n); try{ window.rtSfx && rtSfx('success'); }catch(e){} }
      else if(P.wear.includes(s.id)) P.wear = P.wear.filter(x=> x !== s.id); else P.wear.push(s.id);
      save(); paint(); avatar(); }));
    const nm = body.querySelector('#petName'); if(nm) nm.addEventListener('change', ()=>{ P.name = nm.value.trim() || 'Frugu'; save(); paint(); avatar(); });
    const sh = body.querySelector('#petShow'); if(sh) sh.addEventListener('change', ()=>{ P.shown = sh.checked; save(); avatar(); });
    body.querySelector('.pet-stage').addEventListener('click', ()=>{ if(P.hatched){ act('love'); } });
  }
  function openPet(){ tick(); sheet('xPet', '🦝 ' + esc(P.name), ''); paint(); }
  window.openPet = openPet;

  // ---------- reagisce a quello che fai nell'app ----------
  if(typeof window.setStatus === 'function'){
    const o = window.setStatus;
    window.setStatus = function(id, st){ const before = STATUSES[id]; const r = o.apply(this, arguments); try{ if(st === 'played' && before !== 'played' && STATUSES[id] === 'played'){ P.games = (P.games || 0) + 1; P.fun = clamp(P.fun + 15); addLog('Festa! Hai finito ' + ((GAMES.find(g=> g.id === id) || {}).name || 'un gioco')); reward(10, 25, 'fa festa perché hai finito un gioco!'); avatar(); } }catch(e){} return r; };
    try{ setStatus = window.setStatus; }catch(e){}
  }
  window.addEventListener('update-plus', e=>{ if(e.detail && e.detail.ok){ P.coins += 2; P.xp += 1; save(); } });
  if(typeof window.showAddedBanner === 'function'){ const o = window.showAddedBanner; window.showAddedBanner = function(){ try{ P.coins += 5; P.xp += 2; save(); }catch(e){} return o.apply(this, arguments); }; try{ showAddedBanner = window.showAddedBanner; }catch(e){} }

  // avvio: il tempo trascorso, saluto, avatar e controllo ogni minuto
  tick();
  const away = (now() - (P.last || now())) / H;
  avatar();
  // v215: niente più palloncino automatico all'avvio («Frugu: ha sporcato!» ecc.): il bisogno si vede solo come puntino sull'avatar
  // setTimeout(()=>{ const n = need(); if(P.hatched && P.shown && (n || away > 8)) toast('🦝 ' + P.name + (n ? ': ' + n.toLowerCase() + '!' : ' è felice di rivederti!'), 4500); }, 6000);
  setInterval(()=>{ tick(); avatar(); paint(); }, 60e3);
  (window.XMENU = window.XMENU || []).push({html: '🦝 ' + esc(P.name) + ' (il tuo procione)', run: openPet});
})();
