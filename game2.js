"use strict";
/* ============ Game module 2: target practice, home multiplayer, my holes, challenges, Play / Data tab ============ */
PL.sub=PL.sub||'play';
const TPN=10;
function gmReset(v){v.x=0;v.y=0;v.wp=0;v.strokes=0;v.res=null;v.last=null;v.trail=[{x:0,y:0}];v.lie='tee';v.msg='';v.prev=null;v.st=null;}
function gmCal(){return !!(S.home&&S.home.ver===3&&S.home.vFull);}
function gmLaunch(v,src){
  v.src=src;v.gm=null;R.vh=v;R.rd=null;R.rdClub=null;R.rlat=0;R.rfl='n';R.vhShot=null;R.vhKey=null;R.vhTop=true;
  HM.key=null;HM.sel=null;HM.note='';HM.wait=false;HM.starting=false;
  if(src==='home'){PL.src='home';S.plsrc='home';PL.on=false;HM.view='play';if(typeof swingStop==='function')swingStop();SWV.home=true;hmClose();dlRender();}
  else{PL.src='range';S.plsrc='range';PL.on=true;PL.key=null;HM.view='setup';hmClose();hmBuild();hmDraw();}
}
const gmNewV=(hs,course,extra)=>Object.assign({holes:hs,i:0,h:hs[0],x:0,y:0,wp:0,strokes:0,done:[],res:null,last:null,fin:false,trail:[{x:0,y:0}],lie:'tee',msg:'',course:course},extra||{});

/* ---------- target practice ---------- */
function tpStart(src){
  const act=S.clubs.filter(c=>c.on&&c.carry>20);if(!act.length)return;
  if(src==='home'&&!gmCal()){GM.msg=T('Calibrate first (Play, Home).','Calibra primeiro (Jogar, Casa).');openPanel('play');return;}
  const cs=act.map(c=>c.carry),lo=Math.max(30,Math.min.apply(null,cs)*0.6),hi=Math.max.apply(null,cs)*0.97,t=[];
  for(let i=0;i<TPN;i++)t.push(lo+(hi-lo)*i/(TPN-1)+(Math.random()-.5)*(hi-lo)/TPN*0.6);
  for(let i=t.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const x=t[i];t[i]=t[j];t[j]=x;}
  const hs=t.map((x,i)=>{const len=Math.round(x*U())/U();return mkHole({id:'tp'+i,name:T('Target ','Alvo ')+(i+1)+' · '+d1(len)+' '+ul(),par:3,len:len,path:[[0,0,26],[0,len,26]],pin:{x:0,y:len},green:{x:0,y:len,rx:9,ry:9},trees:false});});
  GM.mp=null;
  gmLaunch(gmNewV(hs,T('Target practice','Treino de alvos'),{tp:{rows:[],n:TPN}}),src);
}
GM.hk.afterHit=function(vv,cl){
  if(!vv.tp)return;
  const H=vv.h,prox=vv.last===null?99:Math.min(99,Math.hypot(vv.x-H.pin.x,vv.y-H.pin.y)),t=H.len,pts=Math.max(0,Math.round(100*(1-prox/(0.10*t))));
  vv.strokes=1;vv.res={rem:prox,putts:0,tp:true};vv.tpRes={prox:prox,pts:pts,t:t};vv.msg='';
  vv.tp.rows.push({t:t,club:cl.id,prox:prox,pts:pts});
};
const _vhNameG=vhName;
vhName=function(st,par){const v=R.vh;if(v&&v.tp&&v.tpRes)return T((v.tpRes.prox*U()).toFixed(1)+' '+ul()+' from the pin, '+v.tpRes.pts+' points',(v.tpRes.prox*U()).toFixed(1)+' '+ul()+' do alvo, '+v.tpRes.pts+' pontos');return _vhNameG(st,par);};
function tpFinish(v){
  const rows=v.tp.rows,n=rows.length,pts=rows.reduce((a,r)=>a+r.pts,0),avg=rows.reduce((a,r)=>a+r.prox,0)/Math.max(1,n);
  const e={t:Date.now(),src:v.src||'range',n:n,pts:pts,avg:avg,h10:rows.filter(r=>r.prox<=0.10*r.t).length,h5:rows.filter(r=>r.prox<=0.05*r.t).length,rows:rows};
  S.tps=S.tps||[];S.tps.unshift(e);S.tps=S.tps.slice(0,60);save();v.tpSum=e;gmClearGame();gmChalAnnounce();
}
function tpSummary(v){
  const e=v.tpSum||{rows:v.tp.rows,pts:0,avg:0,n:0,h10:0,h5:0},u=ul();
  const rows=e.rows.map((r,i)=>'<div class="shot"><b>'+(i+1)+'</b><span>'+d1(r.t)+' '+u+' · '+esc(dtName(r.club))+'</span><span style="text-align:right"><b>'+(r.prox*U()).toFixed(1)+' '+u+'</b> · '+r.pts+'</span></div>').join('');
  return '<div style="background:#fff;flex:1;overflow-y:auto;padding:calc(env(safe-area-inset-top) + 16px) 16px 20px"><div class="big-msg center">'+T('Target practice','Treino de alvos')+'</div><div class="lbl center">'+e.pts+' '+T('points','pontos')+' · '+T('average','média')+' '+(e.avg*U()).toFixed(1)+' '+u+' '+T('from the pin','do alvo')+'</div><div class="sub center" style="margin:6px 0 10px">'+e.h10+' / '+e.n+' '+T('within 10% of the distance','a menos de 10% da distância')+' · '+e.h5+' '+T('within 5%','a menos de 5%')+'</div>'+rows+gmChalNote()+'<button class="cta" style="margin-top:14px" data-gm="tp-again">'+T('Again','Outra vez')+'</button><button class="sec" style="margin-top:8px;width:100%" data-hm="done">'+T('Done','Feito')+'</button></div>';
}

