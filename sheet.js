"use strict";
/* ================= decision engine: lowest expected score (Broadie strokes-gained idea) ================= */
const ZN=(function(){let a=2024;const rnd=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};const o=[];for(let i=0;i<100;i++){const u=Math.max(1e-9,rnd()),v=rnd(),m=Math.sqrt(-2*Math.log(u)),x=m*Math.cos(6.2831853*v),y=m*Math.sin(6.2831853*v);o.push([x,y]);o.push([-x,-y]);}return o;})();
const TB_GR=[[0,1],[.5,1.04],[1,1.12],[2,1.5],[3,1.7],[5,1.9],[8,2.05],[12,2.2],[20,2.5],[30,2.75]];
const TB_FW=[[0,2],[10,2.55],[20,2.75],[40,2.95],[70,3.15],[100,3.3],[150,3.65],[200,3.95],[250,4.2],[300,4.45],[400,4.9],[500,5.4],[600,5.9]];
function interp(t,x){if(x<=t[0][0])return t[0][1];for(let i=1;i<t.length;i++)if(x<=t[i][0]){const a=t[i-1],b=t[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}const a=t[t.length-2],b=t[t.length-1];return b[1]+(b[1]-a[1])*(x-b[0])/(b[0]-a[0]);}
function evPos(rem,green){return green&&rem<=12?interp(TB_GR,rem):interp(TB_FW,rem)+(rem<150?0.2:0.3);}
function pipXY(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)c=!c;}return c;}
function decideCore(o){
  const r=o.r,c0=S.cond,mphW=c0.windKmh/KMH_MPH,w=(MODES[r.mode]||{}).w||0,out=[];
  const lieM=o.lieM||[1,1.25,1.5,1.7][c0.lie]||1;
  const eOrig=interp(TB_FW,o.D0)+(lieM>1.2?0.3:0),pinY=o.pin.y;
  (o.cands||[]).forEach(club=>{
    const sw=swingOf(r,club);if(sw<0.55)return;
    const sp=spread(club),dC=expDist(r,club),rollG=Math.min(dC,w*club.roll*r.rollMult/(1+r.pct));
    const part=Math.max(0,1-Math.min(sw,1));
    const sl=sp.lat/1.28*lieM*(1+0.4*part),sdp=sp.dep/1.28*lieM*(1+0.8*part);
    const SL=Math.hypot(sl,mphW*0.3*dC*0.004),SD=Math.hypot(sdp,mphW*0.3*dC*0.008);
    const cs=(o.hz&&!o.noAim)?[-2,-1.5,-1,-.5,0,.5,1,1.5,2].map(k=>k*sl):[0];
    const res=cs.map(cc=>{
      let sum=0,bad=0;
      for(let i=0;i<ZN.length;i++){
        const x=cc+SL*ZN[i][0],y=dC+SD*ZN[i][1];
        let hz=0;
        if(o.hz){hz=o.hz(x,Math.max(0,y-rollG),true);if(hz!==1)hz=o.hz(x,y,false);}
        const rem=Math.hypot(x-o.pin.x,y-pinY);
        if(hz===1){sum+=2+eOrig;bad++;}
        else if(hz===2){sum+=1+interp(TB_FW,rem)+0.6;bad++;}
        else sum+=1+evPos(rem,o.green)+((o.green&&y>pinY+12)?0.15:0);
      }
      return{c:cc,ev:sum/ZN.length,p:bad/ZN.length};});
    let b=res[0];res.forEach(q=>{if(q.ev<b.ev)b=q;});
    const z=res.find(q=>q.c===0)||res[0];
    if(b!==z&&z.ev-b.ev<0.03)b=z;
    out.push({club:club,sw:sw,c:b.c,ev:b.ev,p:b.p,ev0:z.ev});
  });
  if(!out.length)return null;
  out.sort((a,b)=>a.ev-b.ev);
  const d=r.best?out.find(e=>e.club.id===r.best.id):null;
  let pick=out[0];if(d&&d.ev-pick.ev<0.015)pick=d;
  return{club:pick.club,c:pick.c,ev:pick.ev,p:pick.p,list:out,altE:d,ce:pick};
}
let decMemo={k:'',v:null};
function decideApp(cx){
  const {brg,r,aim}=cx;if(!R.me||!r.list||!r.list.length)return null;
  const q=p=>p?p.lat.toFixed(5)+','+p.lng.toFixed(5):'';
  const k=[q(R.me),q(aim),q(R.pin),q(R.target),R.lay?1:0,JSON.stringify(S.cond),S.alt,S.lefty,R.hzs.map(h=>q(h.a)+q(h.b)+q(h.w)).join('|'),S.clubs.map(c=>c.id+':'+c.carry+':'+c.roll+':'+c.on).join(),Object.keys(S.miss).map(i=>i+S.miss[i].length).join()].join('#');
  if(decMemo.k===k)return decMemo.v;
  const sb=Math.sin(brg*rad),cb=Math.cos(brg*rad),kx=111320*Math.cos(R.me.lat*rad);
  const loc=p=>{const E=(p.lng-R.me.lng)*kx,N=(p.lat-R.me.lat)*111320;return{x:E*cb-N*sb,y:E*sb+N*cb};};
  const polys=R.hzs.map(h=>hzPts(h).map(loc));
  const finP=R.lay?(R.target||R.pin||aim):(R.pin||aim),pin=loc(finP),finD=dist(R.me,finP);
  const o={r:r,cands:r.list,pin:pin,green:!!R.pin||finD<=230,D0:finD};
  if(polys.length)o.hz=(x,y)=>{for(let i=0;i<polys.length;i++)if(pipXY(x,y,polys[i]))return 1;return 0;};
  const v=decideCore(o);decMemo={k:k,v:v};return v;
}
function vhDecide(v,rc,rem){
  if(!rc.list||!rc.list.length||!rc.best)return null;
  const d=vhAim(v),H=v.h,ex=H.pin.x-v.x,ey=H.pin.y-v.y;
  const o={r:rc,cands:rc.list,pin:{x:ex*d.dy-ey*d.dx,y:ex*d.dx+ey*d.dy},green:true,D0:rem,noAim:true,lieM:v.lie==='rough'?1.25:v.lie==='bunker'?1.7:1};
  o.hz=(x,y,carry)=>{if(carry)return 0;const h=vhHit(H,v.x+y*d.dx+x*d.dy,v.y+y*d.dy-x*d.dx);return(h==='water'||h==='oob'||h==='tree')?1:(h==='bunker'?2:0);};
  return decideCore(o);
}
function activeCtx(){
  const aim=R.lay||R.target||R.pin;if(!R.me||!aim)return null;
  const D=dist(R.me,aim),brg=bearing(R.me,aim),r=recommend(D,brg);
  const dec=decideApp({aim,D,brg,r});
  if(dec&&r.best&&dec.club.id!==r.best.id){const nb=r.list.find(x=>x.id===dec.club.id);if(nb){r.alt=r.best;r.best=nb;}}
  let club=r.best||r.longest||null;
  if(R.sel&&r.list){const c=r.list.find(x=>x.id===R.sel);if(c)club=c;}
  const ce=dec&&club?dec.list.find(z=>z.club.id===club.id)||null:null;
  return{aim,D,brg,r,club,dec,ce};
}
function drawZone(){
  if(ln.zone){map.removeLayer(ln.zone);ln.zone=null;}
  const cx=activeCtx();if(!cx||!cx.club)return;
  const {r,club,brg}=cx,sp=spread(club),dC=expDist(r,club);
  const across0=cx.ce?cx.ce.c:0;
  const sb=Math.sin(brg*rad),cb=Math.cos(brg*rad),pts=[];
  for(let i=0;i<36;i++){
    const t=i/36*2*Math.PI,along=dC+sp.dep*Math.cos(t),across=across0+sp.lat*Math.sin(t);
    const E=along*sb+across*cb,N=along*cb-across*sb;
    pts.push([R.me.lat+N/111320,R.me.lng+E/(111320*Math.cos(R.me.lat*rad))]);
  }
  ln.zone=L.polygon(pts,{color:'#fff',weight:2,fillColor:'#16a34a',fillOpacity:.38,interactive:false}).addTo(map);
}
function sheetHTML(){
  if(S.pending){
    const cl=S.clubs.find(x=>x.id===S.pending.club);
    return '<div class="center"><div class="lbl">'+tr('Shot in progress')+'</div><div class="big-msg">'+esc(cl?tc(cl.name):tr('Club'))+'</div><div class="sub">'+tr('Play your shot, walk to the ball, then tap below to log the real distance.')+'</div></div>'+
    (R.note?'<div class="aim" style="margin-top:10px">'+esc(R.note)+'</div>':'')+'<button class="cta" style="margin-top:14px" data-act="mark">'+tr("📍 I'm at my ball")+'</button><div class="center"><button class="link" data-act="cancelHit">'+tr('Cancel')+'</button></div>';
  }
  if(!R.me){
    return '<div class="center"><div class="big-msg">'+tr('Finding your position…')+'</div><div class="sub">'+tr('Allow location access when asked. No signal?')+'</div></div>'+
    '<button class="cta" style="margin-top:12px;background:var(--ink)" data-act="mepick">'+tr('Set my position on the map')+'</button>';
  }
  if(R.hzStep)return hzPromptHTML();
  if(R.placePin)return pinPromptHTML();
  const cx=activeCtx();
  if(!cx){
    let h='<div class="center"><div class="big-msg">'+tr('Tap where you want to hit')+'</div><div class="sub">'+tr('Tap where you want to hit, or set the ⛳ pin. Use ⚠ Hazard for water or bunkers.')+'</div></div>'+hzCardHTML()+wxChips(null)+'<div class="center">'+pinLinkHTML()+hzLinkHTML()+'</div>';
    return h;
  }
  const {D,r,club}=cx,unit=ul();
  if(r.short)return '<div class="hero"><div><div class="lbl">'+tr('Short game')+'</div><div class="club">'+tr('Chip or pitch')+'</div></div><div><div class="dist">'+d1(D)+'<small>'+unit+'</small></div></div></div><div class="why">'+tr('Too close for a full swing. Pick your wedge by feel.')+'</div>'+(club?'<div class="aim">'+tr('Try {0} with a {1}% swing',esc(tc(club.name)),Math.max(20,Math.round(swingOf(r,club)*100)))+'</div>':'')+wxChips(r)+(R.lay?'<div class="center"><button class="link" data-act="unlay">'+tr('✕ Back to target')+'</button></div>':'');
  const mine=!!(R.sel&&club&&r.best&&club.id!==r.best.id);
  let h='<div class="hero"><div>';
  if(club){
    h+='<div class="lbl"'+(!r.best&&!mine?' style="color:var(--bad)"':'')+'>'+tr(mine?'Your pick':(R.lay?'Lay-up':(r.partial?'Shorter than any club':(r.best?MODES[r.mode].n:'Out of range'))))+'</div><button class="clubbtn" data-act="picker"'+(club.name.length>10?' style="font-size:30px"':'')+'>'+esc(tc(club.name))+'<span> ▾</span></button>';
  }else h+='<div class="club">'+tr('No clubs')+'</div>';
  h+='</div><div><div class="dist">'+d1(D)+'<small>'+unit+'</small></div><div class="plays">'+tr('plays like {0} {1}',d1(r.plays),unit)+'</div></div></div>';
  const hh=club?hzHitFor(cx):null;
  if(hh){const safe=(hh.clear&&hh.clear.id!==club.id)?hh.clear:(hh.short&&hh.short.id!==club.id?hh.short:null);
    h+='<div class="hz"><div>⚠ '+tr('{0} lands in the hazard.',esc(tc(club.name)))+'</div>'+(safe?'<button class="sec" style="width:100%;margin-top:6px" data-act="selclub" data-id="'+safe.id+'">'+tr('Switch to {0}',esc(tc(safe.name)))+'</button>':'')+'</div>';}
  if(cx.ce&&R.hzs.length&&cx.ce.p>=0.05)h+='<div class="why">⚠ '+tr('{0}% chance of trouble',Math.round(cx.ce.p*100))+'</div>';
  if(!mine&&r.alt&&cx.dec&&cx.dec.altE&&cx.ce&&club.id===r.best.id){const ae=cx.dec.altE;h+=(R.hzs.length&&ae.p-cx.ce.p>=0.08)?'<div class="aim">'+tr('{0} is safer than {1}: {2}% chance of trouble vs {3}%',esc(tc(club.name)),esc(tc(r.alt.name)),Math.round(cx.ce.p*100),Math.round(ae.p*100))+'</div>':'<div class="why">'+tr('Over {0}: better expected score.',esc(tc(r.alt.name)))+'</div>';}
  if(club&&r.best){const sw=swingOf(r,club);if(sw>0.2&&sw<0.95){const pc=Math.round(sw*100);h+='<div class="aim">'+tr('Swing about <b>{0}%</b> of a full shot ({1})',pc,swingWord(pc))+'</div>';}}
  const lt=club?lateral(r,club):null,cc=cx.ce?cx.ce.c:0,adv=lt?cc-lt.total:0;
  if(lt&&Math.abs(adv)>=2){const why=[];if(Math.abs(lt.wind)>=1)why.push(tr('crosswind'));if(Math.abs(lt.slope)>=1)why.push(tr('slope'));if(Math.abs(lt.stance)>=1)why.push(tr('stance'));if(Math.abs(cc)>=2)why.push(tr('hazard'));const wt=why.length>1?why.slice(0,-1).join(', ')+' '+tr('and')+' '+why[why.length-1]:why[0];h+='<div class="aim">'+tr('↔ Aim {0} {1} {2} for the {3}',d1(Math.abs(adv)),unit,tr(adv>0?'right|aim':'left|aim'),wt)+'</div>';}
  const p=r.parts,bits=[],sg=v=>(v>0?'+':'')+d1(v);
  if(Math.abs(p.wind)>=1)bits.push(tr(r.head>=0?'Headwind ':'Tailwind ')+sg(p.wind));
  if(Math.abs(p.temp)>=1)bits.push(tr(p.temp>0?'Cold ':'Warm ')+sg(p.temp));
  if(p.rain>=1)bits.push(tr('Rain ')+sg(p.rain));
  if(p.lie>=1)bits.push(tr(LIES[S.cond.lie].n)+' '+sg(p.lie));
  if(Math.abs(p.elev)>=1)bits.push(tr(p.elev>0?'Uphill ':'Downhill ')+sg(p.elev));
  if(Math.abs(p.alt)>=1)bits.push(tr('Altitude ')+sg(p.alt));
  if(Math.abs(p.stance)>=1)bits.push(tr(S.cond.stance===1?'Uphill lie ':'Downhill lie ')+sg(p.stance));
  if(lt&&Math.abs(lt.slope)>=1)bits.push(tr('Side slope ')+tr(lt.slope<0?'left |s':'right |s')+d1(Math.abs(lt.slope)));
  h+='<div class="why">'+(bits.length?bits.join(' · ')+' '+unit:tr('No adjustments. Conditions are neutral.'))+'</div>';
  if(club){
    const dC=expDist(r,club),diff=dC-D;
    h+='<div class="why">'+(Math.abs(diff)<3?tr('Lands right on target.'):tr(diff<0?'Lands about <b>{0} {1} short</b> of the target.':'Lands about <b>{0} {1} past</b> the target.',d1(Math.abs(diff)),unit))+'</div>';
    if(!r.best&&!mine)h+='<div class="why" style="color:var(--bad);font-weight:700">'+tr('Beyond your bag. Lay up and leave ~{0} {1}.',d1(Math.max(0,r.leave)),unit)+'</div>'+(R.lay?'':'<button class="sec" style="width:100%;margin:8px 0" data-act="lay">'+tr('Lay up: choose my line')+'</button>');
  }
  h+=hzCardHTML();
  if(R.lay&&(R.target||R.pin))h+='<div class="why">'+tr('Leaves <b>{0} {1}</b> {2}. Tap the map or drag the amber circle to choose your line.',d1(dist(R.lay,R.target||R.pin)),unit,tr(R.pin?'to the pin':'to the target'))+'</div>';
  h+=wxChips(r);
  if(club)h+='<button class="cta" data-act="hit" data-club="'+club.id+'" data-d="'+Math.round(D)+'" data-e="'+Math.round(expDist(r,club))+'" data-a="'+lateral(r,club).total.toFixed(1)+'">'+tr('Hit {0}',esc(tc(club.name)))+'</button>';
  h+='<div class="center">'+(R.lay?'<button class="link" data-act="unlay">'+tr('✕ Back to target')+'</button>':'<button class="link" data-act="lay">'+tr('Lay up')+'</button>')+pinLinkHTML()+hzLinkHTML()+'<button class="link" data-act="more">'+tr(R.expanded?'Hide details ▴':'Details ▾')+'</button></div>';
  if(R.expanded)h+=detailsHTML(r);
  return h;
}
function openPicker(){
  const cx=activeCtx();if(!cx)return;const {r,club}=cx,unit=ul();
  const rows=r.list.slice().sort((a,b)=>b.reach-a.reach).map(c=>{
    const diff=c.reach-r.plays,sw=swingOf(r,c);
    return '<button class="pick'+(club&&c.id===club.id?' on':'')+'" data-act="selclub" data-id="'+c.id+'"><span><b>'+esc(tc(c.name))+'</b>'+(r.best&&c.id===r.best.id?' <em>'+tr('recommended')+'</em>':'')+'</span><span>'+d1(c.reach)+' '+unit+' <small>('+(diff>=0?'+':'')+d1(diff)+' · '+(sw>0.2&&sw<0.95?tr('{0}% swing',Math.round(sw*100)):tr('full swing'))+')</small>'+(function(){const e=cx.dec&&cx.dec.list.find(z=>z.club.id===c.id);return e&&R.hzs.length&&e.p>=0.05?' <small>⚠'+Math.round(e.p*100)+'%</small>':'';})()+'</span></button>';
  }).join('');
  $('#mcard').innerHTML='<div class="row" style="justify-content:space-between"><h3>'+tr('Pick a club')+'</h3><button class="x" data-act="mclose">✕</button></div><div class="sub" style="margin:6px 0 10px">'+tr('Reach vs plays-like distance ({0} {1}). The map shows where each one could land.',d1(r.plays),unit)+'</div>'+rows;
  $('#modal').hidden=false;
}
function detailsHTML(r){
  const c=S.cond,unit=ul();let h='<div class="det">';
  h+='<h4>Lie</h4><div class="seg">'+LIES.map((l,i)=>'<button class="'+(c.lie===i?'on':'')+'" data-act="lie" data-v="'+i+'">'+tr(l.n)+'</button>').join('')+'</div>';
  h+='<h4>'+tr('Slope to target')+'</h4><div class="stepper"><button data-act="elev" data-v="-1">−</button><div class="v">'+(c.elev>0?'+':'')+d1(c.elev)+'<small> '+unit+'</small></div><button data-act="elev" data-v="1">+</button></div><div class="sub" style="margin-top:6px">'+tr(R.elevSrc==='auto'?'From map data (rough, a few metres off). Tap − or + to correct it.':'Uphill is positive. Downhill is negative.')+'</div>';
  h+='<h4>'+tr('Where you stand')+'</h4><div class="seg">'+[[0,'Flat lie'],[1,'Uphill lie'],[-1,'Downhill lie']].map(x=>'<button class="'+((c.stance||0)===x[0]?'on':'')+'" data-act="stance" data-v="'+x[0]+'">'+tr(x[1])+'</button>').join('')+'</div><div class="seg" style="margin-top:10px">'+[[0,'Ball level'],[1,'Ball above feet'],[-1,'Ball below feet']].map(x=>'<button class="'+((c.ballh||0)===x[0]?'on':'')+'" data-act="ballh" data-v="'+x[0]+'">'+tr(x[1])+'</button>').join('')+'</div><div class="sub" style="margin-top:6px">'+tr('Uphill lie: higher, shorter, goes left. Downhill lie: lower, farther, goes right. Above your feet goes left, below goes right (flipped if you are left-handed).')+'</div>';
  h+='<h4>'+tr('Which way would the ball roll after landing?')+'</h4><div class="seg">'+[[-2,'← a lot'],[-1,'← a bit'],[0,'Not at all'],[1,'a bit →'],[2,'a lot →']].map(x=>'<button class="'+((c.tilt||0)===x[0]?'on':'')+'" data-act="tilt" data-v="'+x[0]+'">'+tr(x[1])+'</button>').join('')+'</div>';
  h+='<h4>'+tr('Pin')+'</h4><div class="row">'+(R.placePin?'<span class="sub">'+tr('Tap the map to place the pin…')+'</span>':'<button class="sec" data-act="pinmode">⛳ '+tr(R.pin?'Move pin':'Place pin')+'</button>')+(R.pin?'<button class="sec" data-act="clearpin">'+tr('Remove pin')+'</button>':'')+(R.target?'<button class="sec" data-act="cleartarget">'+tr('Clear target')+'</button>':'')+'</div>';
  if(R.target&&R.pin)h+='<div class="sub" style="margin-top:8px">'+tr('Pin is {0} {1} past your target.',d1(dist(R.target,R.pin)),unit)+'</div>';
  return h+'</div>';
}
