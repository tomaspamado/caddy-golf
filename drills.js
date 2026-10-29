"use strict";
/* ================= Drills, tempo game and tempo metronome ================= */
const DL={mode:'coach',open:null,sc:null,beat:0.3,metro:null,tab:'all'};
const DR_CATS=[['tempo',['Tempo (no ball)','Ritmo (sem bola)']],['putt',['Putting','Putting']],['driver',['Driver','Driver']],['iron',['Irons and wedges','Ferros e wedges']]];
function DR(id,cat,name,purpose,steps,goal,kind,extra){return Object.assign({id,cat,name,purpose,steps,goal,kind},extra||{});}
const DRILLS=[
 DR('t1','tempo',['Count 1-2-3-1','Contar 1-2-3-1'],['Build a 3:1 rhythm. Pros take about three times longer to reach the top than to come down.','Criar um ritmo 3:1. Os profissionais demoram cerca de três vezes mais a chegar ao topo do que a descer.'],
  [['Set up without a ball.','Count "one, two, three" while the club goes back, so you reach the top on three.','Say "one" on the way down and through.','Use the Swing coach to check your tempo number.'],['Põe-te em address sem bola.','Conta "um, dois, três" enquanto o taco sobe, chegando ao topo no três.','Diz "um" na descida e no impacto.','Usa o Swing coach para ver o teu número de ritmo.']],
  ['Goal: 10 swings with tempo between 2.5 and 3.6 to 1.','Objetivo: 10 swings com ritmo entre 2,5 e 3,6 para 1.'],'count'),
 DR('t2','tempo',['Pause at the top','Pausa no topo'],['Stops the rush from backswing to downswing.','Evita a pressa na transição da subida para a descida.'],
  [['Make a half backswing with a 7 iron.','Pause for one full second at the top.','Swing down smoothly.','Build up to full swings as it feels easy.'],['Faz meia subida com um ferro 7.','Pára um segundo completo no topo.','Desce com suavidade.','Aumenta até swings completos quando estiver fácil.']],
  ['Goal: 15 smooth swings in a row without rushing.','Objetivo: 15 swings suaves seguidos sem pressa.'],'streak'),
 DR('t3','tempo',['Feet together','Pés juntos'],['Bad tempo makes you lose balance, so the drill exposes it.','Um mau ritmo faz perder o equilíbrio, por isso o exercício mostra-o.'],
  [['Stand with your feet touching, ball in the middle.','Make half swings with a 7 iron, then lengthen them.','If you stumble, you swung too fast. Slow down.','After 15 to 20 swings, go back to your normal stance.'],['Põe os pés encostados, bola ao meio.','Faz meios swings com um ferro 7 e vai aumentando.','Se tropeçares, foste demasiado rápido. Abranda.','Depois de 15 a 20 swings, volta à posição normal.']],
  ['Goal: 15 swings in balance.','Objetivo: 15 swings em equilíbrio.'],'count'),
 DR('t4','tempo',['Step drill','Exercício do passo'],['Syncs lower body and arms with a smooth start.','Sincroniza a parte de baixo com os braços e dá um início suave.'],
  [['Start with feet together, club just ahead of the ball.','Push the club toward the target, then swing back.','As the club goes up, step the trail foot back to your normal stance.','Step into the lead foot through impact and hold your finish.','Start without a ball, then add one.'],['Começa com os pés juntos, taco logo à frente da bola.','Empurra o taco para o alvo e depois sobe.','Ao subir o taco, dá o passo com o pé de trás para a posição normal.','Apoia o pé da frente no impacto e mantém o final.','Começa sem bola e depois acrescenta uma.']],
  ['Goal: 10 balanced finishes held for 3 seconds.','Objetivo: 10 finais equilibrados mantidos 3 segundos.'],'count'),
 DR('p1','putt',['Gate drill','Exercício da porta'],['Groove a square putter face and start line.','Treinar a face do putter direita e a linha de saída.'],
  [['Put two tees in the ground, a putter head wide, a short way in front of the ball (3 to 4 feet works).','Roll putts through the gate without touching a tee.','Touching the near tee means you pull it, the far tee means you push it.','Narrow the gate only after 7 of 10 pass cleanly.'],['Põe dois tês no chão, à largura da cabeça do putter, um pouco à frente da bola (1 metro dá).','Faz rolar a bola pela porta sem tocar nos tês.','Tocar no tê mais perto é puxar, no mais longe é empurrar.','Só estreita a porta depois de 7 em 10 passarem limpas.']],
  ['Goal: 7 out of 10 through the gate.','Objetivo: 7 em 10 pela porta.'],'count'),
 DR('p2','putt',['Clock drill','Exercício do relógio'],['Short putts under light pressure.','Putts curtos com pouca pressão.'],
  [['Place four balls 3 feet from the hole at 12, 3, 6 and 9 o\'clock.','Hole them all. If you miss, start again from the first.','Harder version: one ball only, read each putt fresh and go round three times.'],['Põe quatro bolas a 1 metro do buraco nas posições 12, 3, 6 e 9 horas.','Mete todas. Se falhares, recomeça da primeira.','Versão difícil: só uma bola, lê cada putt de novo e dá três voltas.']],
  ['Goal: 12 in a row (3 laps).','Objetivo: 12 seguidos (3 voltas).'],'streak',{tgt:12}),
 DR('p3','putt',['3-6-9 drill','Exercício 3-6-9'],['Confidence from 3, 6 and 9 feet.','Confiança aos 1, 2 e 3 metros.'],
  [['Put tees at 3, 6 and 9 feet from the hole.','Make three putts from each distance.','Miss one: repeat that distance. Miss two: move one distance closer. Miss all three: start again.'],['Põe tês a 1, 2 e 3 metros do buraco.','Mete três putts de cada distância.','Falhas um: repete essa distância. Falhas dois: recua uma distância. Falhas os três: recomeça.']],
  ['Goal: finish all three distances.','Objetivo: completar as três distâncias.'],'count'),
 DR('p4','putt',['Ladder (speed control)','Escada (controlo de velocidade)'],['Distance control on long putts.','Controlo de distância em putts longos.'],
  [['Put tees at 10, 20, 30 and 40 feet.','Roll one ball to each tee, then back down the ladder.','Count a rung if the ball stops within 2 feet of the tee.'],['Põe tês a 3, 6, 9 e 12 metros.','Rola uma bola até cada tê e depois desce a escada.','Conta como bom se a bola parar a menos de 60 cm do tê.']],
  ['Goal: 6 of 8 within 2 feet.','Objetivo: 6 de 8 a menos de 60 cm.'],'count'),
 DR('p5','putt',['Safety zone distance game','Jogo da zona de segurança'],['Learn to leave the ball just past the hole.','Aprender a deixar a bola logo depois do buraco.'],
  [['Putt from 20 feet and lay a club 18 inches behind the hole.','Score: +5 for holing it, -5 if short, +2 if it stops between the hole and the club, -2 if it hits the club.','Play until you reach 20 points.'],['Faz putts de 6 metros e põe um taco 45 cm atrás do buraco.','Pontos: +5 se meteres, -5 se ficar curto, +2 se parar entre o buraco e o taco, -2 se bater no taco.','Joga até chegares a 20 pontos.']],
  ['Goal: 20 points.','Objetivo: 20 pontos.'],'points',{btns:[['Holed +5',5],['Short -5',-5],['Past hole +2',2],['Hit club -2',-2]],tgt:20}),
 DR('d1','driver',['Fairway gate (call your shot)','Fairway com portas (anuncia a tacada)'],['Accuracy under a clear target.','Precisão com um alvo claro.'],
  [['Pick a fairway 25 to 30 yards wide on the range between two markers.','Say your shape and target out loud before every drive.','Hit 10 drives.'],['Escolhe um fairway de 25 a 30 jardas de largura entre dois marcadores.','Diz em voz alta a trajetória e o alvo antes de cada drive.','Bate 10 drives.']],
  ['Goal: 6 of 10 inside the fairway.','Objetivo: 6 de 10 dentro do fairway.'],'count'),
 DR('d2','driver',['Launch gate','Porta de saída'],['Control the start line and face.','Controlar a linha de saída e a face.'],
  [['Put an alignment stick 3 to 5 feet in front of the ball.','Start the ball just left or right of the stick, depending on the shape you want.','Use foot spray or impact tape to see where you hit the face.','Hit 4 to 6 drives.'],['Põe uma vara de alinhamento 1 a 1,5 metros à frente da bola.','Faz a bola sair um pouco à esquerda ou à direita da vara, conforme a trajetória que queres.','Usa spray ou fita de impacto para ver onde bates na face.','Bate 4 a 6 drives.']],
  ['Goal: 4 of 6 start on your chosen line.','Objetivo: 4 de 6 saem na linha escolhida.'],'count'),
 DR('d3','driver',['Tees under arms','Tês debaixo dos braços'],['Keep arms and body working together.','Manter braços e corpo a trabalhar em conjunto.'],
  [['Wedge a tee or a glove under each armpit.','Make normal swings and try not to drop them.','A dropped item means your arms and body went out of sync.'],['Põe um tê ou uma luva debaixo de cada axila.','Faz swings normais sem os deixar cair.','Se cair, os braços e o corpo desalinharam-se.']],
  ['Goal: 10 swings without a drop.','Objetivo: 10 swings sem deixar cair.'],'streak',{tgt:10}),
 DR('d4','driver',['Fairway finder (100 yards)','Fairway seguro (100 jardas)'],['Keep the ball in play with a calm, balanced swing.','Manter a bola em jogo com um swing calmo e equilibrado.'],
  [['Narrow your stance and stay on your lead side.','Swing at about 100 yards, low and soft.','Feel the same balance when you swing a full driver.'],['Fecha a posição e fica sobre o lado da frente.','Bate a cerca de 100 jardas, baixo e suave.','Procura o mesmo equilíbrio no driver completo.']],
  ['Goal: 8 of 10 in the fairway.','Objetivo: 8 de 10 no fairway.'],'count'),
 DR('i1','iron',['Wedge ladder','Escada de wedge'],['Distance control with partial wedges.','Controlo de distância com wedges parciais.'],
  [['Pick three carry distances, for example 40, 60 and 80 yards.','Hit two balls to each distance and note the swing length that does it.','Count it if the carry is within 10 percent.'],['Escolhe três distâncias de voo, por exemplo 40, 60 e 80 jardas.','Bate duas bolas para cada distância e anota o tamanho do swing que a dá.','Conta se o voo ficar a menos de 10%.']],
  ['Goal: 4 of 6 within 10 percent.','Objetivo: 4 de 6 a menos de 10%.'],'count'),
 DR('i2','iron',['Mid-iron fairway (start line)','Fairway com ferro médio (linha de saída)'],['Start line and dispersion with a 7 or 8 iron.','Linha de saída e dispersão com um ferro 7 ou 8.'],
  [['Make a fairway between two alignment sticks or range markers.','Hit 6 balls, focusing on start direction.'],['Faz um fairway entre duas varas de alinhamento ou marcas do range.','Bate 6 bolas a pensar na direção de saída.']],
  ['Goal: 4 of 6 between the markers.','Objetivo: 4 de 6 entre as marcas.'],'count'),
 DR('i3','iron',['Towel landing spot','Toalha como alvo de aterragem'],['Feel how speed changes carry.','Sentir como a velocidade muda o voo.'],
  [['Lay a towel as a landing spot.','Hit one on it, then one just short, then one just over.','Notice how much speed each needs.'],['Põe uma toalha como ponto de aterragem.','Bate uma nela, depois uma logo antes e uma logo depois.','Repara na velocidade que cada uma pede.']],
  ['Goal: 5 of 9 land on the towel.','Objetivo: 5 de 9 aterram na toalha.'],'count'),
 DR('i4','iron',['Calibrate your yardages','Calibrar as tuas distâncias'],['Know your real carry for each club.','Saber o teu voo real com cada taco.'],
  [['Hit 5 to 6 well-struck shots with one iron in the same conditions.','Take the median carry as your number.','Enter it in the Range tab and the caddy updates your bag.'],['Bate 5 a 6 tacadas bem batidas com o mesmo ferro nas mesmas condições.','Usa a mediana do voo como o teu número.','Regista-o no separador Treino e o caddy atualiza o teu saco.']],
  ['Goal: one calibrated carry per club.','Objetivo: um voo calibrado por taco.'],'count')
];
const dlT=a=>S.lang==='pt'?a[1]:a[0];
function dlSeg(){
  return '<div class="seg" style="margin-bottom:12px">'+[['coach',T('Coach','Coach')],['drills',T('Drills','Exercícios')]].map(x=>'<button class="'+(DL.mode===x[0]?'on':'')+'" data-dl="mode" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
}
function dlRecord(id){return(S.drills&&S.drills[id])||{best:0,streak:0,n:0};}
function dlHTML(){
  if(DL.open)return dlDetail(DRILLS.find(d=>d.id===DL.open));
  let h='<div class="hint" style="margin-top:0">'+T('Drills collected from well-known coaching sources and simplified. Tap one to see the steps and keep score.','Exercícios recolhidos de fontes de coaching conhecidas e simplificados. Toca num para ver os passos e registar os pontos.')+'</div>';
  h+='<div class="lbl" style="margin:10px 0 6px">'+T('Tempo trainer (no camera)','Treinador de ritmo (sem câmara)')+'</div>'+dlMetroHTML();
  DR_CATS.forEach(c=>{
    h+='<div class="lbl" style="margin:16px 0 6px">'+dlT(c[1])+'</div>';
    DRILLS.filter(d=>d.cat===c[0]).forEach(d=>{const r=dlRecord(d.id);h+='<button class="pick" data-dl="open" data-id="'+d.id+'"><span><b>'+esc(dlT(d.name))+'</b><br><small>'+esc(dlT(d.purpose))+'</small></span><span>'+(r.n?'<small>'+T('best','melhor')+' '+(d.kind==='points'?r.best:(d.kind==='streak'?r.streak:r.best+'%'))+'</small>':'')+'</span></button>';});
  });
  return h;
}
function dlMetroHTML(){
  const on=!!DL.metro;
  return '<div class="hint"><div class="seg" style="margin-bottom:10px">'+[[0.3,T('Quick','Rápido')],[0.36,T('Normal','Normal')],[0.42,T('Slow','Lento')]].map(x=>'<button class="'+(DL.beat===x[0]?'on':'')+'" data-dl="beat" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div><div class="sub" style="margin-bottom:8px">'+T('Three soft clicks while you swing back, then a louder one at impact. That is a 3 : 1 tempo.','Três cliques suaves enquanto sobes e um mais forte no impacto. É um ritmo 3 : 1.')+'</div><button class="cta" data-dl="metro" style="'+(on?'background:#c62828':'')+'">'+(on?T('Stop trainer','Parar treinador'):T('Start trainer','Começar treinador'))+'</button></div>';
}
function dlMetroStop(){if(DL.metro){clearTimeout(DL.metro);DL.metro=null;}}
function dlMetroStart(){
  dlMetroStop();let k=0;const b=DL.beat*1000;
  const tick=()=>{if(!DL.metro)return;const i=k%4;swBeep(i===3?1100:700,i===3?160:70);const wait=i===3?b+2200:b;k++;DL.metro=setTimeout(tick,wait);};
  DL.metro=setTimeout(tick,50);
}
function dlDetail(d){
  const r=dlRecord(d.id),sc=DL.sc&&DL.sc.id===d.id?DL.sc:(DL.sc={id:d.id,a:0,m:0,st:0,bs:0,pts:0,h:[]});
  let h='<button class="link" data-dl="back" style="padding:0">‹ '+T('All drills','Todos os exercícios')+'</button><div class="vhtitle" style="margin:6px 0">'+esc(dlT(d.name))+'</div><div class="sub">'+esc(dlT(d.purpose))+'</div>';
  h+='<div class="lbl" style="margin:14px 0 6px">'+T('How to do it','Como fazer')+'</div>'+(S.lang==='pt'?d.steps[1]:d.steps[0]).map((x,i)=>'<div class="why" style="margin:4px 0"><b>'+(i+1)+'.</b> '+esc(x)+'</div>').join('');
  h+='<div class="aim" style="margin-top:10px">'+esc(dlT(d.goal))+'</div>';
  h+='<div class="lbl" style="margin:16px 0 6px">'+T('Score keeper','Marcador')+'</div>';
  if(d.kind==='points'){
    h+='<div class="hero"><div><div class="club">'+sc.pts+'</div></div><div class="plays">'+T('goal','objetivo')+' '+d.tgt+'</div></div><div class="seg" style="margin:8px 0">'+d.btns.map(b=>'<button data-dl="pts" data-v="'+b[1]+'">'+esc(b[0])+'</button>').join('')+'</div>';
  }else{
    const pct=sc.a?Math.round(sc.m/sc.a*100):0;
    h+='<div class="hero"><div><div class="club">'+sc.m+'<span style="font-size:20px;color:var(--mut)"> / '+sc.a+'</span></div></div><div class="plays">'+(d.kind==='streak'?T('streak','sequência')+' '+sc.st+' · '+T('best','melhor')+' '+sc.bs:pct+'%')+'</div></div>'+
    '<div class="row" style="margin:8px 0"><button class="cta" style="flex:1" data-dl="hit">✓ '+T('Good','Bom')+'</button><button class="cta" style="flex:1;background:#c62828" data-dl="miss">✗ '+T('Miss','Falha')+'</button></div>';
  }
  h+='<div class="row"><button class="sec" data-dl="undo">'+T('Undo','Desfazer')+'</button><button class="sec" data-dl="reset">'+T('Reset','Repor')+'</button><button class="sec" data-dl="save">'+T('Save result','Guardar resultado')+'</button></div>';
  if(r.n)h+='<div class="sub" style="margin-top:10px">'+T('Saved sessions: ','Sessões guardadas: ')+r.n+' · '+T('best','melhor')+' '+(d.kind==='points'?r.best:(d.kind==='streak'?r.streak:r.best+'%'))+'</div>';
  if(d.id==='i4')h+='<button class="sec" style="width:100%;margin-top:12px" data-dl="range">'+T('Open the Range tab','Abrir o separador Treino')+'</button>';
  return h;
}
function dlStreakApply(sc,ok){sc.a++;if(ok){sc.m++;sc.st++;if(sc.st>sc.bs)sc.bs=sc.st;}else sc.st=0;}
function dlAct(a,b){
  if(a==='mode'){DL.mode=b.dataset.v;if(DL.mode!=='coach')swingStop();dlMetroStop();DL.open=null;dlRender();return;}
  if(a==='open'){DL.open=b.dataset.id;DL.sc=null;dlRender();return;}
  if(a==='back'){DL.open=null;dlRender();return;}
  if(a==='beat'){DL.beat=+b.dataset.v;if(DL.metro)dlMetroStart();dlRender();return;}
  if(a==='metro'){if(DL.metro)dlMetroStop();else dlMetroStart();dlRender();return;}
  if(a==='range'){openPanel('range');return;}
  const d=DRILLS.find(x=>x.id===DL.open),sc=DL.sc;if(!d||!sc)return;
  if(a==='hit'||a==='miss'){sc.h.push({a:sc.a,m:sc.m,st:sc.st,bs:sc.bs});dlStreakApply(sc,a==='hit');}
  else if(a==='pts'){sc.h.push({pts:sc.pts});sc.pts+=+b.dataset.v;}
  else if(a==='undo'){const p=sc.h.pop();if(p)Object.assign(sc,p);}
  else if(a==='reset'){DL.sc={id:d.id,a:0,m:0,st:0,bs:0,pts:0,h:[]};}
  else if(a==='save'){
    S.drills=S.drills||{};const r=S.drills[d.id]=S.drills[d.id]||{best:0,streak:0,n:0,log:[]};
    if(d.kind==='points'){if(sc.pts>r.best)r.best=sc.pts;}else{const pc=sc.a?Math.round(sc.m/sc.a*100):0;if(pc>r.best)r.best=pc;if(sc.bs>r.streak)r.streak=sc.bs;}
    r.n++;r.log=(r.log||[]).concat([{t:Date.now(),a:sc.a,m:sc.m,pts:sc.pts,bs:sc.bs}]).slice(-30);save();DL.sc=null;DL.open=null;
  }
  dlRender();
}
function dlRender(){const p=$('#pbody');if(!p)return;p.innerHTML=dlSeg()+(DL.mode==='coach'?swingHTMLBase():dlHTML());if(DL.mode==='coach')swingMountBase();}
document.addEventListener('click',e=>{const b=e.target.closest('[data-dl]');if(b)dlAct(b.dataset.dl,b);});
/* wrap the Swing tab so it shows the Coach / Drills switch */
const swingHTMLBase=swingHTML,swingMountBase=swingMount;
swingHTML=function(){return dlSeg()+(DL.mode==='coach'?swingHTMLBase():dlHTML());};
swingMount=function(){if(DL.mode==='coach')swingMountBase();};

/* ---------- Tempo Flap: a game played with your real swing ---------- */
function swGameStart(){
  if(SWV.state!=='live')return;
  const c=swClub(),cls=swCls(c&&c.name),topH={driver:.8,wood:.72,long:.62,short:.52,wedge:.42}[cls]||.6;
  SWV.state='game';SWV.game={ph:'wait',topH:topH,base:null,tl:0.25,t0:0,path:[],score:0,n:0,streak:0,res:'',cool:0,last:0,prev:null};
  $s('swres').innerHTML='';
  $s('swsess').innerHTML='<canvas id="swg" style="width:100%;height:230px;border-radius:14px;background:#0b3d2a;display:block;margin-top:8px"></canvas><div id="swgs" class="aim" style="background:var(--soft);color:var(--ink)"></div>';
  swBtns();swMsg(T('Tempo Flap: stay still at address, then swing. Your hands are the bird.','Tempo Flap: fica parado em address e depois faz o swing. As tuas mãos são o pássaro.'));
  swSay(T('Tempo Flap. Hold still at address, then swing your hands through the two gates.','Tempo Flap. Fica parado em address e depois faz as mãos passarem pelas duas portas.'));
  swGameDraw(0,0);swGameScore();
}
function swGameEnd(){
  const G=SWV.game;SWV.state='live';SWV.game=null;
  if(G&&G.score>(S.gameBest||0)){S.gameBest=G.score;save();}
  $s('swsess').innerHTML=G&&G.n?'<div class="aim" style="background:#effaf2;color:#166534"><b>Tempo Flap</b><br>'+G.n+' swings · '+G.score+' '+T('points','pontos')+(S.gameBest?' · '+T('best','melhor')+' '+S.gameBest:'')+'</div>':'';
  swBtns();swMsg(T('Game finished.','Jogo terminado.'));
  if(G&&G.n)swSay(T('Game over. '+G.n+' swings, '+G.score+' points.','Fim do jogo. '+G.n+' swings, '+G.score+' pontos.'));
}
function swGameScore(){const G=SWV.game,e=$s('swgs');if(!G||!e)return;e.innerHTML='<b>'+G.score+'</b> '+T('points','pontos')+' · '+T('swings','swings')+' '+G.n+' · '+T('streak','sequência')+' '+G.streak+(G.res?'<br>'+G.res:'');}
const SWG_GATES=[{t:0.9,hw:0.22},{t:1.2,hw:0.20}];
function swGameDraw(t,yN){
  const G=SWV.game,cv=$s('swg');if(!G||!cv)return;
  const w=cv.clientWidth,h=cv.clientHeight,dp=window.devicePixelRatio||1;if(cv.width!==Math.round(w*dp)){cv.width=Math.round(w*dp);cv.height=Math.round(h*dp);}
  const g=cv.getContext('2d');g.setTransform(dp,0,0,dp,0,0);g.clearRect(0,0,w,h);
  const base=h*0.8,sc=(h*0.8-h*0.1)/1.05,Y=v=>base-v*sc,bx=w*0.2,pps=w*0.5;
  g.fillStyle='#14532d';g.fillRect(0,base+12,w,h);g.strokeStyle='rgba(255,255,255,.25)';g.beginPath();g.moveTo(0,base);g.lineTo(w,base);g.stroke();
  const gates=[{t:SWG_GATES[0].t,y:G.topH,hw:SWG_GATES[0].hw},{t:SWG_GATES[1].t,y:0.02,hw:SWG_GATES[1].hw}];
  gates.forEach(gt=>{const x=bx+(gt.t-t)*pps,pw=0.16*pps;g.fillStyle='#22c55e';g.fillRect(x-pw/2,0,pw,Y(gt.y+gt.hw));g.fillRect(x-pw/2,Y(gt.y-gt.hw),pw,h-Y(gt.y-gt.hw));g.fillStyle='rgba(255,255,255,.2)';g.fillRect(x-pw/2,Y(gt.y+gt.hw),pw,Y(gt.y-gt.hw)-Y(gt.y+gt.hw));});
  if(G.path.length>1){g.strokeStyle='rgba(251,191,36,.7)';g.lineWidth=3;g.beginPath();G.path.forEach((p,i)=>{const x=bx+(p.t-t)*pps,y=Y(p.y);i?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();}
  g.fillStyle='#fbbf24';g.beginPath();g.arc(bx,Y(Math.max(-0.1,Math.min(1.1,yN))),11,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(bx+4,Y(Math.max(-0.1,Math.min(1.1,yN)))-3,3,0,7);g.fill();
  g.fillStyle='rgba(255,255,255,.8)';g.font='bold 12px sans-serif';g.fillText(T('Gate 1: top (0.9 s)','Porta 1: topo (0,9 s)'),bx+(0.9-t)*pps-36,14);g.fillText(T('Gate 2: impact (1.2 s)','Porta 2: impacto (1,2 s)'),Math.min(w-110,bx+(1.2-t)*pps-30),h-6);
}
function swGameFrame(L,W,vis,now){
  const G=SWV.game;if(!G)return;
  if(!L){if(G.ph==='run'){G.ph='wait';G.base=null;}return;}
  const hy=(L[15].y+L[16].y)/2,tl=Math.hypot(((L[11].x+L[12].x)/2-(L[23].x+L[24].x)/2)*SWV.ar,(L[11].y+L[12].y)/2-(L[23].y+L[24].y)/2)||0.25;
  if(G.ph==='cool'){if(now>G.cool){G.ph='wait';G.base=null;G.res='';swGameScore();}swGameDraw(0,G.base==null?0:(G.base-hy)/G.tl);return;}
  if(G.ph==='wait'){
    if(G.base==null){G.base=hy;G.tl=tl;G.prev=hy;G.still=0;}
    const rise=(G.base-hy)/G.tl;
    if(rise>0.12&&hy<G.prev){G.rise=(G.rise||0)+1;}else G.rise=0;
    if(G.rise>=3){G.ph='run';G.t0=now-200;G.path=[];G.fail=[false,false];G.rise=0;}
    else{if(Math.abs(rise)<0.08){G.base=G.base*0.9+hy*0.1;G.tl=G.tl*0.9+tl*0.1;}}
    G.prev=hy;swGameDraw(0,rise);return;
  }
  if(G.ph==='run'){
    const t=(now-G.t0)/1000,yN=(G.base-hy)/G.tl;G.path.push({t:t,y:yN});
    const gates=[{t:SWG_GATES[0].t,y:G.topH,hw:SWG_GATES[0].hw},{t:SWG_GATES[1].t,y:0.02,hw:SWG_GATES[1].hw}];
    gates.forEach((gt,i)=>{if(Math.abs(t-gt.t)<=0.08&&Math.abs(yN-gt.y)>gt.hw)G.fail[i]=true;});
    swGameDraw(t,yN);
    if(t>1.5||(t>0.9&&yN<0.0&&G.path.some(p=>p.y>G.topH*0.6)&&t>1.0)){
      let ip=0;G.path.forEach((p,i)=>{if(p.y>G.path[ip].y)ip=i;});
      const tTop=G.path[ip].t;let tImp=null;for(let i=ip;i<G.path.length;i++)if(G.path[i].y<=0.1){tImp=G.path[i].t;break;}
      let tStart=0;for(let i=0;i<G.path.length;i++)if(G.path[i].y>0.05){tStart=G.path[i].t;break;}
      const ratio=tImp&&tImp>tTop?(tTop-tStart+0.2)/(tImp-tTop):0;
      const p1=!G.fail[0],p2=!G.fail[1]&&tImp!==null,gain=(p1?50:0)+(p2?50:0)+(ratio?Math.max(0,Math.round(100-Math.abs(ratio-3)*40)):0);
      G.n++;G.score+=gain;G.streak=(p1&&p2)?G.streak+1:0;
      G.res=(p1?'✓ ':'✗ ')+T('Gate 1','Porta 1')+' · '+(p2?'✓ ':'✗ ')+T('Gate 2','Porta 2')+' · '+T('tempo','ritmo')+' '+(ratio?ratio.toFixed(1)+' : 1':'–')+' · +'+gain;
      swGameScore();
      swSay(T((p1&&p2?'Both gates. ':p1?'Gate one only. ':p2?'Gate two only. ':'Missed. ')+(ratio?'Tempo '+ratio.toFixed(1)+' to 1. ':'')+gain+' points.',(p1&&p2?'As duas portas. ':p1?'Só a porta um. ':p2?'Só a porta dois. ':'Falhou. ')+(ratio?'Ritmo '+ratio.toFixed(1)+' para 1. ':'')+gain+' pontos.'));
      G.ph='cool';G.cool=now+3500;
    }
  }
}