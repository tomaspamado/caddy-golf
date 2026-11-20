"use strict";
/* simpler: (1) no club advice when the target is far beyond any one shot, (2) Details panel keeps the basics up front */
(function(){
  const _sh=sheetHTML;
  sheetHTML=function(){
    let cx=null;
    try{if(!S.pending&&R.me&&!R.hzStep&&!R.placePin)cx=activeCtx();}catch(e){}
    if(cx&&cx.r&&!cx.r.best&&!cx.r.short){
      const act=S.clubs.filter(c=>c.on),mx=act.reduce((m,c)=>Math.max(m,c.carry+c.roll),0);
      if(mx&&cx.D>1.4*mx){
        return '<div class="center"><div class="lbl">'+tr('Too far for one shot')+'</div><div class="big-msg">'+d1(cx.D)+' '+ul()+'</div><div class="sub">'+T('Tap a spot closer to you, where you want to hit, to get a club.','Toca num ponto mais perto, onde queres bater, para ver o taco.')+'</div></div>';
      }
    }
    return _sh.apply(this,arguments);
  };
  let fineOpen=false;
  document.addEventListener('toggle',e=>{if(e.target&&e.target.classList&&e.target.classList.contains('fine'))fineOpen=e.target.open;},true);
  const _dh=detailsHTML;
  detailsHTML=function(){
    const h=_dh.apply(this,arguments);
    const parts=h.split('<h4>');
    if(parts.length<3)return h;
    const head=parts.shift(),secs=parts.map(p=>'<h4>'+p);
    const isFine=s=>/data-act="(stance|tilt)"/.test(s);
    const fine=secs.filter(isFine);if(!fine.length)return h;
    const c=S.cond||{},open=fineOpen||(c.stance||0)!==0||(c.tilt||0)!==0;
    let out=head,placed=false;
    secs.forEach(s=>{
      if(isFine(s)){if(!placed){placed=true;
        out+='<details class="fine"'+(open?' open':'')+'><summary class="link" style="list-style:none">'+T('More options (stance, roll)','Mais opções (posição, rolo)')+'</summary>'+fine.join('')+'</details>';}
        return;}
      out+=s;
    });
    return out;
  };
})();
