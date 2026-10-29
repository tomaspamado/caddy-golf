"use strict";
/* ================= Swing tab: Coach | Drills | History, and at-home camera drills ================= */
const DL={mode:'coach',open:null,beat:0.3,metro:null};
const DR_MET=(r,k)=>r.M.find(m=>m.key===k)||{st:'work',val:'–',tip:''};
const dlT=a=>S.lang==='pt'?a[1]:a[0];
const dlFirst=t=>String(t||'').split(/ Drill:| Exercício:/)[0].trim();
function drGoal(r,k,okEn,okPt){const m=DR_MET(r,k);return{ok:m.st==='good',val:m.val,tip:dlFirst(m.tip)};}
const DRILLS=[
 {id:'t1',view:'dtl',name:['1-2-3-1 tempo','Tempo 1-2-3-1'],purpose:['Build a 3:1 rhythm.','Criar um ritmo 3:1.'],
  steps:[['Stand without a ball and start the drill.','Count "one, two, three" while the club goes back, reaching the top on three.','Say "one" on the way down and through.','I measure back to down time after each swing.'],['Põe-te em address sem bola e começa o exercício.','Conta "um, dois, três" enquanto o taco sobe, chegando ao topo no três.','Diz "um" na descida e no impacto.','Meço a relação subida/descida depois de cada swing.']],
  pass:['Pass: tempo between 2.6 and 3.6 to 1.','Passa: ritmo entre 2,6 e 3,6 para 1.'],
  judge:r=>({ok:r.tempo>=2.6&&r.tempo<=3.6,val:r.tempo.toFixed(1)+' : 1',tip:r.tempo<2.6?T('You rushed the backswing. Count one, two, three going back.','Apressaste a subida. Conta um, dois, três na subida.'):T('The backswing was long or you stalled. Keep it smooth and flowing.','A subida foi longa ou paraste. Mantém o movimento suave e contínuo.')})},
 {id:'t2',view:'dtl',name:['Pause at the top','Pausa no topo'],purpose:['Stops the rush from backswing to downswing.','Evita a pressa na transição.'],
  steps:[['Swing back to the top.','Freeze there for about one second.','Then swing down smoothly.','I measure how long your hands stay still at the top.'],['Sobe até ao topo.','Pára aí cerca de um segundo.','Depois desce com suavidade.','Meço quanto tempo as mãos ficam paradas no topo.']],
  pass:['Pass: pause of 0.5 s or more at the top.','Passa: pausa de 0,5 s ou mais no topo.'],
  judge:r=>({ok:r.pauseTop>=0.5&&r.pauseTop<=2,val:r.pauseTop.toFixed(1)+' s',tip:r.pauseTop<0.5?T('There was no real pause. Stop at the top and count one before you come down.','Não houve pausa. Pára no topo e conta um antes de descer.'):T('That pause was very long. Aim for about one second.','A pausa foi muito longa. Procura cerca de um segundo.')})},
 {id:'t3',view:'fo',name:['Feet together balance','Equilíbrio de pés juntos'],purpose:['Bad tempo makes you lose balance, so this shows it.','Um mau ritmo faz perder o equilíbrio, e isto mostra-o.'],
  steps:[['Stand with your feet touching.','Make smooth half to three-quarter swings.','Hold your finish still until I speak.','I measure how much your head moves in the finish.'],['Põe os pés encostados.','Faz swings suaves de meio a três quartos.','Mantém o final parado até eu falar.','Meço quanto a cabeça mexe no final.']],
  pass:['Pass: head moves under 6 cm in the finish.','Passa: a cabeça mexe menos de 6 cm no final.'],
  judge:r=>drGoal(r,'bal')},
 {id:'t4',view:'dtl',name:['Chair posture','Postura com cadeira'],purpose:['Stops you standing up in the downswing (early extension).','Evita levantares-te na descida.'],
  steps:[['Put a chair or wall just behind your glutes.','Make swings and keep touching it until after impact.','I measure how much your spine angle changes to impact.'],['Põe uma cadeira ou parede logo atrás das nádegas.','Faz swings e mantém o contacto até depois do impacto.','Meço quanto muda o ângulo da coluna até ao impacto.']],
  pass:['Pass: spine angle changes under 6°.','Passa: o ângulo da coluna muda menos de 6°.'],
  judge:r=>drGoal(r,'tiltd')},
 {id:'t5',view:'fo',name:['Quiet head','Cabeça quieta'],purpose:['Turn around a steady head.','Rodar em torno de uma cabeça estável.'],
  steps:[['Face the camera side-on, as in the Face on view.','Make smooth swings keeping your eyes level.','I measure head slide and head rise to impact.'],['Fica de frente para a câmara.','Faz swings suaves com os olhos sempre à mesma altura.','Meço o deslize e a subida da cabeça até ao impacto.']],
  pass:['Pass: head moves under 8 cm.','Passa: a cabeça mexe menos de 8 cm.'],
  judge:r=>drGoal(r,'head')},
 {id:'t6',view:'dtl',name:['Wide lead arm','Braço da frente esticado'],purpose:['Keep the lead arm straight and wide going back.','Manter o braço da frente esticado e aberto na subida.'],
  steps:[['Swing back slowly with a club.','Feel your lead arm stretch away from your chest.','I measure the lead arm angle at the top.'],['Sobe devagar com um taco.','Sente o braço da frente a afastar-se do peito.','Meço o ângulo do braço da frente no topo.']],
  pass:['Pass: lead arm 160° or straighter.','Passa: braço da frente a 160° ou mais esticado.'],
  judge:r=>drGoal(r,'arm')},
 {id:'t7',view:'dtl',name:['Finish and hold','Final e manter'],purpose:['Swing through and hold a balanced finish.','Passar o impacto e manter um final equilibrado.'],
  steps:[['Make a smooth full swing.','Turn all the way to face the target.','Hold the finish on your lead leg until I speak.','I measure finish rotation and balance.'],['Faz um swing completo e suave.','Roda até ficares virado para o alvo.','Mantém o final sobre a perna da frente até eu falar.','Meço a rotação final e o equilíbrio.']],
  pass:['Pass: full rotation and steady finish.','Passa: rotação completa e final estável.'],
  judge:r=>{const a=DR_MET(r,'finrot'),b=DR_MET(r,'bal');return{ok:a.st==='good'&&b.st!=='work',val:a.val+' · '+b.val,tip:a.st!=='good'?dlFirst(a.tip):dlFirst(b.tip)};}}
];
function dlSeg(){
  return '<div class="seg" style="margin-bottom:12px">'+[['coach',T('Coach','Coach')],['drills',T('Drills','Exercícios')],['hist',T('History','Histórico')]].map(x=>'<button class="'+(DL.mode===x[0]?'on':'')+'" data-dl="mode" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
}
function dlRecord(id){return(S.drills&&S.drills[id])||{best:0,n:0,pass:0,reps:0};}
function dlMetroHTML(){
  const on=!!DL.metro;
  return '<details class="hint"><summary style="cursor:pointer;font-weight:700">'+T('3:1 click trainer (no camera)','Treinador de cliques 3:1 (sem câmara)')+'</summary><div class="seg" style="margin:10px 0">'+[[0.3,T('Quick','Rápido')],[0.36,T('Normal','Normal')],[0.42,T('Slow','Lento')]].map(x=>'<button class="'+(DL.beat===x[0]?'on':'')+'" data-dl="beat" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div><div class="sub" style="margin-bottom:8px">'+T('Three soft clicks while you swing back, then a louder one at impact.','Três cliques suaves enquanto sobes e um mais forte no impacto.')+'</div><button class="cta" data-dl="metro" style="'+(on?'background:#c62828':'')+'">'+(on?T('Stop trainer','Parar treinador'):T('Start trainer','Começar treinador'))+'</button></details>';
}
function dlMetroStop(){if(DL.metro){clearTimeout(DL.metro);DL.metro=null;}}
function dlMetroStart(){
  dlMetroStop();let k=0;const b=DL.beat*1000;
  const tick=()=>{if(!DL.metro)return;const i=k%4;swBeep(i===3?1100:700,i===3?160:70);const wait=i===3?b+2200:b;k++;DL.metro=setTimeout(tick,wait);};
  DL.metro=setTimeout(tick,50);
}
function dlHTML(){
  if(DL.open){
    const d=DRILLS.find(x=>x.id===DL.open),r=dlRecord(d.id);
    return '<button class="link" data-dl="back" style="padding:0">‹ '+T('All drills','Todos os exercícios')+'</button><div class="vhtitle" style="margin:6px 0">'+esc(dlT(d.name))+'</div><div class="sub">'+esc(dlT(d.purpose))+'</div>'+
    '<div class="lbl" style="margin:12px 0 6px">'+T('How it works','Como funciona')+'</div>'+(S.lang==='pt'?d.steps[1]:d.steps[0]).map((x,i)=>'<div class="why" style="margin:4px 0"><b>'+(i+1)+'.</b> '+esc(x)+'</div>').join('')+
    '<div class="aim" style="margin-top:10px">'+esc(dlT(d.pass))+'</div><div class="sub" style="margin:8px 0">'+T('Camera: ','Câmara: ')+(d.view==='fo'?T('face on (in front of you)','de frente (à tua frente)'):T('down the line (behind you)','por trás (atrás de ti)'))+(r.n?' · '+T('best streak ','melhor sequência ')+r.best:'')+'</div>'+
    '<div class="lbl" style="margin:10px 0 6px">'+T('Club','Taco')+'</div>'+swClubChips()+swCamBox();
  }
  let h='<div class="hint" style="margin-top:0">'+T('Home drills with no ball. The camera checks each swing and tells you if you did it right.','Exercícios em casa sem bola. A câmara verifica cada swing e diz-te se fizeste bem.')+'</div>'+dlMetroHTML();
  DRILLS.forEach(d=>{const r=dlRecord(d.id);h+='<button class="pick" data-dl="open" data-id="'+d.id+'"><span><b>'+esc(dlT(d.name))+'</b><br><small>'+esc(dlT(d.purpose))+'</small></span><span>'+(r.n?'<small>'+T('best streak','melhor seq.')+' '+r.best+'</small>':'<small>📷</small>')+'</span></button>';});
  return h;
}
/* judge one swing in a drill session */
function drIntro(){const d=SWV.drill;return T('Drill started: '+d.name[0]+'. Swing when you are ready.','Exercício iniciado: '+d.name[1]+'. Faz o swing quando estiveres pronto.');}
function drJudge(res,S_){
  const d=SWV.drill,j=d.judge(res);
  S_.n++;S_.pass=(S_.pass||0)+(j.ok?1:0);S_.st=j.ok?(S_.st||0)+1:0;S_.bs=Math.max(S_.bs||0,S_.st);S_.items.push({ok:j.ok,val:j.val,score:res.score});
  if(typeof hxKeep==='function')hxKeep(res,SWV.frames,{ok:j.ok,drill:d.id});
  const e=$s('swsess');
  if(e)e.innerHTML='<div class="hero" style="margin-top:6px"><div><div class="lbl">'+T('Passed','Aprovados')+'</div><div class="club">'+S_.pass+'<span style="font-size:20px;color:var(--mut)"> / '+S_.n+'</span></div></div><div class="plays">'+T('streak','sequência')+' '+S_.st+'<br>'+T('best','melhor')+' '+S_.bs+'</div></div><div class="row" style="margin:8px 0">'+S_.items.map(x=>'<span class="cond" style="min-height:36px;display:inline-flex;align-items:center;background:'+(x.ok?'#dcfce7':'#fee2e2')+'">'+(x.ok?'✓ ':'✗ ')+esc(x.val)+'</span>').join('')+'</div>';
  swMsg((j.ok?'✓ ':'✗ ')+j.val+(j.ok?'':' · '+j.tip),!j.ok);
  const say=(j.ok?T('Good. ','Bom. '):T('Not yet. ','Ainda não. '))+j.val.replace(' : 1',' to 1')+'. '+(j.ok?'':j.tip);
  swSay(say,()=>setTimeout(swArm,2200));
}
function drEnd(s){
  const d=SWV.drill;SWV.state='live';SWV.auto=null;swBtns();
  try{if(window.speechSynthesis)speechSynthesis.cancel();}catch(e){}
  if(s.n){S.drills=S.drills||{};const r=S.drills[d.id]=S.drills[d.id]||{best:0,n:0,pass:0,reps:0};r.n++;r.pass+=s.pass||0;r.reps+=s.n;if((s.bs||0)>r.best)r.best=s.bs||0;save();}
  const e=$s('swsess');
  if(e)e.innerHTML=s.n?'<div class="aim" style="background:#effaf2;color:#166534"><b>'+esc(dlT(d.name))+'</b><br>'+(s.pass||0)+' / '+s.n+' '+T('passed','aprovados')+' · '+T('best streak','melhor sequência')+' '+(s.bs||0)+'<br>'+T('The full numbers and photos are in History.','Os números e as fotos estão em Histórico.')+'</div>':'';
  swMsg(T('Drill finished.','Exercício terminado.'));SWV.sess=null;
  if(s.n)swSay(T('Drill finished. '+(s.pass||0)+' of '+s.n+' passed.','Exercício terminado. '+(s.pass||0)+' de '+s.n+' aprovados.'));
}
function dlRender(){
  const p=$('#pbody');if(!p)return;
  if(DL.mode!=='drills'||!DL.open)SWV.drill=null;
  p.innerHTML=swingHTMLBase_wrap();
  if(DL.mode==='coach'||(DL.mode==='drills'&&DL.open))swingMountBase();
}
function dlAct(a,b){
  if(a==='mode'){swingStop();dlMetroStop();DL.mode=b.dataset.v;DL.open=null;SWV.drill=null;if(typeof HX!=='undefined')HX.open=null;dlRender();return;}
  if(a==='open'){swingStop();DL.open=b.dataset.id;SWV.drill=DRILLS.find(x=>x.id===DL.open);SWV.view=SWV.drill.view;dlMetroStop();dlRender();return;}
  if(a==='back'){swingStop();DL.open=null;SWV.drill=null;dlRender();return;}
  if(a==='beat'){DL.beat=+b.dataset.v;if(DL.metro)dlMetroStart();dlRender();return;}
  if(a==='metro'){if(DL.metro)dlMetroStop();else dlMetroStart();dlRender();return;}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-dl]');if(b)dlAct(b.dataset.dl,b);});
const swingHTMLBase=swingHTML,swingMountBase=swingMount;
function swingHTMLBase_wrap(){
  return dlSeg()+(DL.mode==='coach'?swingHTMLBase():DL.mode==='drills'?dlHTML():(typeof hxHTML==='function'?hxHTML():''));
}
swingHTML=function(){if(DL.mode!=='drills'||!DL.open)SWV.drill=null;return swingHTMLBase_wrap();};
swingMount=function(){if(DL.mode==='coach'||(DL.mode==='drills'&&DL.open))swingMountBase();};