/* ---------- home multiplayer: pass the phone ---------- */
function gmFriends(){S.gmFriends=S.gmFriends||[];return S.gmFriends;}
function mpPrepare(){
  const fr=gmFriends().filter(f=>String(f.name).trim());
  if(!fr.length){GM.mp=null;return true;}
  const miss=fr.find(f=>!(S.gmCal||{})[f.id]);
  if(miss){GM.msg=T(miss.name+' needs to calibrate first.',miss.name+' precisa de calibrar primeiro.');GM.mp=null;return false;}
  GM.mp={players:[{id:'me',name:T('Me','Eu'),holes:[]}].concat(fr.map(f=>({id:f.id,name:String(f.name).trim(),holes:[]}))),cur:0,newHole:false};
  return true;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-hm="course"]');if(!b)return;
  if(!mpPrepare()){e.stopImmediatePropagation();e.preventDefault();openPanel('play');}
},true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-hm="cal"],[data-hm="back"]');if(b)GM.calFor=null;},true);
function mpNext(v){
  const m=GM.mp,P=m.players[m.cur];
  P.holes[v.i]={par:v.h.par,strokes:v.strokes,st:v.st||null,name:v.h.name,len:Math.round(v.h.len)};
  m.newHole=false;
  if(m.cur<m.players.length-1){m.cur++;gmReset(v);}
  else{
    m.cur=0;
    if(v.i>=v.holes.length-1){v.fin=true;mpFinish(v);}
    else{v.i++;v.h=v.holes[v.i];gmReset(v);v.gm=null;m.newHole=true;}
  }
  R.rd=null;R.rdClub=null;R.vhTop=true;HM.sel=null;
  return true;
}
GM.hk.next=function(v){
  if(v.tp){
    if(v.i>=v.holes.length-1){v.fin=true;tpFinish(v);}else{v.i++;v.h=v.holes[v.i];gmReset(v);}
    R.rd=null;R.rdClub=null;R.vhTop=true;PL.key=null;if(PL.on)hmDraw();return true;
  }
  return GM.mp?mpNext(v):false;
};
const mpTot=p=>p.holes.reduce((a,h)=>a+h.strokes,0),mpPar=p=>p.holes.reduce((a,h)=>a+h.par,0);
function mpFinish(v){
  const m=GM.mp,course=v.course||String((v.holes[0]&&v.holes[0].name)||'').split(' · ').pop(),o=m.players[0];
  S.rounds.unshift({id:Date.now(),date:Date.now(),course:course+' ('+T('Home game','Jogo em casa')+')',range:true,holes:o.holes.map((h,i)=>({n:i+1,par:h.par,score:h.strokes,putts:null,fw:null}))});S.rounds=S.rounds.slice(0,100);
  S.grounds=S.grounds||[];
  S.grounds.unshift({t:Date.now(),course:course,src:'home',holes:o.holes.map(h=>({par:h.par,len:h.len,strokes:h.strokes,name:h.name,st:h.st})),mp:m.players.map(p=>({name:p.name,tot:mpTot(p),par:mpPar(p)}))});
  S.grounds=S.grounds.slice(0,150);
  const best=Math.min.apply(null,m.players.map(mpTot));S.gmBoard=S.gmBoard||{};
  m.players.forEach(p=>{const b=S.gmBoard[p.id]=S.gmBoard[p.id]||{name:p.name,g:0,w:0,d:0};b.name=p.name;b.g++;b.d+=mpTot(p)-mpPar(p);if(mpTot(p)===best)b.w++;});
  save();gmClearGame();gmChalAnnounce();
}
function mpBoard(v){
  const m=GM.mp,rows=m.players.map(p=>({p:p,t:mpTot(p),d:mpTot(p)-mpPar(p)})).sort((a,b)=>a.t-b.t),w=rows[0];
  return '<div style="background:#fff;flex:1;overflow-y:auto;padding:calc(env(safe-area-inset-top) + 16px) 16px 20px"><div class="big-msg center">'+T('Round complete','Volta completa')+'</div><div class="lbl center">'+esc(v.course||'')+'</div>'+
  rows.map((r,i)=>'<div class="shot"><b>'+(i+1)+'. '+esc(r.p.name)+'</b><span><b>'+r.t+'</b> ('+fmtTo(r.d)+')</span></div>').join('')+
  '<div class="sub center" style="margin:10px 0">'+(rows.length>1&&rows[1].t===w.t?T('It is a tie.','Empate.'):'🏆 '+esc(w.p.name)+' '+T('wins','ganha'))+'</div>'+
  m.players.map(p=>'<div class="sub" style="font-size:12px;margin-top:6px"><b>'+esc(p.name)+'</b>: '+p.holes.map(h=>h.strokes).join(' · ')+'</div>').join('')+gmChalNote()+
  '<button class="cta" style="margin-top:14px" data-hm="done">'+T('Done','Feito')+'</button></div>';
}
const _hmScoreG=hmScore;
hmScore=function(v){
  if(v.tp)return tpSummary(v);
  if(GM.mp&&v.fin)return mpBoard(v);
  const h=_hmScoreG(v),n=gmChalNote();
  return n?h.replace('<button class="cta"',n+'<button class="cta"'):h;
};
const _hmHTMLG=hmHTML;
hmHTML=function(){
  let h=_hmHTMLG();
  if(HM.view==='cal'&&GM.calFor!=null){const f=gmFriends()[GM.calFor];if(f)h='<div class="aim" style="background:#eef2ff;color:#3730a3;margin-top:0">'+esc(f.name)+': '+T('your turn to calibrate. Your own full swing becomes your 100%.','a tua vez de calibrar. O teu swing completo passa a ser o teu 100%.')+'</div>'+h;}
  return h;
};
GM.hk.deco.push((v,top)=>{
  const m=GM.mp;
  if(m){
    top.insertAdjacentHTML('beforeend','<div style="display:flex;gap:12px;font-size:12px;margin-top:6px;flex-wrap:wrap">'+m.players.map((p,i)=>'<span style="opacity:'+(i===m.cur?1:.6)+';font-weight:'+(i===m.cur?800:600)+'">'+(i===m.cur?'▶ ':'')+esc(p.name)+' '+(p.holes.length?fmtTo(mpTot(p)-mpPar(p)):'–')+'</span>').join('')+'</div>');
  }
  if(v.tp){
    top.innerHTML=top.innerHTML.replace(tr('Hole {0} of {1} · par {2}',v.i+1,v.holes.length,v.h.par),T('Target '+(v.i+1)+' of '+v.holes.length,'Alvo '+(v.i+1)+' de '+v.holes.length));
    const h=document.getElementById('hmact'),r=v.tpRes;
    if(v.res&&r&&PL.on&&h)h.innerHTML='<div class="big-msg" style="margin:2px 0">'+(r.prox*U()).toFixed(1)+' '+ul()+' '+T('from the pin','do alvo')+'</div><div class="sub" style="font-size:13px">'+r.pts+' '+T('points','pontos')+'</div><button class="cta" style="margin-top:8px;padding:13px" data-act="vhnext">'+(v.i>=v.holes.length-1?T('Finish','Terminar'):T('Next target ›','Próximo alvo ›'))+'</button>'+(v.prev?'<div class="center"><button class="link" data-act="vhundo">'+tr('Undo last shot')+'</button></div>':'');
  }
});

