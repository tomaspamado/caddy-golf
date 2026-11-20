"use strict";
/* Real-round course data from OpenStreetMap: front/middle/back of the green and automatic hole advance.
   Falls back silently when the course is not mapped (the card just does not show). */
(function(){
  const CK='caddy.osm',DW=20000,NEAR=60;
  let DATA=null,key='',busy=false,cand=null,candT=0,last=null;
  const rad=Math.PI/180;
  const xy=(p,o)=>({x:(p.lng-o.lng)*111320*Math.cos(o.lat*rad),y:(p.lat-o.lat)*110540});
  const ll=g=>({lat:g.lat,lng:g.lon});
  function parse(j){
    const holes=[],greens=[];
    (j.elements||[]).forEach(e=>{
      if(e.type!=='way'||!e.geometry||e.geometry.length<2)return;
      const g=e.geometry.map(ll),t=e.tags||{};
      if(t.golf==='hole')holes.push({ref:parseInt(t.ref,10)||null,par:parseInt(t.par,10)||null,pts:g});
      else if(t.golf==='green'&&g.length>=3)greens.push(g);
    });
    greens.forEach(g=>{g.c={lat:g.reduce((a,p)=>a+p.lat,0)/g.length,lng:g.reduce((a,p)=>a+p.lng,0)/g.length};});
    return{holes,greens};
  }
  function load(p){
    const k=p.lat.toFixed(2)+','+p.lng.toFixed(2);
    if(busy||k===key&&DATA)return;
    key=k;let c={};try{c=JSON.parse(localStorage.getItem(CK)||'{}');}catch(_){}
    if(c[k]){DATA=parse(c[k]);return;}
    busy=true;
    const q='[out:json][timeout:20];(way["golf"="hole"](around:900,'+p.lat+','+p.lng+');way["golf"="green"](around:900,'+p.lat+','+p.lng+'););out geom;';
    fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:'data='+encodeURIComponent(q)}).then(r=>r.json()).then(j=>{
      DATA=parse(j);const keep={};keep[k]=j;try{localStorage.setItem(CK,JSON.stringify(keep));}catch(_){}
    }).catch(()=>{key='';}).finally(()=>{busy=false;});
  }
  /* distance from point to a polyline, in metres */
  function dLine(p,pts){
    const o=p,q=pts.map(a=>xy(a,o));let m=1e9;
    for(let i=0;i<q.length-1;i++){
      const a=q[i],b=q[i+1],dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,-(a.x*dx+a.y*dy)/l)):0,x=a.x+t*dx,y=a.y+t*dy;
      m=Math.min(m,Math.hypot(x,y));
    }
    return m;
  }
  function greenFor(h){
    if(!DATA)return null;const end=h.pts[h.pts.length-1];let b=null,bd=40;
    DATA.greens.forEach(g=>{const d=dist(end,g.c);if(d<bd){bd=d;b=g;}});return b;
  }
  /* the hole the player is standing on */
  function here(){
    if(!DATA||!R.me)return null;let b=null,bd=NEAR;
    DATA.holes.forEach(h=>{const d=dLine(R.me,h.pts);if(d<bd){bd=d;b=h;}});return b;
  }
  /* front / middle / back from where the player is */
  function fmb(){
    if(!R.me)return null;
    let g=null,c=null;
    const h=last||here();
    if(h){g=greenFor(h);c=g?g.c:h.pts[h.pts.length-1];}
    if(R.pin)c=R.pin;
    if(!c)return null;
    const mid=dist(R.me,c);let f=mid-12,b=mid+12;
    if(g){
      const o=R.me,u=xy(c,o),n=Math.hypot(u.x,u.y)||1;let lo=1e9,hi=-1e9;
      g.forEach(p=>{const v=xy(p,o),s=(v.x*u.x+v.y*u.y)/n;lo=Math.min(lo,s);hi=Math.max(hi,s);});
      const cc=xy(g.c,o),sc=(cc.x*u.x+cc.y*u.y)/n;f=mid+(lo-sc);b=mid+(hi-sc);
    }
    return{f:Math.max(0,f),m:mid,b:b};
  }
  function card(){
    let el=document.getElementById('grn');
    if(!el){el=document.createElement('div');el.id='grn';el.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 62px);z-index:5;background:rgba(23,23,23,.88);color:#fff;border-radius:14px;padding:6px 12px;font-size:14px;font-weight:600;display:none;gap:12px;white-space:nowrap;pointer-events:none';document.body.appendChild(el);}
    const v=document.body.classList.contains('ongps')&&S.round?fmb():null;
    if(!v){el.style.display='none';return;}
    const u=ul(),s=(l,x)=>'<span><small style="opacity:.7;font-weight:500">'+l+'</small> '+d1(x)+'</span>';
    el.innerHTML=s(T('Front','Frente'),v.f)+s(T('Middle','Meio'),v.m)+s(T('Back','Fundo'),v.b)+'<small style="opacity:.7;font-weight:500">'+u+'</small>';
    el.style.display='flex';
  }
  function auto(){
    if(!S.round||!R.me||S.autoHole===false)return;
    const h=here();if(!h)return;last=h;
    const n=h.ref;if(!n||n>S.round.holes.length||S.round.cur===n-1){cand=null;return;}
    const now=Date.now();
    if(cand!==n){cand=n;candT=now;return;}
    if(now-candT<DW)return;
    cand=null;S.round.cur=n-1;
    const hl=S.round.holes[n-1];if(h.par&&hl&&hl.score==null)hl.par=h.par;
    const g=greenFor(h);try{newHole();}catch(_){}
    if(g)try{placePinAt(g.c);}catch(_){}
    save();try{if(typeof openHole==='function'&&!$('#panel').hidden)openHole();}catch(_){}
    refresh();
  }
  const _sm=setMe;
  setMe=function(p,acc){const r=_sm.apply(this,arguments);try{if(document.body.classList.contains('ongps')){load(p);auto();}}catch(e){}return r;};
  const _rf=refresh;
  refresh=function(){const r=_rf.apply(this,arguments);try{card();}catch(e){}return r;};
  window.__course={parse:j=>{DATA=parse(j);key='x';},fmb,here,card,auto};
})();
