// Dba o to, żeby telefon po każdym deployu dostał nową wersję aplikacji.
// __APP_VERSION__ podmienia GitHub Actions na skrót SHA commita (lokalnie zostaje placeholder).
(function(){
  const VERSION = '__APP_VERSION__';
  const isDev = VERSION.indexOf('__') === 0;

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  if(isDev) return;

  // Po powrocie do karty (telefon trzyma ją w pamięci) sprawdź, czy jest nowsza wersja
  async function checkForUpdate(){
    try{
      const res = await fetch('version.json', { cache: 'no-store' });
      if(!res.ok) return;
      const { version } = await res.json();
      if(!version || version === VERSION) return;
      if(document.body.classList.contains('running')) return; // nie przerywaj treningu
      // Zabezpieczenie przed pętlą przeładowań
      if(sessionStorage.getItem('reloadedFor') === version) return;
      sessionStorage.setItem('reloadedFor', version);
      location.reload();
    }catch(e){}
  }

  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'visible') checkForUpdate();
  });
  window.addEventListener('pageshow', e => { if(e.persisted) checkForUpdate(); });
})();