/* ---------- my holes: build by hand or capture from the map ---------- */
function gmRegHoles(){(S.myHoles||[]).forEach(o=>{if(!LIB.some(x=>x.id===o.id))LIB.push(mkHole(JSON.parse(JSON.stringify(o))));});}
gmRegHoles();
function gmBuildHole(name,len,hz,fw){
  const par=vhPar(len),o={id:'my'+Date.now().toString(36)+Math.floor(Math.random()*99),name:name,par:par,len:len,lvl:9,path:par===3?[[0,Math.max(10,len-70),11],[0,len-8,11]]:[[0,0,fw||17],[0,len-12,fw||17]],pin:{x:0,y:len},green:{x:0,y:len,rx:12,ry:12},water:[],bunk:[]};
  hz.forEach(h=>{const s=h.poly?{poly:h.poly}:{x:h.x,y:h.y,rx:h.rx,ry:h.ry};(h.type==='water'?o.water:o.bunk).push(s);});
  S.myHoles=S.myHoles||[];S.myHoles.push(o);save();gmRegHoles();return o;
}
function gmCapture(){
  if(!R.me||!R.pin)return null;
  const brg=bearing(R.me,R.pin),len=dist(R.me,R.pin),sb=Math.sin(brg*rad),cb=Math.cos(brg*rad),kx=111320*Math.cos(R.me.lat*rad);
  const loc=p=>{const E=(p.lng-R.me.lng)*kx,N=(p.lat-R.me.lat)*111320;return[+(E*cb-N*sb).toFixed(1),+(E*sb+N*cb).toFixed(1)];};
  return{len:len,haz:R.hzs.map(h=>hzPts(h).map(loc))};
}
GM.cap=GM.cap||{name:'',types:{}};
GM.hb=GM.hb||{name:'',len:'',haz:[]};
GM.hz=GM.hz||{type:'bunker',d:'',side:'c',off:'',r:''};
function gmPlayHoles(ids,src){
  const hs=ids.map(id=>LIB.find(o=>o.id===id)).filter(Boolean).map(o=>Object.assign({},o));if(!hs.length)return;
  if(src==='home'&&!gmCal()){GM.msg=T('Calibrate first (Play, Home).','Calibra primeiro (Jogar, Casa).');openPanel('play');return;}
  if(src==='home'){if(!mpPrepare()){openPanel('play');return;}}else GM.mp=null;
  gmLaunch(gmNewV(hs,hs.length>1?T('My holes','Os meus buracos'):undefined),src);
}
function mineHTML(){
  const hs=S.myHoles||[],u=ul(),cap=gmCapture();
  let h='<div class="hint" style="margin-top:0">'+T('Your own holes with the real bunkers and water. Capture one from the map while you are on the course, or build it by hand.','Os teus buracos com os bunkers e a água reais. Captura do mapa quando estás no campo, ou cria à mão.')+'</div>';
  if(hs.length){
    h+=hs.map(o=>'<div class="pick" style="display:block"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span><b>'+esc(o.name)+'</b><br><small>par '+o.par+' · '+d1(o.len)+' '+u+' · '+o.bunk.length+' '+T('bunkers','bunkers')+' · '+o.water.length+' '+T('water','água')+'</small></span></div><div class="row" style="margin-top:8px"><button class="sec" data-gm="myplay" data-id="'+o.id+'">'+T('Play','Jogar')+'</button><button class="sec" data-gm="mydel" data-id="'+o.id+'">'+(GM.armDel===o.id?T('Tap again to delete','Toca outra vez para apagar'):T('Delete','Apagar'))+'</button></div></div>').join('');
    if(hs.length>1)h+='<button class="cta" style="margin:6px 0 14px" data-gm="myall">'+T('Play all my holes','Jogar todos os meus buracos')+'</button>';
  }
  h+='<div class="lbl" style="margin:14px 0 8px">'+T('Capture from the map','Capturar do mapa')+'</div>';
  if(!cap)h+='<div class="sub">'+T('Open the Caddy tab on the course, set your position and the pin, mark the hazards, then come back here.','Abre o separador Caddy no campo, define a tua posição e o pin, marca os perigos e volta aqui.')+'</div>';
  else{
    h+='<div class="pick" style="display:block"><div class="sub" style="margin-bottom:6px">'+T('Tee to pin','Tee ao pin')+': <b>'+d1(cap.len)+' '+u+'</b> · par '+vhPar(cap.len)+' · '+cap.haz.length+' '+T('hazards marked','perigos marcados')+'</div>'+
    '<input type="text" data-gmin="capname" placeholder="'+T('Hole name','Nome do buraco')+'" value="'+esc(GM.cap.name)+'" style="margin-bottom:8px">'+
    cap.haz.map((p,i)=>{const ys=p.map(q=>q[1]),xs=p.map(q=>q[0]),ty=GM.cap.types[i]||'bunker';return '<div class="row" style="justify-content:space-between;flex-wrap:nowrap;margin-bottom:6px"><span style="font-size:13px">#'+(i+1)+' · '+d1(Math.min.apply(null,ys))+'–'+d1(Math.max.apply(null,ys))+' '+u+' · '+(Math.abs((Math.min.apply(null,xs)+Math.max.apply(null,xs))/2)<4?T('centre','centro'):((Math.min.apply(null,xs)+Math.max.apply(null,xs))/2<0?T('left','esq.'):T('right','dir.')))+'</span><span class="row" style="gap:4px;flex-wrap:nowrap">'+['bunker','water'].map(t=>'<button class="cond'+(ty===t?' pickon':'')+'" style="min-height:32px;font-size:12px;padding:0 8px" data-gm="captype" data-i="'+i+'" data-v="'+t+'">'+(t==='bunker'?'Bunker':T('Water','Água'))+'</button>').join('')+'</span></div>';}).join('')+
    '<button class="cta" data-gm="capsave">'+T('Save this hole','Guardar este buraco')+'</button></div>';
  }
  const B=GM.hb,Z=GM.hz;
  h+='<div class="lbl" style="margin:14px 0 8px">'+T('Build by hand','Criar à mão')+'</div><div class="pick" style="display:block">'+
  '<input type="text" data-gmin="hbname" placeholder="'+T('Hole name','Nome do buraco')+'" value="'+esc(B.name)+'" style="margin-bottom:8px"><input type="text" inputmode="numeric" data-gmin="hblen" placeholder="'+T('Length ('+u+')','Comprimento ('+u+')')+'" value="'+esc(B.len)+'" style="margin-bottom:8px">'+
  (B.haz.length?B.haz.map((z,i)=>'<div class="row" style="justify-content:space-between;flex-wrap:nowrap;font-size:13px;margin-bottom:4px"><span>'+(z.type==='water'?'💧':'🏖️')+' '+d1(z.y)+' '+u+' · '+(Math.abs(z.x)<1?T('centre','centro'):(z.x<0?T('left','esq.'):T('right','dir.'))+' '+d1(Math.abs(z.x)))+' · r '+d1(z.rx)+'</span><button class="x" data-gm="hbdel" data-i="'+i+'">✕</button></div>').join(''):'')+
  '<div class="row" style="gap:6px;margin:6px 0">'+['bunker','water'].map(t=>'<button class="cond'+(Z.type===t?' pickon':'')+'" style="min-height:32px;font-size:12px;padding:0 8px" data-gm="hbtype" data-v="'+t+'">'+(t==='bunker'?'Bunker':T('Water','Água'))+'</button>').join('')+['l','c','r'].map(t=>'<button class="cond'+(Z.side===t?' pickon':'')+'" style="min-height:32px;font-size:12px;padding:0 8px" data-gm="hbside" data-v="'+t+'">'+(t==='l'?T('Left','Esq.'):t==='c'?T('Centre','Centro'):T('Right','Dir.'))+'</button>').join('')+'</div>'+
  '<div class="row" style="gap:6px;flex-wrap:nowrap"><input type="text" inputmode="numeric" data-gmin="hzd" placeholder="'+T('From tee','Do tee')+'" value="'+esc(Z.d)+'"><input type="text" inputmode="numeric" data-gmin="hzoff" placeholder="'+T('Off line','Desvio')+'" value="'+esc(Z.off)+'"><input type="text" inputmode="numeric" data-gmin="hzr" placeholder="'+T('Size','Tamanho')+'" value="'+esc(Z.r)+'"></div>'+
  '<div class="row" style="margin-top:8px"><button class="sec" data-gm="hbadd">+ '+T('Add hazard','Adicionar perigo')+'</button><button class="cta" style="flex:1" data-gm="hbsave">'+T('Save hole','Guardar buraco')+'</button></div></div>';
  return h;
}

