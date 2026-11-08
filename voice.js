"use strict";
/* ============ Voice queue (no more cut-off speech) and auto-zoom near the green ============ */
const SQ={q:[],busy:false,cur:null};
function sqNext(){
  if(SQ.busy)return;const it=SQ.q.shift();if(!it)return;
  SQ.busy=true;SQ.cur=it;
  let tm=0;
  const fin=()=>{if(SQ.cur!==it)return;clearTimeout(tm);SQ.cur=null;SQ.busy=false;if(it.cb){try{it.cb();}catch(e){}}sqNext();};
  try{
    const u=new SpeechSynthesisUtterance(it.txt),want=S.lang==='pt'?'pt-PT':'en-GB';u.lang=want;
    const vs=speechSynthesis.getVoices(),nm=x=>(x.lang||'').replace('_','-').toLowerCase();
    const v=vs.find(x=>nm(x)===want.toLowerCase())||vs.find(x=>nm(x).indexOf(S.lang==='pt'?'pt':'en')===0);
    if(v)u.voice=v;u.rate=1;u.onend=fin;u.onerror=fin;
    it.u=u;                                   /* keep a reference: browsers drop speech if it is garbage collected */
    tm=setTimeout(fin,4000+it.txt.length*130);
    /* iOS Safari sometimes wedges speech after camera/audio use: clear it, wake it, and retry once if it never starts */
    let started=false;u.onstart=()=>{started=true;};
    try{if(speechSynthesis.speaking||speechSynthesis.pending||speechSynthesis.paused)speechSynthesis.cancel();speechSynthesis.resume();}catch(e){}
    setTimeout(()=>{
      try{speechSynthesis.speak(u);}catch(e){}
      setTimeout(()=>{
        if(started||SQ.cur!==it)return;
        try{speechSynthesis.cancel();speechSynthesis.resume();const u2=new SpeechSynthesisUtterance(it.txt);u2.lang=u.lang;if(u.voice)u2.voice=u.voice;u2.rate=1;u2.onend=fin;u2.onerror=fin;it.u=u2;speechSynthesis.speak(u2);}catch(e){}
      },1500);
    },60);
  }catch(e){tm=setTimeout(fin,300);}
}
swSay=function(txt,cb,urgent){
  if(!SWV.voice||!window.speechSynthesis||!txt){setTimeout(()=>{if(cb)cb();},400);return;}
  if(urgent){SQ.q=[];SQ.cur=null;SQ.busy=false;try{speechSynthesis.cancel();}catch(e){}}
  SQ.q.push({txt:txt,cb:cb});sqNext();
};
const _swSessEndV=swSessEnd;
swSessEnd=function(){SQ.q=[];SQ.cur=null;SQ.busy=false;_swSessEndV.apply(this,arguments);};
/* a quick club change by gesture replaces what is being said */
const _hmShiftV=hmShift;
hmShift=function(dir,n){SQ.q=[];_hmShiftV(dir,n);};

/* within 100 m of the pin the hole view zooms in on ball and green */
const _hmBoundsV=hmBounds;
hmBounds=function(H){
  const b=_hmBoundsV(H),v=R.vh;
  if(!v||v.h!==H||v.fin)return b;
  let rem;try{rem=vhRem(v);}catch(e){return b;}
  if(!(rem<=100))return b;
  const bx=v.x,by=v.y,px=H.pin.x,py=H.pin.y;
  let x0=Math.min(bx,px)-26,x1=Math.max(bx,px)+26,y0=Math.min(by,py)-24,y1=Math.max(by,py)+24;
  if(x1-x0<70){const c=(x0+x1)/2;x0=c-35;x1=c+35;}
  if(y1-y0<70){const c=(y0+y1)/2;y0=c-35;y1=c+35;}
  return{x0:x0,x1:x1,y0:y0,y1:y1};
};

/* the hole picture must never be squeezed by the notes under it: cap the bottom panel and let it scroll */
(function(){const st=document.createElement('style');st.textContent='#hmov>div:last-child{max-height:44dvh;overflow-y:auto;-webkit-overflow-scrolling:touch}#hmov #vhc{min-height:36dvh}';document.head.appendChild(st);})();
/* voice needs a tap to unlock on iOS: unlock it on the first touch anywhere */
document.addEventListener('touchend',function f(){try{if(window.speechSynthesis){const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u);}}catch(e){}document.removeEventListener('touchend',f);},{once:true,passive:true});
