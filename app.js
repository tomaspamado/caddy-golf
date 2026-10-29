"use strict";
function bagHTML(){
  let h='<div class="hint">'+tr('<b>Quick set:</b> how far does your 7 iron carry? All clubs scale from it.')+'<div class="row" style="margin-top:8px;flex-wrap:nowrap"><input type="number" inputmode="decimal" id="q7" placeholder="'+tr('7 iron carry ({0})',ul())+'" value="'+d1((S.clubs.find(c=>/^7/.test(c.name))||S.clubs[6]||{carry:130}).carry)+'"><button class="sec" data-act="quick" style="flex:none">'+tr('Apply')+'</button></div></div>'+
  '<div class="brow h"><div>'+tr('Club')+'</div><div>'+tr('Flies {0}',ul())+'</div><div>'+tr('Runs {0}',ul())+'</div><div>'+tr('On')+'</div><div></div></div>';
  S.clubs.forEach(c=>{
    h+='<div class="brow"><input type="text" data-f="cname" data-id="'+c.id+'" value="'+esc(tc(c.name))+'"><input type="number" inputmode="decimal" data-f="ccarry" data-id="'+c.id+'" value="'+d1(c.carry)+'"><input type="number" inputmode="decimal" data-f="croll" data-id="'+c.id+'" value="'+d1(c.roll)+'"><input type="checkbox" data-f="con" data-id="'+c.id+'"'+(c.on?' checked':'')+'><button class="x" style="width:34px;height:34px;font-size:14px" data-act="delClub" data-id="'+c.id+'">✕</button></div>';
    const hs=S.hist[c.id],sp=spread(c);
    if((hs&&hs.length>=2)||sp.learned){let t='';
      if(hs&&hs.length>=2){const avg=hs.reduce((a,b)=>a+b,0)/hs.length;t+=tr('Measured avg <b>{0}</b> ({1} shots) vs set {2}',d1(avg),hs.length,d1(c.carry+c.roll)).replace('<b>','<b style="color:var(--accd)">')+' <button class="sec" style="padding:5px 10px;font-size:12px" data-act="calib" data-id="'+c.id+'">'+tr('Calibrate')+'</button> ';}
      if(sp.learned)t+=tr('Learned miss: ±{0} wide, ±{1} deep',d1(sp.lat),d1(sp.dep));
      h+='<div class="sub" style="margin:-3px 0 10px 4px;font-size:13px">'+t+'</div>';}
  });
  return h+'<div class="row" style="margin-top:10px"><button class="sec" data-act="addClub">'+tr('＋ Add club')+'</button><button class="sec" data-act="resetBag">'+tr('Reset defaults')+'</button></div><div class="hint">'+tr("<b>Flies</b> = how far the ball flies. <b>Runs</b> = how far it rolls after landing. Untick a club you don't carry.")+'</div><h4 class="lbl" style="margin:22px 0 8px">'+tr('Shot history')+'</h4>'+shotsHTML();
}
function shotsHTML(){
  if(!S.log.length)return '<div class="hint">'+tr("No shots yet. Tap <b>Hit [club]</b> on the main screen, play the shot, then tap <b>I'm at my ball</b>. Your real GPS distances and misses build up here. After 5 shots with a club, its landing zone is learned from you.")+'</div>';
  let h='';S.log.slice().reverse().slice(0,60).forEach(s=>{const c=S.clubs.find(x=>x.id===s.club);h+='<div class="shot"><b>'+esc(c?tc(c.name):'?')+(s.hole?' <small class="sub">'+tr('· hole {0}',s.hole)+'</small>':'')+'</b><span>'+d1(s.actual)+' '+ul()+' <span class="sub">'+tr('(planned {0})',d1(s.planned))+'</span></span></div>';});
  return h+'<div style="margin-top:12px"><button class="sec" data-act="clearLog">'+tr('Clear shot history')+'</button></div>';
}
function settingsHTML(){
  return '<h4 class="lbl">'+tr('Language')+'</h4><div class="seg"><button class="'+(S.lang==='pt'?'':'on')+'" data-act="lang" data-v="en">English</button><button class="'+(S.lang==='pt'?'on':'')+'" data-act="lang" data-v="pt">Português</button></div>'+
  '<h4 class="lbl" style="margin-top:18px">'+tr('Units')+'</h4><div class="seg"><button class="'+(S.units==='m'?'on':'')+'" data-act="units" data-v="m">'+tr('Metres')+'</button><button class="'+(S.units==='y'?'on':'')+'" data-act="units" data-v="y">'+tr('Yards')+'</button></div>'+
  '<h4 class="lbl" style="margin-top:18px">'+tr('I hit')+'</h4><div class="seg"><button class="'+(S.lefty?'':'on')+'" data-act="hand" data-v="0">'+tr('Right-handed')+'</button><button class="'+(S.lefty?'on':'')+'" data-act="hand" data-v="1">'+tr('Left-handed')+'</button></div>'+
  '<h4 class="lbl" style="margin-top:18px">'+tr('Scorecard')+'</h4><div class="seg"><button class="'+(S.stats?'':'on')+'" data-act="togstats" data-v="0">'+tr('Score only')+'</button><button class="'+(S.stats?'on':'')+'" data-act="togstats" data-v="1">Putts, fairways, greens</button></div>'+
  '<div class="hint" style="margin-top:18px">'+tr('<b>How the caddy thinks.</b> It adjusts the distance for wind (about 6% per 10 km/h into the wind, half that downwind), cold air (about 1.5% per 10°C), rain, rough or sand, and slope, then picks the club whose carry plus roll matches. The green oval is where about 80% of your shots with that club should finish; it starts as an estimate and learns from the shots you log. These are rules of thumb. Your logged shots make it more accurate.')+'</div>'+
  '<div class="hint">'+tr('<b>Club choice.</b> Besides distance, the caddy simulates 200 shots with your spread for every club, counts the hazards you drew, and picks the club with the lowest expected score. It may also tell you to aim away from trouble.')+'</div>'+
  '<div class="hint">'+tr('Weather: Open-Meteo. Height above sea level and slope between you and the target: Copernicus DEM (90 m grid) via Open-Meteo, so slope can be a few metres off; you can always correct it. Map imagery: Esri.')+'</div>'+
  '<div style="margin-top:12px"><button class="sec" data-act="resetAll">'+tr('Reset all my data')+'</button></div>';
}