/* ---------- challenges and streaks ---------- */
const gmDay=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
function gmStreak(){
  const s=new Set();[S.shots,S.grounds,S.tps].forEach(a=>(a||[]).forEach(x=>{if(x&&x.t)s.add(gmDay(x.t));}));
  let cur=0;const d=new Date();if(!s.has(gmDay(d)))d.setDate(d.getDate()-1);
  while(s.has(gmDay(d))){cur++;d.setDate(d.getDate()-1);}
  let best=0,run=0,prev=null;Array.from(s).sort().forEach(k=>{const t=new Date(k+'T12:00:00').getTime();run=(prev!=null&&Math.round((t-prev)/864e5)===1)?run+1:1;prev=t;if(run>best)best=run;});
  return{cur:cur,best:best,today:s.has(gmDay(new Date()))};
}
function gmChals(){
  const wk=Date.now()-7*864e5,all=S.grounds||[],gr=all.filter(r=>r.t>=wk),tp=(S.tps||[]).filter(r=>r.t>=wk);
  let bestRun=0,clean=0;
  gr.forEach(r=>{let run=0;r.holes.forEach(h=>{const st=h.st||{};if(st.gir){run++;if(run>bestRun)bestRun=run;}else run=0;if(st.pen===0&&st.putts!=null&&h.strokes<=h.par)clean++;});});
  const holes=gr.reduce((a,r)=>a+r.holes.length,0),tpn=tp.reduce((a,r)=>a+r.n,0),acc=tp.reduce((m,r)=>Math.max(m,r.n?Math.round(r.h10/r.n*100):0),0);
  let beat=0;const r0=all[0],r1=r0&&all.slice(1).find(r=>r.holes.length===r0.holes.length&&r.holes.length>=3);
  if(r0&&r1&&r0.t>=wk){const sc=r=>r.holes.reduce((x,h)=>x+h.strokes-h.par,0);beat=sc(r0)<sc(r1)?1:0;}
  return[
   {id:'holes',en:'Play 9 holes this week',pt:'Joga 9 buracos esta semana',cur:Math.min(9,holes),goal:9},
   {id:'tp',en:'Hit 10 target practice shots',pt:'Faz 10 tacadas de treino de alvos',cur:Math.min(10,tpn),goal:10},
   {id:'gir',en:'Hit 3 greens in a row',pt:'Acerta 3 greens seguidos',cur:Math.min(3,bestRun),goal:3},
   {id:'clean',en:'3 holes at par or better with no penalty',pt:'3 buracos em par ou melhor sem penalizações',cur:Math.min(3,clean),goal:3},
   {id:'acc',en:'Land 6 of 10 targets within 10% of the distance',pt:'Acerta 6 de 10 alvos a menos de 10% da distância',cur:Math.min(60,acc),goal:60,pct:1},
   {id:'beat',en:'Beat your previous round',pt:'Bate a tua volta anterior',cur:beat,goal:1}
  ].map(c=>Object.assign(c,{done:c.cur>=c.goal}));
}
function gmChalCheck(){
  const wk=Math.floor(Date.now()/(7*864e5)),done=S.chalDone=S.chalDone||{},out=[];
  gmChals().forEach(c=>{const k=c.id+'|'+wk;if(c.done&&!done[k]){done[k]=Date.now();out.push(c);}});
  Object.keys(done).forEach(k=>{if(+k.split('|')[1]<wk-8)delete done[k];});
  if(out.length)save();return out;
}
function gmChalAnnounce(){
  const o=gmChalCheck();if(!o.length)return;GM.newCh=(GM.newCh||[]).concat(o);
  try{swSay(T('Challenge complete: '+o.map(c=>c.en).join(', ')+'.','Desafio cumprido: '+o.map(c=>c.pt).join(', ')+'.'));}catch(e){}
}
function gmChalNote(){const o=GM.newCh||[];GM.newCh=[];return o.length?'<div class="hint" style="background:#fef9c3;border-color:#fde047;color:#713f12;margin-top:10px">🏆 '+o.map(c=>esc(T(c.en,c.pt))).join('<br>🏆 ')+'</div>':'';}
GM.hk.roundEnd=function(){gmChalAnnounce();if(PL.on&&R.vh&&R.vh.fin)hmDraw();};
function goalsHTML(){
  const s=gmStreak(),ch=gmChals(),wk=Math.floor(Date.now()/(7*864e5));
  let h='<div class="pick" style="display:block;text-align:center"><div style="font-size:34px;font-weight:800">🔥 '+s.cur+'</div><div class="sub">'+T('day streak','dias seguidos')+' · '+T('best','melhor')+' '+s.best+(s.today?'':' · '+T('play or practise today to keep it','joga ou treina hoje para a manter'))+'</div></div>'+
  '<div class="lbl" style="margin:14px 0 8px">'+T('This week','Esta semana')+'</div>';
  h+=ch.map(c=>{const p=Math.round(Math.min(1,c.cur/c.goal)*100),dn=c.done||(S.chalDone||{})[c.id+'|'+wk];
    return '<div class="pick" style="display:block"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><b style="font-size:14px">'+(dn?'🏆 ':'')+esc(T(c.en,c.pt))+'</b><span style="font-size:13px;color:var(--mut)">'+c.cur+(c.pct?'%':'')+' / '+c.goal+(c.pct?'%':'')+'</span></div><div style="height:8px;border-radius:4px;background:var(--line);margin-top:8px"><div style="height:8px;border-radius:4px;background:'+(dn?'#16a34a':'#4ade80')+';width:'+p+'%"></div></div></div>';}).join('');
  return h+'<div class="sub" style="margin:10px 0;font-size:12px">'+T('Goals use your last 7 days of rounds and target practice. Wins show up here and are announced when you finish.','As metas usam os teus últimos 7 dias de voltas e treino de alvos. As vitórias aparecem aqui e são anunciadas no fim.')+'</div>';
}

