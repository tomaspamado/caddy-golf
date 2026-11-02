"use strict";
/* ================= Range: ball flight, exact offline, range-ball conversion, learning ================= */
Object.assign(PT,{
 'Ball flight':'Trajetória da bola','Low (stinger)':'Baixa (stinger)','Normal':'Normal','High (sky)':'Alta (sky)',
 'Offline':'Desvio lateral','On line':'Na linha','left':'esquerda','right':'direita','range ball':'bola de range','with a course ball':'com bola de campo',
 'Ball type':'Tipo de bola','Range ball':'Bola de range','Course ball':'Bola de campo','Range balls fly {0}% shorter (driver more, wedges less).':'As bolas de range voam {0}% menos (driver mais, wedges menos).',
 'Range data':'Dados do range','Apply to my bag':'Aplicar ao meu saco','shots':'tacadas','carry':'voo','wide':'largura','deep':'profundidade','Reset range data':'Apagar dados do range','Tap again to confirm':'Toca outra vez para confirmar',
 'Clear free shots':'Limpar tacadas livres','Real-ball carry from your range shots. Misses feed the spread the caddy uses.':'Voo com bola de campo estimado a partir das tuas tacadas. Os desvios alimentam a dispersão usada pelo caddy.',
 'Set my bag from range data':'Atualizar o saco com os dados do range','Not enough shots yet (3 full, normal shots per club).':'Ainda poucas tacadas (3 tacadas completas e normais por taco).'
});
const FLN={l:1.7,n:1,h:0.5};
function rbMult(c){const n=String((c&&c.name)||'');return /driver/i.test(n)?1.4:/wood|hybrid|rescue/i.test(n)?1.2:/wedge/i.test(n)?0.55:1;}
function rbPct(){return S.rbf==null?8:S.rbf;}
function rbFac(c){if(S.rball==='real')return 1;return Math.max(0.6,1-rbPct()/100*rbMult(c));}
function rbReal(c,raw){return raw/rbFac(c);}
function rbRaw(c,real){return real*rbFac(c);}
function rlogCarry(id){const a=(S.rlog||[]).filter(s=>s.club===id&&s.d!=null&&(s.fl||'n')==='n'&&(s.src!=='game'||s.full));return{n:a.length,avg:a.length?a.reduce((x,s)=>x+s.d,0)/a.length:null,a:a};}
function rngMiss(id){
  const all=(S.rlog||[]).filter(s=>s.club===id&&s.d!=null),norm=all.filter(s=>(s.fl||'n')==='n'&&s.plan==null);
  const mean=norm.length>=2?norm.reduce((x,s)=>x+s.d,0)/norm.length:null;
  return all.filter(s=>s.lat!=null).map(s=>({lat:s.lat,de:(s.fl&&s.fl!=='n')?null:(s.plan!=null?s.d-s.plan:(mean!=null?s.d-mean:null))}));
}
function spread(club){
  const prior={lat:Math.max(2,club.carry*0.10),dep:Math.max(2,club.carry*0.08)};
  const m=(S.miss[club.id]||[]).concat(rngMiss(club.id)),ml=m.filter(x=>x.lat!=null),md=m.filter(x=>x.de!=null);
  if(ml.length>=5){
    const rms=a=>Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length),k=3,n=ml.length,nd=md.length;
    const lat=1.28*rms(ml.map(x=>x.lat)),dep=nd>=3?1.28*rms(md.map(x=>x.de)):prior.dep;
    return{lat:Math.max(2,(n*lat+k*prior.lat)/(n+k)),dep:Math.max(2,(nd*dep+k*prior.dep)/(nd+k)),learned:true,n:n};
  }
  return{lat:prior.lat,dep:prior.dep,learned:false,n:0};
}
function rShotUI(cl){
  const u=ul(),fac=rbFac(cl),real=rbReal(cl,R.rd),lat=R.rlat||0,fl=R.rfl||'n';
  const latT=Math.abs(lat)<0.5?tr('On line'):d1(Math.abs(lat))+' '+u+' '+tr(lat<0?'left':'right');
  return '<div class="field center"><div class="lbl">'+tr('Carry distance')+(S.rball==='real'?'':' · '+tr('range ball'))+'</div><div class="stepper" style="justify-content:center"><button data-act="rstep" data-v="-5">−5</button><button data-act="rstep" data-v="-1">−</button><div class="v">'+d1(R.rd)+'<small> '+u+'</small></div><button data-act="rstep" data-v="1">+</button><button data-act="rstep" data-v="5">+5</button></div>'+(fac===1?'':'<div class="sub">≈ <b>'+d1(real)+' '+u+'</b> '+tr('with a course ball')+'</div>')+'</div>'+
  '<div class="field center"><div class="lbl">'+tr('Ball flight')+'</div><div class="seg" style="justify-content:center;margin-top:6px">'+[['l','Low (stinger)'],['n','Normal'],['h','High (sky)']].map(m=>'<button class="'+(fl===m[0]?'on':'')+'" data-act="rfl" data-v="'+m[0]+'">'+tr(m[1])+'</button>').join('')+'</div></div>'+
  '<div class="field center"><div class="lbl">'+tr('Offline')+'</div><div class="stepper" style="justify-content:center"><button data-act="rlat" data-v="-5">◀ 5</button><button data-act="rlat" data-v="-1">◀ 1</button><div class="v" style="font-size:19px;min-width:112px">'+latT+'</div><button data-act="rlat" data-v="1">1 ▶</button><button data-act="rlat" data-v="5">5 ▶</button></div></div>';
}
function rBallUI(){
  const real=S.rball==='real';
  return '<details class="hint" style="margin-top:0"><summary style="cursor:pointer;font-weight:700">'+tr('Ball type')+': '+tr(real?'Course ball':'Range ball')+(real?'':' (−'+rbPct()+'%)')+'</summary><div class="seg" style="margin:10px 0">'+[['range','Range ball'],['real','Course ball']].map(m=>'<button class="'+((real?'real':'range')===m[0]?'on':'')+'" data-act="rball" data-v="'+m[0]+'">'+tr(m[1])+'</button>').join('')+'</div>'+
  (real?'':'<div class="stepper" style="justify-content:center"><button data-act="rbf" data-v="-1">−</button><div class="v" style="font-size:22px;min-width:70px">'+rbPct()+'%</div><button data-act="rbf" data-v="1">+</button></div><div class="sub" style="margin-top:8px">'+tr('Range balls fly {0}% shorter (driver more, wedges less).',rbPct())+'</div>')+'</details>';
}
function rEstHTML(act){
  const rows=act.map(c=>{const all=(S.rlog||[]).filter(s=>s.club===c.id);if(!all.length)return'';const k=rlogCarry(c.id),sp=spread(c);
    return '<div class="shot"><span><b>'+esc(tc(c.name))+'</b><br><small class="sub">'+all.length+' '+tr('shots')+(k.avg!=null?' · '+tr('carry')+' <b>'+d1(k.avg)+'</b> ('+d1(c.carry)+')':'')+'</small></span><span class="sub" style="text-align:right">'+(sp.learned?'±'+d1(sp.lat)+' '+tr('wide')+'<br>±'+d1(sp.dep)+' '+tr('deep'):'')+'</span></div>';}).join('');
  if(!rows)return'';
  const ok=act.filter(c=>rlogCarry(c.id).n>=3).length;
  return '<div class="lbl" style="margin:18px 0 6px">'+tr('Range data')+'</div><div class="sub" style="margin-bottom:6px">'+tr('Real-ball carry from your range shots. Misses feed the spread the caddy uses.')+'</div>'+rows+
  (ok?'<button class="sec" data-act="rapplyAll" style="width:100%;margin-top:10px">'+tr('Set my bag from range data')+'</button>':'<div class="sub" style="margin-top:8px">'+tr('Not enough shots yet (3 full, normal shots per club).')+'</div>')+
  '<div class="row" style="margin-top:10px"><button class="sec" data-act="rclear">'+tr('Clear free shots')+'</button><button class="sec" data-act="rwipe">'+(R.rwipe?tr('Tap again to confirm'):tr('Reset range data'))+'</button></div>';
}
function rangeHTML(){
  const act=S.clubs.filter(c=>c.on);if(!act.length)return '<div class="hint">'+tr('Add a club in Bag first.')+'</div>';
  const sel=S.clubs.find(c=>c.id===S.rsel&&c.on)||act[0];S.rsel=sel.id;
  const mine=(S.rlog||[]).filter(s=>s.club===sel.id&&s.src!=='game'),n=mine.length,avgRaw=n?mine.reduce((a,s)=>a+(s.raw!=null?s.raw:s.d),0)/n:null;
  if(R.rd==null||R.rdClub!==sel.id){R.rd=avgRaw!=null?avgRaw:Math.round(rbRaw(sel,sel.carry));R.rdClub=sel.id;}
  const tog='<div class="seg" style="margin-bottom:12px">'+[['free','Free practice'],['hole','Play a hole']].map(m=>'<button class="'+((R.rmode||'free')===m[0]?'on':'')+'" data-act="rmode" data-v="'+m[0]+'">'+tr(m[1])+'</button>').join('')+'</div>';
  if(R.rmode==='hole')return tog+rBallUI()+vhHTML(act,sel);
  const k=rlogCarry(sel.id),L=mine.filter(s=>s.lat!=null?s.lat<-1:s.side==='l').length,Rt=mine.filter(s=>s.lat!=null?s.lat>1:s.side==='r').length;
  let h=tog+rBallUI()+'<div class="hint" style="margin-top:0">'+tr('Hit a ball, then enter how far it carried (from your launch monitor or the yardage markers) and which way it missed.')+'</div>'+
  '<div class="chiprow" style="flex-wrap:wrap">'+act.map(c=>'<button class="cond'+(c.id===sel.id?' pickon':'')+'" data-act="rsel" data-id="'+c.id+'">'+esc(tc(c.name))+'</button>').join('')+'</div>'+rShotUI(sel)+
  '<button class="cta" data-act="rlog">'+tr('Log shot with {0}',esc(tc(sel.name)))+'</button>';
  if(n){
    h+='<div class="sub" style="margin:10px 0">'+tr('Misses: {0} left · {1} straight · {2} right. Bag has {3} at {4} {5}.',L,n-L-Rt,Rt,esc(tc(sel.name)),d1(sel.carry),ul())+'</div>';
  }
  return h+rEstHTML(act);
}
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
  if(R.vhKey!==ck){R.vhKey=ck;R.rdPlan=Math.max(0,Math.round(Math.min(cl.carry,(rc.plays-cl.roll*0.6*rmu)/lm)));R.rd=Math.round(rbRaw(cl,R.rdPlan));R.rdClub=cl.id;}
  h+='<div class="hero"><div><div class="lbl">'+tr('To the pin')+'</div><div class="dist" style="text-align:left">'+d1(rem)+'<small>'+u+'</small></div></div><div class="plays">'+tr('Stroke {0}',v.strokes+1)+'</div></div>';
  if(v.last!=null)h+='<div class="why">'+tr('Last shot: {0} {1}',d1(v.last),u)+'</div>';
  if(v.msg)h+='<div class="aim">'+v.msg+'</div>';
  if(v.lie&&v.lie!=='tee')h+='<div class="why">'+tr(v.lie==='bunker'?'Lie: bunker':(v.lie==='rough'?'Lie: rough':'Lie: fairway'))+(v.lie==='bunker'?' · −20%':v.lie==='rough'?' · −10%':'')+'</div>';
  const hl=vhList(v,act);if(hl.length)h+='<div class="hz">'+hl.map(t=>'<div>'+t+'</div>').join('')+'</div>';
  if(rb)h+='<div class="aim">'+tr('Caddy suggests {0}',esc(tc(rb.name)))+'</div>';
  if(vd&&rb){const ve=vd.list.find(z=>z.club.id===rb.id),ae=vd.altE;if(ve&&ve.p>=0.05)h+='<div class="why">⚠ '+tr('{0}% chance of trouble',Math.round(ve.p*100))+'</div>';if(ve&&ae&&ae.club.id!==rb.id&&ae.p-ve.p>=0.08)h+='<div class="why">'+tr('{0} is safer than {1}: {2}% chance of trouble vs {3}%',esc(tc(rb.name)),esc(tc(ae.club.name)),Math.round(ve.p*100),Math.round(ae.p*100))+'</div>';}
  h+='<div class="chiprow" style="flex-wrap:wrap">'+act.map(c=>'<button class="cond'+(c.id===cl.id?' pickon':'')+'" data-act="rsel" data-id="'+c.id+'">'+esc(tc(c.name))+'</button>').join('')+'</div>'+
  rShotUI(cl)+
  '<button class="cta" data-act="vhhit">'+tr('Play this shot')+'</button><div class="center">'+(v.prev?'<button class="link" data-act="vhundo">'+tr('Undo last shot')+'</button>':'')+'<button class="link" data-act="vhquit">'+tr('End game')+'</button></div>';
  return h;
}

