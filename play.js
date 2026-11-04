"use strict";
/* ============ New layout: Caddy · Play · Swing · Data · More ============
   - Play: courses and holes, always full screen (real ball at the range, or camera at home)
   - Data: every shot kept, reports, comparisons, swing sessions
   - Caddy learns from range shots (full weight) and home shots (a third of the weight, spread only) */
const PL={on:false,src:S.plsrc==='home'?'home':'range',key:null,fromHome:false};
const DT={sec:'report',club:null};

/* ---------- unified shot log ---------- */
function shotAdd(o){S.shots=S.shots||[];S.shots.push(o);if(S.shots.length>1000)S.shots=S.shots.slice(-1000);save();}
if(!S.shotsMig){S.shots=(S.rlog||[]).filter(s=>s.d!=null).map(s=>({t:s.t,src:'range',club:s.club,carry:s.d,plan:s.plan,lat:s.lat,fl:s.fl||'n'}));S.shotsMig=1;try{save();}catch(e){}}
const _vhhitPL=RACT.vhhit;
RACT.vhhit=function(b,v){
  const cl=S.clubs.find(x=>x.id===S.rsel),vv=R.vh;let pre=null;
  if(!PL.fromHome&&vv&&cl&&!vv.res){const fac=rbFac(cl);pre={t:Date.now(),src:'range',club:cl.id,carry:rbReal(cl,R.rd),plan:R.rdPlan,lat:(R.rlat||0)/fac,fl:R.rfl||'n'};}
  _vhhitPL.apply(this,arguments);
  if(pre){shotAdd(pre);plLearn();}
};
const _hmApplyPL=hmApply;
hmApply=function(cl,carry,lat,fl){
  let plan=null;try{plan=hmPlan().plan;}catch(e){}
  const r=SWV.lastRes,o={t:Date.now(),src:'home',club:cl.id,carry:carry,plan:plan,lat:lat,fl:fl};
  if(r&&r.ok){o.sc=r.score;o.tempo=+r.tempo.toFixed(1);o.m={};r.M.forEach(m=>{o.m[m.key]=[m.val,m.st];});}
  PL.fromHome=true;try{_hmApplyPL(cl,carry,lat,fl);}finally{PL.fromHome=false;}
  shotAdd(o);
};
/* home shots add a third of their weight to the caddy's spread (they cannot teach it real distance) */
const _rngMissPL=rngMiss;
rngMiss=function(id){
  const base=_rngMissPL(id),hs=(S.shots||[]).filter(s=>s.src==='home'&&s.club===id&&s.lat!=null).filter((s,i)=>i%3===0);
  return base.concat(hs.map(s=>({lat:s.lat,de:(s.fl&&s.fl!=='n')||!(s.plan>0)?null:s.carry-s.plan})));
};
/* real range carries move each club's distance gradually (your own setting counts as 3 shots) */
function plLearn(){
  if(S.autoLearn===false)return;
  S.clubs.forEach(c=>{
    if(c.lastAuto==null||Math.abs(c.carry-c.lastAuto)>0.01)c.base0=c.carry;
    const k=rlogCarry(c.id);
    if(k.n>=3){const n=Math.min(k.n,30);c.carry=(3*c.base0+n*k.avg)/(3+n);}
    c.lastAuto=c.carry;
  });
  save();
}

