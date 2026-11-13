"use strict";
/* ============ No map home screen: the app opens on the menu. The map + GPS appear only while a round is being played. ============ */
(function(){
  const st=document.createElement('style');
  st.textContent='body:not(.ongps) #map,body:not(.ongps) #top,body:not(.ongps) #locate,body:not(.ongps) #sheet{display:none!important}';
  document.head.appendChild(st);
  let was=null;
  function sync(){
    const on=!!S.round;
    document.body.classList.toggle('ongps',on);
    const pc=document.getElementById('pclose');if(pc)pc.hidden=!on;
    if(on&&was!==true){try{startGPS();}catch(e){}setTimeout(()=>{try{map.invalidateSize();refresh();}catch(e){}},50);}
    if(!on&&was!==false){/* the menu is the home: always open */
      try{if(watchId!=null&&ptab!=='range'){navigator.geolocation.clearWatch(watchId);watchId=null;}}catch(e){}
      if(document.getElementById('panel').hidden)openPanel(ptab||'round');
    }
    was=on;
  }
  const _act=act;
  act=function(){const r=_act.apply(this,arguments);try{sync();}catch(e){}return r;};
  const _op=openPanel;
  openPanel=function(t){const r=_op.apply(this,arguments);try{if(t==='range'&&!S.round&&watchId==null)startGPS();}catch(e){}try{const pc=document.getElementById('pclose');if(pc)pc.hidden=!S.round;}catch(e){}return r;};
  /* if anything closes the menu while no round is on, open it again */
  new MutationObserver(()=>{if(!S.round&&document.getElementById('panel').hidden)setTimeout(()=>{if(!S.round&&document.getElementById('panel').hidden)openPanel(ptab||'round');},0);}).observe(document.getElementById('panel'),{attributes:true,attributeFilter:['hidden']});
  sync();
})();
