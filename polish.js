"use strict";
/* polish: keep horizontal scroll positions when a screen re-renders, and start tabs at the top */
(function(){
  const HOST='#pbody,#sheet,#mcard',SEL='.chiprow';
  const store={};
  const tabNow=()=>(typeof ptab!=='undefined'?ptab:'');
  function key(el,host){const all=host.querySelectorAll(SEL);return host.id+'|'+tabNow()+'|'+Array.prototype.indexOf.call(all,el);}
  document.addEventListener('scroll',e=>{
    const el=e.target;if(!el||el.nodeType!==1||!el.matches||!el.matches(SEL))return;
    const h=el.closest(HOST);if(h)store[key(el,h)]=el.scrollLeft;
  },true);
  function reveal(row){ /* first time a row shows: bring the selected chip into view */
    const c=row.querySelector('.pickon,.on');if(!c)return;
    const l=c.offsetLeft,r=l+c.offsetWidth;
    if(l<row.scrollLeft||r>row.scrollLeft+row.clientWidth)row.scrollLeft=Math.max(0,l-(row.clientWidth-c.offsetWidth)/2);
  }
  function restore(host){
    host.querySelectorAll(SEL).forEach(row=>{
      const k=key(row,host),v=store[k];
      if(v!=null){if(Math.abs(row.scrollLeft-v)>1)row.scrollLeft=v;}
      else{reveal(row);store[k]=row.scrollLeft;}
    });
  }
  function watch(){
    document.querySelectorAll(HOST).forEach(h=>{
      new MutationObserver(()=>restore(h)).observe(h,{childList:true,subtree:true});
    });
  }
  /* switching tab: start at the top and forget old positions */
  document.addEventListener('click',e=>{
    const b=e.target.closest('#ptabs button');if(!b)return;
    Object.keys(store).forEach(k=>{if(k.indexOf('pbody|')===0)delete store[k];});
    setTimeout(()=>{const p=document.getElementById('pbody');if(p)p.scrollTop=0;},0);
  });
  watch();
  /* the Data screens are gone: anything that tries to open them goes to Play */
  if(typeof openPanel==='function'){const _op=openPanel;openPanel=function(t){if(t==='data')t='play';return _op.call(this,t);};}
})();