/* ---------- Play tab ---------- */
function gmSrcSeg(){return '<div class="seg" style="margin-bottom:12px">'+[['range',T('At the range (real ball)','No range (bola real)')],['home',T('At home (camera)','Em casa (câmara)')]].map(x=>'<button class="'+(PL.src===x[0]?'on':'')+'" data-pl="src" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';}
function gmResumeCard(){
  const j=gmSaved();if(!j||R.vh)return '';const v=j.vh;
  return '<div class="pick" style="display:block;background:#effaf2;border-color:#86efac"><b>'+T('Game in progress','Jogo em curso')+'</b><div class="sub" style="margin:4px 0 8px">'+esc(v.course||String((v.holes[v.i]||{}).name||'').split(' · ')[0])+' · '+T('hole','buraco')+' '+(v.i+1)+'/'+v.holes.length+' · '+(v.src==='home'?'🏠':'⛳')+(j.mp?' · '+j.mp.players.length+' '+T('players','jogadores'):'')+'</div><div class="row"><button class="cta" style="flex:1" data-gm="resume">'+T('Resume','Continuar')+'</button><button class="sec" data-gm="discard">'+T('Discard','Descartar')+'</button></div></div>';
}
function mpCard(){
  const fr=gmFriends();
  return '<div class="lbl" style="margin:14px 0 8px">'+T('Play with friends (pass the phone)','Jogar com amigos (passar o telemóvel)')+'</div><div class="pick" style="display:block"><div class="sub" style="margin-bottom:8px;font-size:12px">'+T('Each friend calibrates once with their own full swing, so 100% always means their own swing. They play each hole after you.','Cada amigo calibra uma vez com o seu swing completo, por isso 100% é sempre o swing de cada um. Jogam cada buraco depois de ti.')+'</div>'+
  fr.map((f,i)=>'<div class="row" style="flex-wrap:nowrap;margin-bottom:6px;gap:6px"><input type="text" data-gmin="fr" data-i="'+i+'" value="'+esc(f.name)+'" placeholder="'+T('Name','Nome')+'">'+((S.gmCal||{})[f.id]?'<span style="font-size:12px;color:#166534;white-space:nowrap">✓ '+T('ready','pronto')+'</span><button class="x" data-gm="gcal" data-i="'+i+'" title="recalibrate">↻</button>':'<button class="sec" style="white-space:nowrap" data-gm="gcal" data-i="'+i+'">'+T('Calibrate','Calibrar')+'</button>')+'<button class="x" data-gm="fdel" data-i="'+i+'">✕</button></div>').join('')+
  (fr.length<3?'<button class="sec" data-gm="fadd">+ '+T('Add friend','Adicionar amigo')+'</button>':'')+'</div>';
}
const _playHTMLG=playHTML;
playHTML=function(){
  const sub=PL.sub||'play',st=gmStreak();
  const nav='<div class="seg" style="margin-bottom:12px">'+[['play',T('Play','Jogar')],['target',T('Target','Alvos')],['mine',T('My holes','Meus')],['goals',(st.cur>=2?'🔥'+st.cur+' ':'')+T('Goals','Metas')]].map(x=>'<button class="'+(sub===x[0]?'on':'')+'" data-gm="sub" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
  let h=gmResumeCard()+(GM.msg?'<div class="aim" style="background:#fff7e6;color:var(--warn)">'+esc(GM.msg)+'</div>':'')+nav;GM.msg='';
  if(sub==='play'){
    let b=_playHTMLG();
    if(PL.src==='home'&&HM.view==='setup'&&gmCal()){const k='<div class="lbl" style="margin:14px 0 8px">',i=b.indexOf(k);const card=mpCard();b=i>0?b.slice(0,i)+card+b.slice(i):b+card;}
    b+='<div class="lbl" style="margin:14px 0 8px">'+T('Game options','Opções do jogo')+'</div><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span style="font-size:14px">💨 '+T('Wind and slope in the game','Vento e declive no jogo')+'</span><span class="row" style="gap:4px;flex-wrap:nowrap">'+[[1,T('On','Ligado')],[0,T('Off','Desligado')]].map(x=>'<button class="cond'+((S.gmWind!==false)===!!x[0]?' pickon':'')+'" style="min-height:32px;font-size:12px;padding:0 10px" data-gm="wind" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</span></div>';
    return h+b;
  }
  h+=gmSrcSeg();
  if(sub==='target'){
    const best=(S.tps||[]).reduce((m,r)=>Math.max(m,r.pts),0),last=(S.tps||[])[0];
    h+='<div class="hint" style="margin-top:0">'+T('10 targets at different distances. The caddy picks the club and the swing percent, you hit, and you score points for how close you land. 100 points = on the pin, 0 = 10% of the distance away or worse.','10 alvos a distâncias diferentes. O caddy escolhe o taco e a percentagem, tu bates, e ganhas pontos pela proximidade. 100 pontos = no pin, 0 = a 10% da distância ou pior.')+'</div>'+
    (last?'<div class="sub" style="margin-bottom:10px">'+T('Last','Último')+': <b>'+last.pts+'</b> '+T('points','pontos')+' · '+T('best','melhor')+' <b>'+best+'</b></div>':'')+
    (PL.src==='home'&&!gmCal()?'<div class="aim" style="background:#fff7e6;color:var(--warn)">'+T('Calibrate your swing first (Play, At home).','Calibra o teu swing primeiro (Jogar, Em casa).')+'</div>':'')+
    '<button class="cta" data-gm="tpstart">'+T('Start target practice','Começar treino de alvos')+'</button>';
  }
  else if(sub==='mine')h+=mineHTML();
  else h+=goalsHTML();
  return h;
};

document.addEventListener('input',e=>{
  const t=e.target;if(!t||!t.dataset||t.dataset.gmin==null)return;const k=t.dataset.gmin,v=t.value;
  if(k==='fr'){const f=gmFriends()[+t.dataset.i];if(f){f.name=v;save();}}
  else if(k==='capname')GM.cap.name=v;
  else if(k==='hbname')GM.hb.name=v;else if(k==='hblen')GM.hb.len=v;
  else if(k==='hzd')GM.hz.d=v;else if(k==='hzoff')GM.hz.off=v;else if(k==='hzr')GM.hz.r=v;
});
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-gm]');if(!b)return;const a=b.dataset.gm,v=b.dataset.v,i=+b.dataset.i,re=()=>openPanel('play');
  if(a==='sub'){PL.sub=v;re();}
  else if(a==='wind'){S.gmWind=v==='1';save();re();}
  else if(a==='tpstart'){tpStart(PL.src);}
  else if(a==='tp-again'){tpStart(R.vh&&R.vh.src||PL.src);}
  else if(a==='fadd'){gmFriends().push({id:'f'+Date.now().toString(36),name:''});save();re();}
  else if(a==='fdel'){const f=gmFriends()[i];if(f){if(S.gmCal)delete S.gmCal[f.id];gmFriends().splice(i,1);save();}re();}
  else if(a==='gcal'){const f=gmFriends()[i];if(!f||!String(f.name).trim()){GM.msg=T('Type the name first.','Escreve primeiro o nome.');re();return;}if(!gmCal()){GM.msg=T('Calibrate yourself first.','Calibra-te primeiro a ti.');re();return;}GM.calFor=i;GM.calName=f.id;HM.view='cal';HM.cal=[];swingStop();SWV.home=true;dlRender();}
  else if(a==='myplay'){gmPlayHoles([b.dataset.id],PL.src);}
  else if(a==='myall'){gmPlayHoles((S.myHoles||[]).map(o=>o.id),PL.src);}
  else if(a==='mydel'){if(GM.armDel!==b.dataset.id){GM.armDel=b.dataset.id;re();return;}GM.armDel=null;S.myHoles=(S.myHoles||[]).filter(o=>o.id!==b.dataset.id);const k=LIB.findIndex(o=>o.id===b.dataset.id);if(k>=0)LIB.splice(k,1);save();re();}
  else if(a==='captype'){GM.cap.types[i]=v;re();}
  else if(a==='capsave'){
    const c=gmCapture();if(!c)return;const nm=String(GM.cap.name).trim()||(T('My hole ','Meu buraco ')+((S.myHoles||[]).length+1));
    gmBuildHole(nm,Math.round(c.len),c.haz.map((p,k)=>({type:GM.cap.types[k]||'bunker',poly:p})));GM.cap={name:'',types:{}};re();
  }
  else if(a==='hbtype'){GM.hz.type=v;re();}
  else if(a==='hbside'){GM.hz.side=v;re();}
  else if(a==='hbdel'){GM.hb.haz.splice(i,1);re();}
  else if(a==='hbadd'){
    const Z=GM.hz,d=toM(parseFloat(Z.d)),off=toM(parseFloat(Z.off)||0),r0=toM(parseFloat(Z.r));
    if(!(d>10)){GM.msg=T('Enter the distance from the tee.','Indica a distância ao tee.');re();return;}
    const r=r0>0?r0:(Z.type==='water'?12:6);
    GM.hb.haz.push({type:Z.type,x:Z.side==='l'?-off:Z.side==='r'?off:0,y:d,rx:r,ry:r*0.8});GM.hz.d='';GM.hz.off='';GM.hz.r='';re();
  }
  else if(a==='hbsave'){
    const len=toM(parseFloat(GM.hb.len));
    if(!(len>=60)||!String(GM.hb.name).trim()){GM.msg=T('Give the hole a name and a length of at least 60.','Dá um nome ao buraco e um comprimento de pelo menos 60.');re();return;}
    gmBuildHole(String(GM.hb.name).trim(),Math.round(len),GM.hb.haz.filter(z=>z.y<len+30));GM.hb={name:'',len:'',haz:[]};re();
  }
});

