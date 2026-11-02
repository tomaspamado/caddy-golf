"use strict";
/* ================= Home golf: swing without a ball, the camera plays the shot ================= */
Object.assign(PT,{
 'Home':'Casa','Home golf':'Golfe em casa','Calibrate':'Calibrar','Calibrated':'Calibrado','Not calibrated yet':'Ainda não calibrado','Start playing':'Começar a jogar','Stop':'Parar',
 'Do 3 full swings at your normal full pace. I measure your hand speed.':'Faz 3 swings completos ao teu ritmo normal. Eu meço a velocidade das mãos.'
});
const HM={view:'setup',cal:[],key:null,sel:null,note:'',last:null};
function hmGauss(){let u=0,v=0;while(!u)u=Math.random();v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function hmQuiet(fn){const o=openPanel;openPanel=function(){};try{return fn();}finally{openPanel=o;}}
function hmChs(cl,carry){const n=String(cl.name||'');const k=/driver/i.test(n)?4.3:/wood|hybrid|rescue/i.test(n)?4.0:/wedge/i.test(n)?3.2:(/^\s*[3-6]/.test(n)?3.8:3.5);return carry/k;}
function hmMeasure(res,F){
  const ar=SWV.ar||0.5625,n=F.length,H=F.map(f=>[(f.i[15][0]+f.i[16][0])/2*ar,(f.i[15][1]+f.i[16][1])/2]);
  const a=Math.max(2,res.idx[1]-2),b=Math.min(n-3,res.idx[2]+2),s=[];
  for(let i=2;i<n-2;i++){const dt=Math.max(.001,(F[i+2].t-F[i-2].t)/1000);s[i]=Math.hypot(H[i+2][0]-H[i-2][0],H[i+2][1]-H[i-2][1])/dt/res.L0;}
  let pk=0;for(let i=a+1;i<=b-1;i++){if(s[i-1]==null||s[i+1]==null||s[i]==null)continue;const w=(s[i-1]+s[i]+s[i+1])/3;if(w>pk)pk=w;}
  let arc=0;for(let i=res.idx[0]+1;i<=res.idx[1]&&i<n;i++)arc+=Math.hypot(H[i][0]-H[i-1][0],H[i][1]-H[i-1][1]);
  return{pk:pk,arc:arc/res.L0};
}
function hmPlan(){
  const v=R.vh,act=S.clubs.filter(c=>c.on),rem=vhRem(v),rc=recommend(rem,null);let rb=rc.best||rc.longest;
  const vd=vhDecide(v,rc,rem);if(vd&&rc.best)rb=rc.list.find(x=>x.id===vd.club.id)||rb;
  const key=v.i+'|'+v.strokes;if(HM.key!==key){HM.key=key;HM.sel=null;}
  const cl=(HM.sel&&act.find(c=>c.id===HM.sel))||(rb&&act.find(c=>c.id===rb.id))||act[0];
  const lm=v.lie==='rough'?.9:v.lie==='bunker'?.8:1,rmu=v.lie==='rough'?.4:v.lie==='bunker'?0:1;
  const plan=Math.max(0,Math.min(cl.carry,(rc.plays-cl.roll*0.6*rmu)/lm));
  return{rem:rem,rc:rc,cl:cl,act:act,plan:plan,pct:Math.max(0,Math.min(100,Math.round(plan/cl.carry*100)))};
}
function hmCourses(){
  const u=ul();
  return CRS.map(c=>{const n=c.pars.length,par=c.pars.reduce((a,b)=>a+b,0);
    return '<div class="pick" style="display:block"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span><b>'+esc(c.name)+'</b><br><small>'+n+' · par '+par+' · '+d1(crsTot(c))+' '+u+'</small></span><span class="lv '+(c.lvl===1?'e':c.lvl===2?'m':'t')+'">'+tr(c.lvl===1?'Easy':c.lvl===2?'Medium':'Tough')+'</span></div><div class="row" style="margin-top:8px">'+(n>9?'<button class="sec" data-hm="course" data-id="'+c.id+'" data-v="all">'+tr('Play 18')+'</button><button class="sec" data-hm="course" data-id="'+c.id+'" data-v="f9">'+tr('Front 9')+'</button><button class="sec" data-hm="course" data-id="'+c.id+'" data-v="b9">'+tr('Back 9')+'</button>':'<button class="sec" data-hm="course" data-id="'+c.id+'" data-v="all">'+tr('Play 9')+'</button>')+'</div></div>';}).join('');
}
function hmBounds(H){
  let x0=0,x1=0;H.path.forEach(p=>{x0=Math.min(x0,p[0]-p[2]);x1=Math.max(x1,p[0]+p[2]);});
  x0=Math.min(x0,H.pin.x-25);x1=Math.max(x1,H.pin.x+25);
  [].concat(H.water||[],H.bunk||[],H.land||[]).forEach(e=>{if(e.x!=null){x0=Math.min(x0,e.x-(e.rx||0));x1=Math.max(x1,e.x+(e.rx||0));}});
  x0-=15;x1+=15;if(x1-x0<110){const c=(x0+x1)/2;x0=c-55;x1=c+55;}
  return{x0:x0,x1:x1,y0:-14,y1:H.len+26};
}
function hmOv(){return document.getElementById('hmov');}
function hmScore(v){
  const tot=v.done.reduce((a,h)=>a+h.strokes,0),par=v.done.reduce((a,h)=>a+h.par,0);
  return '<div style="background:#fff;flex:1;overflow-y:auto;padding:calc(env(safe-area-inset-top) + 16px) 16px 20px"><div class="big-msg center">'+tr('Round complete')+'</div><div class="lbl center">'+esc(v.course||'')+'</div>'+v.done.map((h,i)=>'<div class="shot"><b>'+(i+1)+'</b><span>par '+h.par+' · <b>'+h.strokes+'</b> ('+fmtTo(h.strokes-h.par)+')</span></div>').join('')+'<div class="shot"><b>'+tr('Total')+'</b><span><b>'+tot+'</b> ('+fmtTo(tot-par)+')</span></div><button class="cta" style="margin-top:14px" data-hm="done">'+tr('Done')+'</button></div>';
}
function hmBuild(){
  let ov=hmOv();if(!ov){ov=document.createElement('div');ov.id='hmov';ov.style.cssText='position:fixed;inset:0;z-index:2200;background:#0d2a1a;display:flex;flex-direction:column';document.body.appendChild(ov);}
  ov.dataset.mode='play';
  ov.innerHTML='<div id="hmtop" style="padding:calc(env(safe-area-inset-top) + 8px) 12px 6px;color:#fff"></div><canvas id="vhc" style="flex:1;min-height:0;width:100%;display:block"></canvas>'+
  '<div style="background:#fff;border-radius:18px 18px 0 0;padding:10px 12px calc(env(safe-area-inset-bottom) + 10px)"><div style="display:flex;gap:10px;align-items:flex-start"><div id="swbox" style="display:none;position:relative;background:#000;border-radius:12px;overflow:hidden;width:92px;flex:none"><video id="swv" playsinline muted autoplay style="width:100%;height:100%;object-fit:contain;display:block"></video><canvas id="swc" style="position:absolute;inset:0;width:100%;height:100%"></canvas><div id="swred" style="position:absolute;inset:0;background:rgba(220,38,38,.42);opacity:0;pointer-events:none;display:grid;place-items:center"><div style="color:#fff;font-weight:800;font-size:11px;text-align:center">'+T('Step back','Afasta-te')+'</div></div></div>'+
  '<div style="flex:1;min-width:0"><div id="hmnote"></div><div id="swmsg" class="aim" style="margin:6px 0;background:var(--soft);color:var(--ink);font-size:13px;padding:7px 10px"></div><div id="swsess" style="display:none"></div><div id="hmact"></div><div id="swbtns"></div></div></div><div id="hmclubs" class="chiprow" style="margin:8px 0 0"></div></div>';
}
function hmDraw(){
  const v=R.vh,ov=hmOv();if(!ov)return;
  if(!v){ov.remove();return;}
  if(v.fin){ov.dataset.mode='fin';ov.innerHTML=hmScore(v);return;}
  if(ov.dataset.mode!=='play')hmBuild();
  const H=v.h,p=hmPlan(),u=ul(),nm=H.name.split(' · ');
  document.getElementById('hmtop').innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div style="min-width:0"><div style="font-weight:800;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(nm[0])+(nm[1]?' <span style="font-weight:600;font-size:13px;opacity:.8">'+esc(nm[1])+'</span>':'')+'</div><div style="font-size:12px;opacity:.85">'+tr('Hole {0} of {1} · par {2}',v.i+1,v.holes.length,H.par)+' · '+d1(H.len)+' '+u+'</div></div><div style="text-align:right;flex:none"><div style="font-weight:800;font-size:26px;line-height:1">'+d1(p.rem)+'<span style="font-size:13px;margin-left:2px">'+u+'</span></div><div style="font-size:12px;opacity:.85">'+tr('Stroke {0}',v.strokes+1)+'</div></div></div><div style="display:flex;gap:6px;margin-top:6px"><button class="cond" style="color:#0f1f16;min-height:34px;font-size:12px;padding:0 10px" data-hm="cam">⟲ '+(SWV.cam==='user'?T('Front','Frontal'):T('Back','Traseira'))+'</button><button class="cond" style="color:#0f1f16;min-height:34px;font-size:12px;padding:0 10px" data-hm="view">'+(SWV.view==='dtl'?T('Down the line','Por trás'):T('Face on','De frente'))+'</button><button class="cond" style="color:#0f1f16;min-height:34px;font-size:12px;padding:0 10px;margin-left:auto" data-hm="quit">'+tr('End game')+'</button></div>';
  document.getElementById('hmnote').innerHTML=(HM.note?'<div style="background:#effaf2;color:#166534;border-radius:10px;padding:7px 10px;font-weight:700;font-size:13px;margin-bottom:4px">'+HM.note+'</div>':'')+(v.msg?'<div style="background:#fff7e6;color:var(--warn);border-radius:10px;padding:7px 10px;font-weight:700;font-size:13px">'+v.msg+'</div>':'');
  const pw=p.pct>=95?tr('Full swing'):swingWord(p.pct);
  document.getElementById('hmact').innerHTML=(SWV.state==='auto'?'<div style="font-weight:800;font-size:15px;margin-bottom:6px">'+esc(tc(p.cl.name))+' · '+(p.pct>=95?100:p.pct)+'% <span style="font-weight:600;font-size:12px;color:var(--mut)">'+pw+'</span></div>':'')+(HM.wait&&SWV.state==='auto'?'<button class="cta" style="padding:13px;font-size:16px" data-hm="next">'+T('Ready ▶ ','Pronto ▶ ')+esc(tc(p.cl.name))+' '+(p.pct>=95?100:p.pct)+'%</button>':'');
  document.getElementById('hmclubs').innerHTML=p.act.map(c=>'<button class="cond'+(c.id===p.cl.id?' pickon':'')+'" data-hm="club" data-id="'+c.id+'">'+esc(tc(c.name))+'</button>').join('');
  const c=document.getElementById('vhc');if(c&&typeof paintHole==='function')paintHole(c,H,hmBounds(H),v,v.trail,false);
}
function hmCam(){return swSeg('cam',SWV.cam,[['environment',T('Back camera','Câmara traseira')],['user',T('Front camera','Câmara frontal')]])+swSeg('view',SWV.view,[['dtl',T('Down the line','Por trás')],['fo',T('Face on','De frente')]]);}
function hmHTML(){
  const cal=S.home&&S.home.ver===2&&S.home.vFull;
  const note='<div class="hint">'+tr('Swing without a ball. The camera reads your hand speed (distance) and your swing quality (how well you hit it). Direction is a weighted random draw, because the camera cannot see the clubface.')+'</div>';
  if(HM.view==='cal')return note+'<div class="aim" style="background:var(--soft);color:var(--ink)">'+tr('Do 3 full swings at your normal full pace. I measure your hand speed.')+'</div><div id="hmcal" class="sub" style="margin:8px 0">'+HM.cal.length+' / 3</div>'+hmCam()+swCamBox()+'<div class="center"><button class="link" data-hm="back">‹ '+tr('Back')+'</button></div>';
  if(HM.view==='play')return '<div class="sub" style="margin:20px 0">'+T('Game in progress.','Jogo em curso.')+'</div><button class="cta" data-hm="quit">'+tr('End game')+'</button>';
  return note+'<div class="pick" style="display:block"><b>'+(cal?tr('Calibrated'):tr('Not calibrated yet'))+'</b><div class="sub" style="margin:4px 0 8px">'+(cal?'≈ '+(S.home.vFull*0.5).toFixed(1)+' m/s '+tr('hand speed')+'. ':'')+tr('Do 3 full swings at your normal full pace. I measure your hand speed.')+'</div><button class="cta" data-hm="cal">'+(cal?tr('Calibrate again'):tr('Calibrate'))+'</button></div>'+(cal?'<div class="lbl" style="margin:14px 0 8px">'+tr('Courses')+'</div>'+hmCourses():'<div class="sub">'+tr('Calibrate first, then pick a course.')+'</div>');
}
function hmMount(){
  if(HM.view==='cal'){swBtns();swMsg(T('Tap Start camera to begin.','Toca em Ligar câmara para começar.'));}
  if(HM.view==='play'){hmBuildIfNeeded();swBtns();swMsg(T('Tap Start camera to begin.','Toca em Ligar câmara para começar.'));hmDraw();}
}
function hmBuildIfNeeded(){const o=hmOv();if(!o||o.dataset.mode!=='play')hmBuild();}
/* ---------- session ---------- */
function hmStop(){SWV.state=SWV.stream?'live':'idle';SWV.auto=null;SWV.sess=null;HM.wait=false;swBtns();}
function hmSessStart(){
  SWV.sess={n:0,items:[],lastTip:'',fail:0};SWV.state='auto';SWV.auto={phase:'prep',buf:[],p:null,pt:0,sp:0,swung:false,mv:0,t1:0,vt:0};
  swBtns();
  if(HM.view==='play'&&R.vh){
    HM.wait=true;hmDraw();const p=hmPlan();
    swMsg(T('Pick your club, then tap Ready.','Escolhe o taco e toca em Pronto.'));
    swSay(T('First shot: '+tc(p.cl.name)+' at '+p.pct+' percent. Change club if you want, then tap Ready.','Primeira tacada: '+tc(p.cl.name)+' a '+p.pct+' por cento. Muda de taco se quiseres e toca em Pronto.'));
  }else{
    swMsg(T('Get into position. I will start listening in a moment.','Posiciona-te. Vou começar a ouvir já.'));
    swSay(T('Take your address and hold still until you hear the beep, then swing.','Põe-te em address e fica parado até ouvires o apito, depois faz o swing.'),()=>setTimeout(swArm,1500));
  }
}
const _swSessStartH=swSessStart;
swSessStart=function(){if(HM.view==='cal'||HM.view==='play'){SWV.home=true;hmSessStart();return;}SWV.home=false;_swSessStartH();};
const _swSessEndH=swSessEnd;
swSessEnd=function(){if(SWV.home){SWV.state='live';SWV.auto=null;SWV.sess=null;HM.wait=false;try{speechSynthesis.cancel();}catch(e){}swBtns();swMsg(T('Stopped.','Parado.'));hmDraw();return;}_swSessEndH();};
const _swBtnsH=swBtns;
swBtns=function(){_swBtnsH();const b=document.getElementById('swbtns');if(!b||!(HM.view==='cal'||HM.view==='play'))return;
  if(SWV.state==='live')b.innerHTML=b.innerHTML.replace(/Start hands-free session|Começar sessão sem mãos/,T('Start playing','Começar a jogar')).replace(/<button class="sec" data-sw="rec"[^>]*>[^<]*<\/button>/,'');
  if(SWV.state==='auto')b.innerHTML=b.innerHTML.replace(/End session|Terminar sessão/,T('Stop','Parar'));
  if(HM.view==='play'){
    b.querySelectorAll('.cta').forEach(x=>{x.style.padding='12px';x.style.fontSize='15px';});
    if(SWV.state==='live'&&SWV.home&&!HM.starting){HM.starting=true;setTimeout(()=>{if(SWV.state==='live'&&HM.view==='play')swSessStart();},400);}
  }};
const _swAutoDoneH=swAutoDone;
swAutoDone=function(){
  if(!SWV.home)return _swAutoDoneH();
  const A=SWV.auto,S_=SWV.sess;if(!A||!S_)return;A.phase='busy';SWV.frames=A.buf.slice();
  const res=swAnalyze(SWV.frames,{ar:SWV.ar,lefty:S.lefty,view:SWV.view,cls:swCls((swClub()||{}).name)});
  if(!res.ok){S_.fail++;swMsg(res.why,true);if(S_.fail>=2){S_.fail=0;swSay(T("I didn't catch that swing. Try again.","Não apanhei esse swing. Tenta outra vez."),()=>setTimeout(swArm,1500));}else setTimeout(swArm,800);return;}
  S_.fail=0;hmJudge(res,S_);
};
function hmMed(a){const s=a.slice().sort((x,y)=>x-y);return s[Math.floor(s.length/2)];}
function hmReady(){
  HM.wait=true;hmDraw();
  const p=R.vh&&!R.vh.fin?hmPlan():null;
  swMsg(T('Pick your club if you want, then tap Ready.','Escolhe o taco se quiseres e toca em Pronto.'));
  return p;
}
function hmJudge(res,S_){
  const m=hmMeasure(res,SWV.frames),pk=m.pk;
  if(typeof hxKeep==='function')hxKeep(res,SWV.frames,{home:1});
  if(HM.view==='cal'){
    HM.cal.push(m);S_.n++;const c=document.getElementById('hmcal');if(c)c.textContent=HM.cal.length+' / 3';
    if(HM.cal.length<3){swMsg(T('Swing '+HM.cal.length+' of 3 recorded.','Swing '+HM.cal.length+' de 3 gravado.'));swSay(T('Swing '+HM.cal.length+' recorded.','Swing '+HM.cal.length+' gravado.'),()=>setTimeout(swArm,1200));return;}
    S.home={ver:2,vFull:hmMed(HM.cal.map(x=>x.pk)),lFull:hmMed(HM.cal.map(x=>x.arc)),t:Date.now()};save();HM.cal=[];
    swSay(T('Calibrated. Your full swing is now my one hundred percent.','Calibrado. O teu swing completo é agora o meu cem por cento.'),()=>{hmStop();HM.view='setup';dlRender();});
    return;
  }
  const v=R.vh;if(!v)return;
  const p=hmPlan(),cl=p.cl,H_=S.home,vf=H_.vFull,lf=H_.lFull;
  const sr=pk/vf,lr=lf?m.arc/lf:sr;
  let pct=Math.max(0.1,Math.min(1.1,lf?0.6*sr+0.4*lr:sr));
  if(p.pct>=95&&pct>1.04){H_.vFull=vf+0.25*(pk-vf);if(lf)H_.lFull=lf+0.25*(m.arc-lf);save();}
  const M=k=>res.M.find(x=>x.key===k),td=M('tiltd')?parseFloat(M('tiltd').val):0;
  let eff=Math.max(0.78,Math.min(1,0.78+0.22*res.score/100)),fl='n',tag='';
  if(td<-8){eff*=0.93;fl='l';tag=T('thin, ','fina, ');}else if(td>8){eff*=0.8;tag=T('fat, ','pesada, ');}
  const carry=Math.max(0,cl.carry*pct*eff*(1+0.02*hmGauss()));
  const sp=spread(cl),sig=sp.lat/1.28,lat=hmGauss()*sig*(1.5-0.8*res.score/100);
  const chs=hmChs(cl,cl.carry*pct*eff),u=ul();
  S_.n++;
  hmApply(cl,carry,lat,fl);
  const side=Math.abs(lat)<1?T('on line','na linha'):d1(Math.abs(lat))+' '+u+' '+T(lat<0?'left':'right',lat<0?'esquerda':'direita');
  const pc=Math.round(pct*100);
  let say=tc(cl.name)+', '+pc+' '+T('percent','por cento')+'. '+tag+d1(carry)+' '+u+', '+side+'. ';
  HM.note=esc(tc(cl.name))+' · '+pc+'% ('+T('speed','velocidade')+' '+Math.round(sr*100)+', '+T('backswing','subida')+' '+Math.round(lr*100)+') · '+tag+d1(carry)+' '+u+' · '+side+' · ≈'+Math.round(chs)+' m/s';
  const vv=R.vh;
  if(vv.res){
    say+=tr(vhName(vv.strokes,vv.h.par))+'. ';HM.note+='<br><b>'+tr(vhName(vv.strokes,vv.h.par))+'</b> · '+vv.strokes;
    HM.wait=false;hmDraw();swMsg(HM.note.replace(/<[^>]+>/g,' '));
    swSay(say,()=>{hmQuiet(()=>act('vhnext',{dataset:{}}));HM.key=null;
      if(R.vh&&R.vh.fin){hmStop();hmDraw();swSay(T('Round complete.','Volta completa.'));return;}
      const np=hmReady();swSay(T('Next hole. '+tc(np.cl.name)+' at '+np.pct+' percent. Tap Ready when you are set.','Próximo buraco. '+tc(np.cl.name)+' a '+np.pct+' por cento. Toca em Pronto quando estiveres preparado.'));});
    return;
  }
  const np=hmReady();say+=d1(np.rem)+' '+u+' '+T('to the pin. Next: '+tc(np.cl.name)+' at '+np.pct+' percent. Tap Ready when set.','até ao buraco. Próximo: '+tc(np.cl.name)+' a '+np.pct+' por cento. Toca em Pronto.');
  swSay(say);
}
function hmApply(cl,carry,lat,fl){
  const keep=S.rball,n=S.rlog.length;S.rball='real';R.rd=carry;R.rlat=lat;R.rfl=fl;R.rdPlan=null;S.rsel=cl.id;
  try{hmQuiet(()=>RACT.vhhit({dataset:{}},undefined));}finally{S.rball=keep;}
  S.rlog.length=n;save();
}
/* ---------- wire into the Swing tab ---------- */
const _dlSegH=dlSeg;
dlSeg=function(){return '<div class="seg" style="margin-bottom:12px">'+[['coach',T('Coach','Coach')],['drills',T('Drills','Exercícios')],['home',T('Home','Casa')],['hist',T('History','Histórico')]].map(x=>'<button class="'+(DL.mode===x[0]?'on':'')+'" data-dl="mode" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';};
const _wrapH=swingHTMLBase_wrap;
swingHTMLBase_wrap=function(){if(DL.mode==='home')return dlSeg()+hmHTML();return _wrapH();};
const _dlRenderH=dlRender;
dlRender=function(){_dlRenderH();if(DL.mode==='home')hmMount();};
const _swMountH=swingMount;
swingMount=function(){_swMountH();if(DL.mode==='home')hmMount();};
function hmClose(){const o=hmOv();if(o)o.remove();}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-hm]');if(!b)return;const a=b.dataset.hm;
  if(a==='cal'){HM.view='cal';HM.cal=[];swingStop();SWV.home=true;dlRender();}
  else if(a==='back'){swingStop();SWV.home=false;HM.view='setup';dlRender();}
  else if(a==='done'){swingStop();SWV.home=false;R.vh=null;HM.view='setup';hmClose();dlRender();}
  else if(a==='quit'){swingStop();SWV.home=false;R.vh=null;HM.view='setup';HM.wait=false;hmClose();dlRender();}
  else if(a==='club'){HM.sel=b.dataset.id;hmDraw();}
  else if(a==='next'){HM.wait=false;hmDraw();swMsg(T('Address the ball and hold still.','Põe-te em address e fica parado.'));swArm();}
  else if(a==='cam'){const on=!!SWV.stream;hmStop();SWV.cam=SWV.cam==='user'?'environment':'user';if(on){swStopCam();swStart();}hmDraw();}
  else if(a==='view'){SWV.view=SWV.view==='dtl'?'fo':'dtl';hmDraw();}
  else if(a==='course'){const keep=S.mpNames;S.mpNames=[];try{hmQuiet(()=>act('crsplay',{dataset:{id:b.dataset.id,v:b.dataset.v}}));}finally{S.mpNames=keep;}HM.view='play';HM.key=null;HM.note='';HM.wait=false;HM.starting=false;swingStop();SWV.home=true;hmClose();dlRender();}
});
