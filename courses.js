"use strict";
/* ================= Full courses (real pars and lengths) and multiplayer on one phone ================= */
Object.assign(PT,{
 'Courses':'Campos','Single holes':'Buracos soltos','Players':'Jogadores','Add player':'Adicionar jogador','Name':'Nome','Me':'Eu','Play 18':'Jogar 18','Front 9':'Primeiros 9','Back 9':'Últimos 9','Play 9':'Jogar 9',
 'Real pars and lengths, generated hazards. Layouts are simplified.':'Pares e distâncias reais, obstáculos gerados. Os layouts são simplificados.','Approximate lengths':'Distâncias aproximadas',
 'Playing now':'A jogar','Hole result':'Resultado do buraco','Scorecard':'Cartão','Total':'Total','finished':'terminou','to play':'a jogar',
 'Guest: enter how far the ball went. The caddy advice is for the first player.':'Convidado: indica a distância da bola. Os conselhos do caddy são para o primeiro jogador.'
});
const CRS=[
 {id:'jam',name:'Jamor',place:'Oeiras',lvl:1,u:'m',approx:1,seed:11,pars:[4,3,4,4,3,5,4,3,4],len:[334,145,282,289,130,469,250,150,247]},
 {id:'eb',name:'Estoril Blue',place:'Estoril',lvl:1,u:'y',seed:23,pars:[4,4,5,4,3,4,3,3,4],len:[326,384,445,312,171,332,143,106,330]},
 {id:'ec',name:'Estoril Championship',place:'Estoril',lvl:2,u:'y',seed:37,pars:[4,3,4,3,5,4,4,3,4,5,4,4,3,4,4,3,4,4],len:[383,136,317,160,460,257,389,170,366,452,375,330,143,369,313,176,276,259]},
 {id:'sta',name:'St Andrews Old Course',place:'Scotland',lvl:2,u:'y',approx:1,seed:41,use:{17:'sa17'},pars:[4,4,4,4,5,4,4,3,4,4,3,4,4,5,4,4,4,4],len:[376,453,397,480,568,412,371,175,352,386,174,348,465,618,455,423,495,357]},
 {id:'peb',name:'Pebble Beach',place:'California',lvl:3,u:'y',approx:1,seed:53,use:{7:'p7',18:'p18'},pars:[4,5,4,4,3,5,3,4,4,4,4,3,4,5,4,4,3,5],len:[380,502,390,331,195,523,106,418,505,495,390,202,392,580,397,403,208,543]},
 {id:'aug',name:'Augusta National',place:'Georgia',lvl:3,u:'y',approx:1,seed:61,use:{12:'a12',13:'a13',15:'a15'},pars:[4,5,4,3,4,3,4,5,4,4,4,3,5,4,5,3,4,4],len:[445,575,350,240,495,180,450,570,460,495,520,155,510,440,550,170,440,465]},
 {id:'tpc',name:'TPC Sawgrass',place:'Florida',lvl:3,u:'y',approx:1,seed:71,use:{17:'tpc17'},pars:[4,5,3,4,4,4,4,3,5,4,5,4,3,4,4,5,3,4],len:[423,532,177,384,466,393,442,237,583,424,558,358,181,481,449,523,137,462]}
];
function crsM(c,k){return Math.round(c.len[k]*(c.u==='y'?0.9144:1));}
function crsTot(c){return c.len.reduce((a,_,k)=>a+crsM(c,k),0);}
function genHoleP(len,idx,par,lvl){
  const rnd=vhRng(Math.round(len)*131+idx*17+7),sd=()=>rnd()<.5?-1:1;
  const o={id:'k'+idx,name:'',par:par,len:len,path:par===3?[[0,Math.max(10,len-70),11],[0,len-8,11]]:[[0,0,17],[0,len-12,17]],pin:{x:0,y:len},green:{x:0,y:len,rx:12,ry:12},water:[],bunk:[{x:-14,y:len-3,rx:6,ry:4.5},{x:15,y:len+2,rx:6,ry:5}]};
  if(par===3){if(lvl>=2)o.water.push({x:sd()*17,y:len-22,rx:13,ry:11});}
  else{
    const fy=Math.min(len-90,par===5?170:235),fs=sd();
    if(fy>60)o.bunk.push({x:fs*15,y:fy,rx:5,ry:10});
    const wy=len*(par===5?.78:.7),ws=sd();
    if(lvl>=2&&len>200)o.water.push({x:ws*27,y:wy,rx:14,ry:Math.min(30,len*.07)});
    if(par===5){o.bunk.push({x:-fs*15,y:len*.45,rx:5,ry:9});if(lvl>=2)o.water.push({x:-ws*22,y:len-45,rx:11,ry:9});}
  }
  return mkHole(o);
}
function crsHoles(c,from,to){
  const out=[];
  for(let k=from;k<to;k++){
    const nm='Hole '+(k+1)+' · '+c.name,u=c.use&&c.use[k+1];
    const lib=u&&LIB.find(o=>o.id===u);
    if(lib)out.push(Object.assign({},lib,{name:nm}));
    else out.push(Object.assign(genHoleP(Math.max(40,crsM(c,k)),c.seed*20+k,c.pars[k],c.lvl),{name:nm}));
  }
  return out;
}
/* ---------- player state swap (one phone, take turns) ---------- */
const MPF=['x','y','wp','strokes','res','last','lie','msg','trail','prev'];
const GCLUB={name:'Iron',carry:150,roll:8};
function mpSave(){const v=R.vh,m=v&&v.mp;if(!m)return;const P=m.players[m.cur];MPF.forEach(f=>{P[f]=v[f];});}
function mpLoad(k){const v=R.vh,m=v.mp;m.cur=k;const P=m.players[k];MPF.forEach(f=>{v[f]=P[f];});R.vhShot=null;R.vhKey=null;R.rd=null;R.rdClub=null;R.rlat=0;R.rfl='n';R.vhTop=true;}
function mpReset(P){P.x=0;P.y=0;P.wp=0;P.strokes=0;P.res=null;P.last=null;P.lie='tee';P.msg='';P.trail=[{x:0,y:0}];P.prev=null;P.fin=false;}
function mpRem(v,P){return Math.hypot(v.h.pin.x-P.x,v.h.pin.y-P.y);}
function mpNextPlayer(){
  const v=R.vh,m=v.mp,un=m.players.map((p,i)=>({p:p,i:i})).filter(o=>!o.p.fin);
  if(!un.length)return -1;
  const tee=m.order.filter(i=>!m.players[i].fin&&m.players[i].strokes===0&&m.players[i].lie==='tee');
  if(tee.length)return tee[0];
  un.sort((a,b)=>mpRem(v,b.p)-mpRem(v,a.p));return un[0].i;
}
function mpSnap(){mpSave();const m=R.vh.mp;m.hist.push(JSON.stringify({p:m.players,c:m.cur,o:m.order}));if(m.hist.length>40)m.hist.shift();}
function mpAfter(){
  const v=R.vh,m=v.mp;mpSave();const P=m.players[m.cur];m.note='';
  if(v.res){P.fin=true;P.score=v.strokes;}
  const nx=mpNextPlayer();
  if(nx<0){v.mpSummary=true;return;}
  if(P.fin)m.note=P.name+' '+tr('finished')+': '+tr(vhName(P.score,v.h.par))+' ('+P.score+')';
  mpLoad(nx);
}
function mpGuestHit(){
  const v=R.vh,m=v.mp,P=m.players[m.cur],cl=GCLUB;
  const H=v.h,d=vhAim(v),lm=v.lie==='rough'?.9:v.lie==='bunker'?.8:1,rmu=v.lie==='rough'?.4:v.lie==='bunker'?0:1;
  const fac=rbFac(cl),real=rbReal(cl,R.rd),fl=R.rfl||'n',lat=(R.rlat||0)/fac;
  const tot=real*lm+real*0.05*rmu*(FLN[fl]||1);
  const nx=v.x+d.dx*tot+d.dy*lat,ny=v.y+d.dy*tot-d.dx*lat;v.prev=null;v.strokes++;v.last=tot;v.msg='';
  const hit=vhHit(H,nx,ny);
  if(hit==='water'||hit==='tree'||hit==='oob'){v.strokes++;v.last=null;v.trail.push({x:nx,y:ny});v.trail.push({x:v.x,y:v.y});v.msg=tr(hit==='water'?'Splash! In the water. +1 stroke, play again from the same spot.':(hit==='oob'?'Out of bounds. +1 stroke, play again from the same spot.':'In the trees. +1 stroke, play again from the same spot.'));}
  else{v.x=nx;v.y=ny;v.trail.push({x:nx,y:ny});
    while(v.wp<H.wps.length-1){const a=H.wps[v.wp],b2=H.wps[v.wp+1],past=((v.x-a.x)*(b2.x-a.x)+(v.y-a.y)*(b2.y-a.y))>0;if(past||Math.hypot(a.x-v.x,a.y-v.y)<70)v.wp++;else break;}
    const rem=vhRem(v);
    v.lie=hit==='green'?'green':(hit==='bunker'?'bunker':(vhFw(H,nx,ny)?'fairway':'rough'));
    if(v.lie==='bunker')v.msg=tr('In the bunker.');
    if(hit==='green'){const pu=vhPutts(rem);v.strokes+=pu;v.res={rem:rem,putts:pu};}}
  if(!v.res&&v.strokes>=10)v.res={pick:true};
  R.rlat=0;R.rfl='n';
}
/* ---------- screens ---------- */
function mpBanner(v){
  const m=v.mp;
  return '<div class="row" style="margin:0 0 8px">'+m.players.map((p,i)=>'<span class="cond" style="min-height:34px;display:inline-flex;align-items:center;font-size:13px;'+(i===m.cur?'background:var(--ink);color:#fff':(p.fin?'background:#dcfce7':''))+'">'+esc(p.name)+' · '+(i===m.cur?v.strokes:p.strokes)+(p.fin?' ✓':'')+'</span>').join('')+'</div>'+(m.note?'<div class="aim" style="background:#effaf2;color:#166534">'+esc(m.note)+'</div>':'');
}
function mpTable(m,upto){
  const n=m.players[0].done.length;let h='<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:14px"><tr style="background:var(--soft)"><th style="padding:6px;text-align:left">#</th><th style="padding:6px">'+tr('Par')+'</th>'+m.players.map(p=>'<th style="padding:6px">'+esc(p.name)+'</th>').join('')+'</tr>';
  for(let k=0;k<n;k++)h+='<tr style="border-top:1px solid var(--line)"><td style="padding:6px">'+(k+1)+'</td><td style="padding:6px;text-align:center">'+m.players[0].done[k].par+'</td>'+m.players.map(p=>'<td style="padding:6px;text-align:center"><b>'+p.done[k].strokes+'</b></td>').join('')+'</tr>';
  const par=m.players[0].done.reduce((a,x)=>a+x.par,0);
  h+='<tr style="border-top:2px solid var(--ink);font-weight:800"><td style="padding:6px">'+tr('Total')+'</td><td style="padding:6px;text-align:center">'+par+'</td>'+m.players.map(p=>{const t=p.done.reduce((a,x)=>a+x.strokes,0);return'<td style="padding:6px;text-align:center">'+t+' ('+fmtTo(t-par)+')</td>';}).join('')+'</tr></table></div>';
  return h;
}
function mpGuestHTML(v){
  const m=v.mp,P=m.players[m.cur],H=v.h,u=ul(),rem=vhRem(v),sk='g'+v.i+'|'+m.cur+'|'+v.strokes;
  if(R.vhKey!==sk){R.vhKey=sk;R.rdPlan=null;R.rd=Math.round(rbRaw(GCLUB,Math.min(rem*0.95,230)));}
  let h=(H.name?'<div class="vhtitle">'+esc(H.name.split(' · ')[0])+(H.name.indexOf(' · ')>0?' <span style="font-weight:600;color:var(--mut);font-size:16px">'+esc(H.name.split(' · ')[1])+'</span>':'')+'</div>':'')+'<div class="lbl">'+tr('Hole {0} of {1} · par {2}',v.i+1,v.holes.length,H.par)+' · '+d1(H.len)+' '+u+'</div><canvas id="vhc" style="width:100%;height:300px;border-radius:14px;display:block;margin:8px 0"></canvas>';
  h+='<div class="hero"><div><div class="lbl">'+tr('To the pin')+'</div><div class="dist" style="text-align:left">'+d1(rem)+'<small>'+u+'</small></div></div><div class="plays">'+tr('Stroke {0}',v.strokes+1)+'</div></div>';
  if(v.last!=null)h+='<div class="why">'+tr('Last shot: {0} {1}',d1(v.last),u)+'</div>';
  if(v.msg)h+='<div class="aim">'+v.msg+'</div>';
  if(v.lie&&v.lie!=='tee')h+='<div class="why">'+tr(v.lie==='bunker'?'Lie: bunker':(v.lie==='rough'?'Lie: rough':'Lie: fairway'))+'</div>';
  const hl=vhList(v,[]);if(hl.length)h+='<div class="hz">'+hl.map(t=>'<div>'+t+'</div>').join('')+'</div>';
  h+=rShotUI(GCLUB)+'<button class="cta" data-act="vhhit">'+tr('Play this shot')+'</button>';
  return h;
}
function mpPlayersHTML(){
  const names=S.mpNames&&S.mpNames.length?S.mpNames:[tr('Me')];
  return '<div class="lbl" style="margin:4px 0 6px">'+tr('Players')+'</div>'+names.map((n,i)=>'<div class="row" style="flex-wrap:nowrap;margin-bottom:6px"><input type="text" data-mpname="'+i+'" value="'+esc(n)+'" placeholder="'+tr('Name')+'">'+(i>0?'<button class="x" data-act="mpdel" data-i="'+i+'">✕</button>':'')+'</div>').join('')+(names.length<4?'<button class="sec" data-act="mpadd" style="margin-bottom:10px">+ '+tr('Add player')+'</button>':'')+'<div class="sub" style="margin-bottom:8px">'+tr('Guest: enter how far the ball went. The caddy advice is for the first player.')+'</div>';
}
function crsListHTML(){
  const u=ul();
  let h=mpPlayersHTML();
  [1,2,3].forEach(l=>{
    const cs=CRS.filter(c=>c.lvl===l);if(!cs.length)return;
    h+='<div class="lbl" style="margin:14px 0 8px">'+tr(l===1?'Easy holes':l===2?'Medium holes':'Famous holes').replace(/ holes?/i,'')+'</div>';
    cs.forEach(c=>{const n=c.pars.length,par=c.pars.reduce((a,b)=>a+b,0);
      h+='<div class="pick" style="display:block"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span><b>'+esc(c.name)+'</b><br><small>'+esc(c.place)+' · '+n+' · par '+par+' · '+d1(crsTot(c))+' '+u+(c.approx?' · '+tr('Approximate lengths'):'')+'</small></span><span class="lv '+(c.lvl===1?'e':c.lvl===2?'m':'t')+'">'+tr(c.lvl===1?'Easy':c.lvl===2?'Medium':'Tough')+'</span></div><div class="row" style="margin-top:8px">'+(n>9?'<button class="sec" data-act="crsplay" data-id="'+c.id+'" data-v="all">'+tr('Play 18')+'</button><button class="sec" data-act="crsplay" data-id="'+c.id+'" data-v="f9">'+tr('Front 9')+'</button><button class="sec" data-act="crsplay" data-id="'+c.id+'" data-v="b9">'+tr('Back 9')+'</button>':'<button class="sec" data-act="crsplay" data-id="'+c.id+'" data-v="all">'+tr('Play 9')+'</button>')+'</div></div>';});
  });
  return h+'<div class="sub" style="margin:10px 0">'+tr('Real pars and lengths, generated hazards. Layouts are simplified.')+'</div>';
}
const _vhBase=vhHTML;
vhHTML=function(act,sel){
  const v=R.vh;
  if(!v){
    const seg='<div class="seg" style="margin-bottom:12px">'+[['courses','Courses'],['holes','Single holes']].map(x=>'<button class="'+((R.vhTab||'courses')===x[0]?'on':'')+'" data-act="vhtab" data-v="'+x[0]+'">'+tr(x[1])+'</button>').join('')+'</div>';
    return seg+((R.vhTab||'courses')==='courses'?crsListHTML():mpPlayersHTML()+_vhBase(act,sel));
  }
  const m=v.mp;
  if(!m)return _vhBase(act,sel);
  if(v.fin){
    return '<div class="big-msg center">'+tr('Round complete')+'</div><div class="lbl" style="margin:6px 0">'+esc(v.course||'')+'</div>'+mpTable(m)+'<button class="cta" style="margin-top:14px" data-act="vhquit">'+tr('Done')+'</button>';
  }
  if(v.mpSummary){
    const H=v.h;
    return '<div class="big-msg center">'+tr('Hole result')+'</div><div class="lbl center">'+esc(H.name||'')+' · par '+H.par+'</div>'+m.players.map(p=>'<div class="shot"><b>'+esc(p.name)+'</b><span><b>'+p.score+'</b> · '+tr(vhName(p.score,H.par))+'</span></div>').join('')+'<button class="cta" style="margin-top:14px" data-act="vhnext">'+tr(v.i>=v.holes.length-1?'Done':'Next hole ›')+'</button>'+(m.hist.length?'<div class="center"><button class="link" data-act="vhundo">'+tr('Undo last shot')+'</button></div>':'');
  }
  const P=m.players[m.cur];
  let h=mpBanner(v)+'<div class="lbl" style="margin:0 0 6px">'+tr('Playing now')+': '+esc(P.name)+'</div>';
  if(P.guest)h+=mpGuestHTML(v);
  else h+=_vhBase(act,sel).replace(/<button class="link" data-act="vhundo">[^<]*<\/button>/,'');
  if(m.hist.length)h+='<div class="center"><button class="link" data-act="vhundo">'+tr('Undo last shot')+'</button></div>';
  return h;
};
/* ---------- actions ---------- */
const _vhhitC=RACT.vhhit;
RACT.vhhit=function(b,v){
  const vv=R.vh;if(!vv||!vv.mp){_vhhitC(b,v);return;}
  mpSnap();const P=vv.mp.players[vv.mp.cur];
  if(P.guest)mpGuestHit();else _vhhitC(b,v);
  mpAfter();R.vhTop=true;save();openPanel('range');
};
const _actC=act;
act=function(a,b){
  const v=R.vh;
  if(a==='vhtab'){R.vhTab=b.dataset.v;openPanel('range');return;}
  if(a==='mpadd'){S.mpNames=(S.mpNames&&S.mpNames.length?S.mpNames:[tr('Me')]).slice();if(S.mpNames.length<4)S.mpNames.push('Friend '+S.mpNames.length);save();openPanel('range');return;}
  if(a==='mpdel'){S.mpNames=(S.mpNames||[]).filter((_,i)=>i!==+b.dataset.i);save();openPanel('range');return;}
  if(a==='vhstart'){
    _actC(a,b);const names=(S.mpNames&&S.mpNames.length?S.mpNames:[tr('Me')]).map((x,i)=>String(x).trim()||(i?'Friend '+i:tr('Me')));
    if(R.vh&&!R.vh.mp&&names.length>1){R.vh.mp={players:names.map((nm,i)=>({name:nm,guest:i>0,done:[]})),cur:0,order:names.map((_,i)=>i),hist:[],note:''};R.vh.mp.players.forEach(mpReset);mpLoad(0);openPanel('range');}
    return;}
  if(a==='crsplay'){
    const c=CRS.find(x=>x.id===b.dataset.id);if(!c)return;const w=b.dataset.v,n=c.pars.length,from=w==='b9'?9:0,to=w==='f9'?9:n;
    const hs=crsHoles(c,from,to),names=(S.mpNames&&S.mpNames.length?S.mpNames:[tr('Me')]).map((x,i)=>String(x).trim()||(i?'Friend '+i:tr('Me')));
    R.vh={holes:hs,i:0,h:hs[0],x:0,y:0,wp:0,strokes:0,done:[],res:null,last:null,fin:false,trail:[{x:0,y:0}],lie:'tee',msg:'',course:c.name+(n>9&&w!=='all'?(w==='f9'?' (front 9)':' (back 9)'):'')};
    if(names.length>1){R.vh.mp={players:names.map((nm,i)=>({name:nm,guest:i>0,done:[]})),cur:0,order:names.map((_,i)=>i),hist:[],note:''};R.vh.mp.players.forEach(mpReset);mpLoad(0);}
    R.rd=null;R.rdClub=null;R.rlat=0;R.rfl='n';R.vhTop=true;openPanel('range');return;}
  if(v&&v.mp&&a==='vhundo'){const m=v.mp,s=m.hist.pop();if(s){const o=JSON.parse(s);m.players=o.p;m.order=o.o;v.mpSummary=false;mpLoad(o.c);m.note='';}openPanel('range');return;}
  if(v&&v.mp&&a==='vhnext'){
    const m=v.mp;mpSave();
    m.players.forEach(p=>p.done.push({len:v.h.len,par:v.h.par,strokes:p.strokes,name:v.h.name}));
    const sc=m.players.map(p=>p.strokes);
    if(v.i>=v.holes.length-1){v.fin=true;const me=m.players[0];S.rounds.unshift({id:Date.now(),date:Date.now(),course:(v.course?v.course+' (':'')+tr('Range game')+(v.course?')':''),range:true,holes:me.done.map((h2,i2)=>({n:i2+1,par:h2.par,score:h2.strokes,putts:null,fw:null}))});S.rounds=S.rounds.slice(0,100);save();}
    else{
      v.i++;v.h=v.holes[v.i];v.mpSummary=false;m.players.forEach(mpReset);
      const mn=Math.min.apply(null,sc);m.order=m.players.map((_,i)=>i).sort((x,y)=>sc[x]-sc[y]);if(sc[m.order[0]]!==mn)m.order=m.players.map((_,i)=>i);
      m.hist=[];m.note='';mpLoad(m.order[0]);}
    R.rd=null;R.rdClub=null;R.vhTop=true;openPanel('range');return;}
  if(a==='vhnext'&&v&&v.course&&!v.mp){_actC(a,b);if(R.vh&&R.vh.fin&&S.rounds[0]&&S.rounds[0].range){S.rounds[0].course=R.vh.course+' ('+tr('Range game')+')';save();}return;}
  _actC(a,b);
};
document.addEventListener('input',e=>{const t=e.target;if(t&&t.dataset&&t.dataset.mpname!=null){S.mpNames=(S.mpNames&&S.mpNames.length?S.mpNames:[tr('Me')]).slice();S.mpNames[+t.dataset.mpname]=t.value;save();}});