$('#menuBtn').addEventListener('click',()=>openPanel());
$('#holePill').addEventListener('click',()=>openHole());
$('#pclose').addEventListener('click',()=>{$('#panel').hidden=true;refresh();});
$('#ptabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)openPanel(b.dataset.p);});

/* ================= events ================= */
let resetArm=false;
function act(a,b){
  const v=b&&b.dataset.v,c=S.cond;let chg=true;
  switch(a){
    case 'cond':openCond();return;
    case 'mclose':resetArm=false;R.armFinish=false;R.armDel=null;$('#modal').hidden=true;refresh();return;
    case 'bag':openPanel('bag');return;
    case 'mepick':R.mePick=true;setGps('wait','Tap map: where you stand');return;
    case 'more':R.expanded=!R.expanded;if(R.expanded)setTimeout(()=>{const d=document.querySelector('#sheet .det');if(d)d.scrollIntoView({block:'nearest',behavior:'smooth'});},120);break;
    case 'mode':c.mode=v;break;
    case 'lie':c.lie=Number(v);break;
    case 'tilt':c.tilt=Number(v);break;
    case 'stance':c.stance=Number(v);break;
    case 'ballh':c.ballh=Number(v);break;
    case 'lang':S.lang=v==='pt'?'pt':'en';save();applyStatic();openPanel('settings');refresh();return;
    case 'hand':S.lefty=v==='1';save();openPanel('settings');refresh();return;
    case 'elev':R.elevSrc='manual';c.elev=Math.round((c.elev+toM(1)*Number(v))*10)/10;break;
    case 'pinmode':R.placePin=true;break;
    case 'clearpin':R.pin=null;rmKey('p');break;
    case 'hz':R.hzStep='a';refresh();return;
    case 'hzskip':R.hzStep=null;R.hzCur=null;refresh();return;
    case 'hzcancel':if(R.hzStep!=='w'&&R.hzCur)delHz(R.hzCur.id);R.hzStep=null;R.hzCur=null;refresh();return;
    case 'hzdel':delHz(Number(b.dataset.id));refresh();return;
    case 'pincancel':R.placePin=false;refresh();return;
    case 'lay':startLay();return;
    case 'unlay':endLay();return;
    case 'cleartarget':if(R.lay)endLay();R.target=null;rmKey('t');R.framed=false;break;
    case 'ws':c.windKmh=Math.max(0,Math.round(wFrom(wDisp(c.windKmh)+Number(v))));S.wxAuto=false;save();openCond();refresh();return;
    case 'tp':c.temp+=Number(v);S.wxAuto=false;save();openCond();refresh();return;
    case 'rain':c.rain=Number(v);S.wxAuto=false;save();openCond();refresh();return;
    case 'ground':c.ground=Number(v);save();openCond();refresh();return;
    case 'wx':S.wxAuto=true;fetchWeather().then(ok=>{if(!ok)alertNote(tr('No connection – enter manually'));});return;
    case 'hit':S.pending={club:b.dataset.club,start:R.me?{lat:R.me.lat,lng:R.me.lng}:null,target:(function(){const g=R.lay||R.target||R.pin;return g?{lat:g.lat,lng:g.lng}:null;})(),planned:Number(b.dataset.d),exp:Number(b.dataset.e),drift:Number(b.dataset.a)||0};break;
    case 'cancelHit':S.pending=null;break;
    case 'mark':{const p=S.pending;if(p&&p.start&&R.me){const d=dist(p.start,R.me);if(R.acc&&R.acc>25){R.note=tr('GPS is too weak to measure ({0} m). Try again in a few seconds.',Math.round(R.acc));refresh();return;}if(d<10){R.note=tr('That is under 10 m from where you hit. Walk to your ball first.');refresh();return;}R.note='';{(S.hist[p.club]=S.hist[p.club]||[]).push(d);S.hist[p.club]=S.hist[p.club].slice(-15);
      if(p.target){const tb=bearing(p.start,p.target),bb=bearing(p.start,R.me);(S.miss[p.club]=S.miss[p.club]||[]).push({lat:d*Math.sin((bb-tb)*rad)-(p.drift||0),de:d-(p.exp||p.planned)});S.miss[p.club]=S.miss[p.club].slice(-20);}
      S.log.push({t:Date.now(),club:p.club,planned:p.planned,actual:d,hole:S.round?S.round.cur+1:null});S.log=S.log.slice(-200);R.target=null;rmKey('t');R.sel=null;if(R.lay){R.lay=null;rmKey('ly');}R.elevSrc=null;S.cond.elev=0;S.cond.lie=0;S.cond.tilt=0;S.cond.stance=0;S.cond.ballh=0;elevKey='';}}S.pending=null;break;}
    case 'units':S.units=v;save();openPanel('settings');refresh();return;
    case 'quick':{const val=toM(Number($('#q7').value)||0);const cl=S.clubs.find(x=>/^7/.test(x.name))||S.clubs[6]||S.clubs[0];if(val>20&&cl){const f=val/cl.carry;S.clubs.forEach(x=>{x.carry*=f;x.roll*=f;});S.setup=true;save();openPanel('bag');}return;}
    case 'addClub':S.clubs.push({id:'c'+(S.nid++),name:tr('New club'),carry:100,roll:5,on:true});S.setup=true;save();openPanel('bag');return;
    case 'delClub':S.clubs=S.clubs.filter(x=>x.id!==b.dataset.id);delete S.hist[b.dataset.id];delete S.miss[b.dataset.id];save();openPanel('bag');return;
    case 'resetBag':S.clubs=defaultClubs();S.hist={};S.miss={};S.setup=false;save();openPanel('bag');return;
    case 'calib':{const cl=S.clubs.find(x=>x.id===b.dataset.id),hs=S.hist[b.dataset.id];if(cl&&hs&&hs.length){const avg=hs.reduce((x,y)=>x+y,0)/hs.length,f=avg/(cl.carry+cl.roll);cl.carry*=f;cl.roll*=f;S.hist[b.dataset.id]=[];}save();openPanel('bag');return;}
    case 'clearLog':S.log=[];S.hist={};S.miss={};save();openPanel('bag');return;
    case 'resetAll':if(!resetArm){resetArm=true;b.textContent=tr('Tap again to confirm');return;}try{localStorage.removeItem(KEY);}catch(e){}location.reload();return;
    case 'rsel':S.rsel=b.dataset.id;R.rd=null;save();openPanel('range');return;
    case 'rstep':R.rd=Math.max(0,(R.rd||0)+toM(Number(v)));openPanel('range');return;
    case 'rmiss':R.rmiss=v;openPanel('range');return;
    case 'rlog':{S.rlog.push({club:S.rsel,d:R.rd,side:R.rmiss||'c',t:Date.now()});S.rlog=S.rlog.slice(-300);R.rmiss='c';R.rdClub=null;save();openPanel('range');return;}
    case 'rapply':{const cl=S.clubs.find(x=>x.id===S.rsel),m=S.rlog.filter(s=>s.club===S.rsel);if(cl&&m.length>=3){cl.carry=m.reduce((a,s)=>a+s.d,0)/m.length;S.setup=true;save();}openPanel('range');return;}
    case 'rclear':S.rlog=[];R.rd=null;save();openPanel('range');return;
    case 'rmode':R.rmode=v;R.rd=null;openPanel('range');return;
    case 'rbig':R.rbig=!R.rbig;openPanel('range');return;
    case 'vhstart':{const t=($('#vhl')||{}).value||'';R.vhText=t;const ss=R.vhSel||[];
      let hs=ss.map(id=>LIB.find(o=>o.id===id)).filter(Boolean);
      if(!hs.length)hs=t.split(/[\s,;]+/).map(Number).filter(x=>x>20&&x<900).map((x,i)=>genHole(x/U(),i));
      if(!hs.length)return;
      R.vh={holes:hs,i:0,h:hs[0],x:0,y:0,wp:0,strokes:0,done:[],res:null,last:null,fin:false,trail:[{x:0,y:0}],lie:'tee',msg:''};R.rd=null;R.vhTop=true;openPanel('range');return;}
    case 'vhpick':{if($('#vhl'))R.vhText=$('#vhl').value;const ss=R.vhSel=R.vhSel||[],k=ss.indexOf(b.dataset.id);if(k>=0)ss.splice(k,1);else ss.push(b.dataset.id);openPanel('range');return;}
    case 'vhall':if($('#vhl'))R.vhText=$('#vhl').value;R.vhSel=LIB.filter(o=>v==='easy'?o.lvl===1:v==='med'?o.lvl===2:v==='fam'?o.lvl===3:true).map(o=>o.id);openPanel('range');return;
    case 'vhnone':if($('#vhl'))R.vhText=$('#vhl').value;R.vhSel=[];openPanel('range');return;
    case 'vhhit':{const vv=R.vh,cl=S.clubs.find(x=>x.id===S.rsel);if(!vv||!cl)return;
      const H=vv.h,d=vhAim(vv),lm=vv.lie==='rough'?.9:vv.lie==='bunker'?.8:1,rmu=vv.lie==='rough'?.4:vv.lie==='bunker'?0:1;
      const tot=R.rd*lm+cl.roll*0.6*rmu,lat=({l:-1,c:0,r:1}[R.rmiss||'c'])*R.rd*(R.rbig?0.2:0.08);
      const nx=vv.x+d.dx*tot+d.dy*lat,ny=vv.y+d.dy*tot-d.dx*lat;vv.prev=JSON.stringify({x:vv.x,y:vv.y,wp:vv.wp,strokes:vv.strokes,last:vv.last,lie:vv.lie,msg:vv.msg,trail:vv.trail,res:vv.res});vv.strokes++;vv.last=tot;vv.msg='';
      const hit=vhHit(H,nx,ny);
      if(hit==='water'||hit==='tree'||hit==='oob'){vv.strokes++;vv.last=null;vv.trail.push({x:nx,y:ny});vv.trail.push({x:vv.x,y:vv.y});vv.msg=tr(hit==='water'?'Splash! In the water. +1 stroke, play again from the same spot.':(hit==='oob'?'Out of bounds. +1 stroke, play again from the same spot.':'In the trees. +1 stroke, play again from the same spot.'));}
      else{vv.x=nx;vv.y=ny;vv.trail.push({x:nx,y:ny});
        while(vv.wp<H.wps.length-1){const a=H.wps[vv.wp],b=H.wps[vv.wp+1],past=((vv.x-a.x)*(b.x-a.x)+(vv.y-a.y)*(b.y-a.y))>0;if(past||Math.hypot(a.x-vv.x,a.y-vv.y)<70)vv.wp++;else break;}
        const rem=vhRem(vv);
        vv.lie=hit==='green'?'green':(hit==='bunker'?'bunker':(vhFw(H,nx,ny)?'fairway':'rough'));
        if(vv.lie==='bunker')vv.msg=tr('In the bunker.');
        if(hit==='green'){const pu=vhPutts(rem);vv.strokes+=pu;vv.res={rem:rem,putts:pu};}}
      if(!vv.res&&vv.strokes>=10)vv.res={pick:true};
      R.rmiss='c';R.rbig=false;R.rdClub=null;R.rd=null;R.vhTop=true;save();openPanel('range');return;}
    case 'vhundo':{const vv=R.vh;if(vv&&vv.prev){Object.assign(vv,JSON.parse(vv.prev));vv.prev=null;R.rd=null;R.rdClub=null;R.vhShot=null;R.vhTop=true;openPanel('range');}return;}
    case 'vhnext':{const vv=R.vh;vv.done.push({len:vv.h.len,par:vv.h.par,strokes:vv.strokes,name:vv.h.name});
      if(vv.i>=vv.holes.length-1){vv.fin=true;S.rounds.unshift({id:Date.now(),date:Date.now(),course:tr('Range game'),range:true,holes:vv.done.map((h2,i2)=>({n:i2+1,par:h2.par,score:h2.strokes,putts:null,fw:null}))});S.rounds=S.rounds.slice(0,100);save();}else{vv.i++;vv.h=vv.holes[vv.i];vv.x=0;vv.y=0;vv.wp=0;vv.strokes=0;vv.res=null;vv.last=null;vv.trail=[{x:0,y:0}];vv.lie='tee';vv.msg='';vv.prev=null;}
      R.rd=null;R.rdClub=null;R.vhTop=true;openPanel('range');return;}
    case 'vhquit':R.vh=null;R.rd=null;R.rdClub=null;openPanel('range');return;
    case 'picker':openPicker();return;
    case 'selclub':R.sel=b.dataset.id;$('#modal').hidden=true;break;
        case 'nh':S.nh=Number(v);R.cname=($('#rname')||{}).value||R.cname;save();openPanel('round');return;
    case 'startRound':{const name=(($('#rname')||{}).value||'').trim()||tr('My round');R.cname='';S.round={id:Date.now(),date:Date.now(),course:name,cur:0,holes:Array.from({length:S.nh},(_,i)=>({n:i+1,par:4,score:null,putts:null,fw:null}))};save();openPanel('round');refresh();return;}
    case 'hole':$('#panel').hidden=true;openHole(b.dataset.i);refresh();return;
    case 'hstep':{const h=S.round.holes[S.round.cur],k=b.dataset.k,d=Number(v),base=k==='score'?h.par:2;h[k]=Math.max(k==='score'?1:0,(h[k]==null?base:h[k])+d);save();openHole();updatePill();return;}
    case 'hpar0':{const h=S.round.holes[S.round.cur];h.score=h.par;save();openHole();updatePill();return;}
    case 'togstats':S.stats=v==='1';save();openPanel('settings');return;
    case 'setup7':{const val=toM(Number(($('#q7s')||{}).value)||0),cl=S.clubs.find(x=>/^7/.test(x.name))||S.clubs[0];if(val>20&&cl){const f=val/cl.carry;S.clubs.forEach(x=>{x.carry*=f;x.roll*=f;});}S.setup=true;save();$('#modal').hidden=true;refresh();return;}
    case 'skipSetup':S.setup=true;save();$('#modal').hidden=true;refresh();return;
    case 'hpar':{const h=S.round.holes[S.round.cur];h.par=Number(v);if(h.par===3)h.fw=null;save();openHole();updatePill();return;}
    case 'hfw':{const h=S.round.holes[S.round.cur];h.fw=h.fw===v?null:v;save();openHole();return;}
    case 'hnav':{const rd=S.round,n=rd.holes.length,nx=rd.cur+Number(v);if(nx>=0&&nx<n&&nx!==rd.cur)newHole();if(b.dataset.save){const ch=rd.holes[rd.cur];if(ch.score==null)ch.score=ch.par;}if(nx>=n){$('#modal').hidden=true;save();refresh();return;}rd.cur=Math.max(0,nx);save();openHole();updatePill();return;}
    case 'finishRound':{if(!R.armFinish){R.armFinish=true;b.textContent=tr('Tap again to finish');return;}R.armFinish=false;const rd=S.round;rd.end=Date.now();if(roundTotals(rd).n>0)S.rounds.unshift(rd);S.rounds=S.rounds.slice(0,100);S.round=null;save();openPanel('round');refresh();return;}
    case 'viewRound':viewRound(b.dataset.id);return;
    case 'delRound':{if(R.armDel!==b.dataset.id){R.armDel=b.dataset.id;b.textContent=tr('Tap again to delete');return;}R.armDel=null;S.rounds=S.rounds.filter(x=>String(x.id)!==String(b.dataset.id));save();$('#modal').hidden=true;if(!$('#panel').hidden)openPanel('round');return;}
    default:chg=false;
  }
  if(chg){save();refresh();}
}
function alertNote(t){const b=document.querySelector('#mcard .hint span');if(b)b.textContent=t;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)act(b.dataset.act,b);});
document.addEventListener('change',e=>{
  const t=e.target,f=t.dataset.f;if(!f)return;const id=t.dataset.id,cl=id&&S.clubs.find(x=>x.id===id),val=t.value;
  if(f==='cname'&&cl)cl.name=val;
  else if(f==='ccarry'&&cl){cl.carry=Math.max(0,toM(Number(val)||0));S.setup=true;}
  else if(f==='croll'&&cl){cl.roll=Math.max(0,toM(Number(val)||0));S.setup=true;}
  else if(f==='con'&&cl)cl.on=t.checked;
  save();
});
$('#mcard').addEventListener('click',e=>{});
document.addEventListener('click',e=>{if(e.target.id==='modal'){$('#modal').hidden=true;refresh();}});
document.addEventListener('click',e=>{const d=e.target.closest('#dial');if(d)dialClick({currentTarget:d,clientX:e.clientX,clientY:e.clientY});});
$('#grab').addEventListener('click',()=>{R.expanded=!R.expanded;renderSheet();});

