"use strict";
/* ============ Game module 1: wind & slope, per-hole stats, saved game, round history, swing-linked direction ============ */
const GM={mp:null,say:'',sayWhy:'',whyCur:'',wk:'',keep:false,hk:{deco:[]},calFor:null,calName:''};
const GK='caddy_game_v1';
GM.guest=()=>!!(GM.mp&&GM.mp.cur>0);

/* ---------- wind and slope for each hole ---------- */
function gmInit(v){
  const len=v.h.len,real=S.cond&&S.cond.windKmh>=3,pool=[0,5,8,11,14,18,24];
  const base=real?S.cond.windKmh:pool[Math.floor(Math.random()*pool.length)];
  let e=hmGauss()*0.012*len;if(Math.abs(e)<1.5)e=0;e=Math.max(-9,Math.min(9,Math.round(e*2)/2));
  v.gm={kmh:Math.round(base*(0.8+0.4*Math.random())),from:Math.floor(Math.random()*360),E:e};
}
function gmOn(){const v=R.vh;if(!v||v.fin||v.tp||S.gmWind===false||!v.h)return false;if(!v.gm)gmInit(v);return true;}
function gmBrg(v){const d=vhAim(v);return(Math.atan2(d.dx,d.dy)/rad+360)%360;}
function gmElev(v){return v.gm.E*Math.min(1,vhRem(v)/Math.max(30,v.h.len));}
function gmWith(v,fn){
  const o=S.cond;
  S.cond=Object.assign({},o,{windKmh:v.gm.kmh,windFrom:v.gm.from,elev:gmElev(v),lie:0,tilt:0,stance:0,ballh:0});
  try{return fn();}finally{S.cond=o;}
}
const _recG=recommend;
recommend=function(D,brg){const v=R.vh;if(brg==null&&gmOn())return gmWith(v,()=>_recG(D,gmBrg(v)));return _recG.apply(this,arguments);};
const _vhDecG=vhDecide;
vhDecide=function(v,rc,rem){if(v&&v===R.vh&&gmOn())return gmWith(v,()=>_vhDecG(v,rc,rem));return _vhDecG(v,rc,rem);};
function gmDesc(v){
  const g=v.gm,rem=vhRem(v),r=gmWith(v,()=>calc(Math.max(30,rem),gmBrg(v))),u=ul();let w;
  if(g.kmh<2)w=T('calm','sem vento');
  else{const hd=Math.abs(r.head)>=Math.abs(r.cross);w=wDisp(g.kmh)+' '+wl()+' '+(hd?(r.head>=0?T('into you','de frente'):T('behind you','pelas costas')):(r.cross>0?T('from the right','da direita'):T('from the left','da esquerda')));}
  const el=gmElev(v);let s='';
  if(Math.abs(el)>=1)s=(el>0?T('uphill ','a subir '):T('downhill ','a descer '))+d1(Math.abs(el))+' '+u;
  return{w:w,s:s,el:el,r:r};
}

