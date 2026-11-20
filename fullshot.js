"use strict";
/* Only full swings count for distance spread. Chips and pitches (plan well under the club's full carry) are ignored by the stats. */
function isFullShot(s){
  const cl=(S.clubs||[]).find(c=>c.id===s.club),fc=cl&&cl.carry>0?cl.carry:null,d=s.carry!=null?s.carry:s.d,p=s.plan;
  if(p>0&&fc)return p>=0.92*fc;
  if(fc&&d!=null&&d>0&&d<0.6*fc)return false;
  return s.src!=='game'||!!s.full;
}
(function(){
  const _st=dtStats;dtStats=function(a){return _st(a.filter(isFullShot));};
  const _rc=rlogCarry;rlogCarry=function(id){const r=_rc(id),a=r.a.filter(isFullShot);return{n:a.length,avg:a.length?a.reduce((x,s)=>x+s.d,0)/a.length:null,a:a};};
  const _rm=rngMiss;rngMiss=function(id){
    const r0=S.rlog,s0=S.shots;
    try{S.rlog=(r0||[]).filter(isFullShot);S.shots=(s0||[]).filter(isFullShot);return _rm.apply(this,arguments);}
    finally{S.rlog=r0;S.shots=s0;}
  };
})();
