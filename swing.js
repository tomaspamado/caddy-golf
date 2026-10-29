"use strict";
/* ================= Swing coach: camera + body pose (MediaPipe), no ball needed ================= */
const T=(en,pt)=>S.lang==='pt'?pt:en;
const SWV={lm:null,stream:null,raf:0,state:'idle',frames:[],view:'dtl',cam:'environment',lastVT:-1,rec:null,res:null,busy:false};
const POSE_LINES=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
const SW_VERS=['0.10.21','latest'];
const SW_MODEL='https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
async function swLoadModel(){
  if(SWV.lm)return SWV.lm;
  let err;
  for(const v of SW_VERS){
    try{
      const base='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@'+v;
      const mod=await import(base+'/vision_bundle.mjs');
      const fs=await mod.FilesetResolver.forVisionTasks(base+'/wasm');
      const opt=d=>({baseOptions:{modelAssetPath:SW_MODEL,delegate:d},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.5,minPosePresenceConfidence:.5,minTrackingConfidence:.5});
      try{SWV.lm=await mod.PoseLandmarker.createFromOptions(fs,opt('GPU'));}catch(e){SWV.lm=await mod.PoseLandmarker.createFromOptions(fs,opt('CPU'));}
      return SWV.lm;
    }catch(e){err=e;}
  }
  throw err||new Error('model');
}
function swBeep(f,d){try{const a=SWV.ac=SWV.ac||new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.frequency.value=f;g.gain.value=.15;o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d/1000);}catch(e){}}
function $s(id){return document.getElementById(id);}

