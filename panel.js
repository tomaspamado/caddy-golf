"use strict";
/* ================= conditions modal ================= */
function dialSVG(){
  const c=S.cond,F=c.windFrom;
  const pt=(a,rr)=>[100+rr*Math.sin(a*rad),100-rr*Math.cos(a*rad)];
  const [x1,y1]=pt(F,82),[x2,y2]=pt(F,34);
  const ah=(a,rr,s)=>{const [px,py]=pt(a,rr);const l=pt(a-150,s),r=pt(a+150,s);return px+','+py+' '+(px+(l[0]-100))+','+(py+(l[1]-100))+' '+(px+(r[0]-100))+','+(py+(r[1]-100));};
  const ah2=(a,rr,s)=>{const [px,py]=pt(a,rr),l=pt(a+30,s),r=pt(a-30,s);return px+','+py+' '+(px+l[0]-100)+','+(py+l[1]-100)+' '+(px+r[0]-100)+','+(py+r[1]-100);};
  let s='<svg class="dial" id="dial" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="86" fill="#f2f6f3" stroke="#d3dbd6" stroke-width="2"/>';
  [['N',0],['E',90],['S',180],['W',270]].forEach(d=>{const [tx,ty]=pt(d[1],72);s+='<text x="'+tx+'" y="'+(ty+4)+'" text-anchor="middle" font-size="12" font-weight="700" fill="#5b6b61">'+dirL(d[0])+'</text>';});
  const aim=R.target||R.pin;
  if(R.me&&aim){const b=bearing(R.me,aim),[bx,by]=pt(b,86);s+='<line x1="100" y1="100" x2="'+bx+'" y2="'+by+'" stroke="#16a34a" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 9"/><circle cx="'+bx+'" cy="'+by+'" r="6" fill="#16a34a"/>';}
  if(c.windKmh>=1){s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#2563eb" stroke-width="6" stroke-linecap="round"/><polygon points="'+ah2(F,34,14)+'" fill="#2563eb"/>';}
  return s+'<circle cx="100" cy="100" r="5" fill="#0f1f16"/></svg>';
}
function openCond(){
  const c=S.cond,m=$('#modal');m.hidden=false;
  const step=S.units==='y'?1:2;
  $('#mcard').innerHTML='<div class="row" style="justify-content:space-between"><h3>'+tr('Conditions')+'</h3><button class="x" data-act="mclose">✕</button></div>'+
  '<div class="hint" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span>'+tr(S.wxAuto&&S.wxOk?'Live weather for your location':(S.wxOk?'Entered manually':'Not loaded yet. Tap to load, or enter it yourself.'))+'</span><button class="sec" data-act="wx">'+tr('↻ Live weather')+'</button></div>'+
  '<div class="lbl">'+tr('Wind direction: tap the dial where the wind comes from')+'</div>'+dialSVG()+
  '<div class="legend"><i style="background:#2563eb"></i>'+tr('Wind from {0}',dirL(nearestDir(c.windFrom)))+' <i style="background:#16a34a;margin-left:12px"></i>'+tr('Your shot')+'</div>'+
  '<div class="field center"><div class="lbl">'+tr('Wind speed')+'</div><div class="stepper" style="justify-content:center"><button data-act="ws" data-v="-'+step+'">−</button><div class="v">'+wDisp(c.windKmh)+'<small> '+wl()+'</small></div><button data-act="ws" data-v="'+step+'">+</button></div></div>'+
  '<div class="field center"><div class="lbl">'+tr('Temperature')+'</div><div class="stepper" style="justify-content:center"><button data-act="tp" data-v="-1">−</button><div class="v">'+c.temp+'<small> °C</small></div><button data-act="tp" data-v="1">+</button></div></div>'+
  '<div class="field"><div class="lbl" style="margin-bottom:6px">'+tr('Rain')+'</div><div class="seg">'+['Dry','Light','Heavy'].map((n,i)=>'<button class="'+(c.rain===i?'on':'')+'" data-act="rain" data-v="'+i+'">'+tr(n)+'</button>').join('')+'</div></div>'+
  '<button class="cta" data-act="mclose">'+tr('Done')+'</button>';
}
function dialClick(e){
  const svg=e.currentTarget,rc=svg.getBoundingClientRect();
  const cx=rc.left+rc.width/2,cy=rc.top+rc.height/2;
  let a=Math.atan2(e.clientX-cx,-(e.clientY-cy))/rad;a=(a+360)%360;
  S.cond.windFrom=Math.round(a/5)*5%360;S.wxAuto=false;save();openCond();refresh();
}

/* ================= menu panel ================= */
let ptab='round';
function openPanel(t){
  ptab=t||ptab;$('#panel').hidden=false;resetArm=false;R.armFinish=false;R.armDel=null;
  document.querySelectorAll('#ptabs button').forEach(b=>b.classList.toggle('on',b.dataset.p===ptab));
  $('#pbody').innerHTML=ptab==='round'?roundHTML():ptab==='range'?rangeHTML():ptab==='bag'?bagHTML():settingsHTML();
  if(R.vhTop){$('#pbody').scrollTop=0;R.vhTop=false;}
  if(ptab==='range'&&R.rmode==='hole'){if(R.vh)drawVh();else drawThumbs();}
}

/* ---------- rounds & scorecard ---------- */
const fmtTo=v=>v===0?tr('E|par'):(v>0?'+'+v:''+v);
function roundTotals(rd){let sc=0,par=0,pt=0,n=0;rd.holes.forEach(h=>{if(h.score!=null){sc+=h.score;par+=h.par;n++;}if(h.putts!=null)pt+=h.putts;});return{sc,par,n,pt,to:sc-par};}
function isGIR(h){return h.score!=null&&h.putts!=null&&h.score-h.putts<=h.par-2;}
function scoreCls(h){if(h.score==null)return '';const d=h.score-h.par;return d<=-2?'eag':d===-1?'bir':d===0?'':d===1?'bog':'dbl';}
function cardHTML(rd,editable){
  const full=S.stats,cls='sc'+(full?'':' lite');
  let h='<div class="'+cls+' hd"><div>#</div><div>'+tr('Par')+'</div><div>'+tr('Score')+'</div>'+(full?'<div>Putts</div><div>FW</div><div>GIR</div>':'')+'</div>';
  const cells=x=>'<div>'+x.par+'</div><div><span class="scv '+scoreCls(x)+'">'+(x.score==null?'–':x.score)+'</span></div>'+(full?'<div>'+(x.putts==null?'–':x.putts)+'</div><div>'+(x.par<4?'':({hit:'✓',left:'←',right:'→'}[x.fw]||'–'))+'</div><div>'+(x.score==null||x.putts==null?'–':isGIR(x)?'✓':'✗')+'</div>':'');
  const sub=(label,arr)=>{let p=0,s=0,pt=0,any=false;arr.forEach(x=>{p+=x.par;if(x.score!=null){s+=x.score;any=true;}if(x.putts!=null)pt+=x.putts;});return '<div class="'+cls+' tot"><div>'+tr(label)+'</div><div>'+p+'</div><div>'+(any?s:'–')+'</div>'+(full?'<div>'+(pt||'–')+'</div><div></div><div></div>':'')+'</div>';};
  const rows=editable?rd.holes.filter((x,i)=>x.score!=null||i===rd.cur):rd.holes;
  rows.forEach(x=>{const i=x.n-1;
    h+='<div class="'+cls+(editable&&rd.cur===i?' cur':'')+'"'+(editable?' data-act="hole" data-i="'+i+'"':'')+'><div>'+x.n+'</div>'+cells(x)+'</div>';
    if(!editable&&rd.holes.length===18){if(x.n===9)h+=sub('Out',rd.holes.slice(0,9));if(x.n===18)h+=sub('In',rd.holes.slice(9));}
  });
  const left=rd.holes.length-rows.length;
  if(editable&&left>0)h+='<div class="sub center" style="padding:10px">'+tr('{0} more holes to play',left)+'</div>';
  return h+sub('Total',rd.holes);
}
function statsHTML(){
  const rs=S.rounds.filter(rd=>!rd.range&&roundTotals(rd).n>=9);if(!rs.length)return '';
  let norm=[],fwH=0,fwN=0,g=0,gN=0,pt=0,ptN=0;
  rs.forEach(rd=>{const t=roundTotals(rd);norm.push(t.sc/t.n*18);rd.holes.forEach(x=>{if(x.par>3&&x.score!=null&&x.fw!=null){fwN++;if(x.fw==='hit')fwH++;}if(x.score!=null&&x.putts!=null){gN++;if(isGIR(x))g++;}if(x.putts!=null){pt+=x.putts;ptN++;}});});
  const avg=Math.round(norm.reduce((a,b)=>a+b,0)/norm.length),best=Math.round(Math.min.apply(null,norm));
  const cell=(l,v)=>'<div class="stat"><div class="lbl">'+tr(l)+'</div><div class="big">'+v+'</div></div>';
  return '<h4 class="lbl" style="margin:18px 0 8px">'+tr('Your stats')+'</h4><div class="stats">'+cell('Rounds',rs.length)+cell('Avg per 18',avg)+cell('Best per 18',best)+(S.stats?cell('Fairways',fwN?Math.round(fwH/fwN*100)+'%':'–')+cell('Greens',gN?Math.round(g/gN*100)+'%':'–')+cell('Putts/hole',ptN?(pt/ptN).toFixed(1):'–'):'')+'</div>';
}
function historyHTML(){
  if(!S.rounds.length)return '';
  return '<h4 class="lbl" style="margin:18px 0 8px">'+tr('Past rounds')+'</h4>'+S.rounds.map(rd=>{const t=roundTotals(rd),d=new Date(rd.date);
    return '<button class="pick" data-act="viewRound" data-id="'+rd.id+'"><span><b>'+esc(rd.course)+'</b><br><small>'+d.toLocaleDateString(S.lang==='pt'?'pt-PT':undefined,{day:'numeric',month:'short',year:'numeric'})+' · '+tr('{0} holes',rd.holes.length)+'</small></span><span><b style="font-size:20px">'+(t.n?t.sc:'–')+'</b> <small>'+(t.n?fmtTo(t.to):'')+'</small></span></button>';}).join('');
}
function roundHTML(){
  const rd=S.round;let h='';
  if(!rd){
    h+='<div class="hint"><b style="color:var(--ink);font-size:17px">'+tr('Start a round')+'</b><div class="field"><input type="text" id="rname" placeholder="'+tr('Course name')+'" value="'+esc(R.cname||'')+'"></div><div class="seg">'+[18,9].map(n=>'<button class="'+(S.nh===n?'on':'')+'" data-act="nh" data-v="'+n+'">'+tr('{0} holes',n)+'</button>').join('')+'</div><button class="cta" style="margin-top:12px" data-act="startRound">'+tr('Start round')+'</button></div>';
  }else{
    const t=roundTotals(rd);
    h+='<div class="hint" style="background:var(--ink);color:#fff"><div class="lbl" style="color:#9fb3a7">'+esc(rd.course)+'</div><div class="big" style="color:#fff;font-size:'+(t.n?34:22)+'px">'+(t.n?t.sc+' <small style="font-size:18px">'+fmtTo(t.to)+'</small>':tr('No score yet'))+'</div><div style="margin-top:6px">'+tr('Hole {0} of {1}',rd.cur+1,rd.holes.length)+'</div></div>'+
    '<button class="cta" data-act="hole" data-i="'+rd.cur+'">'+tr('Enter score for hole {0}',rd.cur+1)+'</button><div style="height:12px"></div>'+cardHTML(rd,true)+
    '<div style="margin-top:14px"><button class="sec" data-act="finishRound">'+tr('Finish round')+'</button></div>';
  }
  return h+statsHTML()+historyHTML();
}
function updatePill(){
  const p=$('#holePill');
  if(!S.round){p.hidden=true;return;}
  const rd=S.round,t=roundTotals(rd);p.hidden=false;p.textContent=tr('⛳ Hole {0}',rd.cur+1)+(t.n?' · '+fmtTo(t.to):'');
}
function stp(label,key,val){return '<div class="field center"><div class="lbl">'+tr(label)+'</div><div class="stepper" style="justify-content:center"><button data-act="hstep" data-k="'+key+'" data-v="-1">−</button><div class="v">'+val+'</div><button data-act="hstep" data-k="'+key+'" data-v="1">+</button></div></div>';}
function stpScore(h){const has=h.score!=null;return '<div class="field center"><div class="lbl">'+tr('Strokes')+'</div><div class="stepper" style="justify-content:center"><button data-act="hstep" data-k="score" data-v="-1">−</button><button class="scorebtn'+(has?'':' ghost')+'" data-act="hpar0">'+(has?h.score:h.par)+'</button><button data-act="hstep" data-k="score" data-v="1">+</button></div>'+(has?'':'<div class="sub">'+tr('Next saves par, or use + and −')+'</div>')+'</div>';}
function openHole(i){
  if(!S.round)return;if(i!=null)S.round.cur=Number(i);
  const rd=S.round,h=rd.holes[rd.cur],t=roundTotals(rd),last=rd.cur===rd.holes.length-1;
  let html='<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><button class="x" data-act="hnav" data-v="-1">‹</button><div class="center"><h3>'+tr('Hole {0}',h.n)+'</h3><div class="sub">'+esc(rd.course)+' · '+(t.n?t.sc+' ('+fmtTo(t.to)+')':tr('no score yet'))+'</div></div><button class="x" data-act="hnav" data-v="1">›</button></div>'+
  '<div class="field"><div class="lbl" style="margin-bottom:6px">'+tr('Par')+'</div><div class="seg">'+[3,4,5].map(p=>'<button class="'+(h.par===p?'on':'')+'" data-act="hpar" data-v="'+p+'">'+p+'</button>').join('')+'</div></div>'+stpScore(h);
  if(S.stats){
    html+=stp('Putts','putts',h.putts==null?'–':h.putts);
    if(h.par>3)html+='<div class="field"><div class="lbl" style="margin-bottom:6px">'+tr('Fairway from the tee')+'</div><div class="seg">'+[['hit','✓ Hit'],['left','← Left'],['right','Right →']].map(f=>'<button class="'+(h.fw===f[0]?'on':'')+'" data-act="hfw" data-v="'+f[0]+'">'+tr(f[1])+'</button>').join('')+'</div></div>';
    if(h.score!=null&&h.putts!=null)html+='<div class="sub center" style="margin-bottom:8px">'+tr('Green in regulation: <b>{0}</b>',tr(isGIR(h)?'yes':'no'))+'</div>';
  }
  html+='<button class="cta" data-act="hnav" data-v="1" data-save="1">'+tr(last?'Done':'Next hole ›')+'</button><div class="center"><button class="link" data-act="mclose">'+tr('Close')+'</button></div>';
  $('#mcard').innerHTML=html;$('#modal').hidden=false;
}
function viewRound(id){
  const rd=S.rounds.find(x=>String(x.id)===String(id));if(!rd)return;const t=roundTotals(rd);
  $('#mcard').innerHTML='<div class="row" style="justify-content:space-between"><div><h3>'+esc(rd.course)+'</h3><div class="sub">'+new Date(rd.date).toLocaleDateString(S.lang==='pt'?'pt-PT':undefined,{day:'numeric',month:'long',year:'numeric'})+' · '+(t.n?t.sc+' ('+fmtTo(t.to)+')':tr('no score'))+'</div></div><button class="x" data-act="mclose">✕</button></div><div style="margin-top:12px">'+cardHTML(rd,false)+'</div><div style="margin-top:14px"><button class="sec" data-act="delRound" data-id="'+rd.id+'">'+tr('Delete round')+'</button></div>';
  $('#modal').hidden=false;
}

/* ---------- bag / shots / settings ---------- */
function rangeHTML(){
  const act=S.clubs.filter(c=>c.on);if(!act.length)return '<div class="hint">'+tr('Add a club in Bag first.')+'</div>';
  const sel=S.clubs.find(c=>c.id===S.rsel&&c.on)||act[0];S.rsel=sel.id;
  const mine=S.rlog.filter(s=>s.club===sel.id),n=mine.length,avg=n?mine.reduce((a,s)=>a+s.d,0)/n:null;
  if(R.rd==null||R.rdClub!==sel.id){R.rd=avg!=null?avg:sel.carry;R.rdClub=sel.id;}
  const tog='<div class="seg" style="margin-bottom:12px">'+[['free','Free practice'],['hole','Play a hole']].map(m=>'<button class="'+((R.rmode||'free')===m[0]?'on':'')+'" data-act="rmode" data-v="'+m[0]+'">'+tr(m[1])+'</button>').join('')+'</div>';
  if(R.rmode==='hole')return tog+vhHTML(act,sel);
  const unit=ul(),L=mine.filter(s=>s.side==='l').length,Rt=mine.filter(s=>s.side==='r').length;
  let h=tog+'<div class="hint" style="margin-top:0">'+tr('Hit a ball, then enter how far it carried (from your launch monitor or the yardage markers) and which way it missed.')+'</div>'+
  '<div class="chiprow" style="flex-wrap:wrap">'+act.map(c=>'<button class="cond'+(c.id===sel.id?' pickon':'')+'" data-act="rsel" data-id="'+c.id+'">'+esc(tc(c.name))+'</button>').join('')+'</div>'+
  '<div class="field center"><div class="lbl">'+tr('Carry distance')+'</div><div class="stepper" style="justify-content:center"><button data-act="rstep" data-v="-5">−5</button><button data-act="rstep" data-v="-1">−</button><div class="v">'+d1(R.rd)+'<small> '+unit+'</small></div><button data-act="rstep" data-v="1">+</button><button data-act="rstep" data-v="5">+5</button></div></div>'+
  '<div class="seg" style="justify-content:center;margin-bottom:14px">'+[['l','← Left'],['c','Straight'],['r','Right →']].map(m=>'<button class="'+((R.rmiss||'c')===m[0]?'on':'')+'" data-act="rmiss" data-v="'+m[0]+'">'+tr(m[1])+'</button>').join('')+'</div>'+
  '<button class="cta" data-act="rlog">'+tr('Log shot with {0}',esc(tc(sel.name)))+'</button>';
  if(n){
    const ds=mine.map(s=>s.d);
    h+='<div class="stats" style="margin-top:16px"><div class="stat"><div class="lbl">'+tr('Shots')+'</div><div class="big">'+n+'</div></div><div class="stat"><div class="lbl">'+tr('Average')+'</div><div class="big">'+d1(avg)+'</div></div><div class="stat"><div class="lbl">'+tr('Range|stat')+'</div><div class="big" style="font-size:18px">'+d1(Math.min.apply(null,ds))+'–'+d1(Math.max.apply(null,ds))+'</div></div></div>'+
    '<div class="sub" style="margin:10px 0">'+tr('Misses: {0} left · {1} straight · {2} right. Bag has {3} at {4} {5}.',L,n-L-Rt,Rt,esc(tc(sel.name)),d1(sel.carry),unit)+'</div>'+
    (n>=3?'<button class="sec" data-act="rapply" style="width:100%">'+tr('Set my {0} to {1} {2}',esc(tc(sel.name)),d1(avg),unit)+'</button>':'<div class="sub">'+tr('Log 3 shots to update your bag.')+'</div>');
  }
  if(S.rlog.length)h+='<div style="margin-top:14px"><button class="sec" data-act="rclear">'+tr('Clear this session')+'</button></div>';
  return h;
}