/* ---------- tabs ---------- */
dlSeg=function(){return '';};
function plHL(){const m={round:'round',play:'play',range:'play',swing:'swing',data:'data',more:'more',bag:'more',settings:'more'}[ptab]||'round';document.querySelectorAll('#ptabs button').forEach(b=>b.classList.toggle('on',b.dataset.p===m));}
const _opPL=openPanel;
openPanel=function(t){
  if(PL.on){hmDraw();return;}
  let tab=t||ptab;if(tab==='range')tab='play';if(tab==='more')tab=(ptab==='settings'?'settings':'bag');
  if(tab==='play'||tab==='data'){
    if(typeof swingStop==='function')swingStop();
    ptab=tab;$('#panel').hidden=false;resetArm=false;R.armFinish=false;R.armDel=null;
    $('#pbody').innerHTML=tab==='play'?playHTML():dataHTML();plHL();
    if(tab==='play'&&PL.src==='home')hmMount();
    return;
  }
  if(tab==='swing'){DL.mode='coach';SWV.home=false;}
  _opPL(tab);
  if(tab==='bag'||tab==='settings'){
    $('#pbody').insertAdjacentHTML('afterbegin','<div class="seg" style="margin-bottom:12px">'+[['bag',T('Bag','Saco')],['settings',T('Settings','Definições')]].map(x=>'<button class="'+(tab===x[0]?'on':'')+'" data-pl="more" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>');
  }
  plHL();
};
const _dlRPL=dlRender;
dlRender=function(){
  if(ptab==='play'){const p=$('#pbody');if(p){p.innerHTML=playHTML();if(PL.src==='home')hmMount();}return;}
  if(ptab==='data'){const p=$('#pbody');if(p){const st=p.scrollTop;p.innerHTML=dataHTML();p.scrollTop=st;}return;}
  _dlRPL();
};
(function(){
  const tb=document.getElementById('ptabs');
  tb.innerHTML=[['round','Caddy'],['play','Play'],['swing','Swing'],['data','Data'],['more','More']].map(x=>'<button data-p="'+x[0]+'"'+(x[0]==='round'?' class="on"':'')+'>'+x[1]+'</button>').join('');
  const lab=()=>{const n={round:['Caddy','Caddy'],play:['Play','Jogar'],swing:['Swing','Swing'],data:['Data','Dados'],more:['More','Mais']};document.querySelectorAll('#ptabs button').forEach(b=>{const x=n[b.dataset.p];if(x)b.textContent=x[S.lang==='pt'?1:0];});};
  const _as=applyStatic;applyStatic=function(){_as();lab();};lab();
})();

/* ---------- Play tab ---------- */
function plCourses(){
  const u=ul();
  return CRS.map(c=>{const n=c.pars.length,par=c.pars.reduce((a,b)=>a+b,0);
    const bt=(l,v)=>'<button class="sec" data-pl="course" data-id="'+c.id+'" data-v="'+v+'">'+l+'</button>';
    return '<div class="pick" style="display:block"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span><b>'+esc(c.name)+'</b><br><small>'+n+' · par '+par+' · '+d1(crsTot(c))+' '+u+'</small></span><span class="lv '+(c.lvl===1?'e':c.lvl===2?'m':'t')+'">'+tr(c.lvl===1?'Easy':c.lvl===2?'Medium':'Tough')+'</span></div><div class="row" style="margin-top:8px">'+(n>9?bt(tr('Play 18'),'all')+bt(tr('Front 9'),'f9')+bt(tr('Back 9'),'b9'):bt(tr('Play 9'),'all'))+'</div></div>';}).join('');
}
function playHTML(){
  const seg='<div class="seg" style="margin-bottom:12px">'+[['range',T('At the range (real ball)','No range (bola real)')],['home',T('At home (camera)','Em casa (câmara)')]].map(x=>'<button class="'+(PL.src===x[0]?'on':'')+'" data-pl="src" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
  if(PL.src==='home'){DL.mode='home';return seg+hmHTML();}
  return seg+'<div class="hint" style="margin-top:0">'+T('Hit real balls. After each shot enter the carry and the miss, and the hole moves your ball. The game opens full screen and every shot is saved in Data.','Bate bolas a sério. Depois de cada tacada indica o voo e o desvio, e o buraco move a tua bola. O jogo abre em ecrã inteiro e cada tacada fica guardada em Dados.')+'</div>'+
  (typeof rBallUI==='function'?rBallUI():'')+
  '<div class="lbl" style="margin:12px 0 8px">'+T('Quick hole','Buraco rápido')+'</div><div class="row">'+[[1,T('Easy','Fácil')],[2,T('Medium','Médio')],[3,T('Famous','Famoso')]].map(x=>'<button class="sec" data-pl="quick" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
  '<div class="lbl" style="margin:14px 0 8px">'+tr('Courses')+'</div>'+plCourses();
}
function plStart(kind,id,v){
  const keep=S.mpNames;S.mpNames=[];
  try{
    if(kind==='course')hmQuiet(()=>act('crsplay',{dataset:{id:id,v:v}}));
    else{R.vhSel=[id];R.vhText='';hmQuiet(()=>act('vhstart',{dataset:{}}));}
  }finally{S.mpNames=keep;}
  if(!R.vh)return;
  PL.on=true;PL.key=null;HM.key=null;HM.sel=null;HM.note='';HM.view='setup';HM.wait=false;
  hmClose();hmBuild();hmDraw();
}
function plEnd(){
  PL.on=false;R.vh=null;R.rd=null;R.rdClub=null;R.rlat=0;R.rfl='n';R.vhShot=null;R.vhKey=null;
  hmClose();openPanel('play');
}
document.addEventListener('click',e=>{
  if(!PL.on)return;const b=e.target.closest('[data-hm="done"],[data-hm="quit"]');if(!b)return;
  e.stopImmediatePropagation();e.preventDefault();plEnd();
},true);
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-pl]');if(!b)return;const a=b.dataset.pl,v=b.dataset.v;
  if(a==='src'){PL.src=v;S.plsrc=v;save();if(typeof swingStop==='function')swingStop();SWV.home=(v==='home');HM.view='setup';openPanel('play');}
  else if(a==='course'){if(PL.src==='home'){return;}plStart('course',b.dataset.id,v);}
  else if(a==='quick'){const ls=LIB.filter(o=>o.lvl===Number(v));if(ls.length)plStart('hole',ls[Math.floor(Math.random()*ls.length)].id);}
  else if(a==='more'){openPanel(v);}
  else if(a==='sec'){DT.sec=v;openPanel('data');}
  else if(a==='club'){DT.club=v;openPanel('data');}
  else if(a==='csv'){plCsv();}
});

