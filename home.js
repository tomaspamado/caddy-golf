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
function hmPeak(res,F){
  const ar=SWV.ar||0.5625,n=F.length,H=F.map(f=>[(f.i[15][0]+f.i[16][0])/2*ar,(f.i[15][1]+f.i[16][1])/2]);
  const a=Math.max(1,res.idx[1]-2),b=Math.min(n-2,res.idx[3]+2),s=[];
  for(let i=1;i<n-1;i++){const dt=Math.max(.001,(F[i+1].t-F[i-1].t)/1000);s.push(Math.hypot(H[i+1][0]-H[i-1][0],H[i+1][1]-H[i-1][1])/dt/res.L0);}
  let pk=0;for(let i=a;i<=b&&i-1<s.length;i++){const w=(s[i-1]+(s[i]||0)+(s[i-2]||0))/3;if(w>pk)pk=w;}
  return pk;
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
function hmGameHTML(){
  const v=R.vh;if(!v)return'';const u=ul();
  if(v.fin){
    const tot=v.done.reduce((a,h)=>a+h.strokes,0),par=v.done.reduce((a,h)=>a+h.par,0);
    return '<div class="big-msg center">'+tr('Round complete')+'</div><div class="lbl center">'+esc(v.course||'')+'</div>'+v.done.map((h,i)=>'<div class="shot"><b>'+(i+1)+'</b><span>par '+h.par+' · <b>'+h.strokes+'</b> ('+fmtTo(h.strokes-h.par)+')</span></div>').join('')+'<div class="shot"><b>'+tr('Total')+'</b><span><b>'+tot+'</b> ('+fmtTo(tot-par)+')</span></div><button class="cta" style="margin-top:12px" data-hm="done">'+tr('Done')+'</button>';
  }
  const H=v.h,p=hmPlan();
  let h='<div class="vhtitle">'+esc(H.name.split(' · ')[0])+' <span style="font-weight:600;color:var(--mut);font-size:16px">'+esc(H.name.split(' · ')[1]||'')+'</span></div><div class="lbl">'+tr('Hole {0} of {1} · par {2}',v.i+1,v.holes.length,H.par)+' · '+d1(H.len)+' '+u+'</div><canvas id="vhc" style="width:100%;height:260px;border-radius:14px;display:block;margin:8px 0"></canvas>';
  h+='<div class="hero"><div><div class="lbl">'+tr('To the pin')+'</div><div class="dist" style="text-align:left">'+d1(p.rem)+'<small>'+u+'</small></div></div><div class="plays">'+tr('Stroke {0}',v.strokes+1)+'</div></div>';
  if(HM.note)h+='<div class="aim" style="background:#effaf2;color:#166534">'+HM.note+'</div>';
  if(v.msg)h+='<div class="aim">'+v.msg+'</div>';
  h+=pctBadge(p.cl.name,p.pct);
  h+='<div class="chiprow" style="flex-wrap:wrap">'+p.act.map(c=>'<button class="cond'+(c.id===p.cl.id?' pickon':'')+'" data-hm="club" data-id="'+c.id+'">'+esc(tc(c.name))+'</button>').join('')+'</div>';
  return h;
}
function hmDraw(){const g=document.getElementById('hmgame');if(!g)return;g.innerHTML=hmGameHTML();if(R.vh&&!R.vh.fin&&typeof drawVh==='function')drawVh();}
function hmCam(){return swSeg('cam',SWV.cam,[['environment',T('Back camera','Câmara traseira')],['user',T('Front camera','Câmara frontal')]])+swSeg('view',SWV.view,[['dtl',T('Down the line','Por trás')],['fo',T('Face on','De frente')]]);}
function hmHTML(){
  const cal=S.home&&S.home.vFull;
  const note='<div class="hint">'+tr('Swing without a ball. The camera reads your hand speed (distance) and your swing quality (how well you hit it). Direction is a weighted random draw, because the camera cannot see the clubface.')+'</div>';
  if(HM.view==='cal')return note+'<div class="aim" style="background:var(--soft);color:var(--ink)">'+tr('Do 3 full swings at your normal full pace. I measure your hand speed.')+'</div><div id="hmcal" class="sub" style="margin:8px 0">'+HM.cal.length+' / 3</div>'+hmCam()+swCamBox()+'<div class="center"><button class="link" data-hm="back">‹ '+tr('Back')+'</button></div>';
  if(HM.view==='play')return '<div id="hmgame"></div>'+hmCam()+swCamBox()+'<div class="center"><button class="link" data-hm="quit">'+tr('End game')+'</button></div>';
  return note+'<div class="pick" style="display:block"><b>'+(cal?tr('Calibrated'):tr('Not calibrated yet'))+'</b><div class="sub" style="margin:4px 0 8px">'+(cal?'≈ '+(S.home.vFull*0.5).toFixed(1)+' m/s '+tr('hand speed')+'. ':'')+tr('Do 3 full swings at your normal full pace. I measure your hand speed.')+'</div><button class="cta" data-hm="cal">'+(cal?tr('Calibrate again'):tr('Calibrate'))+'</button></div>'+(cal?'<div class="lbl" style="margin:14px 0 8px">'+tr('Courses')+'</div>'+hmCourses():'<div class="sub">'+tr('Calibrate first, then pick a course.')+'</div>');
}
function hmMount(){
  if(HM.view==='cal'||HM.view==='play'){swBtns();swMsg(T('Tap Start camera to begin.','Toca em Ligar câmara para começar.'));}
  if(HM.view==='play')hmDraw();
}
/* ---------- session ---------- */
function hmStop(){SWV.state=SWV.stream?'live':'idle';SWV.auto=null;SWV.sess=null;swBtns();}
function hmSessStart(){
  SWV.sess={n:0,items:[],lastTip:'',fail:0};SWV.state='auto';SWV.auto={phase:'prep',buf:[],p:null,pt:0,sp:0,swung:false,mv:0,t1:0,vt:0};
  const e=document.getElementById('swsess');if(e)e.innerHTML='';
  swBtns();swMsg(T('Get into position. I will start listening in a moment.','Posiciona-te. Vou começar a ouvir já.'));
  let t=T('Take your address and hold still until you hear the beep, then swing.','Põe-te em address e fica parado até ouvires o apito, depois faz o swing.');
  if(HM.view==='play'&&R.vh){const p=hmPlan();t=T('First shot: '+tc(p.cl.name)+' at '+p.pct+' percent. ','Primeira tacada: '+tc(p.cl.name)+' a '+p.pct+' por cento. ')+t;}
  swSay(t,()=>setTimeout(swArm,1500));
}
const _swSessStartH=swSessStart;
swSessStart=function(){if(HM.view==='cal'||HM.view==='play'){SWV.home=true;hmSessStart();return;}SWV.home=false;_swSessStartH();};
const _swSessEndH=swSessEnd;
swSessEnd=function(){if(SWV.home){SWV.home=false;SWV.state='live';SWV.auto=null;SWV.sess=null;try{speechSynthesis.cancel();}catch(e){}swBtns();swMsg(T('Stopped.','Parado.'));return;}_swSessEndH();};
const _swBtnsH=swBtns;
swBtns=function(){_swBtnsH();const b=document.getElementById('swbtns');if(!b||!(HM.view==='cal'||HM.view==='play'))return;
  if(SWV.state==='live')b.innerHTML=b.innerHTML.replace(/Start hands-free session|Começar sessão sem mãos/,T('Start playing','Começar a jogar')).replace(/<button class="sec" data-sw="rec"[^>]*>[^<]*<\/button>/,'');
  if(SWV.state==='auto')b.innerHTML=b.innerHTML.replace(/End session|Terminar sessão/,T('Stop','Parar'));};
const _swAutoDoneH=swAutoDone;
swAutoDone=function(){
  if(!SWV.home)return _swAutoDoneH();
  const A=SWV.auto,S_=SWV.sess;if(!A||!S_)return;A.phase='busy';SWV.frames=A.buf.slice();
  const res=swAnalyze(SWV.frames,{ar:SWV.ar,lefty:S.lefty,view:SWV.view,cls:swCls((swClub()||{}).name)});
  if(!res.ok){S_.fail++;swMsg(res.why,true);if(S_.fail>=2){S_.fail=0;swSay(T("I didn't catch that swing. Try again.","Não apanhei esse swing. Tenta outra vez."),()=>setTimeout(swArm,1500));}else setTimeout(swArm,800);return;}
  S_.fail=0;hmJudge(res,S_);
};
function hmMed(a){const s=a.slice().sort((x,y)=>x-y);return s[Math.floor(s.length/2)];}
function hmJudge(res,S_){
  const pk=hmPeak(res,SWV.frames);
  if(typeof hxKeep==='function')hxKeep(res,SWV.frames,{home:1});
  if(HM.view==='cal'){
    HM.cal.push(pk);S_.n++;const c=document.getElementById('hmcal');if(c)c.textContent=HM.cal.length+' / 3';
    if(HM.cal.length<3){swMsg(T('Swing '+HM.cal.length+' of 3 recorded.','Swing '+HM.cal.length+' de 3 gravado.'));swSay(T('Swing '+HM.cal.length+' recorded.','Swing '+HM.cal.length+' gravado.'),()=>setTimeout(swArm,1200));return;}
    S.home={vFull:hmMed(HM.cal),t:Date.now()};save();HM.cal=[];
    swSay(T('Calibrated. Your full swing is now my one hundred percent.','Calibrado. O teu swing completo é agora o meu cem por cento.'),()=>{hmStop();HM.view='setup';dlRender();});
    return;
  }
  const v=R.vh;if(!v)return;
  const p=hmPlan(),cl=p.cl,vf=S.home.vFull;
  let pct=Math.max(0.1,Math.min(1.15,pk/vf));
  const M=k=>res.M.find(m=>m.key===k),td=M('tiltd')?parseFloat(M('tiltd').val):0;
  let eff=Math.max(0.78,Math.min(1,0.78+0.22*res.score/100)),fl='n',tag='';
  if(td<-8){eff*=0.93;fl='l';tag=T('thin, ','fina, ');}else if(td>8){eff*=0.8;tag=T('fat, ','pesada, ');}
  const carry=Math.max(0,cl.carry*pct*eff*(1+0.02*hmGauss()));
  const sp=spread(cl),sig=sp.lat/1.28,lat=hmGauss()*sig*(1.5-0.8*res.score/100);
  const chs=hmChs(cl,cl.carry*pct*eff),u=ul();
  S_.n++;
  hmApply(cl,carry,lat,fl);
  const side=Math.abs(lat)<1?T('on line','na linha'):d1(Math.abs(lat))+' '+u+' '+T(lat<0?'left':'right',lat<0?'esquerda':'direita');
  let say=tc(cl.name)+', '+Math.round(pct*100)+' '+T('percent','por cento')+'. '+tag+d1(carry)+' '+u+', '+side+'. ';
  HM.note=esc(tc(cl.name))+' · '+Math.round(pct*100)+'% · '+tag+d1(carry)+' '+u+' · '+side+' · ≈'+Math.round(chs)+' m/s '+T('clubhead','cabeça do taco');
  const vv=R.vh;
  if(vv.res){
    const d=vv.strokes-vv.h.par;say+=tr(vhName(vv.strokes,vv.h.par))+'. ';HM.note+='<br><b>'+tr(vhName(vv.strokes,vv.h.par))+'</b> · '+vv.strokes;
    hmDraw();swMsg(HM.note.replace(/<[^>]+>/g,' '));
    swSay(say,()=>{hmQuiet(()=>act('vhnext',{dataset:{}}));HM.key=null;if(R.vh&&R.vh.fin){hmDraw();hmStop();swSay(T('Round complete.','Volta completa.'));return;}
      const np=hmPlan();hmDraw();swSay(T('Next hole. '+tc(np.cl.name)+' at '+np.pct+' percent.','Próximo buraco. '+tc(np.cl.name)+' a '+np.pct+' por cento.'),()=>setTimeout(swArm,1200));});
    return;
  }
  const np=hmPlan();say+=d1(np.rem)+' '+u+' '+T('to the pin. Next: '+tc(np.cl.name)+' at '+np.pct+' percent.','até ao buraco. Próximo: '+tc(np.cl.name)+' a '+np.pct+' por cento.');
  hmDraw();swMsg(HM.note.replace(/<[^>]+>/g,' '));
  swSay(say,()=>setTimeout(swArm,1500));
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
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-hm]');if(!b)return;const a=b.dataset.hm;
  if(a==='cal'){HM.view='cal';HM.cal=[];swingStop();SWV.home=true;dlRender();}
  else if(a==='back'||a==='done'){swingStop();SWV.home=false;HM.view='setup';if(a==='done')R.vh=null;dlRender();}
  else if(a==='quit'){swingStop();SWV.home=false;R.vh=null;HM.view='setup';dlRender();}
  else if(a==='club'){HM.sel=b.dataset.id;hmDraw();}
  else if(a==='course'){const keep=S.mpNames;S.mpNames=[];try{hmQuiet(()=>act('crsplay',{dataset:{id:b.dataset.id,v:b.dataset.v}}));}finally{S.mpNames=keep;}HM.view='play';HM.key=null;HM.note='';swingStop();SWV.home=true;dlRender();}
});
