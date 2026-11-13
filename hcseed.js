"use strict";
/* ---- rounds read from the Hole19 screen recording (13 Nov 2026), 9 holes, Estoril Blue, par 34 (pars 4 4 5 4 3 4 3 3 4) ----
   score = adjusted: every hole capped at double bogey; raw = what was written on the card. Rating 32.3 / slope 116 (Yellow). */
const HC_SEED=[
  {id:9101,date:'2026-11-13',raw:50,score:44},{id:9102,date:'2026-10-20',raw:62,score:50},{id:9103,date:'2026-10-16',raw:53,score:50},
  {id:9104,date:'2026-07-30',raw:59,score:50},{id:9105,date:'2026-06-01',raw:52,score:47},{id:9106,date:'2026-03-24',raw:65,score:50},{id:9107,date:'2026-04-18',raw:55,score:50}
];
(function(){
  if(S.hcpSeed1)return;const L=hcList();
  HC_SEED.forEach(r=>{if(!L.some(x=>x.id===r.id))L.push({id:r.id,date:new Date(r.date+'T12:00:00').getTime(),course:'Estoril Blue (9) · card '+r.raw,score:r.score,raw:r.raw,cr:32.3,slope:116,holes:9});});
  S.hcpSeed1=true;try{save();}catch(e){}
})();