/* ---------- analysis (pure: takes recorded frames) ---------- */
const swWrap=a=>{while(a>180)a-=360;while(a<-180)a+=360;return a;};
function swAnalyze(F,o){
  const n=F.length,ar=o.ar||0.5625;
  if(n<20)return{ok:false,why:T('Too few frames were recorded. Try again.','Foram gravados poucos fotogramas. Tenta de novo.')};
  const lead=o.lefty?[12,14,16]:[11,13,15],trailSh=o.lefty?11:12;
  const px=(i,k)=>[F[i].i[k][0]*ar,F[i].i[k][1]];
  const mid=(i,a,b)=>{const p=px(i,a),q=px(i,b);return[(p[0]+q[0])/2,(p[1]+q[1])/2];};
  const d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const hands=[],sh=[],hp=[],nose=[];
  for(let i=0;i<n;i++){hands.push(mid(i,15,16));sh.push(mid(i,11,12));hp.push(mid(i,23,24));nose.push(px(i,0));}
  const H=hands.map((_,i)=>{let sx=0,sy=0,c=0;for(let j=Math.max(0,i-1);j<=Math.min(n-1,i+1);j++){sx+=hands[j][0];sy+=hands[j][1];c++;}return[sx/c,sy/c];});
  let L0=0;const m0=Math.min(8,n);for(let i=0;i<m0;i++)L0+=d(sh[i],hp[i]);L0/=m0;
  if(!(L0>0.02))return{ok:false,why:T('I could not see your body clearly. Step back and try again.','Não consegui ver bem o teu corpo. Afasta-te e tenta de novo.')};
  const sp=H.map((_,i)=>i===0||i===n-1?0:d(H[i+1],H[i-1])/Math.max(0.001,(F[i+1].t-F[i-1].t)/1000)/L0);
  const vd=H.map((_,i)=>i===0||i===n-1?0:(H[i+1][1]-H[i-1][1])/Math.max(0.001,(F[i+1].t-F[i-1].t)/1000)/L0);
  let iP=0;for(let i=1;i<n-2;i++)if(vd[i]>vd[iP])iP=i;
  if(vd[iP]<2||sp[iP]<2.5)return{ok:false,why:T('I did not see a full swing. Swing a bit bigger and stay in frame.','Não vi um swing completo. Faz um swing maior e fica no enquadramento.')};
  let iT=0;for(let i=0;i<=iP;i++)if(H[i][1]<H[iT][1])iT=i;
  const k0=Math.max(1,Math.min(10,iT));let yA=0;for(let i=0;i<k0;i++)yA+=H[i][1];yA/=k0;
  let iS=iT;while(iS>0&&H[iS][1]<yA-0.25*L0)iS--;while(iS>0&&sp[iS]>0.3)iS--;
  let iI=Math.min(n-1,iP+3);for(let i=iP;i<=Math.min(n-1,iP+12);i++){if(H[i][1]>=yA-0.06*L0){iI=i;break;}}
  let iF=n-1;for(let i=iI;i<n;i++)if(H[i][1]<H[iF][1]||iF===n-1&&i===iI)iF=i;
  if(iF<=iI)iF=n-1;
  const fps=(n-1)/((F[n-1].t-F[0].t)/1000),cm=v=>v/L0*50;
  const W=(i,k)=>F[i].w[k];
  const ang=(i,a,b)=>Math.atan2(W(i,b)[2]-W(i,a)[2],W(i,b)[0]-W(i,a)[0])*180/Math.PI;
  const avgAng=(a,b)=>{let s=0,c=0;for(let i=Math.max(0,iS-3);i<=iS;i++){s+=swWrap(ang(i,a,b)-ang(iS,a,b));c++;}return ang(iS,a,b)+s/c;};
  const sh0=avgAng(11,12),hip0=avgAng(23,24);
  const shRel=i=>swWrap(ang(i,11,12)-sh0),hipRel=i=>swWrap(ang(i,23,24)-hip0);
  const shT=Math.abs(shRel(iT)),hipT=Math.abs(hipRel(iT)),dirT=Math.sign(shRel(iT))||1;
  const finRot=-shRel(iF)*dirT;
  const mid3=(i,a,b)=>[0,1,2].map(k=>(W(i,a)[k]+W(i,b)[k])/2);
  const tilt=i=>{const a=mid3(i,23,24),b=mid3(i,11,12),v=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],l=Math.hypot(v[0],v[1],v[2])||1;return Math.acos(Math.min(1,Math.abs(v[1])/l))*180/Math.PI;};
  const a3=(i,a,b,c)=>{const p=W(i,a),q=W(i,b),r=W(i,c),u=[p[0]-q[0],p[1]-q[1],p[2]-q[2]],v=[r[0]-q[0],r[1]-q[1],r[2]-q[2]],l=(Math.hypot(u[0],u[1],u[2])*Math.hypot(v[0],v[1],v[2]))||1;return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1]+u[2]*v[2])/l)))*180/Math.PI;};
  const tiltA=tilt(iS),tiltI=tilt(iI),tiltD=tiltI-tiltA;
  const knee=180-(a3(iS,23,25,27)+a3(iS,24,26,28))/2;
  const arm=a3(iT,lead[0],lead[1],lead[2]);
  let sway=0,rise=0;for(let i=iS;i<=iI;i++){sway=Math.max(sway,Math.abs(nose[i][0]-nose[iS][0]));rise=Math.max(rise,Math.abs(nose[i][1]-nose[iS][1]));}
  sway=cm(sway);rise=cm(rise);
  const side=Math.sign(px(iS,lead[0])[0]-px(iS,trailSh)[0])||1;
  const hipTop=cm((hp[iT][0]-hp[iS][0])*side),hipImp=cm((hp[iI][0]-hp[iS][0])*side);
  const reachDir=Math.sign(H[iS][0]-hp[iS][0])||1,reach=cm((H[iI][0]-hp[iI][0]-(H[iS][0]-hp[iS][0]))*reachDir);
  const handsTop=(sh[iT][1]-H[iT][1])/L0;
  let bal=0;{const a=Math.max(iF,n-10);let mx=0,my=0,c=0;for(let i=a;i<n;i++){mx+=nose[i][0];my+=nose[i][1];c++;}mx/=c;my/=c;for(let i=a;i<n;i++)bal=Math.max(bal,Math.hypot(nose[i][0]-mx,nose[i][1]-my));bal=cm(bal);}
  const back=(F[iT].t-F[iS].t)/1000,down=Math.max(0.05,(F[iI].t-F[iT].t)/1000),tempo=back/down;
  let vis=0,vc=0;[11,12,13,14,15,16,23,24,25,26,27,28].forEach(k=>{for(let i=iS;i<=iF;i+=3){vis+=F[i].i[k][2];vc++;}});vis/=vc;
  const rg=(v,g,k)=>v>=g[0]&&v<=g[1]?'good':(v>=k[0]&&v<=k[1]?'ok':'work');
  const M=[];
  const add=(key,w,en,pt,val,st,tgEn,tgPt,tipEn,tipPt)=>M.push({key,w,label:T(en,pt),val,st,target:T(tgEn,tgPt),tip:st==='good'?'':T(tipEn,tipPt)});
  add('tempo',3,'Tempo (back : down)','Ritmo (subida : descida)',tempo.toFixed(1)+' : 1',rg(tempo,[2.5,3.6],[2,4.4]),'Target about 3 : 1','Objetivo cerca de 3 : 1',
    tempo<2.5?'You rush the backswing compared with the downswing. Count "one-two-three" going back and "one" coming down.':'Your backswing is long and slow compared with your downswing. Keep one smooth, continuous motion and do not stall at the top.',
    tempo<2.5?'Estás a apressar a subida em relação à descida. Conta "um-dois-três" na subida e "um" na descida.':'A subida é lenta e longa em comparação com a descida. Faz um movimento contínuo e suave e não pares no topo.');
  add('sh',3,'Shoulder turn at top','Rotação dos ombros no topo',Math.round(shT)+'°',rg(shT,[80,115],[60,130]),'Target 80–110°','Objetivo 80–110°',
    shT<80?'Turn your back to the target more. Feel your lead shoulder go under your chin. Drill: cross your arms on your chest and turn until your lead shoulder points at the ball.':'You may be over-rotating. Shorten the backswing slightly and keep your lead arm wide.',
    shT<80?'Roda mais as costas para o alvo. Sente o ombro da frente a passar por baixo do queixo. Exercício: braços cruzados no peito e roda até o ombro da frente apontar para a bola.':'Podes estar a rodar demais. Encurta um pouco a subida e mantém o braço da frente aberto.');
  add('hip',2,'Hip turn at top','Rotação da anca no topo',Math.round(hipT)+'°',rg(hipT,[35,55],[25,65]),'Target 35–55°','Objetivo 35–55°',
    hipT<35?'Let your hips turn a little more, about 40°, without sliding sideways.':'Your hips turn a lot. Keep your lower body quieter so your shoulders can turn more than your hips.',
    hipT<35?'Deixa a anca rodar um pouco mais, cerca de 40°, sem deslizar para o lado.':'A anca roda muito. Mantém a parte de baixo mais calma para os ombros rodarem mais do que a anca.');
  const xf=shT-hipT;
  add('xf',2,'Shoulder-hip separation','Separação ombros-anca',Math.round(xf)+'°',rg(xf,[30,55],[18,65]),'Target 30–50°','Objetivo 30–50°',
    'Resist with your lower body. Keep your knee flex and let your shoulders turn more than your hips to store power.','Resiste com a parte de baixo. Mantém os joelhos fletidos e deixa os ombros rodar mais do que a anca para guardar potência.');
  add('tilt',2,'Spine tilt at address','Inclinação da coluna no address',Math.round(tiltA)+'°',rg(tiltA,[25,45],[18,52]),'Target 25–45°','Objetivo 25–45°',
    tiltA<25?'Bend forward more from the hips with a straight back.':'You are bent over a lot. Stand a little taller and let your arms hang.',
    tiltA<25?'Inclina-te mais a partir da anca com as costas direitas.':'Estás muito curvado. Fica um pouco mais alto e deixa os braços pendurados.');
  add('tiltd',3,'Posture kept to impact','Postura mantida até ao impacto',(tiltD>=0?'+':'')+Math.round(tiltD)+'°',rg(Math.abs(tiltD),[0,6],[0,12])==='work'?'work':(Math.abs(tiltD)<=6?'good':'ok'),'Target within 6°','Objetivo até 6°',
    tiltD<0?'You stand up in the downswing (early extension). Drill: put a chair or wall behind your glutes and keep touching it until after impact.':'You dip toward the ball in the downswing. Stay tall through the strike.',
    tiltD<0?'Levantas-te na descida (early extension). Exercício: põe uma cadeira ou parede atrás das nádegas e mantém o contacto até depois do impacto.':'Baixas-te para a bola na descida. Mantém a altura durante o impacto.');
  add('knee',1,'Knee flex at address','Flexão dos joelhos no address',Math.round(knee)+'°',rg(knee,[15,35],[8,45]),'Target 15–35°','Objetivo 15–35°',
    knee<15?'Add more knee flex, like an athletic stance.':'Your knees are bent a lot. Stand a bit taller.','Flete mais os joelhos, como numa posição atlética.'.replace('Flete','Flete'));
  add('arm',2,'Lead arm at top','Braço da frente no topo',Math.round(arm)+'°',arm>=160?'good':(arm>=145?'ok':'work'),'Target 160° or more (straight)','Objetivo 160° ou mais (esticado)',
    'Keep your lead arm wider and straighter. Feel extension away from your chest on the way back.','Mantém o braço da frente mais aberto e esticado. Sente extensão para longe do peito na subida.');
  add('top',1,'Hands at top','Mãos no topo',handsTop>=0.15?T('above shoulders','acima dos ombros'):(handsTop>=-0.05?T('shoulder height','à altura dos ombros'):T('below shoulders','abaixo dos ombros')),handsTop>=-0.05?'good':(handsTop>=-0.3?'ok':'work'),'Full swing: hands at or above shoulders','Swing completo: mãos à altura dos ombros ou acima',
    'Your backswing is short. If you want a full swing, keep turning until your hands reach shoulder height.','A subida é curta. Para um swing completo, continua a rodar até as mãos chegarem à altura dos ombros.');
  add('head',2,'Head movement (to impact)','Movimento da cabeça (até ao impacto)',Math.round(Math.max(sway,rise))+' cm',Math.max(sway,rise)<=8?'good':(Math.max(sway,rise)<=15?'ok':'work'),'Target under 8 cm','Objetivo menos de 8 cm',
    rise>sway?'Your head rises or dips. Keep your eye height steady.':'Your head slides sideways. Turn around a steady head. Drill: lightly touch a wall or pole with your head.',
    rise>sway?'A cabeça sobe ou desce. Mantém a altura dos olhos.':'A cabeça desliza para o lado. Roda em torno de uma cabeça estável. Exercício: encosta ao de leve a cabeça a uma parede ou poste.');
  if(o.view==='fo'){
    add('hipTop',1,'Hip slide in backswing','Deslize da anca na subida',(hipTop>=0?'+':'')+Math.round(hipTop)+' cm',rg(hipTop,[-10,3],[-16,8]),'Small move away from target','Pequeno movimento para trás',
      hipTop>3?'Your hips move toward the target in the backswing (reverse pivot). Load into your trail leg.':'Your hips slide too far away from the target. Turn rather than slide.',
      hipTop>3?'A anca vai para o alvo na subida (reverse pivot). Carrega na perna de trás.':'A anca desliza demasiado para trás. Roda em vez de deslizar.');
    add('hipImp',2,'Hips toward target at impact','Anca para o alvo no impacto',(hipImp>=0?'+':'')+Math.round(hipImp)+' cm',rg(hipImp,[4,25],[0,32]),'Target 4–25 cm toward target','Objetivo 4–25 cm para o alvo',
      'Start the downswing by shifting your weight toward the target, then rotate.','Começa a descida passando o peso para o alvo e só depois roda.');
  }else{
    add('reach',2,'Hands distance from body at impact','Distância das mãos ao corpo no impacto',(reach>=0?'+':'')+Math.round(reach)+' cm',Math.abs(reach)<=6?'good':(Math.abs(reach)<=12?'ok':'work'),'Target within 6 cm of address','Objetivo até 6 cm do address',
      reach>0?'Your hands end up farther from you than at address (reaching or early extension). Keep your hips back and your posture.':'Your hands come in closer than at address. Keep your arms extended through impact.',
      reach>0?'As mãos ficam mais longe do corpo do que no address (alcançar ou early extension). Mantém a anca atrás e a postura.':'As mãos ficam mais perto do que no address. Mantém os braços estendidos no impacto.');
  }
  add('finrot',1,'Finish rotation','Rotação no final',Math.round(Math.max(0,finRot))+'°',finRot>=70?'good':(finRot>=45?'ok':'work'),'Target 70° or more past address','Objetivo 70° ou mais além do address',
    'Rotate all the way through until your belt buckle faces the target.','Roda até ao fim, até a fivela do cinto ficar virada para o alvo.');
  add('bal',2,'Balance in finish','Equilíbrio no final',Math.round(bal)+' cm',bal<=6?'good':(bal<=12?'ok':'work'),'Hold still for 3 seconds','Fica parado 3 segundos',
    'You wobble in the finish. Swing at 80% and hold your finish on your lead leg for three seconds.','Perdes equilíbrio no final. Faz o swing a 80% e mantém o final sobre a perna da frente durante três segundos.');
  let pts=0,tot=0;M.forEach(m=>{tot+=m.w;pts+=m.w*(m.st==='good'?1:m.st==='ok'?0.55:0);});
  const score=Math.round(pts/tot*100);
  const tips=M.filter(m=>m.st!=='good').sort((a,b)=>((b.st==='work')-(a.st==='work'))||(b.w-a.w)).slice(0,3);
  return{ok:true,M,score,tips,idx:[iS,iT,iI,iF],fps:Math.round(fps),vis,tempo,back,down,shT,hipT,L0};
}

