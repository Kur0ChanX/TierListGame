// v225: voce AI con i modelli nuovi (interactions) e riserva sui vecchi (generateContent); scelta della voce; errore chiaro
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
let mode='ix'; const seen=[];
// WAV breve (0,2 s di silenzio)
const pcm=Buffer.alloc(9600); const hdr=Buffer.alloc(44); hdr.write('RIFF',0); hdr.writeUInt32LE(36+pcm.length,4); hdr.write('WAVEfmt ',8); hdr.writeUInt32LE(16,16); hdr.writeUInt16LE(1,20); hdr.writeUInt16LE(1,22); hdr.writeUInt32LE(24000,24); hdr.writeUInt32LE(48000,28); hdr.writeUInt16LE(2,32); hdr.writeUInt16LE(16,34); hdr.write('data',36); hdr.writeUInt32LE(pcm.length,40);
const wav=Buffer.concat([hdr,pcm]).toString('base64');
await ctx.route('**/*',r=>{const u=r.request().url();
  if(u.includes('generativelanguage.googleapis.com')){ const body=JSON.parse(r.request().postData()||'{}'); seen.push((u.includes('interactions')?'ix:'+body.model+':'+body.generation_config.speech_config[0].voice:'gc:'+u.split('/models/')[1].split(':')[0]));
    const H={'access-control-allow-origin':'*','access-control-allow-headers':'*','content-type':'application/json'};
    if(r.request().method()==='OPTIONS') return r.fulfill({status:204,headers:H});
    if(mode==='ix' && u.includes('interactions')) return r.fulfill({status:200,headers:H,body:JSON.stringify({steps:[{type:'model_output',content:[{type:'audio',mime_type:'audio/wav',data:wav}]}]})});
    if(mode==='gc' && u.includes(':generateContent')) return r.fulfill({status:200,headers:H,body:JSON.stringify({candidates:[{content:{parts:[{inlineData:{mimeType:'audio/L16;codec=pcm;rate=24000',data:pcm.toString('base64')}}]}}]})});
    if(mode==='quota') return r.fulfill({status:429,headers:H,body:JSON.stringify({error:{message:'quota'}})});
    return r.fulfill({status:404,headers:H,body:JSON.stringify({error:{message:'model not found'}})}); }
  if(u.startsWith('file:')) return r.continue(); return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(7000);
await p.evaluate(()=>{ localStorage.setItem('jrpg_gemini_key','FINTA'); localStorage.setItem('jrpg_story_auto','off'); speechSynthesis.speak=u=>{window.__robot=(window.__robot||0)+1; setTimeout(()=>u.onend&&u.onend(),10);}; });
await p.evaluate(()=>{ window.__g=GAMES.find(x=>x.story)||GAMES[3]; openModal(__g); }); await p.waitForTimeout(700);
console.log('tasto voce:', await p.evaluate(()=>document.getElementById('vcSet').textContent));
await p.evaluate(()=>document.getElementById('vcBtn').click()); await p.waitForTimeout(1500);
console.log('modelli nuovi →', seen.join(' , '), '| stato:', await p.evaluate(()=>document.getElementById('vcBtn').dataset.s), '| robot:', await p.evaluate(()=>window.__robot||0), '| ok:', await p.evaluate(()=>localStorage.getItem('rt_tts_ok')));
await p.evaluate(()=>{ rtStory.stop(); localStorage.removeItem('rt_tts_ok'); }); seen.length=0; mode='gc';
await p.evaluate(async()=>{ const c=await caches.open('rt_voce1'); (await c.keys()).forEach(k=>c.delete(k)); });
await p.evaluate(()=>document.getElementById('vcBtn').click()); await p.waitForTimeout(1500);
console.log('riserva vecchi →', seen.join(' , '), '| ok:', await p.evaluate(()=>localStorage.getItem('rt_tts_ok')), '| robot:', await p.evaluate(()=>window.__robot||0));
await p.evaluate(()=>rtStory.stop()); seen.length=0; mode='quota';
await p.evaluate(async()=>{ const c=await caches.open('rt_voce1'); for(const k of await c.keys()) await c.delete(k); });
await p.evaluate(()=>document.getElementById('vcBtn').click()); await p.waitForTimeout(1200);
console.log('quota finita → errore:', await p.evaluate(()=>localStorage.getItem('rt_tts_err')), '| robot (riserva):', await p.evaluate(()=>window.__robot||0));
// finestra voce
await p.evaluate(()=>rtStory.stop()); mode='ix'; seen.length=0;
await p.evaluate(()=>document.getElementById('vcSet').click()); await p.waitForTimeout(300);
console.log('voci: uomo', await p.evaluate(()=>document.querySelectorAll('#xVoce .vs-ai .vs-grid')[0].children.length), 'donna', await p.evaluate(()=>document.querySelectorAll('#xVoce .vs-ai .vs-grid')[1].children.length));
await p.evaluate(()=>document.querySelector('#xVoce [data-vv="Orus"]').click()); await p.waitForTimeout(900);
console.log('scelta Orus →', seen.join(' , '), '| salvata:', await p.evaluate(()=>localStorage.getItem('jrpg_tts_voice')));
await p.evaluate(()=>document.querySelector('#xVoce [data-eng="phone"]').click());
console.log('motore telefono:', await p.evaluate(()=>localStorage.getItem('jrpg_tts_engine')), '| riquadro AI nascosto:', await p.evaluate(()=>document.querySelector('#xVoce .vs-ai').hidden));
console.log('ERR',errs);await b.close();})();
