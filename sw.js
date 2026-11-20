const VER='caddy-v3';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VER).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
/* network first (3 s), cache as fallback: updates show on the next open, still works offline */
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin!==location.origin&&!/unpkg\.com/.test(u.hostname))return;
  e.respondWith((async()=>{
    const c=await caches.open(VER);
    const net=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res;});
    try{return await Promise.race([net,new Promise((_,j)=>setTimeout(j,3000))]);}
    catch(_){const m=await c.match(r);if(m)return m;return net;}
  })());
});
