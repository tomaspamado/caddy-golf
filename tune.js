"use strict";
/* tune: (1) hazards change the club only when the gain is big, bunkers are not treated like water,
   (2) your own club pick shows where it lands, (3) practice hole shows expected spread + range-ball distance,
   (4) hand-drawn hazards are remembered for next time */
(function(){
  const u=()=>ul();

  /* ---- (1) bunkers cost less than water; only switch club for a real gain ---- */
  const _dc=decideCore;
  decideCore=function(o){
    try{
      if(o&&o.hz&&!o.noAim&&R.me&&R.hzs&&R.hzs.length){
        const aim=R.lay||R.target||R.pin;
        if(aim){
          const brg=bearing(R.me,aim),sb=Math.sin(brg*rad),cb=Math.cos(brg*rad),kx=111320*Math.cos(R.me.lat*rad);
          const loc=p=>{const E=(p.lng-R.me.lng)*kx,N=(p.lat-R.me.lat)*111320;return{x:E*cb-N*sb,y:E*sb+N*cb};};
          const polys=R.hzs.map(h=>hzPts(h).map(loc)),kinds=R.hzs.map(h=>h.kind==='b'?'b':'w');
          o=Object.assign({},o,{hz:(x,y)=>{let r=0;for(let i=0;i<polys.length;i++)if(pipXY(x,y,polys[i])){if(kinds[i]==='w')return 1;r=2;}return r;}});
        }
      }
    }catch(e){}
    const v=_dc(o);
    if(v&&o.hz&&!o.noAim&&v.altE&&v.club.id!==v.altE.club.id){
      const d=v.altE;
      if(!(d.p>=0.30&&d.ev-v.ev>=0.25))return{club:d.club,c:d.c,ev:d.ev,p:d.p,list:v.list,altE:d,ce:d};
    }
    return v;
  };
  const _hh=hzHitFor;
  hzHitFor=function(cx){
    const hit=_hh(cx);if(!hit)return null;
    const p=cx.ce?cx.ce.p:1,thr=(hit.h&&hit.h.kind==='b')?0.40:0.25;
    return p>=thr?hit:null;
  };

  /* ---- (2) expected distance of the club you picked ---- */
  const _sh=sheetHTML;
  sheetHTML=function(){
    let h=_sh.apply(this,arguments);
    try{
      if(R.sel&&R.me&&!S.pending){
        const cx=activeCtx();
        if(cx&&cx.club&&cx.r&&cx.r.best&&cx.club.id!==cx.r.best.id){
          const e=expDist(cx.r,cx.club),df=e-cx.D,sw=swingOf(cx.r,cx.club),pc=Math.round(Math.min(sw,1)*100),
            word=Math.abs(df)<2?T('right on target','mesmo no alvo'):d1(Math.abs(df))+' '+u()+' '+(df<0?T('short','curto'):T('long','longo'));
          const line='<div class="aim" style="background:#f2f6f3;color:var(--ink)">'+T('Your {0} goes about {1} {2}','O teu {0} vai cerca de {1} {2}').replace('{0}',esc(tc(cx.club.name))).replace('{1}',d1(e)).replace('{2}',u())+' · '+word+(sw<0.95?' · '+pc+'%':'')+'</div>';
          const i=h.indexOf('<div class="plays">');
          if(i>=0){const j=h.indexOf('</div></div></div>',i);if(j>=0)h=h.slice(0,j+18)+line+h.slice(j+18);}
        }
      }
    }catch(e){}
    return h;
  };

  /* ---- (3) practice hole: expected spread and range-ball distance ---- */
  const _vh=vhHTML;
  vhHTML=function(){
    let h=_vh.apply(this,arguments);
    try{
      const v=R.vh;if(!v||v.fin||v.res)return h;
      const cl=S.clubs.find(c=>c.id===R.rdClub);if(!cl)return h;
      const f=S.rball==='real'?1:rbFac(cl);
      if(f!==1&&R.vhAdj!==R.vhKey){R.vhAdj=R.vhKey;R.rd=Math.round(R.rd*f);h=_vh.apply(this,arguments);}
      const sp=spread(cl),real=f===1?R.rd:R.rd/f,un=u();
      let t='<div class="hint" style="margin:8px 0">'+T('Expected landing','Aterragem esperada')+': <b>'+d1(real)+' '+un+'</b> ±'+d1(sp.dep)+' '+T('long/short','longo/curto')+', ±'+d1(sp.lat)+' '+T('sideways','de lado');
      if(f!==1)t+='<br>'+T('Real course distance','Distância real no campo')+' <b>'+d1(real)+'</b> → '+T('hit this on range balls','bate isto com bolas de range')+' <b>'+d1(R.rd)+'</b> '+un+' (−'+Math.round((1-f)*100)+'%)';
      t+='</div>';
      const k=h.indexOf('<div class="field center">');
      if(k>=0)h=h.slice(0,k)+t+h.slice(k);
    }catch(e){}
    return h;
  };
  const _dv=drawVh;
  drawVh=function(){
    _dv.apply(this,arguments);
    try{
      const v=R.vh,c=document.getElementById('vhc');if(!v||!c||v.fin||v.res)return;
      const cl=S.clubs.find(x=>x.id===R.rdClub);if(!cl||R.rd==null)return;
      const H=v.h,b={x0:Math.min(v.x,H.pin.x)-30,x1:Math.max(v.x,H.pin.x)+30,y0:Math.min(v.y,H.pin.y)-24,y1:Math.max(v.y,H.pin.y)+30};
      const w=c.clientWidth,hh=c.clientHeight,sc=Math.min(hh/(b.y1-b.y0),w/Math.max(110,b.x1-b.x0)),cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2;
      const P=(x,y)=>[w/2+(x-cx)*sc,hh/2-(y-cy)*sc];
      const d=vhAim(v),f=S.rball==='real'?1:rbFac(cl),lm=v.lie==='rough'?.9:v.lie==='bunker'?.8:1,rmu=v.lie==='rough'?.4:v.lie==='bunker'?0:1;
      const tot=(R.rd/f)*lm+cl.roll*0.6*rmu,sp=spread(cl),q=P(v.x+d.dx*tot,v.y+d.dy*tot);
      const g=c.getContext('2d');g.save();g.beginPath();g.ellipse(q[0],q[1],Math.max(4,sp.dep*sc),Math.max(4,sp.lat*sc),Math.atan2(-d.dy,d.dx),0,2*Math.PI);
      g.fillStyle='rgba(253,224,71,.28)';g.fill();g.strokeStyle='#fde047';g.lineWidth=2;g.stroke();
      g.beginPath();g.arc(q[0],q[1],3,0,2*Math.PI);g.fillStyle='#fde047';g.fill();g.restore();
    }catch(e){}
  };

  /* ---- (4) remember hand-drawn hazards where you drew them ---- */
  let restored=false;
  function manual(){return (R.hzs||[]).filter(h=>!h.auto&&h.a&&h.b);}
  const pt=p=>p?{lat:+p.lat.toFixed(6),lng:+p.lng.toFixed(6)}:null;
  const _rf=refresh;
  refresh=function(){
    try{
      if(R.me&&S.round){
        if(!restored){
          restored=true;
          (S.hzSaved||[]).filter(z=>dist(R.me,z.a)<700).forEach(z=>{
            if(manual().some(h=>dist(h.a,z.a)<2))return;
            R.hzs.push({id:++R.hzId,a:L.latLng(z.a.lat,z.a.lng),b:L.latLng(z.b.lat,z.b.lng),w:z.w?L.latLng(z.w.lat,z.w.lng):null,kind:z.kind||null});
          });
        }else if(!R.hzStep){
          const keep=(S.hzSaved||[]).filter(z=>dist(R.me,z.a)>=700);
          const cur=manual().map(h=>({a:pt(h.a),b:pt(h.b),w:pt(h.w),kind:h.kind||null}));
          const nxt=keep.concat(cur).slice(-120);
          if(JSON.stringify(nxt)!==JSON.stringify(S.hzSaved||[])){S.hzSaved=nxt;save();}
        }
      }
    }catch(e){}
    return _rf.apply(this,arguments);
  };
})();