/* ---------- drawing ---------- */
function swDrawLm(cv,L,opt){
  const w=cv.clientWidth,h=cv.clientHeight,dp=window.devicePixelRatio||1;
  if(cv.width!==Math.round(w*dp)){cv.width=Math.round(w*dp);cv.height=Math.round(h*dp);}
  const g=cv.getContext('2d');g.setTransform(dp,0,0,dp,0,0);g.clearRect(0,0,w,h);
  if(!L)return;
  let ox=0,oy=0,sx=w,sy=h;
  const xa=opt&&opt.fit?(opt.ar||1):1;
  if(opt&&opt.fit){let x0=9,x1=-9,y0=9,y1=-9;[0,11,12,13,14,15,16,23,24,25,26,27,28].forEach(k=>{x0=Math.min(x0,L[k][0]*xa);x1=Math.max(x1,L[k][0]*xa);y0=Math.min(y0,L[k][1]);y1=Math.max(y1,L[k][1]);});const s=Math.min(w/((x1-x0)*1.3||1),h/((y1-y0)*1.2||1)),cx=(x0+x1)/2,cy=(y0+y1)/2;sx=s;sy=s;ox=w/2-cx*s;oy=h/2-cy*s;}
  const P=k=>[ox+L[k][0]*xa*sx,oy+L[k][1]*sy];
  g.lineWidth=opt&&opt.fit?3:4;g.lineCap='round';
  POSE_LINES.forEach(a=>{const p=P(a[0]),q=P(a[1]),ok=(L[a[0]][2]===undefined||L[a[0]][2]>.4)&&(L[a[1]][2]===undefined||L[a[1]][2]>.4);g.strokeStyle=ok?'#4ade80':'#f87171';g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke();});
  const hd=P(0);g.fillStyle='#fff';g.beginPath();g.arc(hd[0],hd[1],opt&&opt.fit?5:7,0,7);g.fill();
  [15,16].forEach(k=>{const p=P(k);g.fillStyle='#fbbf24';g.beginPath();g.arc(p[0],p[1],opt&&opt.fit?4:6,0,7);g.fill();});
}
function swLm(L){return L?L.map(p=>[p.x,p.y,p.visibility===undefined?1:p.visibility]):null;}
function swVisible(L){return[11,12,23,24,25,26,27,28].every(k=>L[k].visibility>0.4&&L[k].x>0.02&&L[k].x<0.98&&L[k].y>0.02&&L[k].y<0.98);}