/* ---------- every shot: wind effect, hole stats ---------- */
const _hitG=RACT.vhhit;
RACT.vhhit=function(b,val){
  const vv=R.vh,cl=S.clubs.find(x=>x.id===S.rsel);
  if(!vv||vv.res||vv.fin||!cl)return _hitG.apply(this,arguments);
  const useW=gmOn()&&R.rd!=null,raw=R.rd,rlat=R.rlat||0,fac=rbFac(cl),n0=vv.strokes,u=ul();
  const rl0=(S.rlog||[])[S.rlog.length-1],sh0=(S.shots||[])[(S.shots||[]).length-1];
  let eff=null;
  GM.say='';
  if(useW){
    eff=gmWith(vv,()=>{const real=rbReal(cl,raw),r=calc(Math.max(20,real),gmBrg(vv)),el=gmElev(vv),re=Math.max(0,(real-el)/(1+r.pct));return{real:real,re:re,dr:-r.cross*re*0.004};});
    R.rd=rbRaw(cl,eff.re);R.rlat=rlat+eff.dr*fac;
  }
  try{_hitG.apply(this,arguments);}finally{}
  if(useW){
    if(!PL.fromHome){
      const l=S.rlog[S.rlog.length-1];if(l&&l!==rl0){l.d=rbReal(cl,raw);l.raw=raw;l.lat=rlat/fac;}
      const s=(S.shots||[])[(S.shots||[]).length-1];if(s&&s!==sh0){s.carry=rbReal(cl,raw);s.lat=rlat/fac;}
      save();plLearn();
    }
    const dd=eff.re-eff.real,dr=eff.dr;
    if(Math.abs(dd)>=1.5||Math.abs(dr)>=1){
      const t1=(dd<0?'−':'+')+d1(Math.abs(dd))+' '+u,t2=Math.abs(dr)>=1?', '+d1(Math.abs(dr))+' '+u+' '+(dr<0?T('left','esq.'):T('right','dir.')):'';
      vv.msg=(vv.msg?vv.msg+' ':'')+'💨 '+T('Wind and slope: ','Vento e declive: ')+t1+t2;
      if(PL.fromHome){const ps=[];
        if(Math.abs(dd)>=1.5)ps.push(dd<0?T('The wind took '+d1(Math.abs(dd))+' off','O vento tirou '+d1(Math.abs(dd))):T('The wind added '+d1(Math.abs(dd)),'O vento deu mais '+d1(Math.abs(dd))));
        if(Math.abs(dr)>=1)ps.push(T('It pushed it '+d1(Math.abs(dr))+' '+(dr<0?'left':'right'),'Empurrou-a '+d1(Math.abs(dr))+' para a '+(dr<0?'esquerda':'direita')));
        GM.say=ps.length?ps.join(', ')+'.':'';}
    }
  }
  const st=vv.st=vv.st||{pen:0,fw:null,gir:null,putts:null,shots:0};
  st.shots++;
  if(vv.last===null&&vv.strokes-n0>=2)st.pen++;
  if(n0===0&&vv.h.par>3)st.fw=vv.last!==null&&vv.lie==='fairway';
  if(vv.res&&vv.res.putts!=null){st.putts=vv.res.putts;st.gir=(vv.strokes-vv.res.putts)<=vv.h.par-2;st.prox=vv.res.rem;}
  if(vv.res&&vv.res.pick)st.pick=true;
  if(GM.hk.afterHit)GM.hk.afterHit(vv,cl,raw);
};

/* ---------- next hole / undo ---------- */
function gmRoundEnd(w){
  gmClearGame();
  if(w.tp||GM.mp)return;
  const e={t:Date.now(),course:w.course||String((w.done[0]&&w.done[0].name)||'Game').split(' · ').pop(),src:w.src||'range',holes:w.done.map(h=>({par:h.par,len:Math.round(h.len),strokes:h.strokes,name:h.name,st:h.st||null}))};
  S.grounds=S.grounds||[];S.grounds.unshift(e);S.grounds=S.grounds.slice(0,150);save();
  if(GM.hk.roundEnd)GM.hk.roundEnd(e);
}
const _actG=act;
act=function(a,b){
  const v=R.vh;
  if(a==='vhnext'&&v&&!v.fin){
    if(GM.hk.next&&GM.hk.next(v))return;
    const st=v.st;
    _actG(a,b);
    const w=R.vh;
    if(w){const d=w.done[w.done.length-1];if(d&&st&&!d.st)d.st=st;w.st=null;w.gm=null;if(w.fin)gmRoundEnd(w);}
    return;
  }
  if(a==='vhundo'&&v&&v.prev){
    if(v.tp&&v.res&&v.tp.rows.length)v.tp.rows.pop();
    if(v.st){v.st.shots=Math.max(0,v.st.shots-1);if(v.last===null&&v.st.pen>0)v.st.pen--;if(v.res){v.st.putts=null;v.st.gir=null;v.st.prox=null;v.st.pick=false;}}
  }
  _actG(a,b);
};

/* ---------- saved game: resume after closing the app ---------- */
function gmSaveGame(){
  const v=R.vh;if(!v||v.fin||!(PL.on||HM.view==='play'))return;
  try{localStorage.setItem(GK,JSON.stringify({t:Date.now(),vh:v,mp:GM.mp,src:v.src||'range'},function(k,val){return(k==='h'&&this===v)?undefined:val;}));}catch(e){}
}
function gmClearGame(){try{localStorage.removeItem(GK);}catch(e){}}
function gmSaved(){try{const j=JSON.parse(localStorage.getItem(GK)||'null');return j&&j.vh&&!j.vh.fin?j:null;}catch(e){return null;}}
function gmResume(){
  const j=gmSaved();if(!j)return false;
  const v=j.vh;v.h=v.holes[v.i];R.vh=v;GM.mp=j.mp||null;R.rd=null;R.rdClub=null;R.rlat=0;R.rfl='n';R.vhShot=null;R.vhKey=null;
  HM.key=null;HM.sel=null;HM.note='';HM.wait=false;HM.starting=false;
  if(v.src==='home'){PL.src='home';S.plsrc='home';PL.on=false;HM.view='play';if(typeof swingStop==='function')swingStop();SWV.home=true;hmClose();dlRender();}
  else{PL.src='range';PL.on=true;PL.key=null;HM.view='setup';hmClose();hmBuild();hmDraw();}
  return true;
}
const _plEndG=plEnd;
plEnd=function(){if(!GM.keep)gmClearGame();GM.mp=null;_plEndG();};
document.addEventListener('click',e=>{
  const q=e.target.closest('[data-hm="quit"],[data-hm="done"]');
  if(q&&!PL.on){gmClearGame();GM.mp=null;}
  const b=e.target.closest('[data-gm]');if(!b)return;
  const a=b.dataset.gm;
  if(a==='pause'){
    gmSaveGame();
    if(PL.on){GM.keep=true;try{plEnd();}finally{GM.keep=false;}}
    else{swingStop();SWV.home=false;R.vh=null;HM.view='setup';HM.wait=false;hmClose();dlRender();}
  }
  else if(a==='resume'){gmResume();}
  else if(a==='discard'){gmClearGame();if(typeof openPanel==='function')openPanel('play');}
},true);

