"use strict";
/* ================= Always show the swing percentage for the suggested club ================= */
Object.assign(PT,{'{0} at {1}%':'{0} a {1}%','Full swing':'Swing completo','a full swing':'swing completo'});
function pctBadge(name,pc){
  const w=pc>=95?tr('Full swing'):swingWord(pc);
  return '<div class="aim" style="background:#effaf2;color:#166534;font-size:17px">'+tr('{0} at {1}%',esc(tc(name)),pc>=95?100:pc)+' <span style="font-weight:600;font-size:14px">· '+w+'</span></div>';
}
const _sheetPct=sheetHTML;
sheetHTML=function(){
  let h=_sheetPct();
  try{
    if(h.indexOf('class="clubbtn"')<0)return h;
    const cx=activeCtx();if(!cx||!cx.club||!cx.r||!cx.r.best)return h;
    const sw=swingOf(cx.r,cx.club);if(!(sw>0.2))return h;
    const pc=Math.max(20,Math.min(100,Math.round(sw*100)));
    const old='<div class="aim">'+tr('Swing about <b>{0}%</b> of a full shot ({1})',Math.round(sw*100),swingWord(Math.round(sw*100)))+'</div>';
    h=h.replace(old,'');
    const k=h.indexOf('</div></div></div>',h.indexOf('plays'));
    if(k>0)h=h.slice(0,k+18)+pctBadge(cx.club.name,pc)+h.slice(k+18);
  }catch(e){}
  return h;
};
const _vhPct=vhHTML;
vhHTML=function(act,sel){
  let h=_vhPct(act,sel);
  try{
    const v=R.vh;if(!v||v.res||v.fin||v.mpSummary||R.rdPlan==null)return h;
    if(v.mp&&v.mp.players[v.mp.cur].guest)return h;
    const cl=S.clubs.find(c=>c.id===S.rsel);if(!cl||!(cl.carry>0))return h;
    const pc=Math.max(0,Math.min(100,Math.round(R.rdPlan/cl.carry*100)));
    const m='<div class="chiprow" style="flex-wrap:wrap">',k=h.indexOf(m);
    if(k>=0)h=h.slice(0,k)+pctBadge(cl.name,pc)+h.slice(k);
  }catch(e){}
  return h;
};