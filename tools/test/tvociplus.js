// v254: voci in più (Azure, ElevenLabs, Cartesia con risposte finte; Piper vero se c'è internet: PIPER=1)
const {chromium}=require('playwright');
(async()=>{const px=process.env.HTTPS_PROXY;const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'],proxy:px?{server:px}:undefined});
const ctx=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,ignoreHTTPSErrors:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const seen=[];const mp3=Buffer.from('SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//WreyTRUoAWgBgkOAGbZHBgG1OF6zM82DWbZaUmMBptgQhGjsyYqc9ae9XFz280948NMBWInljyzsNRFLPWdnZGWrddDsjK1unuSrVN9jJsK8KuQtQCtMBjCEtImISdNKJOopIpBFpNSMbIHCSRpRR5iakjTiyzLhchUUBwCgyKiweBv/7UsQbg8isVNoMPMjAAAA0gAAABEVFGmgqK////9bP/6XCykxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq','base64');
let mode='ok';
await ctx.route('**/*',r=>{const u=r.request().url(),m=r.request().method();const H={'access-control-allow-origin':'*','access-control-allow-headers':'*'};
  if(/tts\.speech\.microsoft|api\.elevenlabs|api\.cartesia/.test(u)){ if(m==='OPTIONS') return r.fulfill({status:204,headers:H}); seen.push(u.split('?')[0].replace(/^https:\/\//,'')+' '+(r.request().postData()||'').slice(0,90));
    if(mode==='bad') return r.fulfill({status:401,headers:{...H,'content-type':'application/json'},body:JSON.stringify({detail:{status:'invalid_api_key',message:'Invalid API key'}})});
    if(/voices\/list/.test(u)) return r.fulfill({status:200,headers:{...H,'content-type':'application/json'},body:JSON.stringify([{ShortName:'it-IT-IsabellaMultilingualNeural',Locale:'it-IT',Gender:'Female',VoiceType:'Neural'},{ShortName:'it-IT-DiegoNeural',Locale:'it-IT',Gender:'Male',VoiceType:'Neural'},{ShortName:'en-US-AvaNeural',Locale:'en-US',Gender:'Female'}])});
    if(/elevenlabs.*\/v1\/voices/.test(u)) return r.fulfill({status:200,headers:{...H,'content-type':'application/json'},body:JSON.stringify({voices:[{voice_id:'EL1',name:'George',labels:{gender:'male',accent:'british'}},{voice_id:'EL2',name:'Sarah',labels:{gender:'female'}}]})});
    if(/cartesia.*\/voices/.test(u)) return r.fulfill({status:200,headers:{...H,'content-type':'application/json'},body:JSON.stringify({data:[{id:'CA1',name:'Giulia',gender:'feminine',language:'it'},{id:'CA2',name:'Marco',gender:'masculine',language:'it'}]})});
    if(/cartesia.*tts/.test(u) && /sonic-3/.test(r.request().postData()||'')) return r.fulfill({status:400,headers:{...H,'content-type':'application/json'},body:JSON.stringify({error:'model sonic-3 not found'})});
    return r.fulfill({status:200,headers:{...H,'content-type':'audio/mpeg'},body:mp3}); }
  if(u.startsWith('file:')) return r.continue();
  if(process.env.PIPER && /jsdelivr|huggingface|hf\.co|cdnjs|xethub|cas-bridge/.test(u)) return r.continue();
  return r.abort();});
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(7000);
await p.evaluate(()=>{ localStorage.setItem('jrpg_story_auto','off'); speechSynthesis.speak=u=>{window.__robot=(window.__robot||0)+1; setTimeout(()=>u.onend&&u.onend(),10);}; openModal(GAMES.find(x=>x.story)||GAMES[3]); }); await p.waitForTimeout(700);
await p.evaluate(()=>document.getElementById('vcSet').click()); await p.waitForTimeout(400);
console.log('motori:', await p.evaluate(()=>[...document.querySelectorAll('#xVoce [data-eng]')].map(x=>x.dataset.eng).join(',')));
console.log('catena con chiavi:', await p.evaluate(()=>{ localStorage.setItem('jrpg_azure_key','x'); localStorage.setItem('jrpg_cartesia_key','x'); localStorage.setItem('jrpg_gcloud_key','x'); localStorage.setItem('jrpg_gemini_key','x'); localStorage.setItem('jrpg_tts_engine','cart'); document.getElementById('vcSet').click(); const t=document.getElementById('vcSet').textContent; ['jrpg_azure_key','jrpg_cartesia_key','jrpg_gcloud_key','jrpg_gemini_key'].forEach(k=>localStorage.removeItem(k)); return t; }));
for(const [id,k] of [['azure','AZ'],['eleven','EL'],['cart','CA']]){
  seen.length=0;
  await p.evaluate(id=>document.querySelector(`#xVoce [data-eng="${id}"]`).click(), id); await p.waitForTimeout(200);
  console.log(id,'tasto dice:', await p.evaluate(()=>document.getElementById('vcSet').textContent));
  console.log(id,'senza chiave →', await p.evaluate(()=>document.querySelector('#xVoce .vs-st').textContent));
  await p.evaluate(([id,k])=>{ const bx=document.querySelector(`[data-vpbox="${id}"]`); bx.querySelector('[data-vk]').value='FINTA-'+k; bx.querySelector('[data-vsave]').click(); }, [id,k]); await p.waitForTimeout(1200);
  const vv=await p.evaluate(id=>[...document.querySelectorAll(`[data-vpbox="${id}"] [data-vpv]`)].map(x=>x.dataset.vpv+(x.classList.contains('on')?'*':'')).join(','), id);
  console.log('   voci:', vv, '| richieste:', seen.length, '| stato:', await p.evaluate(()=>document.querySelector('#xVoce .vs-st').textContent));
  // lettura vera della storia
  await p.evaluate(()=>{ document.querySelector('#xVoce .x-close, #xVoce [data-close]')?.click(); rtStory.stop(); }); seen.length=0;
  await p.evaluate(()=>rtStory.play(window.__g=GAMES.find(x=>x.story)||GAMES[3])); await p.waitForTimeout(1500);
  console.log('   lettura storia → richieste TTS:', seen.filter(s=>/cognitiveservices\/v1|text-to-speech|tts\/bytes/.test(s)).length, '| robot:', await p.evaluate(()=>window.__robot||0), seen.filter(s=>/cartesia.*tts/.test(s)).slice(0,2).map(s=>s.slice(0,70)).join(' | '));
  await p.evaluate(()=>{ rtStory.stop(); document.getElementById('vcSet')?.click(); }); await p.waitForTimeout(300);
}
// chiave sbagliata → avviso chiaro e riserva
mode='bad'; await p.evaluate(()=>{ localStorage.setItem('jrpg_tts_engine','eleven'); localStorage.setItem('jrpg_eleven_key','SBAGLIATA'); window.__robot=0; }); await p.evaluate(async()=>{ for(const k of await caches.keys()) if(/voce_plus/.test(k)) await caches.delete(k); });
await p.evaluate(()=>{ rtStory.stop(); rtStory.play(GAMES.find(x=>x.story)||GAMES[3]); }); await p.waitForTimeout(1500);
console.log('chiave sbagliata → errore:', await p.evaluate(()=>rtVociPlus.err('eleven')), '| riserva robot:', await p.evaluate(()=>window.__robot||0));
if(process.env.PIPER){ mode='ok'; await p.evaluate(()=>{ rtStory.stop(); localStorage.setItem('jrpg_tts_engine','piper'); });
  const t0=Date.now(); const r=await p.evaluate(async()=>{ let ticks=0, maxGap=0, last=performance.now(); const iv=setInterval(()=>{ const n=performance.now(); maxGap=Math.max(maxGap,n-last); last=n; ticks++; },50); try{ const bl=await rtVociPlus.audio('piper','Ciao, sono la voce offline. Questa frase è un po\' più lunga per vedere se l\'app resta libera.'); clearInterval(iv); return 'blob '+bl.type+' '+bl.size+' | blocco più lungo dell\'app: '+Math.round(maxGap)+' ms'; }catch(e){ clearInterval(iv); return 'ERRORE '+e.message; } });
  console.log('piper →', r, ((Date.now()-t0)/1000).toFixed(1)+'s', '| pronta:', await p.evaluate(()=>rtVociPlus.ready('piper'))); }
console.log('ERR',errs);await b.close();})();