/* ---------- actions ---------- */
const RACT={
 rlat(b,v){R.rlat=Math.max(-200,Math.min(200,(R.rlat||0)+toM(Number(v))));openPanel('range');},
 rfl(b,v){R.rfl=v;openPanel('range');},
 rball(b,v){S.rball=v==='real'?'real':'range';save();R.rd=null;R.rdClub=null;R.vhKey=null;openPanel('range');},
 rbf(b,v){S.rbf=Math.max(0,Math.min(25,rbPct()+Number(v)));save();R.rd=null;R.rdClub=null;R.vhKey=null;openPanel('range');},
 rlog(){const cl=S.clubs.find(x=>x.id===S.rsel);if(!cl)return;const fac=rbFac(cl);
  S.rlog.push({club:cl.id,d:rbReal(cl,R.rd),raw:R.rd,lat:(R.rlat||0)/fac,fl:R.rfl||'n',src:'free',t:Date.now()});S.rlog=S.rlog.slice(-400);R.rlat=0;R.rfl='n';R.rmiss='c';save();openPanel('range');},
 rapply(){const cl=S.clubs.find(x=>x.id===S.rsel),k=cl?rlogCarry(cl.id):{n:0};if(cl&&k.n>=3){cl.carry=k.avg;S.setup=true;save();}openPanel('range');},
 rapplyAll(){S.clubs.forEach(c=>{const k=rlogCarry(c.id);if(k.n>=3){c.carry=k.avg;S.setup=true;}});save();openPanel('range');},
 rclear(){S.rlog=(S.rlog||[]).filter(s=>s.src==='game');R.rd=null;save();openPanel('range');},
 rwipe(){if(!R.rwipe){R.rwipe=true;openPanel('range');return;}R.rwipe=false;S.rlog=[];R.rd=null;save();openPanel('range');},
 vhhit(){const vv=R.vh,cl=S.clubs.find(x=>x.id===S.rsel);if(!vv||!cl)return;
  const H=vv.h,d=vhAim(vv),lm=vv.lie==='rough'?.9:vv.lie==='bunker'?.8:1,rmu=vv.lie==='rough'?.4:vv.lie==='bunker'?0:1;
  const fac=rbFac(cl),real=rbReal(cl,R.rd),fl=R.rfl||'n',latR=(R.rlat||0)/fac,plan=R.rdPlan;
  S.rlog.push({club:cl.id,d:real,raw:R.rd,lat:latR,fl:fl,plan:plan!=null?plan:null,full:plan!=null&&plan>=0.92*cl.carry,src:'game',t:Date.now()});S.rlog=S.rlog.slice(-400);
  const tot=real*lm+cl.roll*0.6*rmu*(FLN[fl]||1),lat=latR;
  const nx=vv.x+d.dx*tot+d.dy*lat,ny=vv.y+d.dy*tot-d.dx*lat;vv.prev=JSON.stringify({x:vv.x,y:vv.y,wp:vv.wp,strokes:vv.strokes,last:vv.last,lie:vv.lie,msg:vv.msg,trail:vv.trail,res:vv.res});vv.strokes++;vv.last=tot;vv.msg='';
  const hit=vhHit(H,nx,ny);
  if(hit==='water'||hit==='tree'||hit==='oob'){vv.strokes++;vv.last=null;vv.trail.push({x:nx,y:ny});vv.trail.push({x:vv.x,y:vv.y});vv.msg=tr(hit==='water'?'Splash! In the water. +1 stroke, play again from the same spot.':(hit==='oob'?'Out of bounds. +1 stroke, play again from the same spot.':'In the trees. +1 stroke, play again from the same spot.'));}
  else{vv.x=nx;vv.y=ny;vv.trail.push({x:nx,y:ny});
    while(vv.wp<H.wps.length-1){const a=H.wps[vv.wp],b2=H.wps[vv.wp+1],past=((vv.x-a.x)*(b2.x-a.x)+(vv.y-a.y)*(b2.y-a.y))>0;if(past||Math.hypot(a.x-vv.x,a.y-vv.y)<70)vv.wp++;else break;}
    const rem=vhRem(vv);
    vv.lie=hit==='green'?'green':(hit==='bunker'?'bunker':(vhFw(H,nx,ny)?'fairway':'rough'));
    if(vv.lie==='bunker')vv.msg=tr('In the bunker.');
    if(hit==='green'){const pu=vhPutts(rem);vv.strokes+=pu;vv.res={rem:rem,putts:pu};}}
  if(!vv.res&&vv.strokes>=10)vv.res={pick:true};
  R.rlat=0;R.rfl='n';R.rmiss='c';R.rbig=false;R.rdClub=null;R.rd=null;R.vhTop=true;save();openPanel('range');},
 vhquit(){const fin=R.vh&&R.vh.fin;R.vh=null;R.rd=null;R.rdClub=null;R.rlat=0;R.rfl='n';if(fin){R.vhSel=[];}openPanel('range');}
};
const _actBase=act;
act=function(a,b){const f=RACT[a];if(f){f(b,b&&b.dataset.v);return;}_actBase(a,b);};