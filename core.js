"use strict";
/* ================= state ================= */
function defaultClubs(){
  const d=[['Driver',200,20],['3 Wood',180,15],['5 Wood',168,12],['4 Hybrid',160,10],['5 Iron',150,8],['6 Iron',140,7],['7 Iron',130,6],['8 Iron',120,5],['9 Iron',110,4],['Pitching Wedge',100,3],['Gap Wedge',88,3],['Sand Wedge',74,2],['Lob Wedge',58,1]];
  return d.map((c,i)=>({id:'c'+i,name:c[0],carry:c[1],roll:c[2],on:true}));
}
function defaults(){return{units:'m',lang:((navigator.language||'').toLowerCase().indexOf('pt')===0?'pt':'en'),clubs:defaultClubs(),setup:false,rlog:[],rsel:null,wxAuto:true,wxTime:0,round:null,rounds:[],disp:1,miss:{},nh:9,
  cond:{windKmh:0,windFrom:0,temp:18,rain:0,ground:1,lie:0,elev:0,tilt:0,stance:0,ballh:0,mode:'auto'},alt:0,lefty:false,wxOk:false,stats:false,hist:{},log:[],pending:null,nid:100};}
let S=defaults();
try{const j=JSON.parse(localStorage.getItem(KEY)||'null');if(j&&j.clubs){S=Object.assign(defaults(),j);S.cond=Object.assign(defaults().cond,j.cond||{});if(S.cond.mode==='approach'&&!j.v2)S.cond.mode='auto';S.v2=1;}}catch(e){}
function save(){try{S.v2=1;localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
(function(){if(S.mig10)return;S.mig10=1;const has=n=>S.clubs.some(c=>c.name===n),pw=S.clubs.find(c=>c.name==='Pitching Wedge'),sw=S.clubs.find(c=>c.name==='Sand Wedge');if(pw&&sw&&sw.carry<pw.carry){if(!has('Gap Wedge'))S.clubs.push({id:'c'+(S.nid++),name:'Gap Wedge',carry:(pw.carry+sw.carry)/2,roll:(pw.roll+sw.roll)/2,on:true});if(!has('Lob Wedge'))S.clubs.push({id:'c'+(S.nid++),name:'Lob Wedge',carry:sw.carry*0.78,roll:Math.max(1,sw.roll*.5),on:true});}save();})();
const R={hzs:[],hzCur:null,hzId:0,hzStep:null,elevSrc:null,lay:null,sel:null,me:null,acc:null,target:null,pin:null,manual:false,placePin:false,expanded:false,framed:false};

/* ================= units ================= */
const U=()=>S.units==='y'?M2Y:1;
const ul=()=>S.units==='y'?'yd':'m';
const wl=()=>S.units==='y'?'mph':'km/h';
const d1=m=>Math.round(m*U());
const toM=v=>v/U();
const wDisp=k=>S.units==='y'?Math.round(k/KMH_MPH):Math.round(k);
const wFrom=v=>S.units==='y'?v*KMH_MPH:v;
const toWu=mph=>S.units==='y'?mph:mph*KMH_MPH;   // mph -> display wind unit

/* ================= geometry ================= */
const rad=Math.PI/180;
function dist(a,b){const dLa=(b.lat-a.lat)*rad,dLn=(b.lng-a.lng)*rad;const x=Math.sin(dLa/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLn/2)**2;return 2*6371000*Math.asin(Math.sqrt(x));}
function bearing(a,b){const y=Math.sin((b.lng-a.lng)*rad)*Math.cos(b.lat*rad);const x=Math.cos(a.lat*rad)*Math.sin(b.lat*rad)-Math.sin(a.lat*rad)*Math.cos(b.lat*rad)*Math.cos((b.lng-a.lng)*rad);return (Math.atan2(y,x)/rad+360)%360;}
const DIRS=[['N',0],['NE',45],['E',90],['SE',135],['S',180],['SW',225],['W',270],['NW',315]];
function angd(a,b){return Math.abs(((a-b+540)%360)-180);}
function nearestDir(deg){return DIRS.reduce((a,b)=>angd(deg,a[1])<=angd(deg,b[1])?a:b)[0];}

/* ================= caddy brain ================= */
const LIES=[{n:'Fairway / tee',add:0,roll:1},{n:'Light rough',add:.05,roll:.7},{n:'Heavy rough',add:.12,roll:.5},{n:'Bunker',add:.12,roll:.4}];
const MODES={auto:{n:'Auto'},carry:{n:'Carry a hazard',w:0},approach:{n:'Approach',w:.35},total:{n:'Tee shot / lay-up',w:1}};
function calc(D,brg){
  const c=S.cond,mph=c.windKmh/KMH_MPH;
  let head=0,cross=0;
  if(brg!=null){const th=(c.windFrom-brg)*rad;head=mph*Math.cos(th);cross=mph*Math.sin(th);}
  const windPct=head>=0?head*0.01:head*0.0055;
  const tempPct=(20-c.temp)*0.0015;
  const rainPct=[0,0.01,0.02][c.rain];
  const lie=LIES[c.lie];
  const altPct=-(S.alt||0)/300*0.01,stPct=c.stance===1?0.04:(c.stance===-1?-0.03:0);
  const pct=windPct+tempPct+rainPct+lie.add+altPct+stPct;
  const plays=D*(1+pct)+c.elev;
  const rollMult=[0.7,1,1.25][c.ground]*[1,0.75,0.55][c.rain]*lie.roll;
  const drift=Math.abs(cross)*D*0.004;
  return{D,plays,pct,rollMult,head,cross,drift,parts:{wind:D*windPct,temp:D*tempPct,rain:D*rainPct,lie:D*lie.add,alt:D*altPct,stance:D*stPct,elev:c.elev}};
}
function recommend(D,brg){
  const r=calc(D,brg);
  const act=S.clubs.filter(x=>x.on);
  const maxTot=act.reduce((m,x)=>Math.max(m,x.carry+x.roll),0);
  let mode=S.cond.mode;if(mode==='auto')mode=(maxTot&&D>=0.85*maxTot)?'total':'approach';
  if(R.lay&&S.cond.mode==='auto')mode='total';
  r.mode=mode;const w=MODES[mode].w;
  const cl=act.map(x=>Object.assign({},x,{reach:x.carry+w*x.roll*r.rollMult})).sort((a,b)=>a.reach-b.reach);
  r.list=cl;if(!cl.length)return r;
  let best=null;
  if(mode==='carry'){best=cl.find(x=>x.reach>=r.plays*1.03)||null;}
  else{let bs=1e9;cl.forEach(x=>{const d=x.reach-r.plays,s=d>=0?d:-d*1.5;if(s<bs){bs=s;best=x;}});if(best&&best.reach<r.plays*0.9)best=null;}
  if(best){const i=cl.indexOf(best);r.best=best;r.shorter=cl[i-1]||null;r.longer=cl[i+1]||null;r.swing=(r.plays-w*best.roll*r.rollMult)/best.carry;
    if(i===0&&r.swing<0.92){r.partial=true;if(r.swing<0.35||r.plays<15)r.short=true;}}
  else{r.longest=cl[cl.length-1];r.leave=r.plays-r.longest.reach;}
  return r;
}

/* ================= map ================= */
const map=L.map('map',{zoomControl:false,attributionControl:true,maxZoom:20}).setView([38.7223,-9.1393],15);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxNativeZoom:19,maxZoom:20,attribution:'Imagery © Esri'}).addTo(map);
const mk={},ln={};
function dIcon(cls,html,sz){return L.divIcon({className:'',html:'<div class="'+cls+'">'+(html||'')+'</div>',iconSize:sz,iconAnchor:[sz[0]/2,sz[1]/2]});}
function frame(pts){
  const sh=$('#sheet').offsetHeight;
  const b=L.latLngBounds(pts);
  map.fitBounds(b,{paddingTopLeft:[40,80],paddingBottomRight:[40,sh+40],maxZoom:19,animate:true});
}
function setMe(ll,acc){
  const first=!R.me;R.me=ll;R.acc=acc||null;
  if(!mk.me){mk.me=L.marker(ll,{icon:dIcon('me','',[20,20]),zIndexOffset:1000,interactive:false}).addTo(map);mk.acc=L.circle(ll,{radius:acc||10,color:'#2563eb',weight:1,fillOpacity:.1,interactive:false}).addTo(map);}
  else{mk.me.setLatLng(ll);mk.acc.setLatLng(ll).setRadius(acc||10);}
  if(first){map.setView(ll,18);maybeWeather(true);}
  refresh();
}
function placeTarget(ll){
  R.target=ll;R.sel=null;R.elevSrc=null;S.cond.elev=0;elevKey='';
  if(!mk.t){mk.t=L.marker(ll,{icon:dIcon('tg','',[30,30]),draggable:true,zIndexOffset:900}).addTo(map);mk.t.on('drag',e=>{R.target=e.target.getLatLng();refresh();});}
  else mk.t.setLatLng(ll);
  refresh();
  if(R.me&&!R.framed){R.framed=true;frame([R.me,ll]);}
}
function placePinAt(ll){
  R.pin=ll;R.placePin=false;
  if(!mk.p){mk.p=L.marker(ll,{icon:dIcon('pn','⛳',[30,30]),draggable:true,zIndexOffset:800}).addTo(map);mk.p.on('drag',e=>{R.pin=e.target.getLatLng();refresh();});}
  else mk.p.setLatLng(ll);
  refresh();
}
function tagAt(ll,text,key,cls){
  const ic=L.divIcon({className:'',html:'<div class="tag '+(cls||'')+'">'+text+'</div>',iconSize:[0,0]});
  if(!mk[key])mk[key]=L.marker(ll,{icon:ic,interactive:false,zIndexOffset:700}).addTo(map);else{mk[key].setLatLng(ll);mk[key].setIcon(ic);}
}
function rmKey(k){if(mk[k]){map.removeLayer(mk[k]);mk[k]=null;}}
function refreshLines(){
  ['l1','l2'].forEach(k=>{if(ln[k]){map.removeLayer(ln[k]);ln[k]=null;}});
  const fin=R.target||R.pin,aim=R.lay||fin,mid=(a,b)=>L.latLng((a.lat+b.lat)/2,(a.lng+b.lng)/2);
  if(R.me&&aim){ln.l1=L.polyline([R.me,aim],{color:'#fff',weight:3,opacity:.95,interactive:false}).addTo(map);tagAt(mid(R.me,aim),d1(dist(R.me,aim))+' '+ul(),'tg1');}else rmKey('tg1');
  if(R.lay&&fin){ln.l2=L.polyline([R.lay,fin],{color:'#ffd166',weight:3,dashArray:'7 7',interactive:false}).addTo(map);tagAt(mid(R.lay,fin),tr('leaves {0} {1}',d1(dist(R.lay,fin)),ul()),'tg2','y');}
  else if(R.target&&R.pin){ln.l2=L.polyline([R.target,R.pin],{color:'#ffd166',weight:3,dashArray:'7 7',interactive:false}).addTo(map);tagAt(mid(R.target,R.pin),d1(dist(R.target,R.pin))+' '+ul(),'tg2','y');}
  else rmKey('tg2');
  drawHz();
}
function hzPts(h){
  const c={lat:(h.a.lat+h.b.lat)/2,lng:(h.a.lng+h.b.lng)/2},Lh=Math.max(2,dist(h.a,h.b)/2),th=bearing(h.a,h.b)*rad;
  const uE=Math.sin(th),uN=Math.cos(th),vE=Math.cos(th),vN=-Math.sin(th),kx=111320*Math.cos(c.lat*rad);
  let m=Lh;
  if(h.w){const dy=(h.w.lat-c.lat)*111320,dx=(h.w.lng-c.lng)*kx;m=Math.max(3,Math.abs(dx*vE+dy*vN));}
  const pts=[];
  for(let i=0;i<36;i++){const t=i/36*2*Math.PI,E=Lh*Math.cos(t)*uE+m*Math.sin(t)*vE,N=Lh*Math.cos(t)*uN+m*Math.sin(t)*vN;pts.push(L.latLng(c.lat+N/111320,c.lng+E/kx));}
  return pts;
}
function hzInfo(){
  if(!R.me)return [];
  const act=S.clubs.filter(c=>c.on);
  return R.hzs.map(h=>{
    const pts=hzPts(h);let nP=pts[0],fP=pts[0],Dn=1e9,Df=0;
    pts.forEach(p=>{const d=dist(R.me,p);if(d<Dn){Dn=d;nP=p;}if(d>Df){Df=d;fP=p;}});
    const rn=calc(Dn,bearing(R.me,nP)),rf=calc(Df,bearing(R.me,fP));
    const o={h:h,Dn:Dn,Df:Df,nP:nP,fP:fP,pn:Dn*(1+rn.pct),pf:Df*(1+rf.pct)};
    o.clear=act.filter(c=>c.carry>=o.pf+5).sort((a,b)=>a.carry-b.carry)[0]||null;
    o.short=act.filter(c=>c.carry+c.roll*rn.rollMult<=o.pn-8).sort((a,b)=>b.carry-a.carry)[0]||null;
    return o;
  });
}
let hzKeys=[];
function drawHz(){
  hzKeys.forEach(k=>{if(k.indexOf('hp')===0){if(ln[k]){map.removeLayer(ln[k]);ln[k]=null;}}else rmKey(k);});hzKeys=[];
  R.hzs.forEach(h=>{const k='hp'+h.id;ln[k]=L.polygon(hzPts(h),{color:'#fff',weight:2,fillColor:'#ef4444',fillOpacity:.35,interactive:false}).addTo(map);hzKeys.push(k);});
  hzInfo().forEach(i=>{const nk='hzn'+i.h.id,fk='hzf'+i.h.id;tagAt(i.nP,d1(i.Dn)+' '+ul(),nk,'up');tagAt(i.fP,d1(i.Df)+' '+ul(),fk,'up');hzKeys.push(nk,fk);});
}
function hzCardHTML(){
  const u=ul();
  return hzInfo().map((i,k)=>{
    let h='<div class="hz"><div class="hzh"><span>'+tr('⚠ Hazard')+' '+(k+1)+': '+tr('{0} to {1} {2}',d1(i.Dn),d1(i.Df),u)+'</span><button class="hzx" data-act="hzdel" data-id="'+i.h.id+'" aria-label="Remove">✕</button></div>';
    h+='<div>'+(i.clear?tr('Carries it: {0} (carry {1} {2})',esc(tc(i.clear.name)),d1(i.clear.carry),u):tr('No club carries it. Lay up short.'))+(i.short?' · '+tr('Stays short: {0}',esc(tc(i.short.name))):'')+'</div>';
    return h+'</div>';}).join('');
}
function pipLL(p,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.lat>p.lat)!==(b.lat>p.lat)&&p.lng<(b.lng-a.lng)*(p.lat-a.lat)/(b.lat-a.lat)+a.lng)c=!c;}return c;}
function hzHitFor(cx){
  if(!R.hzs.length||!R.me||!cx.club)return null;
  const {r,club,brg}=cx,dC=expDist(r,club),lt=(cx.ce?cx.ce.c:0),sb=Math.sin(brg*rad),cb=Math.cos(brg*rad);
  const E=dC*sb+lt*cb,N=dC*cb-lt*sb,p={lat:R.me.lat+N/111320,lng:R.me.lng+E/(111320*Math.cos(R.me.lat*rad))};
  return hzInfo().find(i=>pipLL(p,hzPts(i.h)))||null;
}
function hzLinkHTML(){return '<button class="link" data-act="hz">'+tr('⚠ Hazard')+'</button>';}
function pinLinkHTML(){return R.pin?'<button class="link" data-act="clearpin">'+tr('✕ Pin')+'</button>':'<button class="link" data-act="pinmode">'+tr('⛳ Pin')+'</button>';}
function hzPromptHTML(){
  const s=R.hzStep,T={a:['Tap one end of the hazard','Tap the map where the water or bunker starts.'],b:['Tap the other end','Tap where it ends. That makes a circle.'],w:['Tap the side to make an oval','Tap how wide it is, or press Done to keep a circle.']}[s];
  return '<div class="center"><div class="lbl">'+tr('⚠ Hazard')+'</div><div class="big-msg">'+tr(T[0])+'</div><div class="sub">'+tr(T[1])+'</div></div>'+(s==='w'?'<button class="cta" style="margin-top:12px" data-act="hzskip">'+tr('Done')+'</button>':'')+'<div class="center"><button class="link" data-act="hzcancel">'+tr('Cancel')+'</button></div>';
}
function pinPromptHTML(){return '<div class="center"><div class="lbl">'+tr('⛳ Pin')+'</div><div class="big-msg">'+tr('Tap the pin')+'</div><div class="sub">'+tr('Tap the map where the flag is.')+'</div></div><div class="center"><button class="link" data-act="pincancel">'+tr('Cancel')+'</button></div>';}
function hzMarker(h,k){
  const key='h'+h.id+k;
  mk[key]=L.marker(h[k],{icon:dIcon('hzm','',[22,22]),draggable:true,zIndexOffset:850}).addTo(map);
  mk[key].on('drag',e=>{h[k]=e.target.getLatLng();refresh();});
}
function placeHz(ll){
  const s=R.hzStep;
  if(s==='a'){R.hzCur={id:++R.hzId,a:ll,b:null,w:null};hzMarker(R.hzCur,'a');R.hzStep='b';}
  else if(s==='b'){const h=R.hzCur;h.b=ll;hzMarker(h,'b');R.hzs.push(h);R.hzStep='w';}
  else if(s==='w'){const h=R.hzCur;h.w=ll;hzMarker(h,'w');R.hzStep=null;R.hzCur=null;}
  refresh();
}
function delHz(id){['a','b','w'].forEach(k=>rmKey('h'+id+k));R.hzs=R.hzs.filter(h=>h.id!==id);if(R.hzCur&&R.hzCur.id===id)R.hzCur=null;}
function clearHz(){R.hzs.slice().forEach(h=>delHz(h.id));if(R.hzCur)delHz(R.hzCur.id);R.hzStep=null;refresh();}
function newHole(){S.cond.lie=0;S.cond.tilt=0;S.cond.stance=0;S.cond.ballh=0;R.pin=null;rmKey('p');R.target=null;rmKey('t');R.framed=false;R.placePin=false;if(R.lay)endLay();clearHz();}
function offsetPt(ll,brg,m){const sb=Math.sin(brg*rad),cb=Math.cos(brg*rad);return L.latLng(ll.lat+m*cb/111320,ll.lng+m*sb/(111320*Math.cos(ll.lat*rad)));}
function startLay(){
  const fin=R.target||R.pin;if(!R.me||!fin)return;
  const D=dist(R.me,fin),brg=bearing(R.me,fin),r=recommend(D,brg);
  let d=r.longest?expDist(r,r.longest):(D>150?D-90:D*0.6);d=Math.max(15,Math.min(d,D*0.9));
  R.lay=offsetPt(R.me,brg,d);R.sel=null;
  mk.ly=L.marker(R.lay,{icon:dIcon('ly','',[30,30]),draggable:true,zIndexOffset:950}).addTo(map);
  mk.ly.on('drag',e=>{R.lay=e.target.getLatLng();R.sel=null;refresh();});
  refresh();
}
function moveLay(ll){R.lay=ll;R.sel=null;if(mk.ly)mk.ly.setLatLng(ll);refresh();}
function endLay(){R.lay=null;R.sel=null;rmKey('ly');refresh();}
map.on('click',e=>{
  if(R.hzStep){placeHz(e.latlng);return;}
  if(R.lay&&!R.placePin&&!R.mePick){moveLay(e.latlng);return;}
  if(R.placePin){placePinAt(e.latlng);return;}
  if(R.mePick){R.mePick=false;R.manual=true;setMe(e.latlng,5);setGps('ok','Manual position');return;}
  placeTarget(e.latlng);
});
$('#locate').addEventListener('click',()=>{R.manual=false;startGPS(true);if(R.me){const sh=$('#sheet').offsetHeight;map.fitBounds(L.latLngBounds([R.me,R.me]),{paddingBottomRight:[0,sh],maxZoom:18});}});