/* ---------- overlay extras: wind chip, pause button, hooks ---------- */
const _hmDrawG=hmDraw;
hmDraw=function(){
  _hmDrawG();
  const v=R.vh,ov=hmOv();
  if(GM.mp&&!v)GM.mp=null;
  if(!ov||!v)return;
  if(!v.src)v.src=PL.on?'range':'home';
  if(v.fin){gmClearGame();return;}
  const top=document.getElementById('hmtop');if(!top)return;
  if(gmOn()){
    const g=v.gm,d=gmDesc(v),rel=(((g.from+180-gmBrg(v))%360)+360)%360,p=hmPlan(),pl=p.rc.plays-p.rem;
    top.insertAdjacentHTML('beforeend','<div style="display:flex;gap:12px;font-size:12px;margin-top:6px;align-items:center;opacity:.95;flex-wrap:wrap"><span>💨 '+(g.kmh<2?'':'<span style="display:inline-block;transform:rotate('+Math.round(rel)+'deg);font-weight:800">↑</span> ')+esc(d.w)+'</span>'+(d.s?'<span>'+(d.el>0?'▲ ':'▼ ')+esc(d.s)+'</span>':'')+(Math.abs(pl)>=2?'<span>'+T('plays ','joga ')+d1(p.rc.plays)+' '+ul()+'</span>':'')+'</div>');
  }
  const q=top.querySelector('[data-hm="quit"]');
  if(q&&!top.querySelector('[data-gm="pause"]')){
    q.style.marginLeft='0';
    q.insertAdjacentHTML('beforebegin','<button class="cond" style="color:#0f1f16;min-height:34px;font-size:12px;padding:0 10px;margin-left:auto" data-gm="pause">⏸ '+T('Save & exit','Guardar e sair')+'</button>');
  }
  if(PL.src==='home'&&GM.whyCur&&SWV.home){const n=document.getElementById('hmnote');if(n)n.insertAdjacentHTML('beforeend','<div style="background:#eef2ff;color:#3730a3;border-radius:10px;padding:7px 10px;font-weight:700;font-size:13px;margin-top:4px">'+esc(GM.whyCur)+'</div>');}
  GM.hk.deco.forEach(f=>{try{f(v,top);}catch(e){}});
  gmSaveGame();
};

/* ---------- voice: wind on the new hole, wind effect and swing reason after the shot ---------- */
const _swSayG=swSay;
swSay=function(txt,cb,urg){
  try{
    const v=R.vh;
    if(txt&&v&&!v.fin){
      const m=GM.mp;
      if(m&&/^(Next hole\.|Próximo buraco\.)/.test(txt)){
        const nm=m.players[m.cur].name,head=(m.newHole?T('Next hole. ','Próximo buraco. '):'')+(m.cur===0?T('Your turn.','É a tua vez.'):T(nm+', your turn.',nm+', é a tua vez.'));
        txt=txt.replace(/^(Next hole\.|Próximo buraco\.)/,head);
      }
      if(gmOn()&&/^(Next hole\.|Próximo buraco\.|[^.]*, your turn\.|[^.]*, é a tua vez\.|Your turn\.|É a tua vez\.)/.test(txt)){
        const d=gmDesc(v),wt=T('Wind ','Vento ')+d.w+(d.s?', '+d.s:'')+'.';
        txt=txt.replace(/^([^.]*\.)/,'$1 '+wt);
      }else if(gmOn()&&/^(First shot:|Primeira tacada:)/.test(txt)){
        const d=gmDesc(v);txt=T('Wind ','Vento ')+d.w+(d.s?', '+d.s:'')+'. '+txt;
      }
      const ex=[GM.say,GM.sayWhy].filter(Boolean).join(' ');
      if(ex&&/(percent|por cento)/.test(txt)){
        const re=/(\d+ (?:m|yd) (?:to the pin|até ao buraco))/;
        txt=re.test(txt)?txt.replace(re,ex+' $1'):txt+' '+ex;
        GM.say='';GM.sayWhy='';
      }
    }
  }catch(e){}
  return _swSayG(txt,cb,urg);
};