/* ---------- Data tab: rounds, target practice, friends, swing and direction ---------- */
function gmDataSeg(){return '<div class="seg" style="margin-bottom:12px">'+[['report',T('Report','Relatório')],['cmp',T('Compare','Comparar')],['shots',T('Shots','Tacadas')],['sess',T('Swings','Swings')],['rounds',T('Rounds','Voltas')]].map(x=>'<button class="'+(DT.sec===x[0]?'on':'')+'" data-pl="sec" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';}
const gmBox=(t,b)=>'<div class="hint" style="background:#fff;border:1.5px solid var(--line);color:var(--ink)"><b>'+t+'</b>'+b+'</div>';
function gmRoundsHTML(){
  const g=S.grounds||[],u=ul(),tps=S.tps||[];let h='';
  if(!g.length&&!tps.length)return '<div class="sub">'+T('No rounds yet. Finish a course or a few holes in Play and they are saved here, with fairways, greens and putts.','Ainda sem voltas. Termina um campo ou alguns buracos em Jogar e ficam aqui, com fairways, greens e putts.')+'</div>';
  const hs=[].concat.apply([],g.map(r=>r.holes)),pct=(f,k)=>{const a=hs.filter(x=>x.st&&x.st[k]!=null);return a.length?Math.round(a.filter(x=>f(x.st)).length/a.length*100)+'%':'–';};
  if(g.length){
    const pu=hs.filter(x=>x.st&&x.st.putts!=null),pn=hs.reduce((a,x)=>a+(x.st?x.st.pen||0:0),0);
    const cell=(l,v)=>'<div style="text-align:center;flex:1"><div style="font-size:20px;font-weight:800">'+v+'</div><div style="font-size:11px;color:var(--mut)">'+l+'</div></div>';
    h+=gmBox(T('Your numbers','Os teus números')+' · '+hs.length+' '+T('holes','buracos'),'<div class="row" style="margin-top:8px;flex-wrap:nowrap">'+cell(T('Greens','Greens'),pct(s=>s.gir,'gir'))+cell('Fairways',pct(s=>s.fw,'fw'))+cell(T('Putts/hole','Putts/buraco'),pu.length?(pu.reduce((a,x)=>a+x.st.putts,0)/pu.length).toFixed(1):'–')+cell(T('Penalties','Penalizações'),(pn/g.length).toFixed(1)+'/'+T('round','volta'))+'</div>');
    const by={};g.forEach(r=>r.holes.forEach(x=>{if(!x.name)return;const o=by[x.name]=by[x.name]||{n:0,d:0};o.n++;o.d+=x.strokes-x.par;}));
    const hl=Object.keys(by).filter(k=>by[k].n>=2).map(k=>({k:k,n:by[k].n,a:by[k].d/by[k].n})).sort((a,b)=>b.a-a.a);
    if(hl.length)h+=gmBox(T('Hardest and best holes','Buracos mais difíceis e melhores'),hl.slice(0,3).concat(hl.length>4?hl.slice(-2):[]).map(o=>'<div style="margin-top:6px;font-size:14px">'+esc(o.k)+': <b>'+(o.a>0?'+':'')+o.a.toFixed(1)+'</b> <small style="color:var(--mut)">('+o.n+'×)</small></div>').join(''));
    h+='<div class="lbl" style="margin:12px 0 8px">'+T('Rounds','Voltas')+'</div>'+g.slice(0,15).map(r=>{
      const tot=r.holes.reduce((a,x)=>a+x.strokes,0),par=r.holes.reduce((a,x)=>a+x.par,0),d=new Date(r.t);
      return '<details class="hint" style="background:#fff;border:1.5px solid var(--line);color:var(--ink)"><summary style="font-weight:700">'+d.toLocaleDateString(undefined,{day:'numeric',month:'short'})+' · '+esc(r.course)+' '+(r.src==='home'?'🏠':'⛳')+' — '+tot+' ('+fmtTo(tot-par)+')</summary>'+
      (r.mp?'<div class="sub" style="margin:6px 0">'+r.mp.map(p=>esc(p.name)+' '+p.tot+' ('+fmtTo(p.tot-p.par)+')').join(' · ')+'</div>':'')+
      '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px"><tr style="font-size:11px;font-weight:800;color:var(--mut)"><td>#</td><td>Par</td><td>'+T('Score','Score')+'</td><td>GIR</td><td>FW</td><td>Putts</td></tr>'+
      r.holes.map((x,i)=>'<tr style="border-top:1px solid var(--line)"><td>'+(i+1)+'</td><td>'+x.par+'</td><td><b>'+x.strokes+'</b></td><td>'+(x.st&&x.st.gir!=null?(x.st.gir?'✓':'–'):'')+'</td><td>'+(x.st&&x.st.fw!=null?(x.st.fw?'✓':'–'):'')+'</td><td>'+(x.st&&x.st.putts!=null?x.st.putts:'')+'</td></tr>').join('')+'</table></details>';}).join('');
  }
  if(tps.length){
    h+='<div class="lbl" style="margin:12px 0 8px">'+T('Target practice','Treino de alvos')+'</div>'+gmBox(T('Best','Melhor')+': '+Math.max.apply(null,tps.map(r=>r.pts))+' '+T('points','pontos'),tps.slice(0,8).map(r=>'<div class="shot" style="font-size:14px"><span>'+new Date(r.t).toLocaleDateString(undefined,{day:'numeric',month:'short'})+' '+(r.src==='home'?'🏠':'⛳')+'</span><span><b>'+r.pts+'</b> · '+(r.avg*U()).toFixed(1)+' '+u+' · '+r.h10+'/'+r.n+'</span></div>').join(''));
  }
  const bd=S.gmBoard?Object.keys(S.gmBoard).map(k=>S.gmBoard[k]):[];
  if(bd.length>1)h+='<div class="lbl" style="margin:12px 0 8px">'+T('Friends','Amigos')+'</div>'+gmBox(T('Home games','Jogos em casa'),bd.sort((a,b)=>b.w-a.w).map(b=>'<div class="shot" style="font-size:14px"><span><b>'+esc(b.name)+'</b></span><span>'+b.w+' / '+b.g+' '+T('wins','vitórias')+' · '+T('avg','média')+' '+(b.d/Math.max(1,b.g)>0?'+':'')+(b.d/Math.max(1,b.g)).toFixed(1)+'</span></div>').join(''));
  return h;
}
function gmDirBlock(){
  const hs=(S.shots||[]).filter(s=>s.src==='home'&&s.lat!=null).slice(-60);if(hs.length<8)return '';
  const LAB={tempo:T('rushed transition','transição apressada'),hipImp:T('weight shift to the target','peso para o alvo'),finrot:T('finish rotation','rotação no final'),reach:T('hands away from the body','mãos afastadas do corpo')};
  const by={};hs.forEach(s=>{if(s.wk){const o=by[s.wk]=by[s.wk]||{n:0,l:0};o.n++;o.l+=s.lat;}});
  const ks=Object.keys(by).sort((a,b)=>by[b].n-by[a].n).slice(0,3);
  const left=hs.filter(s=>s.lat<=-3).length,right=hs.filter(s=>s.lat>=3).length;
  return gmBox(T('Swing and direction (home shots)','Swing e direção (tacadas em casa)'),'<div class="sub" style="margin-top:6px;font-size:13px">'+T('The camera cannot see the clubface, so it reads your body: weight shift, tempo, rotation, hands. Last '+hs.length+' shots: '+left+' missed left, '+right+' right.','A câmara não vê a face do taco, por isso lê o corpo: peso, ritmo, rotação, mãos. Últimas '+hs.length+' tacadas: '+left+' à esquerda, '+right+' à direita.')+'</div>'+
    (ks.length?ks.map(k=>'<div style="margin-top:6px;font-size:14px">• '+esc(LAB[k]||k)+': '+by[k].n+'× '+T('(average miss ','(desvio médio ')+(by[k].l/by[k].n<0?'◀ ':'')+d1(Math.abs(by[k].l/by[k].n))+' '+ul()+(by[k].l/by[k].n>0?' ▶':'')+')</div>').join(''):'<div class="sub" style="margin-top:6px;font-size:13px">'+T('No clear swing cause yet.','Ainda sem causa clara no swing.')+'</div>'));
}
const _dataHTMLG=dataHTML;
dataHTML=function(){
  if(DT.sec==='rounds')return gmDataSeg()+gmRoundsHTML();
  let h=_dataHTMLG();
  h=h.replace('</div>','<button class="'+(DT.sec==='rounds'?'on':'')+'" data-pl="sec" data-v="rounds">'+T('Rounds','Voltas')+'</button></div>');
  if(!DT.sec||DT.sec==='report')h+=gmDirBlock();
  return h;
};
