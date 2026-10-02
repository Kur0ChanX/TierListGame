(function(){
  if(window.__rtApk) return; window.__rtApk = 1;
  var P = window.RTApk; if(!P) return;
  var FS = /\(\s*display-mode\s*:\s*fullscreen\s*\)/g, ALL = '(min-width:0px)';
  function send(o){ try{ P.postMessage(JSON.stringify(o)); }catch(e){} }

  // L'APK è sempre a schermo intero: le regole «display-mode: fullscreen» devono valere anche qui.
  var mm = window.matchMedia && window.matchMedia.bind(window);
  if(mm) window.matchMedia = function(q){ return mm(String(q).replace(FS, ALL)); };
  function fixSheet(sh){
    var rs; try{ rs = sh.cssRules; }catch(e){ return; }
    if(!rs || sh.__rtFix) return; sh.__rtFix = 1;
    for(var i = rs.length - 1; i >= 0; i--){
      var r = rs[i]; if(r.type !== 4) continue;
      var c = r.conditionText || (r.media && r.media.mediaText) || '';
      if(!/display-mode\s*:\s*fullscreen/.test(c)) continue;
      var inner = ''; for(var j = 0; j < r.cssRules.length; j++) inner += r.cssRules[j].cssText;
      try{ sh.deleteRule(i); sh.insertRule('@media ' + c.replace(FS, ALL) + '{' + inner + '}', i); }catch(e){}
    }
  }
  function fixAll(){ for(var k = 0; k < document.styleSheets.length; k++) fixSheet(document.styleSheets[k]); }
  document.addEventListener('DOMContentLoaded', fixAll); window.addEventListener('load', fixAll);
  new MutationObserver(function(ms){
    ms.forEach(function(m){ m.addedNodes.forEach(function(n){
      if(n.nodeName === 'LINK' || n.nodeName === 'STYLE'){ n.addEventListener('load', fixAll); setTimeout(fixAll, 0); }
    }); });
  }).observe(document, {childList: true, subtree: true});

  // Salvataggio dei file (backup, immagini, calendario) nella cartella Download.
  function save(href, name){
    fetch(href).then(function(r){ return r.blob(); }).then(function(b){
      var fr = new FileReader();
      fr.onload = function(){ var s = String(fr.result); send({t: 'save', name: name || 'file', mime: b.type || 'application/octet-stream', data: s.slice(s.indexOf(',') + 1)}); };
      fr.readAsDataURL(b);
    }).catch(function(){});
  }
  function dl(a){ var h = a.href || ''; return a.hasAttribute('download') && /^(blob|data):/.test(h); }
  var oc = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function(){ if(dl(this)){ save(this.href, this.getAttribute('download')); return; } return oc.apply(this, arguments); };
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('a[download]') : null;
    if(a && dl(a)){ e.preventDefault(); save(a.href, a.getAttribute('download')); }
  }, true);

  // Lettura ad alta voce con la voce di Android.
  var cbs = {}, n = 0;
  function Utt(t){ this.text = t || ''; this.lang = 'it-IT'; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null; this.onstart = this.onend = this.onerror = null; }
  Utt.prototype.addEventListener = function(t, f){ this['on' + t] = f; };
  var V = [{name: 'Voce di Android', lang: 'it-IT', voiceURI: 'android', localService: true, 'default': true}];
  var S = {
    speaking: false, pending: false, paused: false, onvoiceschanged: null,
    getVoices: function(){ return V; },
    speak: function(u){ var id = ++n; cbs[id] = u; S.speaking = true; send({t: 'speak', id: id, text: String(u.text || ''), rate: +u.rate || 1, pitch: +u.pitch || 1, lang: u.lang || 'it-IT'}); },
    cancel: function(){ cbs = {}; S.speaking = false; send({t: 'stop'}); },
    pause: function(){}, resume: function(){}, addEventListener: function(){}, removeEventListener: function(){}
  };
  try{ Object.defineProperty(window, 'speechSynthesis', {value: S, configurable: true}); }catch(e){ window.speechSynthesis = S; }
  try{ Object.defineProperty(window, 'SpeechSynthesisUtterance', {value: Utt, configurable: true, writable: true}); }catch(e){ window.SpeechSynthesisUtterance = Utt; }
  P.onmessage = function(e){
    var m; try{ m = JSON.parse(e.data); }catch(x){ return; }
    if(m.t !== 'tts') return;
    var u = cbs[m.id]; if(!u) return;
    if(m.ev === 'start'){ if(u.onstart) u.onstart.call(u, {type: 'start', utterance: u}); return; }
    delete cbs[m.id]; S.speaking = Object.keys(cbs).length > 0;
    var f = m.ev === 'end' ? u.onend : u.onerror; if(f) f.call(u, {type: m.ev, utterance: u, error: m.ev === 'end' ? undefined : 'synthesis-failed'});
  };
})();