/* ================= boot ================= */
function openSetup(){$('#mcard').innerHTML='<h3>'+tr('Welcome to Caddy')+'</h3><div class="sub" style="margin:8px 0 14px">'+tr('One question to start: how far does your 7 iron fly through the air (carry)? Every other club is set from it, and you can change them anytime in Bag.')+'</div><div class="field"><input type="number" inputmode="decimal" id="q7s" value="'+d1(130)+'"><div class="sub" style="margin-top:6px">'+tr(S.units==='y'?'in yards':'in metres')+'</div></div><button class="cta" data-act="setup7">'+tr('Start')+'</button><div class="center"><button class="link" data-act="skipSetup">'+tr('Use the defaults for now')+'</button></div>';$('#modal').hidden=false;}
function applyStatic(){document.documentElement.lang=S.lang==='pt'?'pt-PT':'en';document.title=tr('Caddy – Golf GPS & Club Advisor');
  const tb={round:'Round',range:'Range',bag:'Bag',settings:'Settings'};document.querySelectorAll('#ptabs button').forEach(b=>b.textContent=tr(tb[b.dataset.p]));
  $('#locate').setAttribute('aria-label',tr('Centre on me'));setGps(R.g?R.g[0]:'wait',R.g?R.g[1]:'Finding GPS…');}
applyStatic();renderSheet();startGPS();if(!S.setup)setTimeout(openSetup,400);
function reqWake(){try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(()=>{});}catch(e){}}
reqWake();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reqWake();});
window.__caddy={newHole,delHz,clearHz,placeHz,hzInfo,doElev,startLay,moveLay,endLay,S,R,calc,recommend,setMe,placeTarget,placePinAt,refresh,spread,activeCtx,ln};
