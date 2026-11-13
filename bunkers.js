"use strict";
/* ============ Auto bunkers + water: pulled from OpenStreetMap (Overpass) around the player, cached on the phone,
   and fed into the same hazard system as the hand-drawn ⚠ hazards (club advice, trouble %, distances). ============ */
(function(){
  const bT=(e,p)=>S.lang==='pt'?p:e;
  const KEY='caddy_bn1',RAD=2500,REF=1200,MAXD_NO_TARGET=220,CORR=40,MAXH=10;
  const BN={items:{},cs:[],st:'idle',last:0,busy:false,drawKey:''};
  try{const j=JSON.parse(localStorage.getItem(KEY)||'null');if(j&&j.items&&j.cs){BN.items=j.items;BN.cs=j.cs;BN.st=Object.keys(j.items).length?'ok':'none';}}catch(e){}
  function persist(){try{localStorage.setItem(KEY,JSON.stringify({items:BN.items,cs:BN.cs}));}catch(e){}}

  /* ---------- fetch ---------- */
  const EP=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
  function query(c){
    const a='(around:'+RAD+','+c.lat.toFixed(5)+','+c.lng.toFixed(5)+')';
    return '[out:json][timeout:25];(way["golf"="bunker"]'+a+';way["golf"="water_hazard"]'+a+';way["golf"="lateral_water_hazard"]'+a+';);out geom;';
  }
  async function get(q){
    let err;
    for(const ep of EP){
      try{
        const ac=new AbortController(),t=setTimeout(()=>ac.abort(),20000);
        const r=await fetch(ep+'?data='+encodeURIComponent(q),{signal:ac.signal});clearTimeout(t);
        if(!r.ok)throw new Error('http '+r.status);
        return await r.json();
      }catch(e){err=e;}
    }
    throw err;
  }
  function parse(j){
    const out={};
    (j.elements||[]).forEach(el=>{
      if(el.type!=='way'||!el.geometry||el.geometry.length<3||!el.tags)return;
      const g=el.tags.golf,k=g==='bunker'?'b':'w';
      out[el.id]={k:k,p:el.geometry.map(p=>[+p.lat.toFixed(6),+p.lon.toFixed(6)])};
    });
    return out;
  }
  function need(){return R.me&&!BN.cs.some(c=>dist({lat:c[0],lng:c[1]},R.me)<REF);}
  async function tick(){
    if(BN.busy||!R.me||!need())return;
    if(Date.now()-BN.last<(BN.st==='err'?90000:15000))return;
    BN.busy=true;BN.last=Date.now();const c={lat:R.me.lat,lng:R.me.lng};if(!Object.keys(BN.items).length)BN.st='loading';
    try{
      const j=await get(query(c)),got=parse(j);
      Object.assign(BN.items,got);BN.cs.push([c.lat,c.lng]);
      const ks=Object.keys(BN.items);if(ks.length>3000)ks.slice(0,ks.length-3000).forEach(k=>delete BN.items[k]);
      BN.st=ks.length?'ok':'none';persist();
    }catch(e){BN.st=Object.keys(BN.items).length?'ok':'err';}
    BN.busy=false;BN.drawKey='';try{refresh();}catch(e){}
  }

  /* ---------- geometry ---------- */
  const polyCache={};
  function ptsOf(id){return polyCache[id]||(polyCache[id]=BN.items[id].p.map(p=>L.latLng(p[0],p[1])));}
  function nearestFar(pts){let a=pts[0],far=0;pts.forEach(p=>{const d=dist(pts[0],p);if(d>far){far=d;a=p;}});let b=pts[0];far=0;pts.forEach(p=>{const d=dist(a,p);if(d>far){far=d;b=p;}});return[a,b];}
  function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;let t=l2?((px-ax)*dx+(py-ay)*dy)/l2:0;t=Math.max(0,Math.min(1,t));const x=ax+t*dx-px,y=ay+t*dy-py;return Math.sqrt(x*x+y*y);}

  /* ---------- choose which mapped hazards matter right now ---------- */
  function sync(){
    if(!R.me)return;
    const ids=Object.keys(BN.items);if(!ids.length)return;
    const kx=111320*Math.cos(R.me.lat*rad),XY=p=>[(p.lng-R.me.lng)*kx,(p.lat-R.me.lat)*111320];
    const fin=R.lay||R.target||R.pin,F=fin?XY(fin):null,D=F?Math.hypot(F[0],F[1]):0;
    const cand=[];
    ids.forEach(id=>{
      const it=BN.items[id];
      /* quick reject on the first vertex */
      const p0=it.p[0];if(Math.abs(p0[0]-R.me.lat)>0.006||Math.abs(p0[1]-R.me.lng)>0.008)return;
      const pts=ptsOf(id);let dm=1e9,ds=1e9;
      pts.forEach(p=>{const q=XY(p),d=Math.hypot(q[0],q[1]);if(d<dm)dm=d;if(F){const s=segDist(q[0],q[1],0,0,F[0],F[1]);if(s<ds)ds=s;}});
      if(F?(ds<=CORR&&dm<=D+60):(dm<=MAXD_NO_TARGET))cand.push({id:id,dm:dm});
    });
    cand.sort((a,b)=>a.dm-b.dm);
    const want=cand.slice(0,MAXH).map(c=>c.id),have=R.hzs.filter(h=>h.auto).map(h=>h.oid);
    if(want.join()===have.join())return;
    const keep=R.hzs.filter(h=>!h.auto),add=want.map(id=>{
      const pts=ptsOf(id),ab=nearestFar(pts);
      return{id:'o'+id,oid:id,auto:true,kind:BN.items[id].k,poly:pts,a:ab[0],b:ab[1],w:ab[0]};
    });
    R.hzs=keep.concat(add);
  }

  /* ---------- plug into the existing hazard code ---------- */
  const _hp=hzPts;hzPts=function(h){return h.poly||_hp(h);};

  const _dh=drawHz;
  drawHz=function(){
    _dh.apply(this,arguments);
    const near=hzInfo().filter(i=>i.h.auto).sort((a,b)=>a.Dn-b.Dn);
    near.forEach((i,k)=>{
      const pl=ln['hp'+i.h.id];
      if(pl)pl.setStyle(i.h.kind==='w'?{color:'#fff',weight:2,fillColor:'#38bdf8',fillOpacity:.5}:{color:'#fff',weight:2,fillColor:'#f2d27a',fillOpacity:.7});
      if(k>=4){rmKey('hzn'+i.h.id);rmKey('hzf'+i.h.id);}
    });
    drawBg();
  };

  /* faint outline of every other mapped bunker/water within 350 m, so you can see what the app knows */
  let bg=null;
  function drawBg(){
    if(!R.me||typeof map==='undefined')return;
    const key=R.me.lat.toFixed(4)+','+R.me.lng.toFixed(4)+','+Object.keys(BN.items).length+','+R.hzs.filter(h=>h.auto).length;
    if(key===BN.drawKey)return;BN.drawKey=key;
    if(bg){map.removeLayer(bg);bg=null;}
    const used={};R.hzs.forEach(h=>{if(h.auto)used[h.oid]=1;});
    const g=L.layerGroup();
    Object.keys(BN.items).forEach(id=>{
      if(used[id])return;const it=BN.items[id],p0=it.p[0];
      if(Math.abs(p0[0]-R.me.lat)>0.004||Math.abs(p0[1]-R.me.lng)>0.006)return;
      if(dist(R.me,L.latLng(p0[0],p0[1]))>350)return;
      L.polygon(ptsOf(id),it.k==='w'?{color:'#fff',weight:1,fillColor:'#38bdf8',fillOpacity:.3,interactive:false}:{color:'#fff',weight:1,fillColor:'#f2d27a',fillOpacity:.4,interactive:false}).addTo(g);
    });
    bg=g.addTo(map);
  }

  /* sheet card: hand-drawn hazards keep their full card; mapped ones get one compact line each */
  hzCardHTML=function(){
    const u=ul(),info=hzInfo();let h='';
    info.filter(i=>!i.h.auto).forEach((i,k)=>{
      h+='<div class="hz"><div class="hzh"><span>'+tr('⚠ Hazard')+' '+(k+1)+': '+tr('{0} to {1} {2}',d1(i.Dn),d1(i.Df),u)+'</span><button class="hzx" data-act="hzdel" data-id="'+i.h.id+'" aria-label="Remove">✕</button></div>';
      h+='<div>'+(i.clear?tr('Carries it: {0} (carry {1} {2})',esc(tc(i.clear.name)),d1(i.clear.carry),u):tr('No club carries it. Lay up short.'))+(i.short?' · '+tr('Stays short: {0}',esc(tc(i.short.name))):'')+'</div></div>';
    });
    const au=info.filter(i=>i.h.auto).sort((a,b)=>a.Dn-b.Dn).slice(0,4);
    if(au.length){
      h+='<div class="hz">'+au.map(i=>{
        const nm=i.h.kind==='w'?'💧 '+bT('Water','Água'):'🏖 Bunker';
        const adv=i.clear?(' · '+tr('Carries it: {0} (carry {1} {2})',esc(tc(i.clear.name)),d1(i.clear.carry),u)):(i.short?' · '+tr('Stays short: {0}',esc(tc(i.short.name))):'');
        return '<div>'+nm+' '+tr('{0} to {1} {2}',d1(i.Dn),d1(i.Df),u)+adv+'</div>';
      }).join('')+'</div>';
    }else if(R.me){
      const msg=BN.st==='loading'?bT('Looking for mapped bunkers…','A procurar bunkers no mapa…')
        :BN.st==='none'?bT('No bunkers mapped here. Use ⚠ Hazard to add them.','Sem bunkers no mapa aqui. Usa ⚠ Obstáculo para os juntar.')
        :BN.st==='err'?bT('Could not load bunkers (offline?). Use ⚠ Hazard.','Não deu para carregar os bunkers (sem rede?). Usa ⚠ Obstáculo.'):'';
      if(msg)h+='<div class="sub center" style="margin-top:6px">'+msg+'</div>';
    }
    return h;
  };

  const _rf=refresh;
  refresh=function(){try{sync();}catch(e){}const r=_rf.apply(this,arguments);try{tick();}catch(e){}return r;};
  window.__bn=BN;
})();
