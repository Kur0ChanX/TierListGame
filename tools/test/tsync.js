// v219: sincronizzazione con richiesta condizionale (ETag): non scarica né analizza se non è cambiato niente; invia se hai modificato
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:412,height:915}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const log=[]; let ver=1;
await ctx.route('**/*',async r=>{const rq=r.request(), u=rq.url(); if(u.startsWith('file:')) return r.continue();
  if(/api\.github\.com\/gists\/g1$/.test(u)){
    if(rq.method()==='PATCH'){ ver++; log.push('PATCH'); return r.fulfill({status:200,contentType:'application/json',headers:{etag:'W/"v'+ver+'"','access-control-allow-origin':'*','access-control-expose-headers':'ETag'},body:JSON.stringify({id:'g1',files:{}})}); }
    const inm=rq.headers()['if-none-match']; log.push('GET'+(inm?' (condizionale '+inm+')':''));
    if(inm==='W/"v'+ver+'"') return r.fulfill({status:304,headers:{etag:'W/"v'+ver+'"','access-control-allow-origin':'*','access-control-expose-headers':'ETag'},body:''});
    return r.fulfill({status:200,contentType:'application/json',headers:{etag:'W/"v'+ver+'"','access-control-allow-origin':'*','access-control-expose-headers':'ETag'},body:JSON.stringify({id:'g1',files:{'tierlist-data.json':{content:JSON.stringify({keys:{}})}}})});
  }
  return r.abort();});
await ctx.addInitScript(()=>{ window.__ks={}; const o=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(/^jrpg_/.test(k)) window.__ks[k]=(window.__ks[k]||0)+1; if(k==='rt_sync_dirty'){ (window.__dl=window.__dl||[]).push(Math.round(performance.now())+' set '+((new Error().stack||'').split('\n').slice(2,4).map(l=>(l.match(/([\w-]+\.js):(\d+)/)||[''])[0]).join('<'))); } return o.apply(this,arguments); }; });
await ctx.addInitScript(()=>{ if(sessionStorage.getItem('s')) return; sessionStorage.setItem('s','1'); localStorage.setItem('jrpg_sync_token','x'); localStorage.setItem('jrpg_sync_gist','g1'); localStorage.setItem('rt_calm','on'); localStorage.setItem('jrpg_intro','off'); });
await p.goto('file:///home/user/TierListGame/Tier%20List%20RPG%20%26%20JRPG%20di%20Mario.html'); await p.waitForTimeout(9000);
console.log('1) all\'avvio:', log.join(' | '));
console.log('   chiavi scritte (jrpg_):', await p.evaluate(()=>JSON.stringify(window.__ks||{}))); await p.waitForTimeout(42000); console.log('   chiavi scritte dopo:', await p.evaluate(()=>JSON.stringify(window.__ks||{}))); console.log('   (dopo 20 s di quiete) dirty=',await p.evaluate(()=>localStorage.getItem('rt_sync_dirty')),'etag=',await p.evaluate(()=>localStorage.getItem('rt_sync_etag')), '| richieste intanto:', log.join(' | ')); log.length=0; await p.evaluate(()=>syncNow()); await p.waitForTimeout(800);
console.log('2) subito dopo, senza modifiche:', log.join(' | '), '(deve essere condizionale e senza PATCH)');
log.length=0; await p.evaluate(()=>{ localStorage.setItem('jrpg_prova_sync','ciao'); }); console.log('   stato subito dopo la modifica: dirty=',await p.evaluate(()=>localStorage.getItem('rt_sync_dirty')),'etag=',await p.evaluate(()=>localStorage.getItem('rt_sync_etag'))); await p.waitForTimeout(21000);
console.log('3) dopo una modifica (dopo 15 s):', log.join(' | '), '(deve fare GET completo + PATCH)');
log.length=0; await p.evaluate(()=>syncNow({force:true})); await p.waitForTimeout(800);
console.log('4) «Sincronizza ora» a mano:', log.join(' | '), '(sempre completo)');
console.log('storia dirty:', await p.evaluate(()=>JSON.stringify(window.__dl||[]))); console.log('ERR',errs);await b.close();})();
