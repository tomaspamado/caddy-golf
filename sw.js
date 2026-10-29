// Caddy service worker. Bump VER when shipping; index.html is network-first so it is never stale online.
const VER='caddy-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg',
 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VER).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==VER).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  const own=u.origin===self.location.origin;
  if(own||u.hostname==='unpkg.com'){
    const shell=r.mode==='navigate'||(own&&/(\/|index\.html|sw\.js)$/.test(u.pathname));
    if(shell){ // network first, cache fallback
      e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(VER).then(c=>c.put(r,cp));}return res;})
        .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html'))));
    }else{ // cache first
      e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(VER).then(c=>c.put(r,cp));}return res;})));
    }
  }
});
