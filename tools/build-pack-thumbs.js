#!/usr/bin/env node
// Costruisce le anteprime del selettore dei temi grafici: packs/thumbs/ID-d.webp (scuro) e ID-l.webp (chiaro), più «orig» per il tema originale.
// Apre l'app vera con ogni tema e ne fotografa la parte alta (testata, pulsanti, tier). Serve Playwright con Chromium (sviluppo): non gira sui server.
// Uso:  node tools/build-pack-thumbs.js [id,id,...]      (senza argomenti rifà tutte le anteprime)
const fs = require('fs'), path = require('path');
let chromium; try{ ({chromium} = require('playwright')); }catch(e){ console.error('Serve Playwright: npm i -g playwright'); process.exit(1); }
const ROOT = path.join(__dirname, '..');
const HTML = 'file://' + path.join(ROOT, 'Tier List RPG & JRPG di Mario.html').split('/').map((s, i)=> i ? encodeURIComponent(s) : s).join('/');
const OUT = path.join(ROOT, 'packs', 'thumbs');
const exe = fs.existsSync('/opt/pw-browsers/chromium') ? {executablePath: '/opt/pw-browsers/chromium'} : {};
const src = fs.readFileSync(path.join(ROOT, 'packs.js'), 'utf8');
// elenco dei temi preso da packs.js (id e modo): niente da tenere aggiornato a mano
const packs = [...src.matchAll(/\{id: '([a-z0-9]+)', g: '[^']*', n: '[^']*', t: '[^']*', m: '(both|dark|light)'/g)].map(m=> ({id: m[1], m: m[2]}));
const only = process.argv[2] ? process.argv[2].split(',') : null;
const jobs = [];
[{id: 'orig', m: 'both'}, ...packs].forEach(p=>{ if(only && !only.includes(p.id)) return; (p.m === 'both' ? ['dark', 'light'] : [p.m]).forEach(mode=> jobs.push({id: p.id, mode})); });
(async()=>{
  fs.mkdirSync(OUT, {recursive: true});
  const b = await chromium.launch(exe);
  const conv = await (await b.newContext()).newPage();
  for(const j of jobs){
    const ctx = await b.newContext({viewport: {width: 390, height: 760}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: j.mode});
    const p = await ctx.newPage();
    await p.addInitScript(([id])=>{ try{ localStorage.setItem('jrpg_pack', JSON.stringify(id === 'orig' ? '' : id)); localStorage.setItem('jrpg_palette', '"apple"'); }catch(e){} }, [j.id]);
    await p.goto(HTML); await p.waitForTimeout(2800);
    await p.evaluate(()=>{ const t = document.getElementById('toast'); if(t) t.classList.remove('show'); });
    const png = await p.screenshot({clip: {x: 0, y: 14, width: 390, height: 408}});
    const b64 = await conv.evaluate(async([data])=>{
      const img = new Image(); img.src = 'data:image/png;base64,' + data; await img.decode();
      const c = document.createElement('canvas'); c.width = 320; c.height = 335; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, 320, 335);
      return c.toDataURL('image/webp', .74).split(',')[1];
    }, [png.toString('base64')]);
    const f = path.join(OUT, j.id + '-' + (j.mode === 'dark' ? 'd' : 'l') + '.webp');
    fs.writeFileSync(f, Buffer.from(b64, 'base64'));
    console.log(path.basename(f), Math.round(fs.statSync(f).size / 1024) + ' KB');
    await ctx.close();
  }
  await b.close();
})();
