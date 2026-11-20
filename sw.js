const VER='caddy-v4',TILES='caddy-tiles-v1',MAXT=600;
const PRE=['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(VER).then(c=>Promise.all(PRE.map(u=>c.add(u).catch(()=>{})))));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VER&&x!==TILES).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
/* app files: network first (3 s), cache as fallback. Map tiles: cache first, so visited holes work with no signal */
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(/arcgisonline\.com$/.test(u.hostname)){
    e.respondWith((async()=>{
      const c=await caches.open(TILES),m=await c.match(r);if(m)return m;
      try{const res=await fetch(r);if(res&&res.ok){c.put(r,res.clone());c.keys().then(k=>{if(k.length>MAXT)c.delete(k[0]);});}return res;}catch(_){return Response.error();}
    })());return;
  }
  if(u.origin!==location.origin&&!/unpkg\.com/.test(u.hostname))return;
  e.respondWith((async()=>{
    const c=await caches.open(VER);
    const net=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res;});
    try{return await Promise.race([net,new Promise((_,j)=>setTimeout(j,3000))]);}
    catch(_){const m=await c.match(r);if(m)return m;return net;}
  })());
});
