"use strict";
/* ============ Voice queue (no more cut-off speech) and auto-zoom near the green ============ */
const SQ={q:[],busy:false,cur:null};
function sqNext(){
  if(SQ.busy)return;const it=SQ.q.shift();if(!it)return;
  SQ.busy=true;SQ.cur=it;
  let tm=0;
  const fin=()=>{if(SQ.cur!==it)return;clearTimeout(tm);SQ.cur=null;SQ.busy=false;if(it.cb){try{it.cb();}catch(e){}}sqNext();};
  try{
    const want=S.lang==='pt'?'pt-PT':'en-GB',nm=x=>(x.lang||'').replace('_','-').toLowerCase();
    const vs=(speechSynthesis.getVoices()||[]).filter(x=>!/siri|premium|enhanced|eloquence|novelty|bad|good|whisper|zarvox|trinoids|cellos|organ|bells/i.test(x.name||''));
    const pref=S.lang==='pt'?/joana|catarina|helena/i:/daniel|serena|kate|samantha|karen/i;
    const pool=vs.filter(x=>nm(x)===want.toLowerCase()).concat(vs.filter(x=>nm(x).indexOf(S.lang==='pt'?'pt':'en')===0));
    const v=pool.find(x=>x.localService&&pref.test(x.name))||pool.find(x=>x.localService)||pool[0]||null;
    const mk=(useV)=>{const u=new SpeechSynthesisUtterance(it.txt);u.lang=want;if(useV&&v)u.voice=v;u.rate=1;u.volume=1;u.pitch=1;u.onerror=fin;it.u=u;return u;};
    tm=setTimeout(fin,4000+it.txt.length*130);
    let t0=0,tries=0,curU=null;
    const go=(useV)=>{
      tries++;const u=mk(useV);curU=u;let started=false;u.onerror=()=>{if(curU===u)fin();};
      u.onstart=()=>{started=true;t0=Date.now();};
      /* an utterance that "ends" at once with no sound (a broken voice) is retried with the phone's default voice */
      u.onend=()=>{if(curU!==u)return;if(started&&Date.now()-t0<250&&it.txt.length>15&&tries<3&&SQ.cur===it){try{speechSynthesis.cancel();}catch(e){}setTimeout(()=>go(false),80);return;}fin();};
      try{if(speechSynthesis.speaking||speechSynthesis.pending||speechSynthesis.paused)speechSynthesis.cancel();speechSynthesis.resume();}catch(e){}
      setTimeout(()=>{
        try{speechSynthesis.speak(u);}catch(e){}
        setTimeout(()=>{if(curU===u&&!started&&SQ.cur===it&&tries<3){try{speechSynthesis.cancel();}catch(e){}go(false);}},1500);
      },60);
    };
    go(true);
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
