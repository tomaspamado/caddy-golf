"use strict";
/* ---------- virtual hole on the range ---------- */
function vhRng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function vhPar(m){return m<=230?3:(m<=430?4:5);}
function inShape(s,x,y){
  if(s.poly){let c=false;const P=s.poly;for(let i=0,j=P.length-1;i<P.length;j=i++){const p=P[i],q=P[j];if((p[1]>y)!==(q[1]>y)&&x<(q[0]-p[0])*(y-p[1])/(q[1]-p[1])+p[0])c=!c;}return c;}
  const rt=s.rot||0,dx=x-s.x,dy=y-s.y,u=dx*Math.cos(rt)+dy*Math.sin(rt),w=-dx*Math.sin(rt)+dy*Math.cos(rt);
  return (u/s.rx)*(u/s.rx)+(w/s.ry)*(w/s.ry)<=1;
}
function shapePts(s){
  if(s.poly)return s.poly.map(p=>({x:p[0],y:p[1]}));
  const o=[],rt=s.rot||0;for(let i=0;i<24;i++){const t=i/24*2*Math.PI,u=s.rx*Math.cos(t),w=s.ry*Math.sin(t);o.push({x:s.x+u*Math.cos(rt)-w*Math.sin(rt),y:s.y+u*Math.sin(rt)+w*Math.cos(rt)});}
  return o;
}
const RECT=(x0,y0,x1,y1)=>({poly:[[x0,y0],[x1,y0],[x1,y1],[x0,y1]]});
function genTrees(o,rnd){
  let P=o.path.length>1?o.path.slice():[[0,0,12],[o.pin.x,o.pin.y,12]];
  if(P[0][1]>5)P.unshift([0,0,12]);
  const bad=(x,y)=>o.water.some(e=>inShape(e,x,y))||o.bunk.some(e=>inShape(e,x,y))||o.oob.some(e=>inShape(e,x,y))||inShape(o.green,x,y)||o.land.some(e=>inShape(e,x,y));
  const out=[];
  for(let i=0;i<P.length-1;i++){
    const a=P[i],b=P[i+1],Lg=Math.hypot(b[0]-a[0],b[1]-a[1])||1,ux=(b[0]-a[0])/Lg,uy=(b[1]-a[1])/Lg;
    for(let t=0;t<Lg;t+=18+rnd()*14){[-1,1].forEach(sg=>{
      const hw=a[2]+(b[2]-a[2])*t/Lg,off=hw+16+rnd()*22,x=a[0]+ux*t+uy*sg*off,y=a[1]+uy*t-ux*sg*off,r=5+rnd()*4;
      if(!bad(x,y))out.push({x:x,y:y,r:r});});}
  }
  return out;
}
function mkHole(o){
  o.water=o.water||[];o.bunk=o.bunk||[];o.oob=o.oob||[];o.land=o.land||[];o.path=o.path||[];
  o.wps=o.path.slice(1).map(p=>({x:p[0],y:p[1]}));o.wps.push({x:o.pin.x,y:o.pin.y});
  o.lvl=o.lvl||3;o.trees=o.trees===false?[]:genTrees(o,vhRng(o.len*131+(o.id.length*7)));
  return o;
}
function genHole(len,idx){
  const rnd=vhRng(Math.round(len)*131+idx*17+7),par=vhPar(len),sd=()=>rnd()<.5?-1:1;
  const o={id:'c'+idx,name:'',par:par,len:len,path:par===3?[[0,Math.max(10,len-70),11],[0,len-8,11]]:[[0,0,17],[0,len-12,17]],pin:{x:0,y:len},green:{x:0,y:len,rx:12,ry:12},water:[],bunk:[{x:-14,y:len-3,rx:6,ry:4.5},{x:15,y:len+2,rx:6,ry:5}]};
  if(par===3){o.water.push({x:sd()*17,y:len-22,rx:13,ry:11});}
  else{
    const fy=Math.min(len-90,par===5?170:235),fs=sd();
    if(fy>60)o.bunk.push({x:fs*15,y:fy,rx:5,ry:10});
    const wy=len*(par===5?.78:.7),ws=sd();
    o.water.push({x:ws*27,y:wy,rx:14,ry:Math.min(30,len*.07)});
    if(par===5){o.bunk.push({x:-fs*15,y:len*.45,rx:5,ry:9});o.water.push({x:-ws*22,y:len-45,rx:11,ry:9});}
  }
  return mkHole(o);
}
const LIB=[
 {id:'e1',lvl:1,name:'Meadow 1 · Gentle par 3',par:3,len:105,path:[[0,50,16],[0,100,16]],pin:{x:0,y:105},green:{x:0,y:105,rx:15,ry:12},bunk:[{x:-24,y:100,rx:6,ry:4}],
  note:['A friendly warm-up. Wide green, no water.','Um aquecimento simpático. Green largo, sem água.']},
 {id:'e2',lvl:1,name:'Meadow 2 · Wide open par 4',par:4,len:290,path:[[0,0,24],[0,278,24]],pin:{x:0,y:290},green:{x:0,y:290,rx:15,ry:13},bunk:[{x:-28,y:262,rx:5,ry:9}],
  note:['A very wide fairway. Swing freely.','Um fairway muito largo. Bate à vontade.']},
 {id:'e3',lvl:1,name:'Meadow 3 · Short par 4',par:4,len:250,path:[[0,0,22],[5,238,22]],pin:{x:5,y:250},green:{x:5,y:250,rx:14,ry:12},bunk:[{x:26,y:228,rx:5,ry:8}],
  note:['Short enough to drive near the green.','Curto o suficiente para chegar perto do green com o driver.']},
 {id:'e4',lvl:1,name:'Meadow 4 · Easy par 5',par:5,len:445,path:[[0,0,24],[0,200,24],[8,380,22],[8,435,18]],pin:{x:8,y:445},green:{x:8,y:445,rx:15,ry:12},
  water:[{x:-52,y:260,rx:10,ry:16}],bunk:[{x:-14,y:458,rx:6,ry:4},{x:30,y:440,rx:5,ry:6}],
  note:['Plenty of room. The pond is well out of play.','Muito espaço. O lago está longe da linha de jogo.']},
 {id:'e5',lvl:1,name:'Meadow 5 · Friendly par 3',par:3,len:150,path:[[0,70,15],[0,142,15]],pin:{x:0,y:150},green:{x:0,y:150,rx:14,ry:12},
  water:[{x:-36,y:150,rx:9,ry:14}],bunk:[{x:22,y:146,rx:6,ry:5}],
  note:['A pond to the left, but the green is generous.','Um lago à esquerda, mas o green é generoso.']},
 {id:'e6',lvl:1,name:'Meadow 6 · Straight par 4',par:4,len:330,path:[[0,0,22],[0,318,22]],pin:{x:0,y:330},green:{x:0,y:330,rx:14,ry:12},bunk:[{x:-30,y:200,rx:5,ry:9},{x:14,y:342,rx:6,ry:4}],
  note:['Straight down the middle. Just one bunker to avoid.','Sempre em frente. Só um bunker a evitar.']},
 {id:'m1',lvl:2,name:'Heath 1 · Narrow par 3',par:3,len:135,path:[[0,70,12],[0,128,12]],pin:{x:0,y:135},green:{x:0,y:135,rx:12,ry:10},
  water:[{x:-20,y:122,rx:11,ry:9}],bunk:[{x:17,y:138,rx:6,ry:5},{x:0,y:152,rx:7,ry:4}],
  note:['A smaller green with a pond short left.','Um green mais pequeno com um lago curto à esquerda.']},
 {id:'m2',lvl:2,name:'Heath 2 · Dogleg right par 4',par:4,len:340,path:[[0,0,19],[0,170,19],[30,290,17],[38,335,13]],pin:{x:38,y:342},green:{x:38,y:342,rx:13,ry:11},
  water:[{x:64,y:342,rx:12,ry:16}],bunk:[{x:22,y:205,rx:5,ry:9,rot:-.3},{x:20,y:350,rx:6,ry:5},{x:50,y:356,rx:6,ry:4}],
  note:['Bends right. A pond guards the right side of the green.','Curva à direita. Um lago guarda o lado direito do green.']},
 {id:'m3',lvl:2,name:'Heath 3 · Creek par 4',par:4,len:380,path:[[0,0,19],[0,370,17]],pin:{x:0,y:380},green:{x:0,y:380,rx:13,ry:11},
  water:[{x:0,y:250,rx:40,ry:4,rot:.05}],bunk:[{x:-23,y:300,rx:5,ry:9},{x:24,y:330,rx:5,ry:9},{x:-15,y:386,rx:6,ry:4}],
  note:['A creek crosses the fairway. Choose a club that carries it.','Um ribeiro atravessa o fairway. Escolhe um taco que o passe.']},
 {id:'m4',lvl:2,name:'Heath 4 · Bunker alley par 4',par:4,len:400,path:[[0,0,17],[-5,200,16],[0,390,13]],pin:{x:0,y:400},green:{x:0,y:400,rx:13,ry:11},
  bunk:[{x:-22,y:220,rx:5,ry:9},{x:22,y:240,rx:5,ry:9},{x:-23,y:272,rx:5,ry:8},{x:24,y:300,rx:5,ry:9},{x:-17,y:392,rx:6,ry:5},{x:17,y:404,rx:6,ry:5}],
  note:['No water, but bunkers line both sides.','Sem água, mas há bunkers dos dois lados.']},
 {id:'m5',lvl:2,name:'Heath 5 · Pond par 5',par:5,len:480,path:[[0,0,19],[0,200,19],[-10,350,17],[-8,470,13]],pin:{x:-8,y:480},green:{x:-8,y:480,rx:13,ry:10},
  water:[{x:-40,y:300,rx:16,ry:30},{x:22,y:455,rx:14,ry:9}],bunk:[{x:24,y:250,rx:5,ry:9},{x:-22,y:492,rx:6,ry:4},{x:8,y:494,rx:6,ry:4}],
  note:['Ponds left off the tee and right of the green.','Lagos à esquerda na saída e à direita do green.']},
 {id:'m6',lvl:2,name:'Heath 6 · Carry par 3',par:3,len:160,path:[[0,60,10],[0,150,12]],pin:{x:0,y:160},green:{x:0,y:160,rx:13,ry:10},
  water:[{x:0,y:104,rx:34,ry:14}],bunk:[{x:-18,y:165,rx:6,ry:5},{x:16,y:168,rx:6,ry:5}],
  note:['You must carry the water in front.','Tens de passar a água à frente.']},
 {id:'a12',name:'Augusta 12 · Golden Bell',par:3,len:142,path:[[0,92,10],[0,134,10]],pin:{x:3,y:142},green:{x:0,y:142,rx:16,ry:7},
  water:[{x:-2,y:127,rx:30,ry:3.5}],bunk:[{x:-15,y:135,rx:6,ry:3.5},{x:13,y:152,rx:7,ry:3.5},{x:-6,y:153,rx:6,ry:3.5}],
  note:['Rae’s Creek guards a shallow green. Short is wet.','O ribeiro protege um green estreito. Curto é água.']},
 {id:'a13',name:'Augusta 13 · Azalea',par:5,len:466,path:[[0,0,16],[10,180,16],[0,300,15],[-22,400,13],[-28,458,10]],pin:{x:-28,y:466},green:{x:-28,y:466,rx:13,ry:9},
  water:[{x:-27,y:262,rx:4,ry:55,rot:.12},{x:-35,y:380,rx:4,ry:35,rot:.45},{x:-28,y:443,rx:22,ry:3.5}],bunk:[{x:22,y:300,rx:5,ry:10},{x:-38,y:478,rx:6,ry:4},{x:-20,y:480,rx:6,ry:4},{x:-46,y:466,rx:4,ry:6}],
  note:['Dogleg left with a creek down the left and in front of the green.','Dogleg à esquerda, com ribeiro à esquerda e à frente do green.']},
 {id:'a15',name:'Augusta 15 · Firethorn',par:5,len:485,path:[[0,0,17],[0,180,17],[5,330,15],[0,430,12]],pin:{x:0,y:487},green:{x:0,y:485,rx:13,ry:9},
  water:[{x:-2,y:462,rx:30,ry:12}],bunk:[{x:22,y:250,rx:5,ry:10},{x:-22,y:255,rx:5,ry:10},{x:-14,y:498,rx:6,ry:4},{x:0,y:503,rx:6,ry:4},{x:15,y:498,rx:6,ry:4}],
  note:['Reachable in two, but a pond sits in front of the green.','Alcançável em duas, mas há um lago à frente do green.']},
 {id:'tpc17',name:'TPC Sawgrass 17 · Island green',par:3,len:125,path:[],pin:{x:2,y:125},green:{x:0,y:125,rx:13,ry:11},
  land:[{x:0,y:125,rx:19,ry:16}],water:[{x:0,y:125,rx:46,ry:40}],bunk:[{x:-12,y:119,rx:4,ry:3.5}],
  note:['Island green. Anything that misses it is in the water.','Green numa ilha. Tudo o que falha vai à água.']},
 {id:'p7',name:'Pebble Beach 7 · Tiny par 3',par:3,len:97,path:[],pin:{x:0,y:97},green:{x:0,y:97,rx:8,ry:7},
  water:[RECT(-70,35,70,80),RECT(-250,35,-17,135),RECT(17,35,250,135),RECT(-250,114,250,170)],
  bunk:[{x:-11,y:92,rx:3.5,ry:5},{x:11,y:93,rx:3.5,ry:5},{x:-9,y:106,rx:4,ry:3},{x:9,y:105,rx:4,ry:3},{x:0,y:108,rx:4,ry:2.5}],trees:false,
  note:['A tiny green on the ocean edge. Wind decides everything.','Um green minúsculo à beira do oceano. O vento decide tudo.']},
 {id:'t8',name:'Royal Troon 8 · Postage Stamp',par:3,len:112,path:[[0,60,9],[0,104,9]],pin:{x:0,y:112},green:{x:0,y:112,rx:7,ry:6},
  bunk:[{x:-9,y:111,rx:2.8,ry:8,rot:.15},{x:9,y:110,rx:3,ry:5},{x:-6,y:100,rx:4,ry:3},{x:6,y:122,rx:4,ry:3},{x:-8,y:123,rx:4,ry:3}],trees:false,
  note:['The smallest green in championship golf, ringed by deep bunkers.','O menor green do golfe de campeonato, rodeado de bunkers fundos.']},
 {id:'sa17',name:'St Andrews 17 · Road Hole',par:4,len:453,path:[[0,0,14],[-3,150,13],[-8,300,14],[-5,400,12],[0,446,9]],pin:{x:2,y:450},green:{x:0,y:448,rx:13,ry:8},
  oob:[RECT(20,15,90,135),RECT(-90,463,90,540)],bunk:[{x:-13,y:441,rx:6,ry:5},{x:14,y:250,rx:5,ry:9},{x:-22,y:332,rx:5,ry:8},{x:16,y:420,rx:5,ry:6}],trees:false,
  note:['Drive over the hotel sheds (out of bounds right). Road behind the green.','Tacada sobre os barracões do hotel (fora de limites à direita). Estrada atrás do green.']},
 {id:'c18',name:'Carnoustie 18 · Barry Burn',par:4,len:456,path:[[0,0,16],[0,200,16],[5,330,14],[2,440,10]],pin:{x:3,y:456},green:{x:0,y:456,rx:13,ry:9},
  water:[{x:0,y:222,rx:45,ry:4,rot:.07},{x:-6,y:398,rx:45,ry:4,rot:-.06}],bunk:[{x:22,y:238,rx:5,ry:9},{x:-19,y:262,rx:5,ry:8},{x:-14,y:448,rx:6,ry:4},{x:15,y:463,rx:6,ry:5}],trees:false,
  note:['The Barry Burn snakes across the fairway and again before the green.','O Barry Burn serpenteia pelo fairway e outra vez antes do green.']},
 {id:'p18',name:'Pebble Beach 18 · Ocean par 5',par:5,len:497,path:[[0,0,17],[8,140,16],[-8,280,16],[-40,390,15],[-60,450,13],[-62,490,10]],pin:{x:-62,y:497},green:{x:-62,y:497,rx:13,ry:9},
  water:[{poly:[[-34,-30],[-30,140],[-45,270],[-85,370],[-112,450],[-112,560],[-260,560],[-260,-30]]}],bunk:[{x:20,y:200,rx:5,ry:9},{x:-70,y:508,rx:6,ry:4},{x:-50,y:510,rx:6,ry:4}],trees:false,
  note:['The Pacific runs down the whole left side. Stay right of it.','O Pacífico corre por todo o lado esquerdo. Fica à direita.']}
].map(mkHole);
function vhHit(H,x,y){
  if(Math.abs(x)>260||y<-40||y>H.len+150)return 'oob';
  if(H.oob.some(e=>inShape(e,x,y)))return 'oob';
  if(!H.land.some(e=>inShape(e,x,y))&&H.water.some(e=>inShape(e,x,y)))return 'water';
  if(H.trees.some(t=>Math.hypot(x-t.x,y-t.y)<=t.r))return 'tree';
  if(inShape(H.green,x,y))return 'green';
  if(H.bunk.some(e=>inShape(e,x,y)))return 'bunker';
  return null;
}
function vhFw(H,x,y){
  const P=H.path;
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],dx=b[0]-a[0],dy=b[1]-a[1],L2=dx*dx+dy*dy||1;
    let t=((x-a[0])*dx+(y-a[1])*dy)/L2;t=Math.max(0,Math.min(1,t));
    if(Math.hypot(x-(a[0]+dx*t),y-(a[1]+dy*t))<=a[2]+(b[2]-a[2])*t)return true;}
  return false;
}
function vhAim(v){const t=v.h.wps[v.wp],dx=t.x-v.x,dy=t.y-v.y,l=Math.hypot(dx,dy)||1;return{dx:dx/l,dy:dy/l};}
function vhRem(v){return Math.hypot(v.h.pin.x-v.x,v.h.pin.y-v.y);}
function vhList(v,act){
  const u=ul(),d=vhAim(v),H=v.h,out=[];
  [['Water',H.water],['Bunker',H.bunk]].forEach(g=>g[1].forEach(e=>{
    let mn=1e9,mx=0,np=null;
    shapePts(e).forEach(p=>{const dd=Math.hypot(p.x-v.x,p.y-v.y);if(dd<mn){mn=dd;np=p;}if(dd>mx)mx=dd;});
    if(!np||mn>340||mx<8)return;
    const ex=np.x-v.x,ey=np.y-v.y,el=Math.hypot(ex,ey)||1;
    if((ex*d.dx+ey*d.dy)/el<0.3)return;
    const lat=ex*d.dy-ey*d.dx;
    if(Math.abs(lat)>45)return;
    out.push({g:g[0],mn:mn,mx:mx,lat:lat});}));
  out.sort((a,b)=>a.mn-b.mn);
  const m=[];
  out.forEach(o=>{const p=m[m.length-1];if(p&&p.g===o.g&&o.g==='Bunker'&&o.mn<=p.mx+10){p.mx=Math.max(p.mx,o.mx);}else m.push(o);});
  return m.slice(0,3).map(o=>{
    let t=tr(o.g)+' '+d1(o.mn)+(o.mx-o.mn>120?'+ ':'–'+d1(o.mx)+' ')+u;
    if(Math.abs(o.lat)>=8)t+=' · '+tr(o.lat>0?'right|aim':'left|aim');
    if(o.g==='Water'&&o.mx-o.mn<=120&&!H.land.length&&Math.abs(o.lat)<8){const c=act.filter(k=>k.carry>=o.mx+5).sort((a,b)=>a.carry-b.carry)[0];if(c&&o.mn>0)t+=' · '+tr('{0} carries it',esc(tc(c.name)));}
    return t;});
}
function vhPutts(rem){const r=Math.random();if(rem<0.6)return 0;if(rem<=3)return r<.75?1:2;if(rem<=8)return r<.12?1:(r<.9?2:3);if(rem<=15)return r<.05?1:(r<.7?2:3);return r<.45?2:(r<.95?3:4);}
function paintHole(c,H,b,ball,trail,thumb){
  const w=c.clientWidth,h=c.clientHeight,dp=window.devicePixelRatio||1;c.width=w*dp;c.height=h*dp;
  const g=c.getContext('2d');g.setTransform(dp,0,0,dp,0,0);
  const sc=Math.min(h/(b.y1-b.y0),w/Math.max(thumb?120:110,b.x1-b.x0)),cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2,P=(x,y)=>[w/2+(x-cx)*sc,h/2-(y-cy)*sc];
  const path=(s)=>{g.beginPath();if(s.poly){s.poly.forEach((p,i)=>{const q=P(p[0],p[1]);i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]);});g.closePath();}else{const q=P(s.x,s.y);g.ellipse(q[0],q[1],s.rx*sc,s.ry*sc,-(s.rot||0),0,7);}};
  const fill=(s,f,st)=>{path(s);g.fillStyle=f;g.fill();if(st){g.strokeStyle=st;g.lineWidth=thumb?1:1.5;g.stroke();}};
  g.fillStyle='#2f7d3a';g.fillRect(0,0,w,h);
  g.lineCap='round';g.lineJoin='round';g.strokeStyle='#58b865';
  for(let i=0;i<H.path.length-1;i++){const a=H.path[i],q2=H.path[i+1],p=P(a[0],a[1]),q=P(q2[0],q2[1]);g.lineWidth=(a[2]+q2[2])*sc;g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke();}
  const t=P(0,0);g.fillStyle='#7fd18b';g.fillRect(t[0]-6*sc,t[1]-3*sc,12*sc,6*sc);
  H.water.forEach(e=>fill(e,'#3b82c4','#9cc9ef'));
  H.land.forEach(e=>fill(e,'#58b865','#3f9a4c'));
  H.oob.forEach(e=>fill(e,'rgba(70,70,70,.65)'));
  fill(H.green,'#8be39a','#fff');
  H.bunk.forEach(e=>fill(e,'#efdfa6','#c9b26a'));
  H.trees.forEach(tr_=>{const p=P(tr_.x,tr_.y);g.beginPath();g.arc(p[0],p[1],tr_.r*sc,0,7);g.fillStyle='#1d5a2a';g.fill();g.beginPath();g.arc(p[0]-tr_.r*sc*.25,p[1]-tr_.r*sc*.25,tr_.r*sc*.55,0,7);g.fillStyle='#2b7a3a';g.fill();});
  const gp=P(H.pin.x,H.pin.y),fl=thumb?10:24;g.strokeStyle='#fff';g.lineWidth=thumb?1.5:2;g.beginPath();g.moveTo(gp[0],gp[1]);g.lineTo(gp[0],gp[1]-fl);g.stroke();g.fillStyle='#ef4444';g.beginPath();g.moveTo(gp[0],gp[1]-fl);g.lineTo(gp[0]+fl/2,gp[1]-fl*.8);g.lineTo(gp[0],gp[1]-fl*.6);g.fill();
  if(trail){g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=2;g.setLineDash([5,4]);g.beginPath();trail.forEach((p,i)=>{const q=P(p.x,p.y);i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]);});g.stroke();g.setLineDash([]);}
  if(ball){const bp=P(ball.x,ball.y);g.beginPath();g.arc(bp[0],bp[1],5,0,7);g.fillStyle='#fff';g.fill();g.strokeStyle='#111';g.lineWidth=1.5;g.stroke();}
}
function drawVh(){
  const v=R.vh,c=$('#vhc');if(!v||!c||v.fin)return;const H=v.h;
  paintHole(c,H,{x0:Math.min(v.x,H.pin.x)-30,x1:Math.max(v.x,H.pin.x)+30,y0:Math.min(v.y,H.pin.y)-24,y1:Math.max(v.y,H.pin.y)+30},v,v.trail,false);
}
function drawThumbs(){
  document.querySelectorAll('.hth').forEach(c=>{
    const H=LIB.find(o=>o.id===c.dataset.hid);if(!H)return;
    const xs=H.path.map(p=>p[0]).concat([0,H.pin.x]);
    paintHole(c,H,{x0:Math.min.apply(null,xs)-40,x1:Math.max.apply(null,xs)+40,y0:-10,y1:H.len+22},null,null,true);
  });
}
function vhName(st,par){const d=st-par;return st===1?'Hole in one!':d<=-3?'Albatross':d===-2?'Eagle':d===-1?'Birdie':d===0?'Par':d===1?'Bogey':d===2?'Double bogey':'Triple bogey or worse';}
function vhHTML(act,sel){
  const v=R.vh,u=ul();
  if(!v){
    const ss=R.vhSel||[];
    const card=o=>{const pr=o.name.split(' · '),on=ss.indexOf(o.id)>=0;
      return '<button class="hcard'+(on?' on':'')+'" data-act="vhpick" data-id="'+o.id+'">'+(on?'<span class="tick">✓</span>':'')+'<canvas class="hth" data-hid="'+o.id+'"></canvas><div class="hn">'+esc(pr[0])+'</div><div class="hs">'+esc(pr[1]||'')+'</div><div class="hm"><span>Par '+o.par+' · '+d1(o.len)+' '+u+'</span><span class="lv '+(o.lvl===1?'e':o.lvl===2?'m':'t')+'">'+tr(o.lvl===1?'Easy':o.lvl===2?'Medium':'Tough')+'</span></div></button>';};
    return '<div class="sub" style="margin:0 0 10px">'+tr('Pick holes to play. Hit real shots, enter the carry, and the app moves your ball down the hole.')+'</div>'+
    '<div class="seg" style="gap:8px;margin-bottom:10px"><button data-act="vhall" data-v="easy">'+tr('All easy')+'</button><button data-act="vhall" data-v="med">'+tr('All medium')+'</button><button data-act="vhall" data-v="fam">'+tr('All famous')+'</button><button data-act="vhnone">'+tr('Clear')+'</button></div>'+
    '<div class="lbl" style="margin:6px 0 8px">'+tr('Easy holes')+'</div><div class="hgrid">'+LIB.filter(o=>o.lvl===1).map(card).join('')+'</div>'+
    '<div class="lbl" style="margin:16px 0 8px">'+tr('Medium holes')+'</div><div class="hgrid">'+LIB.filter(o=>o.lvl===2).map(card).join('')+'</div>'+
    '<div class="lbl" style="margin:16px 0 8px">'+tr('Famous holes')+'</div><div class="hgrid">'+LIB.filter(o=>o.lvl===3).map(card).join('')+'</div>'+
    '<div class="sub" style="margin:8px 0">'+tr('Layouts are simplified, not exact.')+'</div>'+
    (ss.length?'<button class="cta" data-act="vhstart">'+tr('Play {0} holes',ss.length)+'</button>':'')+
    '<div class="lbl" style="margin:16px 0 6px">'+tr('Or your own lengths')+'</div><div class="row" style="flex-wrap:nowrap"><input type="text" id="vhl" value="'+esc(R.vhText||'380, 165, 510')+'"><button class="sec" data-act="vhstart" style="flex:none">'+tr('Start')+'</button></div>';
  }
  if(v.fin){
    const tot=v.done.reduce((a,h)=>a+h.strokes,0),par=v.done.reduce((a,h)=>a+h.par,0);
    return '<div class="big-msg center">'+tr('Round complete')+'</div>'+v.done.map((h,i)=>'<div class="shot"><b>'+esc(h.name||tr('Hole {0}',i+1))+'</b><span>'+d1(h.len)+' '+u+' · par '+h.par+' · <b>'+h.strokes+'</b> ('+fmtTo(h.strokes-h.par)+')</span></div>').join('')+'<div class="shot"><b>'+tr('Total')+'</b><span><b>'+tot+'</b> ('+fmtTo(tot-par)+')</span></div><button class="cta" style="margin-top:14px" data-act="vhquit">'+tr('Done')+'</button>';
  }
  const H=v.h,len=H.len,par=H.par;
  let h=(H.name?'<div class="vhtitle">'+esc(H.name.split(' · ')[0])+(H.name.indexOf(' · ')>0?' <span style="font-weight:600;color:var(--mut);font-size:16px">'+esc(H.name.split(' · ')[1])+'</span>':'')+'</div>':'')+'<div class="lbl">'+tr('Hole {0} of {1} · par {2}',v.i+1,v.holes.length,par)+' · '+d1(len)+' '+u+'</div><canvas id="vhc" style="width:100%;height:300px;border-radius:14px;display:block;margin:8px 0"></canvas>';
  if(H.note&&v.strokes===0&&!v.res)h+='<div class="sub" style="margin-bottom:6px">'+esc(S.lang==='pt'?H.note[1]:H.note[0])+'</div>';
  if(v.res){
    const d=v.strokes-par;
    h+='<div class="big-msg" style="color:'+(d<0?'#15803d':d>0?'#b45309':'var(--ink)')+'">'+tr(vhName(v.strokes,par))+'</div><div class="sub">'+tr('{0} strokes ({1})',v.strokes,fmtTo(d))+'</div><div class="why">'+(v.res.pick?tr('Pick up. Too many strokes.'):v.res.putts===0?tr('Holed out! No putts needed.'):tr('On the green, {0} {1} from the pin. Putts: {2}.',d1(v.res.rem),u,v.res.putts))+'</div><button class="cta" style="margin-top:14px" data-act="vhnext">'+tr(v.i>=v.holes.length-1?'Done':'Next hole ›')+'</button>'+(v.prev?'<div class="center"><button class="link" data-act="vhundo">'+tr('Undo last shot')+'</button></div>':'');
    return h;
  }
  const rem=vhRem(v),rc=recommend(rem,null);let rb=rc.best||rc.longest;const vd=vhDecide(v,rc,rem);if(vd&&rc.best){rb=rc.list.find(x=>x.id===vd.club.id)||rb;}
  let cl=sel;const sk=v.i+'|'+v.strokes;
  if(R.vhShot!==sk){R.vhShot=sk;if(rb){cl=rb;S.rsel=rb.id;}R.vhKey=null;}
  const ck=sk+'|'+cl.id;
  const lm=v.lie==='rough'?.9:v.lie==='bunker'?.8:1,rmu=v.lie==='rough'?.4:v.lie==='bunker'?0:1;
  if(R.vhKey!==ck){R.vhKey=ck;R.rd=Math.max(0,Math.round(Math.min(cl.carry,(rc.plays-cl.roll*0.6*rmu)/lm)));R.rdClub=cl.id;}
  h+='<div class="hero"><div><div class="lbl">'+tr('To the pin')+'</div><div class="dist" style="text-align:left">'+d1(rem)+'<small>'+u+'</small></div></div><div class="plays">'+tr('Stroke {0}',v.strokes+1)+'</div></div>';
  if(v.last!=null)h+='<div class="why">'+tr('Last shot: {0} {1}',d1(v.last),u)+'</div>';
  if(v.msg)h+='<div class="aim">'+v.msg+'</div>';
  if(v.lie&&v.lie!=='tee')h+='<div class="why">'+tr(v.lie==='bunker'?'Lie: bunker':(v.lie==='rough'?'Lie: rough':'Lie: fairway'))+(v.lie==='bunker'?' · −20%':v.lie==='rough'?' · −10%':'')+'</div>';
  const hl=vhList(v,act);if(hl.length)h+='<div class="hz">'+hl.map(t=>'<div>'+t+'</div>').join('')+'</div>';
  if(rb)h+='<div class="aim">'+tr('Caddy suggests {0}',esc(tc(rb.name)))+'</div>';
  if(vd&&rb){const ve=vd.list.find(z=>z.club.id===rb.id),ae=vd.altE;if(ve&&ve.p>=0.05)h+='<div class="why">⚠ '+tr('{0}% chance of trouble',Math.round(ve.p*100))+'</div>';if(ve&&ae&&ae.club.id!==rb.id&&ae.p-ve.p>=0.08)h+='<div class="why">'+tr('{0} is safer than {1}: {2}% chance of trouble vs {3}%',esc(tc(rb.name)),esc(tc(ae.club.name)),Math.round(ve.p*100),Math.round(ae.p*100))+'</div>';}
  h+='<div class="chiprow" style="flex-wrap:wrap">'+act.map(c=>'<button class="cond'+(c.id===cl.id?' pickon':'')+'" data-act="rsel" data-id="'+c.id+'">'+esc(tc(c.name))+'</button>').join('')+'</div>'+
  '<div class="field center"><div class="lbl">'+tr('Carry distance')+'</div><div class="stepper" style="justify-content:center"><button data-act="rstep" data-v="-5">−5</button><button data-act="rstep" data-v="-1">−</button><div class="v">'+d1(R.rd)+'<small> '+u+'</small></div><button data-act="rstep" data-v="1">+</button><button data-act="rstep" data-v="5">+5</button></div></div>'+
  '<div class="seg" style="justify-content:center;margin-bottom:14px">'+[['l','← Left'],['c','Straight'],['r','Right →']].map(m=>'<button class="'+((R.rmiss||'c')===m[0]?'on':'')+'" data-act="rmiss" data-v="'+m[0]+'">'+tr(m[1])+'</button>').join('')+'</div>'+
  '<div class="seg" style="justify-content:center;margin:-6px 0 12px"><button class="'+(R.rbig?'on':'')+'" data-act="rbig">'+tr('Big miss')+'</button></div>'+
  '<button class="cta" data-act="vhhit">'+tr('Play this shot')+'</button><div class="center">'+(v.prev?'<button class="link" data-act="vhundo">'+tr('Undo last shot')+'</button>':'')+'<button class="link" data-act="vhquit">'+tr('End game')+'</button></div>';
  return h;
}