/* ================= GPS ================= */
let watchId=null;
function setGps(state,text){R.g=[state,text];$('#gps').innerHTML='<i class="dot '+state+'"></i><span>'+tr(text)+'</span>';}
function startGPS(restart){
  if(!navigator.geolocation){setGps('bad','No GPS');return;}
  if(watchId!=null){if(!restart)return;navigator.geolocation.clearWatch(watchId);}
  setGps('wait','Finding GPS…');
  watchId=navigator.geolocation.watchPosition(p=>{
    if(R.manual)return;
    setMe({lat:p.coords.latitude,lng:p.coords.longitude},p.coords.accuracy);
    setGps('ok','GPS ±'+Math.round(p.coords.accuracy*U())+ul());
    maybeWeather(false);
  },err=>{if(err&&err.code===1)setGps('bad','GPS blocked');else setGps('wait','Finding GPS…');refresh();},{enableHighAccuracy:true,maximumAge:1000,timeout:25000});
}
$('#gps').addEventListener('click',()=>{R.mePick=true;setGps('wait','Tap map: where you stand');});

/* ================= weather ================= */
let wxBusy=false;
async function maybeWeather(force){
  if(!S.wxAuto)return;
  if(!force&&Date.now()-S.wxTime<30*60*1000)return;
  await fetchWeather();
}
async function fetchWeather(){
  if(wxBusy)return false;wxBusy=true;
  const pos=R.me||map.getCenter();
  try{
    const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+pos.lat.toFixed(4)+'&longitude='+pos.lng.toFixed(4)+'&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation&wind_speed_unit=kmh');
    const j=(await r.json()).current;
    S.cond.temp=Math.round(j.temperature_2m);S.cond.windKmh=Math.round(j.wind_speed_10m);S.cond.windFrom=Math.round(j.wind_direction_10m);
    S.cond.rain=j.precipitation>=1?2:(j.precipitation>0?1:0);
    S.wxAuto=true;S.wxOk=true;S.wxTime=Date.now();save();refresh();if(!$('#modal').hidden&&$('#mcard').querySelector('#dial'))openCond();
    return true;
  }catch(e){S.wxTime=Date.now()-25*60*1000;return false;}
  finally{wxBusy=false;}
}