/* ---------- camera and loop ---------- */
function swStopCam(){
  if(SWV.raf)cancelAnimationFrame(SWV.raf);SWV.raf=0;
  if(SWV.stream){SWV.stream.getTracks().forEach(t=>t.stop());SWV.stream=null;}
  const v=$s('swv');if(v)v.srcObject=null;
  SWV.state='idle';clearTimeout(SWV.cdT);
}
function swingStop(){if(SWV.state!=='idle')swStopCam();}
function swMsg(t,warn){const m=$s('swmsg');if(m){m.textContent=t;m.style.background=warn?'#fdecea':'var(--soft)';m.style.color=warn?'#8a1c1c':'var(--ink)';}}
function swBtns(){
  const b=$s('swbtns');if(!b)return;const s=SWV.state;let h='';
  if(s==='idle')h='<button class="cta" data-sw="start">'+T('Start camera','Ligar câmara')+'</button>';
  else if(s==='loading')h='<button class="cta" disabled style="opacity:.6">'+T('Loading…','A carregar…')+'</button>';
  else if(s==='live')h='<button class="cta" data-sw="rec">'+T('Record a swing','Gravar um swing')+'</button><div class="center"><button class="link" data-sw="stopcam">'+T('Turn camera off','Desligar câmara')+'</button></div>';
  else if(s==='count')h='<button class="cta" data-sw="cancel" style="background:var(--ink)">'+T('Cancel','Cancelar')+'</button>';
  else if(s==='rec')h='<button class="cta" data-sw="finish" style="background:#c62828">'+T('Stop and analyse','Parar e analisar')+'</button>';
  b.innerHTML=h;
}
async function swStart(){
  SWV.state='loading';swBtns();$s('swbox').style.display='block';swMsg(T('Loading the pose model (about 6 MB, first time only)…','A carregar o modelo de pose (cerca de 6 MB, só da primeira vez)…'));
  try{await swLoadModel();}catch(e){SWV.state='idle';swBtns();$s('swbox').style.display='none';swMsg(T('Could not load the pose model. Check your internet connection and try again.','Não foi possível carregar o modelo de pose. Verifica a ligação à internet e tenta de novo.'),true);return;}
  try{
    SWV.stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:SWV.cam,width:{ideal:720},height:{ideal:1280},frameRate:{ideal:60,min:24}}});
  }catch(e){SWV.state='idle';swBtns();$s('swbox').style.display='none';swMsg(T('Camera access was blocked. Allow the camera in your browser settings and try again.','O acesso à câmara foi bloqueado. Permite a câmara nas definições do navegador e tenta de novo.'),true);return;}
  const v=$s('swv');v.srcObject=SWV.stream;v.setAttribute('playsinline','');v.muted=true;
  try{await v.play();}catch(e){}
  await new Promise(r=>{if(v.videoWidth)r();else v.onloadedmetadata=r;setTimeout(r,2000);});
  const box=$s('swbox');if(v.videoWidth)box.style.aspectRatio=v.videoWidth+'/'+v.videoHeight;box.style.transform=SWV.cam==='user'?'scaleX(-1)':'none';
  SWV.ar=v.videoWidth&&v.videoHeight?v.videoWidth/v.videoHeight:0.5625;SWV.lastVT=-1;SWV.state='live';swBtns();swMsg(T('Step back until your whole body is in the picture.','Afasta-te até o corpo todo aparecer.'));
  SWV.raf=requestAnimationFrame(swLoop);
}
function swLoop(){
  if(SWV.state==='idle'||SWV.state==='loading')return;
  SWV.raf=requestAnimationFrame(swLoop);
  const v=$s('swv'),cv=$s('swc');if(!v||!cv||v.readyState<2||v.currentTime===SWV.lastVT)return;
  SWV.lastVT=v.currentTime;
  let r;try{r=SWV.lm.detectForVideo(v,performance.now());}catch(e){return;}
  const L=r.landmarks&&r.landmarks[0],W=r.worldLandmarks&&r.worldLandmarks[0];
  swDrawLm(cv,swLm(L),null);
  const vis=!!(L&&W&&swVisible(L));
  if(SWV.state==='live'){swMsg(vis?T('Good. Your whole body is visible. Tap Record when ready.','Bom. O corpo todo está visível. Toca em Gravar quando estiveres pronto.'):T('Step back until your whole body is in the picture.','Afasta-te até o corpo todo aparecer.'),!vis);}
  else if(SWV.state==='rec'){
    const R_=SWV.rec,now=performance.now();
    if(L&&W){
      SWV.frames.push({t:now,i:swLm(L),w:W.map(p=>[p.x,p.y,p.z])});
      const hp=[(L[15].x+L[16].x)/2*SWV.ar,(L[15].y+L[16].y)/2],tl=Math.hypot(((L[11].x+L[12].x)/2-(L[23].x+L[24].x)/2)*SWV.ar,(L[11].y+L[12].y)/2-(L[23].y+L[24].y)/2)||0.2;
      if(R_.p){const dt=Math.max(.001,(now-R_.pt)/1000),s=Math.hypot(hp[0]-R_.p[0],hp[1]-R_.p[1])/dt/tl;R_.sp=R_.sp*.6+s*.4;if(R_.sp>3.5)R_.swung=true;if(R_.sp>0.8)R_.mv=now;}
      R_.p=hp;R_.pt=now;
    }
    if(R_.swung&&now-R_.mv>900)swFinish();
    else if(now-R_.t0>18000)swFinish();
  }
}
function swRecord(){
  SWV.state='count';swBtns();let c=6;
  const tick=()=>{if(SWV.state!=='count')return;if(c>0){swMsg(T('Get into position… ','Posiciona-te… ')+c);if(c<=3)swBeep(660,120);c--;SWV.cdT=setTimeout(tick,1000);}else{swBeep(990,300);SWV.frames=[];SWV.rec={t0:performance.now(),p:null,sp:0,swung:false,mv:performance.now()};SWV.state='rec';swBtns();swMsg(T('Swing now!','Faz o swing!'));}};
  tick();
}
function swFinish(){
  if(SWV.state!=='rec')return;
  SWV.state='live';swBtns();
  const res=swAnalyze(SWV.frames,{ar:SWV.ar,lefty:S.lefty,view:SWV.view});
  if(!res.ok){swMsg(res.why,true);$s('swres').innerHTML='';return;}
  swShow(res);
}
function swShow(res){
  swMsg(T('Done. Scroll down for your feedback, or record another swing.','Pronto. Desce para ver o feedback ou grava outro swing.'));
  const col={good:'#16a34a',ok:'#f59e0b',work:'#dc2626'};
  S.swings=(S.swings||[]);S.swings.push({t:Date.now(),view:SWV.view,score:res.score,tempo:+res.tempo.toFixed(1),sh:Math.round(res.shT)});S.swings=S.swings.slice(-40);save();
  const names=[T('Address','Address'),T('Top','Topo'),T('Impact','Impacto'),T('Finish','Final')];
  let h='<div class="hero" style="margin-top:14px"><div><div class="lbl">'+T('Swing score','Nota do swing')+'</div><div class="club">'+res.score+'<span style="font-size:20px;color:var(--mut)"> /100</span></div></div><div class="plays">'+T('Tempo','Ritmo')+' '+res.tempo.toFixed(1)+' : 1<br>'+res.fps+' fps</div></div>';
  if(res.vis<0.6)h+='<div class="hz">'+T('Tracking was weak (bad light, dark clothes or part of the body out of view). Treat the numbers as rough.','O seguimento foi fraco (pouca luz, roupa escura ou parte do corpo fora do ecrã). Considera os números aproximados.')+'</div>';
  h+='<div class="lbl" style="margin:14px 0 6px">'+T('Key positions','Posições-chave')+'</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">'+names.map((n,i)=>'<div><canvas class="swk" data-k="'+i+'" style="width:100%;height:110px;background:#14532d;border-radius:10px;display:block"></canvas><div class="sub" style="text-align:center;font-size:12px">'+n+'</div></div>').join('')+'</div>';
  if(res.tips.length)h+='<div class="lbl" style="margin:16px 0 6px">'+T('What to work on','No que trabalhar')+'</div>'+res.tips.map((t,i)=>'<div class="aim" style="background:#fff7e6"><b>'+(i+1)+'. '+esc(t.label)+'.</b> '+esc(t.tip)+'</div>').join('');
  else h+='<div class="aim" style="background:#effaf2;color:#166534">'+T('Nice swing. Everything measured is in a good range. Keep repeating it.','Bom swing. Tudo o que medi está numa boa zona. Continua a repetir.')+'</div>';
  h+='<div class="lbl" style="margin:16px 0 6px">'+T('All measurements','Todas as medições')+'</div>'+res.M.map(m=>'<div class="shot" style="align-items:center"><span><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+col[m.st]+';margin-right:8px"></i><b>'+esc(m.label)+'</b><br><small class="sub">'+esc(m.target)+'</small></span><b>'+esc(m.val)+'</b></div>').join('');
  h+='<div class="hint">'+T('These angles come from a phone camera and a body-tracking model, so they are estimates (a few degrees off). Compare swings over time rather than trusting a single number. The club itself is not tracked, only your body and hands.','Estes ângulos vêm da câmara do telemóvel e de um modelo de seguimento do corpo, por isso são estimativas (com alguns graus de erro). Compara swings ao longo do tempo em vez de confiar num só número. O taco não é seguido, só o corpo e as mãos.')+'</div>';
  const hist=(S.swings||[]).filter(x=>x.view===SWV.view).slice(-6);
  if(hist.length>1)h+='<div class="lbl" style="margin:14px 0 6px">'+T('Your last swings','Os teus últimos swings')+'</div><div class="row">'+hist.map(x=>'<span class="cond" style="min-height:36px;display:inline-flex;align-items:center">'+x.score+'</span>').join('')+'</div>';
  const el=$s('swres');el.innerHTML=h;
  el.querySelectorAll('.swk').forEach(c=>{const f=SWV.frames[res.idx[+c.dataset.k]];if(f)swDrawLm(c,f.i,{fit:true,ar:SWV.ar});});
  setTimeout(()=>{const t=$s('swres');if(t&&t.scrollIntoView)t.scrollIntoView({behavior:'smooth',block:'start'});},100);
}
function swAct(a,b){
  if(a==='start'){swStart();}
  else if(a==='rec'){swRecord();}
  else if(a==='finish'){swFinish();}
  else if(a==='cancel'){SWV.state='live';clearTimeout(SWV.cdT);swBtns();swMsg(T('Cancelled.','Cancelado.'));}
  else if(a==='stopcam'){swStopCam();swBtns();const bx=$s('swbox');if(bx)bx.style.display='none';swMsg('');}
  else if(a==='view'){SWV.view=b.dataset.v;document.querySelectorAll('[data-sw=view]').forEach(x=>x.classList.toggle('on',x.dataset.v===SWV.view));swView();}
  else if(a==='cam'){SWV.cam=b.dataset.v;document.querySelectorAll('[data-sw=cam]').forEach(x=>x.classList.toggle('on',x.dataset.v===SWV.cam));if(SWV.state==='live'){swStopCam();swStart();}}
}
function swView(){const e=$s('swtip');if(e)e.textContent=SWV.view==='dtl'?T('Down the line: the camera stands behind you, looking along the target line. Best for posture, hand position and distance from the ball.','Por trás: a câmara fica atrás de ti, a olhar ao longo da linha do alvo. Melhor para postura, posição das mãos e distância à bola.'):T('Face on: the camera stands in front of you, looking at your chest. Best for head movement, hip slide and weight shift.','De frente: a câmara fica à tua frente, a olhar para o peito. Melhor para movimento da cabeça, deslize da anca e transferência de peso.');}
function swingHTML(){
  const seg=(a,cur,items)=>'<div class="seg" style="margin-bottom:10px">'+items.map(x=>'<button class="'+(cur===x[0]?'on':'')+'" data-sw="'+a+'" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
  return '<div class="hint" style="margin-top:0">'+T('Practise without a ball. Prop your phone about 3 m away at hip height, full body in the picture, in good light. Tap Start, then Record. You get 6 seconds to get into position and the app stops by itself after your swing.','Treina sem bola. Apoia o telemóvel a cerca de 3 m, à altura da anca, com o corpo todo no ecrã e boa luz. Toca em Começar e depois em Gravar. Tens 6 segundos para te posicionares e a app pára sozinha depois do swing.')+'</div>'+
  seg('view',SWV.view,[['dtl',T('Down the line','Por trás')],['fo',T('Face on','De frente')]])+'<div id="swtip" class="sub" style="margin:-4px 0 10px"></div>'+
  seg('cam',SWV.cam,[['environment',T('Back camera','Câmara traseira')],['user',T('Front camera','Câmara frontal')]])+
  '<div id="swbox" style="display:none;position:relative;background:#000;border-radius:14px;overflow:hidden;max-height:62vh;margin:0 auto"><video id="swv" playsinline muted autoplay style="width:100%;height:100%;object-fit:contain;display:block"></video><canvas id="swc" style="position:absolute;inset:0;width:100%;height:100%"></canvas></div>'+
  '<div id="swmsg" class="aim" style="margin:8px 0;background:var(--soft);color:var(--ink)"></div><div id="swbtns"></div><div id="swres"></div>';
}
function swingMount(){swView();swBtns();swMsg(T('Tap Start to turn on the camera.','Toca em Começar para ligar a câmara.'));}
document.addEventListener('click',e=>{const b=e.target.closest('[data-sw]');if(b)swAct(b.dataset.sw,b);});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')swingStop();});
(function(){const c=document.getElementById('pclose');if(c)c.addEventListener('click',swingStop);})();
/* hook the Swing tab into the existing menu without touching other files */
(function(){
  const _op=openPanel;
  openPanel=function(t){
    const tab=t||ptab;
    if(tab!=='swing'){swingStop();_op(t);return;}
    ptab='swing';$('#panel').hidden=false;resetArm=false;R.armFinish=false;R.armDel=null;
    document.querySelectorAll('#ptabs button').forEach(b=>b.classList.toggle('on',b.dataset.p==='swing'));
    $('#pbody').innerHTML=swingHTML();swingMount();
  };
  const _as=applyStatic;
  applyStatic=function(){_as();const b=document.querySelector('#ptabs [data-p=swing]');if(b)b.textContent='Swing';};
  applyStatic();
})();
