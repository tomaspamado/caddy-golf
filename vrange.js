"use strict";
/* ============ Virtual range (Play → Range view) + unfinished range rounds are kept ============ */
(function(){
  const VR={club:'all',last:false,all:false,undo:null};
  const COLS=['#fde047','#60a5fa','#f472b6','#fb923c','#c084fc','#67e8f9','#fca5a5','#bef264','#ffffff','#a5b4fc'];
  const dayK=t=>new Date(t).toDateString();
  const lastDay=()=>{let m=0;(S.shots||[]).forEach(s=>{if(s.carry>0&&isFullShot(s)&&s.t>m)m=s.t;});return m?dayK(m):null;};
  const sh=id=>{const a=(S.shots||[]).filter(s=>s.club===id&&s.carry>0&&isFullShot(s));if(!VR.last)return a;const k=lastDay();return a.filter(s=>dayK(s.t)===k);};
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const sdv=a=>{if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((x,y)=>x+(y-m)*(y-m),0)/(a.length-1));};
  /* mishits: with 8+ shots, anything beyond 2 standard deviations (distance or sideways) stays out of the ovals */
  const isOut=(s,A)=>{if(A.length<8)return false;const m=mean(A.map(x=>x.carry)),sc=sdv(A.map(x=>x.carry)),ll=A.filter(x=>x.lat!=null),ml=ll.length?mean(ll.map(x=>x.lat)):0,sl=sdv(ll.map(x=>x.lat));return(sc>0&&Math.abs(s.carry-m)>2*sc)||(s.lat!=null&&sl>0&&Math.abs(s.lat-ml)>2*sl);};
  const trim=A=>A.filter(s=>!isOut(s,A));
  function st(a){
    if(!a.length)return null;
    const ll=a.filter(s=>s.lat!=null);
    return{n:a.length,my:mean(a.map(s=>s.carry)),sy:sdv(a.map(s=>s.carry)),mx:ll.length?mean(ll.map(s=>s.lat)):0,sx:sdv(ll.map(s=>s.lat)),a:a};
  }
  const cname=id=>{const c=S.clubs.find(x=>x.id===id);return c?tc(c.name):'?';};

  /* ---------- keep unfinished range rounds ---------- */
  function saveUnfinished(){
    const v=R.vh;if(!v||v.fin||v.tp||v._vrSaved)return;
    if(typeof GM!=='undefined'&&GM.mp)return;
    const d=v.done||[];if(!d.length)return;
    v._vrSaved=1;
    const course=v.course||String((d[0]&&d[0].name)||'Game').split(' · ').pop();
    S.grounds=S.grounds||[];
    S.grounds.unshift({t:Date.now(),course:course+' · '+T('unfinished','incompleto')+' '+d.length+'/'+(v.holes?v.holes.length:d.length),src:v.src||(PL.on&&PL.src==='home'?'home':'range'),unfinished:true,
      holes:d.map(h=>({par:h.par,len:Math.round(h.len),strokes:h.strokes,name:h.name,st:h.st||null}))});
    S.grounds=S.grounds.slice(0,150);save();
  }
  const _pe=plEnd;plEnd=function(){try{saveUnfinished();}catch(e){}return _pe.apply(this,arguments);};
  const _ac=act;act=function(a){if(a==='vhquit'){try{saveUnfinished();}catch(e){}}return _ac.apply(this,arguments);};

  /* ---------- the picture ---------- */
  const W=390,SX=3.2;
  function pic(ells,dots,maxM){
    const step=50/U(),n=Math.min(8,Math.max(3,Math.ceil((maxM+20)/step))),top=26,bot=40,yM=n*step;
    const sy=Math.min(2,430/yM),H=Math.round(top+yM*sy+bot),y0=top+yM*sy,cx=W/2;
    const Y=m=>y0-m*sy,X=m=>cx+m*SX;
    let g='<rect width="'+W+'" height="'+H+'" fill="#2e6b3a"/>';
    const sb=step/5;for(let i=0;i*sb<yM;i++)g+='<rect x="0" y="'+Y((i+1)*sb)+'" width="'+W+'" height="'+(sb*sy+.5)+'" fill="'+(i%2?'#31723e':'#2a6035')+'"/>';
    g+='<rect x="0" y="0" width="26" height="'+H+'" fill="#1f4a29"/><rect x="'+(W-26)+'" y="0" width="26" height="'+H+'" fill="#1f4a29"/>';
    for(let i=0;i*30<H;i++){const r=8+(i*37)%6;g+='<circle cx="'+(10+(i*13)%8)+'" cy="'+(i*30+10)+'" r="'+r+'" fill="#173a20"/><circle cx="'+(W-10-(i*11)%8)+'" cy="'+(i*30+22)+'" r="'+(8+(i*29)%6)+'" fill="#173a20"/>';}
    [20,40,60].forEach(l=>{[-1,1].forEach(sg=>{const x=X(sg*l);if(x>30&&x<W-30)g+='<text x="'+x+'" y="'+(top-8)+'" text-anchor="middle" font-size="9" fill="#cfe6d4">'+d1(l)+'</text>';});});
    g+='<line x1="'+cx+'" y1="'+top+'" x2="'+cx+'" y2="'+y0+'" stroke="#fff" stroke-opacity=".3"/>';
    for(let i=1;i<=n;i++){const y=Y(i*step),lab=String(Math.round(i*50));
      g+='<line x1="26" y1="'+y+'" x2="'+(W-26)+'" y2="'+y+'" stroke="#fff" stroke-opacity=".4"/>';
      [4,W-40].forEach(x=>{g+='<rect x="'+x+'" y="'+(y-8)+'" width="36" height="16" rx="3" fill="#fff"/><text x="'+(x+18)+'" y="'+(y+4)+'" text-anchor="middle" font-size="11" font-weight="600" fill="#171717">'+lab+'</text>';});}
    g+='<rect x="'+(cx-70)+'" y="'+y0+'" width="140" height="22" rx="4" fill="#5b6b5f"/><text x="'+cx+'" y="'+(y0+15)+'" text-anchor="middle" font-size="10" fill="#e8efe9">'+T('Tee','Tee')+'</text>';
    ells.forEach(e=>{
      const ex=X(e.mx),ey=Y(e.my),rx=Math.max(6,1.28*e.sx*SX),ry=Math.max(6,1.28*e.sy*sy);
      g+='<ellipse cx="'+ex+'" cy="'+ey+'" rx="'+rx+'" ry="'+ry+'" fill="'+e.col+'" fill-opacity=".24" stroke="'+e.col+'" stroke-width="2"/>';
    });
    const placed=[];
    ells.filter(e=>e.lab).map(e=>({e:e,x:X(e.mx),y:Y(e.my)+4})).sort((a,b)=>a.y-b.y).forEach(o=>{
      let y=o.y;placed.forEach(p=>{if(Math.abs(p.x-o.x)<70&&Math.abs(p.y-y)<13)y=p.y+13;});
      placed.push({x:o.x,y:y});
      g+='<text x="'+o.x+'" y="'+y+'" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" style="paint-order:stroke;stroke:#0b1f12;stroke-width:3px">'+o.e.lab+'</text>';
    });
    dots.forEach(d=>{if(d.out){g+='<circle cx="'+X(d.x)+'" cy="'+Y(d.y)+'" r="4" fill="none" stroke="#f87171" stroke-width="1.8"/>';return;}g+='<circle cx="'+X(d.x)+'" cy="'+Y(d.y)+'" r="3.5" fill="'+d.col+'" stroke="#0b1f12" stroke-width="1.2"/>';});
    return{svg:'<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="display:block;border-radius:12px" role="img" aria-label="'+T('Virtual range','Range virtual')+'">'+g+'</svg>',ratio:SX/sy};
  }

  /* ---------- progression ---------- */
  function sessions(a){
    const by={};a.forEach(s=>{const k=new Date(s.t).toDateString();(by[k]=by[k]||[]).push(s);});
    return Object.keys(by).map(k=>({t:by[k][0].t,a:by[k]})).filter(x=>x.a.length>=2).sort((p,q)=>p.t-q.t).slice(-8);
  }
  function chart(title,vals,labs,fmt,note){
    if(vals.length<2)return '';
    const w=340,h=110,pl=34,pr=10,pt=12,pb=22,lo=Math.min.apply(null,vals),hi=Math.max.apply(null,vals),rg=(hi-lo)||1,
      x=i=>pl+(w-pl-pr)*i/(vals.length-1),y=v=>pt+(h-pt-pb)*(1-(v-lo)/rg);
    let g='<line x1="'+pl+'" y1="'+(h-pb)+'" x2="'+(w-pr)+'" y2="'+(h-pb)+'" stroke="rgba(23,23,23,.12)"/><line x1="'+pl+'" y1="'+pt+'" x2="'+(w-pr)+'" y2="'+pt+'" stroke="rgba(23,23,23,.08)"/>'+
      '<text x="'+(pl-6)+'" y="'+(pt+4)+'" text-anchor="end" font-size="10" fill="#737373">'+fmt(hi)+'</text><text x="'+(pl-6)+'" y="'+(h-pb+3)+'" text-anchor="end" font-size="10" fill="#737373">'+fmt(lo)+'</text>';
    g+='<polyline fill="none" stroke="#15803d" stroke-width="2" stroke-linejoin="round" points="'+vals.map((v,i)=>x(i)+','+y(v)).join(' ')+'"/>';
    vals.forEach((v,i)=>{g+='<circle cx="'+x(i)+'" cy="'+y(v)+'" r="3.5" fill="#15803d"/><text x="'+x(i)+'" y="'+(h-6)+'" text-anchor="middle" font-size="9" fill="#737373">'+labs[i]+'</text>';});
    return '<div class="hint" style="background:#fff;border:1px solid var(--line);color:var(--ink)"><b>'+title+'</b><svg viewBox="0 0 '+w+' '+h+'" width="100%" style="margin-top:6px">'+g+'</svg>'+(note?'<div class="sub" style="font-size:13px">'+note+'</div>':'')+'</div>';
  }
  const dl=t=>{const d=new Date(t);return d.getDate()+'/'+(d.getMonth()+1);};

  /* before / now compare, with words so it never relies on colour alone */
  function cmpRow(label,a,b,f,lowerBetter,wordLo,wordHi){
    if(a==null||b==null)return '<div class="shot"><span>'+label+'</span><span class="sub">–</span></div>';
    const d=b-a,same=Math.abs(d)<Math.max(0.5,Math.abs(a)*0.04);
    let word=T('same','igual'),col='var(--mut)';
    if(!same){const good=lowerBetter?d<0:d>0;word=d<0?wordLo:wordHi;col=lowerBetter?(good?'#15803d':'#b42318'):'var(--mut)';}
    return '<div class="shot"><span>'+label+'</span><span><span class="sub">'+f(a)+' → </span><b>'+f(b)+'</b> <span style="color:'+col+';font-weight:500">'+word+'</span></span></div>';
  }

  /* every shot that counts for this club, newest first, each one removable */
  function listHTML(c,A){
    const u=ul(),n=A.length,m=mean(A.map(s=>s.carry)),sc=sdv(A.map(s=>s.carry)),ll=A.filter(s=>s.lat!=null),ml=ll.length?mean(ll.map(s=>s.lat)):0,sl=sdv(ll.map(s=>s.lat));
    const odd=s=>n>=8&&((sc>0&&Math.abs(s.carry-m)>2*sc)||(s.lat!=null&&sl>0&&Math.abs(s.lat-ml)>2*sl));
    const lim=VR.all?n:40,rows=A.map(s=>({s:s,i:S.shots.indexOf(s)})).reverse().slice(0,lim);
    let h='<div class="lbl" style="margin:20px 0 6px">'+T('Shots counted','Tacadas contadas')+' · '+n+'</div><div class="sub" style="font-size:13px;margin:0 0 8px">'+T('Delete any shot that should not count. The ovals and the caddy update straight away.','Apaga as tacadas que não devem contar. Os ovais e o caddie atualizam logo.')+'</div>';
    if(VR.undo)h+='<div class="aim" style="display:flex;justify-content:space-between;align-items:center;background:var(--soft);color:var(--ink)"><span>'+T('Shot deleted','Tacada apagada')+'</span><button class="link" data-vr="undo" style="color:var(--accd)">'+T('Undo','Anular')+'</button></div>';
    h+=rows.map(r=>{
      const s=r.s,d=new Date(s.t),side=s.lat==null?'–':(Math.abs(s.lat)<0.5?T('on line','na linha'):d1(Math.abs(s.lat))+' '+u+' '+(s.lat<0?T('left','esq.'):T('right','dir.')));
      return '<div class="shot" style="align-items:center;gap:8px"><span><b>'+d1(s.carry)+' '+u+'</b><br><small class="sub">'+dl(s.t)+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+(odd(s)?' · '+T('far from your average','longe da tua média'):'')+'</small></span><span class="sub" style="margin-left:auto;text-align:right">'+side+'</span><button class="x" data-vr="del" data-i="'+r.i+'" aria-label="'+T('Delete shot','Apagar tacada')+'">✕</button></div>';
    }).join('');
    if(n>lim)h+='<button class="sec" data-vr="more" style="width:100%;margin-top:8px">'+T('Show all {0} shots','Ver as {0} tacadas').replace('{0}',n)+'</button>';
    return h;
  }

  function vrHTML(){
    const u=ul(),clubs=S.clubs.filter(c=>c.on&&sh(c.id).length);
    if(!clubs.length)return '<div class="hint">'+T('No shots yet. Hit some balls in Play (at the range or at home) and your spread shows up here.','Ainda sem tacadas. Bate umas bolas em Jogar (no range ou em casa) e a tua dispersão aparece aqui.')+'</div>';
    if(VR.club!=='all'&&!clubs.some(c=>c.id===VR.club))VR.club='all';
    const when='<div class="seg" style="margin-bottom:8px"><button class="'+(VR.last?'':'on')+'" data-vr="when" data-v="all">'+T('All time','Sempre')+'</button><button class="'+(VR.last?'on':'')+'" data-vr="when" data-v="last">'+T('Last session','Última sessão')+'</button></div>';
    const chips=when+'<div class="chiprow"><button class="cond'+(VR.club==='all'?' pickon':'')+'" data-vr="club" data-v="all">'+T('All clubs','Todos')+'</button>'+clubs.map(c=>'<button class="cond'+(c.id===VR.club?' pickon':'')+'" data-vr="club" data-v="'+c.id+'">'+esc(tc(c.name))+'</button>').join('')+'</div>';
    let ells=[],dots=[],maxM=100,body='',cap='';
    if(VR.club==='all'){
      clubs.forEach((c,i)=>{const a=trim(sh(c.id)).slice(-20),s=st(a);maxM=Math.max(maxM,s.my+1.28*s.sy);
        if(a.length>=3)ells.push({mx:s.mx,my:s.my,sx:Math.max(1,s.sx),sy:Math.max(1,s.sy),col:COLS[i%COLS.length],lab:esc(tc(c.name))});});
      body=clubs.map((c,ci)=>{const A=trim(sh(c.id)),now=st(A.slice(-10)),bf=A.length>10?st(A.slice(-20,-10)):null;
        return '<div class="shot" data-vr="club" data-v="'+c.id+'" style="cursor:pointer;min-height:56px;align-items:center"><span><b><i style="display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:8px;vertical-align:-1px;border:1px solid rgba(0,0,0,.25);background:'+COLS[ci%COLS.length]+'"></i>'+esc(tc(c.name))+'</b><br><small class="sub">'+A.length+' '+T('shots','tacadas')+'</small></span><span style="text-align:right"><b>'+d1(now.my)+'</b> '+u+'<br><small class="sub">±'+d1(now.sx)+' '+T('sideways','lado')+(bf&&bf.n>=3&&now.n>=3?' · '+(now.sx<bf.sx*0.96?T('tighter','mais junto'):now.sx>bf.sx*1.04?T('wider','mais aberto'):T('same','igual')):'')+'</small></span></div>';}).join('');
      cap=T('Each oval holds about 80% of your last 20 shots with that club. Match the colour to the list below, or tap a club to see its shots.','Cada oval contém cerca de 80% das últimas 20 tacadas com esse taco. Liga a cor à lista abaixo ou toca num taco para ver as tacadas.');
    }else{
      const c=clubs.find(x=>x.id===VR.club),AA=sh(c.id),A=trim(AA),L=A.slice(-10),P=A.slice(-20,-10),sn=st(L),sp=P.length?st(P):null,col='#fde047';
      AA.slice(-25).forEach(s=>{if(isOut(s,AA))dots.push({x:s.lat||0,y:s.carry,out:1});});L.forEach(s=>dots.push({x:s.lat||0,y:s.carry,col:col}));
      if(L.length>=3)ells.push({mx:sn.mx,my:sn.my,sx:Math.max(1,sn.sx),sy:Math.max(1,sn.sy),col:col});
      maxM=Math.max(maxM,sn.my+1.28*sn.sy);
      const ses=sessions(A);
      body='<div class="hint" style="background:#fff;border:1px solid var(--line);color:var(--ink)"><b>'+T('Last 10 shots vs the 10 before','Últimas 10 tacadas vs as 10 anteriores')+'</b><div style="margin-top:6px">'+
        (sp&&sp.n>=3&&sn.n>=3?
          cmpRow(T('Average carry','Voo médio'),sp.my,sn.my,v=>d1(v)+' '+u,false,T('shorter','mais curto'),T('longer','mais longo'))+
          cmpRow(T('Left-right spread','Dispersão lateral'),sp.sx,sn.sx,v=>'±'+d1(v),true,T('tighter','mais junto'),T('wider','mais aberto'))+
          cmpRow(T('Distance spread','Dispersão em distância'),sp.sy,sn.sy,v=>'±'+d1(v),true,T('tighter','mais junto'),T('wider','mais aberto'))
        :'<div class="sub">'+T('Needs at least 3 shots in each group (13+ shots in total).','Precisa de pelo menos 3 tacadas em cada grupo (13+ no total).')+'</div>')+'</div></div>'+
        (ses.length>=2?chart(T('Average carry per session','Voo médio por sessão'),ses.map(x=>mean(x.a.map(s=>s.carry))*U()),ses.map(x=>dl(x.t)),v=>String(Math.round(v)),u):'')+
        (ses.length>=2&&ses.every(x=>x.a.filter(s=>s.lat!=null).length>=2)?chart(T('Left-right spread per session','Dispersão lateral por sessão'),ses.map(x=>sdv(x.a.filter(s=>s.lat!=null).map(s=>s.lat))*U()),ses.map(x=>dl(x.t)),v=>'±'+Math.round(v),T('Lower is tighter.','Mais baixo é mais junto.')):'')+
        (ses.length<2?'<div class="sub" style="margin:8px 0">'+T('Hit at least 2 shots on two different days to see your progression over time.','Bate pelo menos 2 tacadas em dois dias diferentes para ver a evolução ao longo do tempo.')+'</div>':'');
      body+=listHTML(c,AA);
      cap=T('Yellow: your last 10 shots. Red rings are mishits, left out of the ovals.','Amarelo: as últimas 10 tacadas. Anéis vermelhos são más tacadas, fora dos ovais.');
    }
    const p=pic(ells,dots,maxM);
    return chips+p.svg+'<div class="sub" style="font-size:13px;margin:6px 0 12px">'+cap+' '+T('Sideways is stretched ×{0} so the spread is easy to see.','O lado está esticado ×{0} para veres bem a dispersão.').replace('{0}',p.ratio.toFixed(1))+'</div>'+body;
  }
  function vrRender(){const b=document.getElementById('vrbox');if(b)b.innerHTML=vrHTML();}

  /* ---------- Play tab: a 'Range view' button next to the others ---------- */
  const _pH=playHTML;
  playHTML=function(){
    const vr=PL.sub==='vr';if(vr)PL.sub='goals';
    let h;try{h=_pH();}finally{if(vr)PL.sub='vr';}
    const i=h.indexOf('data-gm="sub"');if(i<0)return h;
    const s=h.lastIndexOf('<div class="seg"',i),e=h.indexOf('</div>',i)+6;
    let nav=h.slice(s,e);
    if(vr)nav=nav.replace(/ class="on"( data-gm="sub")/g,' class=""$1');
    nav=nav.replace(/<\/div>$/,'<button class="'+(vr?'on':'')+'" data-gm="sub" data-v="vr">'+T('Range view','Vista range')+'</button></div>');
    if(!vr)return h.slice(0,s)+nav+h.slice(e);
    return h.slice(0,s)+nav+'<div id="vrbox"></div>';
  };
  const _op=openPanel;
  openPanel=function(t){_op.apply(this,arguments);try{if(ptab==='play'&&PL.sub==='vr'&&!PL.on)setTimeout(vrRender,0);}catch(e){}};
  const _dl=dlRender;
  dlRender=function(){const r=_dl.apply(this,arguments);try{if(ptab==='play'&&PL.sub==='vr'&&!PL.on)vrRender();}catch(e){}return r;};
  document.addEventListener('click',e=>{const b=e.target.closest('[data-vr="club"]');if(!b)return;VR.club=b.dataset.v;VR.all=false;VR.undo=null;vrRender();});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-vr="when"]');if(!b)return;VR.last=b.dataset.v==='last';vrRender();});
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-vr="del"],[data-vr="undo"],[data-vr="more"]');if(!b)return;
    const a=b.dataset.vr;
    if(a==='more'){VR.all=true;vrRender();return;}
    if(a==='undo'){const u=VR.undo;if(!u)return;S.shots.splice(Math.min(u.i,S.shots.length),0,u.s);if(u.r)S.rlog.splice(Math.min(u.ri,S.rlog.length),0,u.r);VR.undo=null;save();vrRender();try{refresh();}catch(_){}return;}
    const i=Number(b.dataset.i),s=S.shots[i];if(!s)return;
    let ri=-1,best=1e9;
    (S.rlog||[]).forEach((r,k)=>{if(r.club!==s.club)return;const dt=Math.abs((r.t||0)-(s.t||0)),dd=Math.abs((r.d!=null?r.d:r.carry)-s.carry);if(dt<10000&&dd<2&&dt+dd*1000<best){best=dt+dd*1000;ri=k;}});
    VR.undo={s:s,i:i,r:ri>=0?S.rlog[ri]:null,ri:ri};
    S.shots.splice(i,1);if(ri>=0)S.rlog.splice(ri,1);
    save();vrRender();try{refresh();}catch(_){}
  });
  window.__vr={VR,vrHTML,saveUnfinished};
})();
