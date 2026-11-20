"use strict";
/* onboard: four-step first-run flow (welcome, 7 iron, quick choices, location). Replaces the old one-question welcome card. */
(function(){
  const st=document.createElement('style');
  st.textContent='#ob{position:fixed;inset:0;z-index:3000;background:#fff;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top) + 18px) 20px calc(env(safe-area-inset-bottom) + 16px);overflow-y:auto}'+
  '#ob .dots{display:flex;gap:6px;justify-content:center;margin:0 0 22px;min-height:6px}#ob .dots i{height:6px;width:6px;border-radius:3px;background:#d3dbd6}#ob .dots i.on{width:22px;background:var(--ink)}'+
  '#ob h1{font-size:26px;line-height:1.2;margin:0 0 8px;letter-spacing:-.4px}#ob .sub{margin:0 0 18px}'+
  '#ob .orow{display:flex;gap:12px;align-items:flex-start;margin:0 0 16px}#ob .oic{width:40px;height:40px;border-radius:12px;background:#effaf2;color:var(--accd);display:grid;place-items:center;font-size:20px;flex:none}'+
  '#ob .orow b{display:block;font-size:16px}#ob .orow span{font-size:14px;color:var(--mut)}'+
  '#ob .foot{margin-top:auto;padding-top:16px;display:flex;flex-direction:column;gap:6px}'+
  '#ob input[type=number]{font-size:26px;min-height:56px}#ob .err{color:var(--bad);font-size:14px;min-height:20px;margin:6px 0 0}'+
  '#ob .big{width:64px;height:64px;border-radius:50%;background:#effaf2;color:var(--accd);display:grid;place-items:center;font-size:32px;margin:30px auto 14px}';
  document.head.appendChild(st);

  let O=null;
  const root=()=>{let e=document.getElementById('ob');if(!e){e=document.createElement('div');e.id='ob';document.body.appendChild(e);}return e;};
  const seg=(g,opts,cur)=>'<div class="seg" style="margin:0 0 16px">'+opts.map(o=>'<button class="'+(o[0]===cur?'on':'')+'" data-ob="set" data-g="'+g+'" data-v="'+o[0]+'">'+o[1]+'</button>').join('')+'</div>';
  const row=(ic,a,b)=>'<div class="orow"><div class="oic">'+ic+'</div><div><b>'+a+'</b><span>'+b+'</span></div></div>';
  const dots=n=>'<div class="dots">'+(n>3?'':[0,1,2,3].map(i=>'<i class="'+(i===n?'on':'')+'"></i>').join(''))+'</div>';

  function render(){
    const n=O.step;let h=dots(n);
    if(n===0){
      h+='<h1>'+T('Your caddy, in your pocket','O teu caddie, no bolso')+'</h1><p class="sub">'+T('Caddy reads your GPS and your own shots, then tells you which club to hit.','O Caddy lê o teu GPS e as tuas tacadas e diz-te que taco usar.')+'</p>'+
        row('⌖',T('Live distances','Distâncias em direto'),T('To the pin and to any hazard.','Até à bandeira e a qualquer obstáculo.'))+
        row('◎',T('Advice that learns you','Conselhos que te aprendem'),T('Your carry and your misses shape every suggestion.','O teu voo e os teus erros moldam cada sugestão.'))+
        row('↗',T('Practice that counts','Treino que conta'),T('Range shots feed your spread and your progress.','As tacadas no range alimentam a tua dispersão e a tua evolução.'))+
        '<div class="foot"><button class="cta" data-ob="next">'+T('Get started','Começar')+'</button></div>';
    }else if(n===1){
      h+='<h1>'+T('How far do you hit your 7 iron?','A que distância bates o ferro 7?')+'</h1><p class="sub">'+T('Every other club scales from this. It sharpens as you play.','Todos os outros tacos escalam a partir disto. Fica mais certo à medida que jogas.')+'</p>'+
        seg('unit',[['m',T('Metres','Metros')],['y',T('Yards','Jardas')]],O.unit)+
        '<input type="number" inputmode="decimal" id="obc7" placeholder="'+(O.unit==='m'?'130':'142')+'" value="'+(O.c7||'')+'" aria-label="'+T('7 iron carry','Voo do ferro 7')+'"><div class="err" id="oberr" role="alert"></div>'+
        '<p class="sub" style="margin-top:8px">'+T('Not sure? Most amateurs carry 110 to 150 metres. You can change it any time in Bag.','Não sabes? A maioria dos amadores faz 110 a 150 metros. Podes mudar quando quiseres em Saco.')+'</p>'+
        '<div class="foot"><button class="cta" data-ob="c7">'+T('Continue','Continuar')+'</button><button class="link" data-ob="skip7">'+T('Skip for now','Saltar por agora')+'</button></div>';
    }else if(n===2){
      h+='<h1>'+T('A few quick choices','Duas escolhas rápidas')+'</h1><p class="sub">'+T('All of this lives in Settings if you change your mind.','Tudo isto fica nas Definições se mudares de ideias.')+'</p>'+
        '<div class="lbl" style="margin:0 0 8px">'+T('Language','Idioma')+'</div>'+seg('lang',[['en','English'],['pt','Português']],S.lang)+
        '<div class="lbl" style="margin:0 0 8px">'+T('I hit','Sou')+'</div>'+seg('hand',[['r',T('Right-handed','Destro')],['l',T('Left-handed','Esquerdino')]],S.lefty?'l':'r')+
        '<div class="lbl" style="margin:0 0 8px">'+T('Scorecard','Cartão')+'</div>'+seg('card',[['s',T('Score only','Só pancadas')],['p',T('Putts and more','Putts e mais')]],S.stats?'p':'s')+
        '<div class="foot"><button class="cta" data-ob="next">'+T('Continue','Continuar')+'</button></div>';
    }else if(n===3){
      h+='<h1>'+T('Allow your location','Permite a tua localização')+'</h1><p class="sub">'+T('Caddy needs GPS to measure distances on the course. Your location stays on your phone.','O Caddy precisa do GPS para medir distâncias no campo. A tua localização fica no teu telemóvel.')+'</p>'+
        row('✓',T('Private by design','Privado por defeito'),T('No account, no sign-in, nothing uploaded.','Sem conta, sem login, nada é enviado.'))+
        row('✓',T('Works on the course','Funciona no campo'),T('Distances and advice need no signal once the map has loaded.','Distâncias e conselhos não precisam de rede depois de o mapa carregar.'))+
        '<div class="foot"><button class="cta" data-ob="allow">'+T('Allow location','Permitir localização')+'</button><button class="link" data-ob="later">'+T('Not now','Agora não')+'</button></div>';
    }else{
      h+='<div class="big">✓</div><h1 style="text-align:center">'+T("You're set","Está tudo pronto")+'</h1><p class="sub center">'+(O.c7?T('Your 7 iron carries ','O teu ferro 7 faz ')+O.c7+' '+(O.unit==='m'?'m':'yd')+'. ':'')+T('Start a round or hit some balls at the range.','Começa uma volta ou bate umas bolas no range.')+'</p>'+
        '<div class="foot"><button class="cta" data-ob="round">'+T('Start a round','Começar uma volta')+'</button><button class="link" data-ob="range">'+T('Go to the range','Ir para o range')+'</button></div>';
    }
    root().innerHTML=h;
  }

  function finish(){
    S.setup=true;save();const e=document.getElementById('ob');if(e)e.remove();
    try{applyStatic();}catch(_){}try{refresh();}catch(_){}
  }
  function release(go){
    try{if(window.__obRelease)window.__obRelease();}catch(_){}
    if(go){try{startGPS(true);}catch(_){}}
  }
  function applyC7(){
    const val=Number(O.c7);if(!(val>0))return;
    const m=O.unit==='y'?val/M2Y:val,cl=S.clubs.find(x=>/^7/.test(x.name))||S.clubs[6]||S.clubs[0];
    if(m>20&&cl){const f=m/cl.carry;S.clubs.forEach(x=>{x.carry*=f;x.roll*=f;});}
    S.units=O.unit;
  }

  function open(){
    O={step:0,unit:S.units==='y'?'y':'m',c7:''};
    render();
  }
  openSetup=open;
  /* app.js already queued the old one-question card; swap it for this flow the moment it appears */
  const m=document.getElementById('modal');
  if(m)new MutationObserver(()=>{if(!m.hidden&&document.getElementById('q7s')&&!document.getElementById('ob')){m.hidden=true;open();}}).observe(m,{attributes:true,attributeFilter:['hidden']});

  document.addEventListener('click',e=>{
    const b=e.target.closest('#ob [data-ob]');if(!b||!O)return;
    const a=b.dataset.ob;
    if(a==='next'){O.step++;render();}
    else if(a==='set'){
      const g=b.dataset.g,v=b.dataset.v;
      if(g==='unit'){const el=document.getElementById('obc7');if(el)O.c7=el.value;O.unit=v;render();}
      else if(g==='lang'){S.lang=v;save();try{applyStatic();}catch(_){}render();}
      else if(g==='hand'){S.lefty=v==='l';save();render();}
      else if(g==='card'){S.stats=v==='p';save();render();}
    }
    else if(a==='c7'){
      const v=parseFloat((document.getElementById('obc7')||{}).value),mn=O.unit==='m'?50:55,mx=O.unit==='m'?260:285;
      if(!(v>=mn&&v<=mx)){document.getElementById('oberr').textContent=T('Enter a distance between '+mn+' and '+mx+', or skip.','Indica uma distância entre '+mn+' e '+mx+', ou salta.');return;}
      O.c7=String(Math.round(v));applyC7();save();O.step=2;render();
    }
    else if(a==='skip7'){O.c7='';O.step=2;render();}
    else if(a==='allow'){release(true);S.setup=true;save();O.step=4;render();}
    else if(a==='later'){release(false);S.setup=true;save();O.step=4;render();}
    else if(a==='round'){finish();O=null;try{openPanel('round');}catch(_){}}
    else if(a==='range'){finish();O=null;try{PL.src='range';openPanel('play');}catch(_){}}
  });
  document.addEventListener('input',e=>{if(e.target&&e.target.id==='obc7'){const m=document.getElementById('oberr');if(m)m.textContent='';}});
})();