/* full-screen range game: reuses the home overlay with a compact shot panel */
const _hmDrawPL=hmDraw;
hmDraw=function(){
  _hmDrawPL();
  if(!PL.on)return;
  const v=R.vh,ov=hmOv();if(!ov||!v||v.fin)return;
  ['swmsg','swbtns','swsess'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
  document.querySelectorAll('#hmov [data-hm="cam"],#hmov [data-hm="view"]').forEach(x=>x.style.display='none');
  const p=hmPlan(),cl=p.cl,u=ul(),h=document.getElementById('hmact');if(!h)return;
  S.rsel=cl.id;
  const ck=v.i+'|'+v.strokes+'|'+cl.id;
  if(PL.key!==ck){PL.key=ck;R.rdPlan=Math.round(p.plan);R.rd=Math.round(rbRaw(cl,R.rdPlan));R.rdClub=cl.id;R.rlat=0;R.rfl='n';}
  if(v.res){
    const d=v.strokes-v.h.par;
    h.innerHTML='<div class="big-msg" style="margin:2px 0;color:'+(d<0?'#15803d':d>0?'#b45309':'var(--ink)')+'">'+tr(vhName(v.strokes,v.h.par))+'</div><div class="sub" style="font-size:13px">'+tr('{0} strokes ({1})',v.strokes,fmtTo(d))+'</div><button class="cta" style="margin-top:8px;padding:13px" data-act="vhnext">'+tr(v.i>=v.holes.length-1?'Done':'Next hole ›')+'</button>'+(v.prev?'<div class="center"><button class="link" data-act="vhundo">'+tr('Undo last shot')+'</button></div>':'');
    return;
  }
  const lat=R.rlat||0,fl=R.rfl||'n';
  const latT=Math.abs(lat)<0.5?tr('On line'):d1(Math.abs(lat))+' '+u+' '+tr(lat<0?'left':'right');
  const sb=(a,val,l)=>'<button data-act="'+a+'" data-v="'+val+'" style="width:42px;height:42px;border-radius:50%;border:1.5px solid var(--line);background:#fff;font-weight:700">'+l+'</button>';
  h.innerHTML='<div style="font-weight:800;font-size:15px;margin-bottom:4px">'+tr('Caddy suggests {0}',esc(tc(cl.name)))+' <span style="font-weight:600;font-size:12px;color:var(--mut)">'+T('plan','plano')+' '+d1(R.rdPlan)+' '+u+'</span></div>'+
  '<div class="row" style="justify-content:space-between;flex-wrap:nowrap;gap:4px"><span class="lbl">'+tr('Carry distance')+'</span><span class="row" style="gap:4px;flex-wrap:nowrap">'+sb('rstep',-5,'−5')+sb('rstep',-1,'−')+'<b style="min-width:62px;text-align:center;font-size:18px">'+d1(R.rd)+'</b>'+sb('rstep',1,'+')+sb('rstep',5,'+5')+'</span></div>'+
  '<div class="row" style="justify-content:space-between;flex-wrap:nowrap;gap:4px;margin-top:4px"><span class="lbl">'+tr('Offline')+'</span><span class="row" style="gap:4px;flex-wrap:nowrap">'+sb('rlat',-5,'◀5')+sb('rlat',-1,'◀')+'<b style="min-width:62px;text-align:center;font-size:13px">'+latT+'</b>'+sb('rlat',1,'▶')+sb('rlat',5,'5▶')+'</span></div>'+
  '<div class="row" style="margin:6px 0;gap:6px">'+[['l','Low (stinger)'],['n','Normal'],['h','High (sky)']].map(m=>'<button class="cond'+(fl===m[0]?' pickon':'')+'" style="min-height:34px;font-size:12px;padding:0 10px" data-act="rfl" data-v="'+m[0]+'">'+tr(m[1])+'</button>').join('')+'</div>'+
  '<button class="cta" style="padding:13px;font-size:16px" data-act="vhhit">'+tr('Play this shot')+'</button>'+(v.prev?'<div class="center"><button class="link" data-act="vhundo" style="min-height:36px">'+tr('Undo last shot')+'</button></div>':'');
};

/* ---------- Data tab ---------- */
function dtName(id){const c=S.clubs.find(x=>x.id===id);return c?tc(c.name):'?';}
function dtStats(a){
  const n=a.length;if(!n)return null;
  const m=a.reduce((x,s)=>x+s.carry,0)/n;
  const ll=a.filter(s=>s.lat!=null),ml=ll.length?ll.reduce((x,s)=>x+s.lat,0)/ll.length:0,sl=ll.length>1?Math.sqrt(ll.reduce((x,s)=>x+(s.lat-ml)*(s.lat-ml),0)/ll.length):0;
  const pe=a.filter(s=>s.plan>0).map(s=>(s.carry-s.plan)/s.plan),pm=pe.length?pe.reduce((x,y)=>x+y,0)/pe.length:null,ps=pe.length>1?Math.sqrt(pe.reduce((x,y)=>x+(y-pm)*(y-pm),0)/pe.length):null;
  return{n:n,m:m,ml:ml,sl:sl,pm:pm,ps:ps,pn:pe.length,thin:a.filter(s=>s.fl==='l').length/n};
}
function dtSwings(){
  const out=[];hxLoad().filter(s=>!s.name).forEach(s=>s.sw.forEach(x=>out.push({M:x.M,sc:x.score,tempo:x.tempo,lab:s.labels||{},t:x.t||s.t})));
  return out.slice(0,25);
}
function dtMetrics(){
  const sw=dtSwings(),by={};
  sw.forEach(x=>x.M.forEach(m=>{const o=by[m[0]]=by[m[0]]||{k:m[0],lab:x.lab[m[0]]||m[0],n:0,g:0};o.n++;if(m[2]==='good')o.g++;}));
  return{sw:sw,list:Object.keys(by).map(k=>by[k]).filter(o=>o.n>=5).map(o=>({k:o.k,lab:o.lab,pct:Math.round(o.g/o.n*100),n:o.n}))};
}
function dtReport(){
  const sh=S.shots||[],str=[],weak=[],inc=[],u=ul();
  S.clubs.forEach(c=>{
    const a=sh.filter(s=>s.club===c.id),st=dtStats(a);if(!st||st.n<5)return;const nm=tc(c.name),pct=x=>Math.round(Math.abs(x)*100);
    if(st.ps!=null&&st.pn>=5){
      if(st.ps<=0.06)str.push([1-st.ps,T(nm+': tight distance control (within about ±'+pct(st.ps)+'% of the plan).',nm+': bom controlo de distância (cerca de ±'+pct(st.ps)+'% do plano).')]);
      if(st.ps>=0.12)inc.push([st.ps,T(nm+': distance varies about ±'+pct(st.ps)+'% from what you planned.',nm+': a distância varia cerca de ±'+pct(st.ps)+'% do planeado.')]);
      if(st.pm<=-0.06)weak.push([-st.pm,T(nm+' lands about '+pct(st.pm)+'% short of the plan.',nm+' fica cerca de '+pct(st.pm)+'% curto do plano.')]);
      if(st.pm>=0.06)weak.push([st.pm,T(nm+' flies about '+pct(st.pm)+'% past the plan.',nm+' passa cerca de '+pct(st.pm)+'% do plano.')]);
    }
    if(Math.abs(st.ml)<=0.04*st.m&&st.sl<=0.07*st.m)str.push([1,T(nm+': straight, little left-right.',nm+': direito, pouco desvio lateral.')]);
    if(Math.abs(st.ml)>=Math.max(3,0.05*st.m))weak.push([Math.abs(st.ml)/st.m,T(nm+' misses '+(st.ml<0?'left':'right')+' by '+d1(Math.abs(st.ml))+' '+u+' on average.',nm+' falha '+(st.ml<0?'à esquerda':'à direita')+' '+d1(Math.abs(st.ml))+' '+u+' em média.')]);
    if(st.sl>=0.1*st.m)inc.push([st.sl/st.m,T(nm+': left-right spread of about ±'+d1(st.sl)+' '+u+'.',nm+': dispersão lateral de cerca de ±'+d1(st.sl)+' '+u+'.')]);
    if(st.thin>=0.2)weak.push([st.thin,T(nm+': '+Math.round(st.thin*100)+'% of shots are thin.',nm+': '+Math.round(st.thin*100)+'% das tacadas são finas.')]);
  });
  const mt=dtMetrics();
  mt.list.forEach(o=>{
    if(o.pct>=70)str.push([o.pct/100,T('Swing: '+o.lab+' is on target in '+o.pct+'% of swings.','Swing: '+o.lab+' no alvo em '+o.pct+'% dos swings.')]);
    if(o.pct<=40)weak.push([1-o.pct/100,T('Swing: '+o.lab+' is on target in only '+o.pct+'% of swings.','Swing: '+o.lab+' no alvo só em '+o.pct+'% dos swings.')]);
  });
  const tp=mt.sw.map(x=>x.tempo).filter(x=>x>0);
  if(tp.length>=8){const m=tp.reduce((a,b)=>a+b,0)/tp.length,sd=Math.sqrt(tp.reduce((a,b)=>a+(b-m)*(b-m),0)/tp.length);if(sd>=0.4)inc.push([sd,T('Tempo varies from swing to swing (±'+sd.toFixed(1)+' on a ratio near '+m.toFixed(1)+' : 1).','O ritmo varia de swing para swing (±'+sd.toFixed(1)+' num rácio de '+m.toFixed(1)+' : 1).')]);}
  const sc=mt.sw.map(x=>x.sc).filter(x=>x!=null);
  if(sc.length>=8){const m=sc.reduce((a,b)=>a+b,0)/sc.length,sd=Math.sqrt(sc.reduce((a,b)=>a+(b-m)*(b-m),0)/sc.length);if(sd>=12)inc.push([sd/20,T('Swing scores jump around (average '+Math.round(m)+', ±'+Math.round(sd)+').','As notas do swing variam muito (média '+Math.round(m)+', ±'+Math.round(sd)+').')]);}
  const top=l=>l.sort((a,b)=>b[0]-a[0]).slice(0,4).map(x=>x[1]);
  return{str:top(str),weak:top(weak),inc:top(inc),n:sh.length,sw:mt.sw.length};
}
function dtBlock(title,color,items,empty){
  return '<div class="hint" style="background:#fff;border:1.5px solid var(--line);color:var(--ink)"><b style="color:'+color+'">'+title+'</b>'+(items.length?items.map(t=>'<div style="margin-top:6px;font-size:14px">• '+esc(t)+'</div>').join(''):'<div class="sub" style="margin-top:6px;font-size:13px">'+empty+'</div>')+'</div>';
}
function dtClubTable(){
  const u=ul();
  const rows=S.clubs.filter(c=>c.on).map(c=>{
    const a=(S.shots||[]).filter(s=>s.club===c.id),st=dtStats(a);if(!st)return '';
    const home=a.filter(s=>s.src==='home').length;
    return '<tr style="border-top:1px solid var(--line)"><td style="padding:7px 4px 7px 0"><b>'+esc(tc(c.name))+'</b><div style="font-size:11px;color:var(--mut)">'+st.n+' '+T('shots','tacadas')+(home?' · '+home+' '+T('home','casa'):'')+'</div></td><td style="padding:7px 4px;font-weight:800">'+d1(st.m)+'</td><td style="padding:7px 4px">'+(st.ps!=null?'±'+Math.round(st.ps*100)+'%':'–')+'</td><td style="padding:7px 0 7px 4px">'+(Math.abs(st.ml)<0.5?'0':(st.ml<0?'◀ ':'')+d1(Math.abs(st.ml))+(st.ml>0?' ▶':''))+'<div style="font-size:11px;color:var(--mut)">±'+d1(st.sl)+'</div></td></tr>';
  }).join('');
  if(!rows)return '';
  return '<div class="hint" style="background:#fff;border:1.5px solid var(--line);color:var(--ink)"><b>'+T('By club','Por taco')+'</b><table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px"><tr style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--mut)"><td>'+T('Club','Taco')+'</td><td style="padding:0 4px">'+T('Carry','Voo')+' ('+u+')</td><td style="padding:0 4px">'+T('Distance control','Controlo')+'</td><td style="padding:0 0 0 4px">'+T('Miss','Desvio')+' ('+u+')</td></tr>'+rows+'</table><div class="sub" style="font-size:12px;margin-top:8px">'+T('Distance control = how far the ball lands from your plan. Miss = average left (◀) or right (▶), with the spread underneath.','Controlo = quão longe a bola cai do plano. Desvio = média à esquerda (◀) ou direita (▶), com a dispersão por baixo.')+'</div></div>';
}
function dtCmp(){
  const clubs=S.clubs.filter(c=>c.on&&(S.shots||[]).some(s=>s.club===c.id));
  if(!clubs.length)return '<div class="sub">'+T('No shots yet. Play a hole in Play and they show up here.','Ainda sem tacadas. Joga um buraco em Jogar e aparecem aqui.')+'</div>';
  if(!DT.club||!clubs.some(c=>c.id===DT.club))DT.club=clubs[0].id;
  const all=(S.shots||[]).filter(s=>s.club===DT.club),L=all.slice(-10),P=all.slice(-20,-10),Rg=all.filter(s=>s.src==='range'),Hm=all.filter(s=>s.src==='home');
  const row=(l,f)=>{return '<tr style="border-top:1px solid var(--line)"><td style="padding:7px 4px 7px 0">'+l+'</td>'+f.map(c=>'<td style="padding:7px 4px;font-weight:700">'+c+'</td>').join('')+'</tr>';};
  const val=(st,k)=>{if(!st)return '–';return k==='n'?st.n:k==='m'?d1(st.m):k==='ps'?(st.ps!=null?'±'+Math.round(st.ps*100)+'%':'–'):k==='ml'?(Math.abs(st.ml)<0.5?'0':(st.ml<0?'◀ ':'')+d1(Math.abs(st.ml))+(st.ml>0?' ▶':'')):'±'+d1(st.sl);};
  const tbl=(h1,A,h2,B)=>{const a=dtStats(A),b=dtStats(B);return '<table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--mut)"><td></td><td style="padding:0 4px">'+h1+'</td><td style="padding:0 4px">'+h2+'</td></tr>'+
    [['n',T('Shots','Tacadas')],['m',T('Average carry','Voo médio')],['ps',T('Distance control','Controlo de distância')],['ml',T('Average miss','Desvio médio')],['sl',T('Left-right spread','Dispersão lateral')]].map(r=>row(r[1],[val(a,r[0]),val(b,r[0])])).join('')+'</table>';};
  return '<div class="chiprow">'+clubs.map(c=>'<button class="cond'+(c.id===DT.club?' pickon':'')+'" data-pl="club" data-v="'+c.id+'">'+esc(tc(c.name))+'</button>').join('')+'</div>'+
   '<div class="hint" style="background:#fff;border:1.5px solid var(--line);color:var(--ink)"><b>'+T('Last 10 shots vs the 10 before','Últimas 10 tacadas vs as 10 anteriores')+'</b><div style="margin-top:6px">'+(P.length?tbl(T('Last 10','Últimas 10'),L,T('Before','Antes'),P):'<div class="sub" style="font-size:13px">'+T('Needs at least 11 shots with this club.','Precisa de pelo menos 11 tacadas com este taco.')+'</div>')+'</div></div>'+
   '<div class="hint" style="background:#fff;border:1.5px solid var(--line);color:var(--ink)"><b>'+T('Range (real ball) vs Home (camera)','Range (bola real) vs Casa (câmara)')+'</b><div style="margin-top:6px">'+(Rg.length&&Hm.length?tbl(T('Range','Range'),Rg,T('Home','Casa'),Hm):'<div class="sub" style="font-size:13px">'+T('Needs shots from both places with this club.','Precisa de tacadas dos dois locais com este taco.')+'</div>')+'</div></div>';
}
function dtShots(){
  const a=(S.shots||[]).slice(-40).reverse(),u=ul();
  if(!a.length)return '<div class="sub">'+T('No shots yet.','Ainda sem tacadas.')+'</div>';
  return a.map(s=>{const d=new Date(s.t);
    return '<div class="shot" style="font-size:14px"><span>'+(s.src==='home'?'🏠 ':'⛳ ')+'<b>'+esc(dtName(s.club))+'</b><br><small style="color:var(--mut)">'+d.toLocaleDateString(undefined,{day:'numeric',month:'short'})+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+(s.sc!=null?' · '+T('swing','swing')+' '+s.sc:'')+(s.fl==='l'?' · '+T('thin','fina'):'')+'</small></span><span style="text-align:right"><b>'+d1(s.carry)+' '+u+'</b>'+(s.plan>0?'<br><small style="color:var(--mut)">'+T('plan','plano')+' '+d1(s.plan)+'</small>':'')+(s.lat!=null&&Math.abs(s.lat)>=0.5?'<br><small style="color:var(--mut)">'+d1(Math.abs(s.lat))+' '+(s.lat<0?T('left','esq.'):T('right','dir.'))+'</small>':'')+'</span></div>';}).join('')+
    '<div class="center" style="margin-top:10px"><button class="sec" data-pl="csv">'+T('Download CSV','Descarregar CSV')+'</button></div>';
}
function plCsv(){
  const rows=[['date','source','club','carry','plan','offline','flight','swing_score','tempo']].concat((S.shots||[]).map(s=>[new Date(s.t).toISOString(),s.src,dtName(s.club),(s.carry!=null?s.carry.toFixed(1):''),(s.plan!=null?s.plan.toFixed(1):''),(s.lat!=null?s.lat.toFixed(1):''),s.fl||'',s.sc!=null?s.sc:'',s.tempo!=null?s.tempo:'']));
  const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='caddy-shots.csv';document.body.appendChild(a);a.click();a.remove();
}
function dataHTML(){
  const seg='<div class="seg" style="margin-bottom:12px">'+[['report',T('Report','Relatório')],['cmp',T('Compare','Comparar')],['shots',T('Shots','Tacadas')],['sess',T('Swings','Swings')]].map(x=>'<button class="'+(DT.sec===x[0]?'on':'')+'" data-pl="sec" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
  if(DT.sec==='cmp')return seg+dtCmp();
  if(DT.sec==='shots')return seg+dtShots();
  if(DT.sec==='sess')return seg+(typeof hxHTML==='function'?hxHTML():'');
  const r=dtReport(),need=r.n<5&&r.sw<5;
  return seg+'<div class="sub" style="margin-bottom:8px">'+r.n+' '+T('shots','tacadas')+' · '+r.sw+' '+T('recent coach swings','swings recentes do coach')+'</div>'+
   (need?'<div class="hint">'+T('Not much data yet. Play some holes (range or home) and run a coach session, and this fills in. Each club needs about 5 shots.','Ainda poucos dados. Joga alguns buracos (range ou casa) e faz uma sessão de coach, e isto preenche-se. Cada taco precisa de cerca de 5 tacadas.')+'</div>':'')+
   dtBlock(T('Doing well','O que está bem'),'#166534',r.str,T('Nothing stands out yet.','Nada se destaca ainda.'))+
   dtBlock(T('Needs work','A melhorar'),'#b45309',r.weak,T('Nothing flagged. Keep going.','Nada assinalado. Continua.'))+
   dtBlock(T('Inconsistencies','Inconsistências'),'#c62828',r.inc,T('Nothing flagged yet.','Nada assinalado ainda.'))+
   dtClubTable();
}