/* ================= sheet ================= */
const sheetBody=$('#sheetBody');
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function refresh(){refreshLines();drawZone();updatePill();renderSheet();scheduleElev();}
let elevKey='',elevTimer=null;
function scheduleElev(){if(elevTimer)clearTimeout(elevTimer);elevTimer=setTimeout(doElev,700);}
async function doElev(){
  if(!R.me)return;
  const aim=R.lay||R.target||R.pin,q=p=>p.lat.toFixed(4)+','+p.lng.toFixed(4);
  const key=q(R.me)+'|'+(aim?q(aim):'');
  if(key===elevKey)return;elevKey=key;
  const pts=aim?[R.me,aim]:[R.me];
  try{
    const r=await fetch('https://api.open-meteo.com/v1/elevation?latitude='+pts.map(p=>p.lat.toFixed(4)).join(',')+'&longitude='+pts.map(p=>p.lng.toFixed(4)).join(','));
    const e=(await r.json()).elevation;
    if(!e||e.length<pts.length||e.some(x=>typeof x!=='number'))return;
    S.alt=Math.max(0,Math.round(e[0]));
    if(pts.length===2&&R.elevSrc!=='manual'){const d=e[1]-e[0];S.cond.elev=Math.abs(d)<2?0:Math.round(d*2)/2;R.elevSrc='auto';}
    save();refresh();
  }catch(err){elevKey='';}
}
function renderSheet(){
  sheetBody.innerHTML=sheetHTML();
  requestAnimationFrame(()=>document.documentElement.style.setProperty('--sh',$('#sheet').offsetHeight+'px'));
}
function wxChips(r){
  const c=S.cond;let wtxt;
  if(c.windKmh<1)wtxt=tr('No wind');
  else if(r){const hd=Math.abs(r.head)>=Math.abs(r.cross);wtxt=wDisp(c.windKmh)+' '+wl()+' '+tr(hd?(r.head>=0?'in your face':'behind you'):(r.cross>0?'from right':'from left'));}
  else wtxt=wDisp(c.windKmh)+' '+wl()+' '+tr('from')+' '+dirL(nearestDir(c.windFrom));
  return '<div class="chiprow"><button class="cond" data-act="cond">💨 '+wtxt+'</button><button class="cond" data-act="cond">🌡 '+c.temp+'°C</button><button class="cond" data-act="cond">'+tr(['☀️ Dry','🌦 Light rain','🌧 Heavy rain'][c.rain])+'</button></div>';
}
function sd(a){if(a.length<2)return 0;const m=a.reduce((x,y)=>x+y,0)/a.length;return Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/(a.length-1));}
function spread(club){
  const prior={lat:Math.max(2,club.carry*0.10),dep:Math.max(2,club.carry*0.08)};
  const m=S.miss[club.id];
  if(m&&m.length>=5){
    const rms=a=>Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length),n=m.length,k=3;
    const lat=1.28*rms(m.map(x=>x.lat)),dep=1.28*rms(m.map(x=>x.de));
    return{lat:Math.max(2,(n*lat+k*prior.lat)/(n+k)),dep:Math.max(2,(n*dep+k*prior.dep)/(n+k)),learned:true,n:n};
  }
  return{lat:prior.lat,dep:prior.dep,learned:false,n:0};
}
function swingOf(r,club){const w=(MODES[r.mode]||{}).w||0;return (r.plays-w*club.roll*r.rollMult)/club.carry;}
function expDist(r,club){const sw=swingOf(r,club);const reach=(sw>0&&sw<1)?r.plays:club.reach;return Math.max(0,(reach-S.cond.elev)/(1+r.pct));}
function swingWord(p){return tr(p>=85?'smooth swing':(p>=70?'three-quarter swing':(p>=50?'half swing':'short, soft swing')));}
function lateral(r,club){const dC=expDist(r,club),c=S.cond;const wind=-r.cross*dC*0.004,slope=(c.tilt||0)*0.25*club.roll*r.rollMult;const st=((c.stance===-1?1:c.stance===1?-1:0)+(c.ballh===-1?1:c.ballh===1?-1:0))*0.03*dC*(S.lefty?-1:1);return{wind:wind,slope:slope,stance:st,total:wind+slope+st};}
