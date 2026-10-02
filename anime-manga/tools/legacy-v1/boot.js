// AVVIO dell'app: deve restare l'ultimo script caricato (tutte le funzioni degli altri file devono già esistere).
(function boot(){
  const dateIt = iso=>{ try{ return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', {day:'numeric', month:'long', year:'numeric'}); }catch(e){ return iso; } };
  const bl = document.getElementById('buildLine');
  if(bl) bl.textContent = `Database aggiornato al ${dateIt(AM.built)} · ${ITEMS.length} titoli · voti AniList e IMDb`;
  renderListBar(); renderStudioFilter(); renderStats(); renderTagChips(); renderMoodChips(); renderMetrics(); syncQuick();
  renderCompareTray();
  // scheda condivisa: index.html#t=a16498
  const m = location.hash.match(/^#t=([a-z]\d+)$/);
  setView('list');
  if(m){ const g = byId(m[1]); if(g) setTimeout(()=> openModal(g), 300); }
  if(typeof window.bootExtras === 'function') window.bootExtras();
})();