/* ---------- swing-linked direction (home shots) ---------- */
function gmBias(res,sig){
  GM.whyCur='';GM.wk='';GM.sayWhy='';
  let tot=0;
  try{
    const num=k=>{const m=res.M.find(x=>x.key===k);if(!m)return null;const p=cmParse(m.val);return p?{n:p.n,m:m}:null;};
    const parts=[],cl=(x,a,b)=>Math.max(a,Math.min(b,x));
    const t=num('tempo');if(t){const d=cl((t.n-3)/0.8,-2,0.5);parts.push(['tempo',0.4*d,d<0?T('Rushed transition: pulled it left.','Transição apressada: puxou para a esquerda.'):'']);}
    const h=num('hipImp');if(h){const d=cl((h.n-14)/12,-2,1);parts.push(['hipImp',-0.45*d,d<0?T('Little weight shift to the target: blocked it right.','Pouco peso para o alvo: bloqueou para a direita.'):T('Hips slid too far: pulled it left.','A anca deslizou demais: puxou para a esquerda.')]);}
    const f=num('finrot');if(f&&f.m.st!=='good')parts.push(['finrot',f.m.st==='work'?0.3:0.15,T('Stopped rotating: blocked it right.','Parou de rodar: bloqueou para a direita.')]);
    const r=num('reach');if(r){const d=cl(r.n/8,-2,2);parts.push(['reach',-0.3*d,d>0?T('Hands drifted away from the body: pulled it left.','As mãos afastaram-se do corpo: puxou para a esquerda.'):T('Hands came in close: pushed it right.','As mãos ficaram junto ao corpo: empurrou para a direita.')]);}
    let sum=0,best=null;parts.forEach(p=>{sum+=p[1];if(!best||Math.abs(p[1])>Math.abs(best[1]))best=p;});
    sum=cl(sum,-0.9,0.9);if(S.lefty)sum=-sum;tot=sum*sig*0.9;
    if(best&&Math.abs(best[1])>=0.15&&Math.abs(sum)>=0.15&&best[2]){GM.whyCur=best[2];GM.sayWhy=best[2];GM.wk=best[0];}
  }catch(e){tot=0;}
  return tot;
}
function gmSprd(res){try{let n=0;res.M.forEach(m=>{if(['head','reach','bal','tiltd'].indexOf(m.key)>=0&&m.st==='work')n++;});return Math.min(1.3,1+0.1*n);}catch(e){return 1;}}
function gmHome(){const m=GM.mp;if(m&&m.cur>0){const c=(S.gmCal||{})[m.players[m.cur].id];if(c)return c;}return S.home;}
function gmSetHome(o){if(GM.calFor!=null){S.gmCal=S.gmCal||{};S.gmCal[GM.calName]=o;GM.calFor=null;}else S.home=o;}
try{
  let src=hmJudge.toString();
  const a="lat=hmGauss()*sig*(1.5-0.8*res.score/100);",b="H_=S.home,",c="S.home={ver:3,",d="t:Date.now()};save();HM.cal=[];";
  if(src.indexOf(a)>0&&src.indexOf(b)>0&&src.indexOf(c)>0&&src.indexOf(d)>0){
    src=src.replace(a,"lat=hmGauss()*sig*(1.5-0.8*res.score/100)*gmSprd(res)+gmBias(res,sig);").replace(b,"H_=gmHome(),").replace(c,"gmSetHome({ver:3,").replace(d,"t:Date.now()});save();HM.cal=[];");
    hmJudge=(0,eval)('('+src+')');
  }else console.warn('hmJudge patch skipped');
}catch(e){console.warn('hmJudge patch failed',e);}

/* ---------- log filters ---------- */
const _shotAddG=shotAdd;
shotAdd=function(o){
  if(GM.guest())return;
  if(o.src==='home'&&GM.wk)o.wk=GM.wk;
  if(R.vh&&R.vh.tp){o.tp=1;}
  _shotAddG(o);
};
const _hxKeepG=hxKeep;
hxKeep=function(){if(GM.guest())return;return _hxKeepG.apply(this,arguments);};
