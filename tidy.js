"use strict";
/* Declutter Play/Swing, backup and restore, putting summary */
(function(){
  const css=document.createElement('style');
  css.textContent='.seg:has([data-gm="sub"]){flex-wrap:nowrap;overflow-x:auto;gap:4px;-webkit-overflow-scrolling:touch}.seg:has([data-gm="sub"]) button{flex:0 0 auto;white-space:nowrap;padding-left:14px;padding-right:14px}.chiprow.swr{flex-wrap:nowrap!important;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch}.chiprow.swr .cond{flex:0 0 auto;white-space:nowrap}.bk textarea{width:100%;min-height:90px;font-size:13px;border:1px solid var(--line);border-radius:10px;padding:8px;box-sizing:border-box}';
  document.head.appendChild(css);

  /* Play: tell the two camera modes apart */
  const _pl=playHTML;
  playHTML=function(){
    let h=_pl.apply(this,arguments);
    h=h.split(T('At home (camera)','Em casa (câmara)')).join(T('Home (no ball)','Casa (sem bola)')).split(T('At the range (real ball)','No range (bola real)')).join(T('Range (real ball)','Range (bola real)'));
    h=h.replace(/🎥 (Track|Bola)</,'🎥 '+T('Track','Bola')+'<');
    return h;
  };

  /* Swing: one scrolling row of clubs, short intro */
  const _sc=swClubChips;
  swClubChips=function(){return _sc.apply(this,arguments).replace('class="chiprow" style="flex-wrap:wrap;margin:0 0 10px"','class="chiprow swr" style="margin:0 0 10px"');};
  const _sw=swingHTML;
  swingHTML=function(){
    const h=_sw.apply(this,arguments),i=h.indexOf('<div class="hint"'),e=h.indexOf('</div>',i)+6;
    if(i<0)return h;
    return h.slice(0,i)+'<div class="sub" style="font-size:13px;margin:0 0 10px">'+T('Phone about 3 m away at hip height, whole body in view. Pick a club, start the camera, swing.','Telemóvel a cerca de 3 m, à altura da anca, corpo todo visível. Escolhe o taco, liga a câmara e roda.')+'</div>'+h.slice(e);
  };

  /* Backup and restore */
  function dump(){try{return localStorage.getItem(KEY)||JSON.stringify(S);}catch(e){return JSON.stringify(S);}}
  const _st=settingsHTML;
  settingsHTML=function(){
    const h=_st.apply(this,arguments),k=h.lastIndexOf('<div style="margin-top:12px"><button class="sec" data-act="resetAll">');
    const bk='<div class="bk" style="margin-top:18px"><h4 class="lbl">'+T('Backup','Cópia de segurança')+'</h4><div class="sub" style="font-size:13px;margin-bottom:8px">'+T('Your shots and bag live only on this phone. Copy a backup now and then, and add Caddy to your Home Screen (Share, Add to Home Screen) so iOS keeps its data.','As tuas tacadas e o saco vivem só neste telemóvel. Copia uma cópia de vez em quando e adiciona o Caddy ao Ecrã principal (Partilhar, Adicionar ao Ecrã principal) para o iOS guardar os dados.')+'</div>'+
      '<div class="row"><button class="sec" data-bk="copy" style="flex:1">'+T('Copy backup','Copiar cópia')+'</button><button class="sec" data-bk="restore" style="flex:1">'+T('Restore','Restaurar')+'</button></div><div id="bkbox"></div></div>';
    return k<0?h+bk:h.slice(0,k)+bk+h.slice(k);
  };
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-bk]');if(!b)return;const a=b.dataset.bk,box=document.getElementById('bkbox');if(!box)return;
    if(a==='copy'){
      const t=dump();let ok=false;try{await navigator.clipboard.writeText(t);ok=true;}catch(_){}
      box.innerHTML=ok?'<div class="aim" style="margin-top:8px">'+T('Copied. Paste it into Notes or an email to yourself.','Copiado. Cola numa nota ou num email para ti.')+'</div>':'<div class="sub" style="margin-top:8px">'+T('Could not copy automatically. Select all and copy:','Não deu para copiar. Seleciona tudo e copia:')+'</div><textarea readonly>'+esc(t)+'</textarea>';
      if(!ok){const x=box.querySelector('textarea');x.focus();x.select();}
    }else if(a==='restore'){
      box.innerHTML='<div class="sub" style="margin:8px 0">'+T('Paste your backup here. This replaces the data on this phone.','Cola aqui a tua cópia. Isto substitui os dados deste telemóvel.')+'</div><textarea id="bktxt"></textarea><button class="cta" data-bk="apply" style="margin-top:8px">'+T('Restore now','Restaurar agora')+'</button><div id="bkmsg" class="sub"></div>';
    }else if(a==='apply'){
      const t=(document.getElementById('bktxt')||{}).value||'',m=document.getElementById('bkmsg');
      try{const o=JSON.parse(t);if(!o||typeof o!=='object'||!Array.isArray(o.clubs))throw 0;localStorage.setItem(KEY,JSON.stringify(o));location.reload();}
      catch(_){if(m)m.textContent=T('That does not look like a Caddy backup.','Isto não parece uma cópia do Caddy.');}
    }
  });

  /* Putting summary from rounds with putts entered */
  function puttCard(){
    const hs=[];(S.rounds||[]).forEach(r=>(r.holes||[]).forEach(h=>{if(typeof h.putts==='number')hs.push(h.putts);}));
    if(hs.length<9)return '<div class="hint">'+T('Putting: turn on the full scorecard in Settings and enter putts. After 9 holes you get your averages here.','Putting: liga o cartão completo nas Definições e regista os putts. Depois de 9 buracos vês aqui as médias.')+'</div>';
    const n=hs.length,avg=hs.reduce((x,y)=>x+y,0)/n,one=hs.filter(x=>x<=1).length,three=hs.filter(x=>x>=3).length;
    return '<h4 class="lbl" style="margin:18px 0 8px">'+T('Putting','Putting')+'</h4><div class="hint" style="background:#fff;border:1px solid var(--line);color:var(--ink)"><div class="shot"><span>'+T('Putts per hole','Putts por buraco')+'</span><b>'+avg.toFixed(2)+'</b></div><div class="shot"><span>'+T('One-putts','1 putt')+'</span><b>'+Math.round(100*one/n)+'%</b></div><div class="shot"><span>'+T('Three-putts or worse','3 putts ou pior')+'</span><b>'+Math.round(100*three/n)+'%</b></div><div class="sub" style="font-size:12px;margin-top:6px">'+T('{0} holes with putts entered.','{0} buracos com putts.').replace('{0}',n)+'</div></div>';
  }
  const _hc=hcHTML;
  hcHTML=function(){return _hc.apply(this,arguments)+puttCard();};
  window.__tidy={puttCard};
})();
