"use strict";
/* ============ Flight tracker: slo-mo clip (or in-app recording) -> ball speed, launch angle, carry estimate ============
   Camera beside the ball (side-on), square to the target line. The ball diameter (42.67 mm) gives the scale. */
const FLD=0.04267;
const FL={st:'setup',vid:null,url:null,cvs:null,cx:null,W:0,H:0,d:1/240,nF:0,cur:0,ref:null,out:null,busy:false,pg:'',nrv:false,
  recFps:null,cam:null,fpsAuto:null,pts:null,logged:false,err:''};
const flS=()=>{S.flset=Object.assign({fps:240,tilt:0,dir:'auto'},S.flset||{});return S.flset;};
const flFps=()=>FL.recFps||flS().fps;

/* ---------- aerodynamics (tuned to typical launch-monitor numbers) ---------- */
const FLP={m:0.04593,r:0.02135,cd0:0.20,cd1:0.2,cl1:1.3,clm:0.2};
FLP.A=Math.PI*FLP.r*FLP.r;
function flRho(){const T=(S.cond&&isFinite(S.cond.temp))?S.cond.temp:18;return 1.225*288.15/(T+273.15);}
function flSim(v0,th,spin,tEnd,ts){
  // returns {pos:[[x,y]...] at times ts (sorted), carry, apex, tof}
  const K=0.5*flRho()*FLP.A/FLP.m,w=spin*2*Math.PI/60,dt=0.001;
  let x=0,y=0,vx=v0*Math.cos(th),vy=v0*Math.sin(th),t=0,apex=0,k=0;const pos=[];
  const stop=tEnd==null?20:tEnd;
  while(t<stop){
    const v=Math.hypot(vx,vy),S_=FLP.r*w/v,Cd=FLP.cd0+FLP.cd1*S_,Cl=Math.min(FLP.clm,FLP.cl1*S_);
    const ax=-K*Cd*v*vx+K*Cl*v*(-vy),ay=-K*Cd*v*vy+K*Cl*v*vx-9.81,px=x,py=y,pt=t;
    vx+=ax*dt;vy+=ay*dt;x+=vx*dt;y+=vy*dt;t+=dt;if(y>apex)apex=y;
    if(ts){while(k<ts.length&&ts[k]<=t){const f=(ts[k]-pt)/dt;pos.push([px+(x-px)*f,py+(y-py)*f]);k++;}if(k>=ts.length&&tEnd!=null)break;}
    if(tEnd==null&&y<0&&t>0.1){const f=py/(py-y);return{carry:px+(x-px)*f,apex:apex,tof:pt+dt*f,land:Math.atan2(-vy,vx)*180/Math.PI};}
  }
  return{pos:pos,carry:x,apex:apex,tof:t};
}
function flSpin(c,v,thDeg){
  const n=String((c&&c.name)||'').toLowerCase();let s=null;
  const m=n.match(/(\d)\s*(iron|wood|hybrid|rescue)/),num=m?+m[1]:null;
  if(/driver/.test(n))s=[2600,70];
  else if(/wood/.test(n))s=num&&num>=5?[4300,61]:[3700,65];
  else if(/hybrid|rescue/.test(n))s=[4800,58];
  else if(/lob/.test(n))s=[10300,37];
  else if(/sand/.test(n))s=[9900,40.5];
  else if(/gap|approach|attack/.test(n))s=[9600,42.5];
  else if(/pitch/.test(n))s=[9200,44.5];
  else if(/iron/.test(n)&&num){const tb={2:[3900,62],3:[4300,60],4:[4800,57],5:[5400,55],6:[6100,53],7:[6800,51],8:[7600,48.5],9:[8400,46.5]};s=tb[num]||[6800,51];}
  if(!s){ // from launch angle
    const T=[[8,2200],[11,2800],[13,4200],[15,5500],[17,6700],[21,8300],[25,9300],[30,9800],[45,9500]];let sp=T[T.length-1][1];
    for(let i=1;i<T.length;i++)if(thDeg<=T[i][0]){const a=T[i-1],b=T[i];sp=a[1]+(b[1]-a[1])*Math.max(0,(thDeg-a[0]))/(b[0]-a[0]);break;}
    return sp;
  }
  return s[0]*Math.max(0.6,Math.min(1.4,Math.pow(v/s[1],0.9)));
}

/* ---------- image helpers ---------- */
let _c=0,_a=0;
function flInt(L,W,H,I){
  const W1=W+1;for(let x=0;x<=W;x++)I[x]=0;
  for(let y=0;y<H;y++){let row=0;const o=(y+1)*W1,o0=y*W1,lo=y*W;I[o]=0;for(let x=0;x<W;x++){row+=L[lo+x];I[o+x+1]=I[o0+x+1]+row;}}
}
function flScore(I,I0,W,H,x,y,hi,ho){
  const W1=W+1;
  if(x-ho<0||y-ho<0||x+ho>=W||y+ho>=H){_c=-1e9;_a=-1e9;return;}
  const ni=(2*hi+1)*(2*hi+1),no=(2*ho+1)*(2*ho+1);
  const ax0=x-hi,ay0=y-hi,ax1=x+hi,ay1=y+hi,bx0=x-ho,by0=y-ho,bx1=x+ho,by1=y+ho;
  const si=I[(ay1+1)*W1+ax1+1]-I[ay0*W1+ax1+1]-I[(ay1+1)*W1+ax0]+I[ay0*W1+ax0];
  const so=I[(by1+1)*W1+bx1+1]-I[by0*W1+bx1+1]-I[(by1+1)*W1+bx0]+I[by0*W1+bx0];
  const s0=I0[(ay1+1)*W1+ax1+1]-I0[ay0*W1+ax1+1]-I0[(ay1+1)*W1+ax0]+I0[ay0*W1+ax0];
  _c=si/ni-(so-si)/(no-ni);_a=(si-s0)/ni;
}
function flScore4(I,W,H,x,y,hi,ho){
  const W1=W+1;if(x-ho<0||y-ho<0||x+ho>=W||y+ho>=H){_c=-1e9;return;}
  const bx=(x0,y0,x1,y1)=>I[(y1+1)*W1+x1+1]-I[y0*W1+x1+1]-I[(y1+1)*W1+x0]+I[y0*W1+x0];
  const ni=(2*hi+1)*(2*hi+1),mi=bx(x-hi,y-hi,x+hi,y+hi)/ni,w=ho-hi,lr=w*(2*ho+1),tb=w*(2*ho+1);
  const l=bx(x-ho,y-ho,x-hi-1,y+ho)/lr,r=bx(x+hi+1,y-ho,x+ho,y+ho)/lr,t=bx(x-ho,y-ho,x+ho,y-hi-1)/tb,b=bx(x-ho,y+hi+1,x+ho,y+ho)/tb;
  _c=mi-Math.max(l,r,t,b);
}
function flHo(d){const hi=Math.max(1,Math.round(0.35*d)),ho=Math.max(hi+2,Math.round(1.3*d));return[hi,ho];}
function flCtr(L,W,H,x,y,hi,ho){ // direct contrast at (x,y)
  if(x-ho<0||y-ho<0||x+ho>=W||y+ho>=H)return 0;let si=0,so=0,ni=0,no=0;
  for(let j=-ho;j<=ho;j++)for(let i=-ho;i<=ho;i++){const v=L[(y+j)*W+x+i];if(Math.abs(i)<=hi&&Math.abs(j)<=hi){si+=v;ni++;}else{so+=v;no++;}}
  return si/ni-so/no;
}
function flCands(I,I0,W,H,x0,y0,x1,y1,hi,ho,th,k,minD,ok){
  const arr=[];x0=Math.max(ho,Math.floor(x0));y0=Math.max(ho,Math.floor(y0));x1=Math.min(W-1-ho,Math.ceil(x1));y1=Math.min(H-1-ho,Math.ceil(y1));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    flScore(I,I0,W,H,x,y,hi,ho);if(_c<th||_a<th)continue;if(ok&&!ok(x,y))continue;arr.push([Math.min(_c,_a),x,y]);
  }
  arr.sort((a,b)=>b[0]-a[0]);const out=[];
  for(let q=0;q<arr.length&&out.length<k;q++){const c=arr[q];if(out.every(o=>Math.hypot(o[1]-c[1],o[2]-c[2])>=minD))out.push(c);}
  return out;
}
/* centroid of the bright streak around (x,y), along direction (ux,uy), half length a */
function flRefine(L,L0,W,H,x,y,ux,uy,a,b){
  // centroid of the connected bright blob (new pixels vs the rest frame) that contains the candidate
  const R=Math.ceil(a+b)+2,cx=Math.round(x),cy=Math.round(y),x0=Math.max(0,cx-R),x1=Math.min(W-1,cx+R),y0=Math.max(0,cy-R),y1=Math.min(H-1,cy+R);
  const w=x1-x0+1,h=y1-y0+1,df=new Int16Array(w*h);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)df[j*w+i]=L[(y0+j)*W+x0+i]-L0[(y0+j)*W+x0+i];
  let pk=-999,px=cx-x0,py=cy-y0;
  for(let j=Math.max(0,cy-y0-3);j<=Math.min(h-1,cy-y0+3);j++)for(let i=Math.max(0,cx-x0-3);i<=Math.min(w-1,cx-x0+3);i++){const v=df[j*w+i];if(v>pk){pk=v;px=i;py=j;}}
  if(pk<4)return[x,y];
  const t=0.5*pk,seen=new Uint8Array(w*h),st=[py*w+px];seen[py*w+px]=1;let sw=0,sx=0,sy=0,cnt=0;
  while(st.length&&cnt<6000){
    const q=st.pop(),qi=q%w,qj=(q-qi)/w;cnt++;const wt=df[q]-t;sw+=wt;sx+=wt*(x0+qi);sy+=wt*(y0+qj);
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ni=qi+di,nj=qj+dj;if(ni<0||nj<0||ni>=w||nj>=h)continue;const k=nj*w+ni;if(seen[k])continue;seen[k]=1;if(df[k]>=t)st.push(k);}
  }
  if(sw<=0)return[x,y];return[sx/sw,sy/sw];
}
/* measure the resting ball: centre + diameter from the half-level area */
function flMeasureBall(L,W,H,cx,cy,dg){
  let x=cx,y=cy,d=dg;
  for(let it=0;it<3;it++){
    const R=Math.ceil(1.8*d)+2,x0=Math.max(0,Math.round(x)-R),x1=Math.min(W-1,Math.round(x)+R),y0=Math.max(0,Math.round(y)-R),y1=Math.min(H-1,Math.round(y)+R);
    const inner=[],outer=[];
    for(let j=y0;j<=y1;j++)for(let i=x0;i<=x1;i++){const r=Math.hypot(i-x,j-y);if(r<=0.4*d)inner.push(L[j*W+i]);else if(r>=1.15*d&&r<=1.8*d)outer.push(L[j*W+i]);}
    if(inner.length<3||outer.length<8)break;
    inner.sort((a,b)=>a-b);outer.sort((a,b)=>a-b);
    const pk=inner[inner.length>>1],bg=outer[outer.length>>1];if(pk-bg<6)break;
    let A=0,sx=0,sy=0;
    for(let j=y0;j<=y1;j++)for(let i=x0;i<=x1;i++){const r=Math.hypot(i-x,j-y);if(r>1.5*d)continue;const w=Math.max(0,Math.min(1,(L[j*W+i]-bg)/(pk-bg)));A+=w;sx+=w*i;sy+=w*j;}
    if(A<3)break;x=sx/A;y=sy/A;d=2*Math.sqrt(A/Math.PI);
  }
  return{x:x,y:y,d:d};
}
function flFindBall(L,W,H,px,py,rad){
  const I=new Int32Array((W+1)*(H+1));flInt(L,W,H,I);let best=null;
  [5,6.5,8,10,12,15,18,22,28,36,46].forEach(d=>{
    const [hi,ho]=flHo(d);
    for(let y=Math.max(ho,Math.round(py-rad));y<=Math.min(H-1-ho,Math.round(py+rad));y+=1)for(let x=Math.max(ho,Math.round(px-rad));x<=Math.min(W-1-ho,Math.round(px+rad));x+=1){
      const dd=Math.hypot(x-px,y-py);if(dd>rad)continue;flScore4(I,W,H,x,y,hi,ho);const s=_c*(1-0.35*dd/rad);
      if(!best||s>best.s)best={s:s,x:x,y:y,d:d};
    }
  });
  if(!best||best.s<8)return null;
  return flMeasureBall(L,W,H,best.x,best.y,best.d);
}

/* ---------- video access ---------- */
function flSeek(v,t){
  return new Promise(res=>{
    let pres=false,sk=false,fin=false;
    const done=()=>{if(fin)return;fin=true;v.removeEventListener('seeked',on);clearTimeout(to);res();};
    const on=()=>{sk=true;if(pres||FL.nrv)done();else setTimeout(()=>{if(!pres)FL.nrv=true;done();},140);};
    const to=setTimeout(done,3000);
    if(v.requestVideoFrameCallback&&!FL.nrv)v.requestVideoFrameCallback(()=>{pres=true;if(sk)done();});
    v.addEventListener('seeked',on);
    if(Math.abs(v.currentTime-t)<1e-7){setTimeout(done,10);return;}
    v.currentTime=t;
  });
}
async function flGrab(i){
  const v=FL.vid,t=Math.max(0,Math.min((v.duration||1e9)-1e-4,(i+0.5)*FL.d));
  await flSeek(v,t);
  FL.cx.drawImage(v,0,0,FL.W,FL.H);
  const id=FL.cx.getImageData(0,0,FL.W,FL.H).data,n=FL.W*FL.H,L=new Uint8Array(n);
  for(let p=0,q=0;p<n;p++,q+=4)L[p]=(id[q]*77+id[q+1]*150+id[q+2]*29)>>8;
  return L;
}
function flMediaTime(t){ // time of the frame actually shown after seeking to t
  const v=FL.vid;
  return new Promise(res=>{
    let got=null,fin=false;const done=()=>{if(fin)return;fin=true;res(got);};
    if(v.requestVideoFrameCallback)v.requestVideoFrameCallback((n,md)=>{got=md.mediaTime;setTimeout(done,0);});
    const on=()=>{v.removeEventListener('seeked',on);setTimeout(done,200);};
    v.addEventListener('seeked',on);setTimeout(done,2500);v.currentTime=t;
  });
}
async function flProbeStep(){
  try{
    if(!FL.vid.requestVideoFrameCallback)return null;
    const t0=Math.min(0.3,(FL.vid.duration||1)/3),a=await flMediaTime(t0);if(a==null)return null;
    let hi=null;
    for(const dx of [0.0008,0.0016,0.0032,0.0064,0.0128,0.026,0.05]){const b=await flMediaTime(a+dx);if(b!=null&&b>a+1e-5){hi=b;break;}}
    if(hi==null)return null;
    let est=hi-a,last=hi,n=1;const first=a;
    for(let k=0;k<7;k++){
      let nx=null;
      for(const f of [0.6,0.8,1.0,1.3,1.8]){const b=await flMediaTime(last+est*f);if(b!=null&&b>last+1e-5){nx=b;break;}}
      if(nx==null)break;
      if(nx-last>3*est)break;
      last=nx;n++;
    }
    return (last-first)/n;
  }catch(e){return null;}
}
function flFree(){
  if(FL.url){try{URL.revokeObjectURL(FL.url);}catch(e){}}
  FL.url=null;FL.vid=null;FL.ref=null;FL.out=null;FL.pts=null;FL.logged=false;FL.err='';
}
async function flLoad(file,recFps){
  flFree();FL.recFps=recFps||null;FL.st='loading';FL.pg=T('Opening the clip…','A abrir o vídeo…');flRender();
  const v=document.createElement('video');v.muted=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';
  FL.url=URL.createObjectURL(file);FL.vid=v;
  const ok=await new Promise(res=>{v.onloadedmetadata=()=>res(true);v.onerror=()=>res(false);v.src=FL.url;setTimeout(()=>res(false),15000);});
  if(!ok){FL.st='setup';FL.err=T('Could not open that video.','Não foi possível abrir esse vídeo.');flRender();return;}
  if(!isFinite(v.duration)){ // recorded webm: force the duration
    await new Promise(r=>{v.onseeked=()=>{v.onseeked=null;r();};v.currentTime=1e7;setTimeout(r,1500);});
    v.currentTime=0;await new Promise(r=>setTimeout(r,80));
  }
  const w=v.videoWidth,h=v.videoHeight,k=Math.min(1,1920/Math.max(w,h));
  FL.W=Math.round(w*k);FL.H=Math.round(h*k);
  FL.cvs=document.createElement('canvas');FL.cvs.width=FL.W;FL.cvs.height=FL.H;FL.cx=FL.cvs.getContext('2d',{willReadFrequently:true});
  FL.pg=T('Reading the frame rate…','A ler a taxa de imagens…');flRender();
  const d=await flProbeStep();
  FL.fpsAuto=null;
  if(d&&d>0.001&&d<0.1){
    FL.d=d;const r=1/d;
    for(const q of [240,120,60,30,25,24]){if(Math.abs(r-q)/q<0.1){FL.fpsAuto=q;FL.d=1/q;break;}}
  }else FL.d=1/(recFps||flS().fps);
  if(FL.fpsAuto&&FL.fpsAuto>=60&&!FL.recFps)FL.recFps=FL.fpsAuto; // native high-rate file
  FL.nF=Math.max(2,Math.floor((v.duration||1)/FL.d));
  FL.cur=0;FL.L=await flGrab(0);FL.st='pick';FL.ref=null;FL.out=null;flRender();
}

/* ---------- analysis ---------- */
async function flRun(fromHere){
  if(FL.busy||!FL.ref)return;FL.busy=true;FL.st='run';FL.err='';flRender();
  const pg=t=>{FL.pg=t;const e=document.getElementById('flpg');if(e)e.textContent=t;};
  try{
    const W=FL.W,H=FL.H,ref=FL.ref,d=ref.d,[hi,ho]=flHo(d),sc=d/FLD,dt=1/flFps();
    let K0=FL.cur,L0=await flGrab(K0);
    const c0=Math.max(10,flCtr(L0,W,H,Math.round(ref.x),Math.round(ref.y),hi,ho));
    if(!fromHere){
      pg(T('Finding the moment of impact…','A encontrar o momento do impacto…'));
      const step=6,lim=Math.min(FL.nF-2,K0+1500);let found=-1;
      for(let i=K0+step;i<=lim;i+=step){
        const L=await flGrab(i),r=flCtr(L,W,H,Math.round(ref.x),Math.round(ref.y),hi,ho)/c0;
        if((i-K0)%(step*10)===0)pg(T('Finding the moment of impact… ','A encontrar o impacto… ')+Math.round((i-K0)/(lim-K0)*100)+'%');
        if(r<0.45){
          let stay=true;
          for(const dd of [12,24]){if(i+dd<FL.nF-1){const L2=await flGrab(i+dd);if(flCtr(L2,W,H,Math.round(ref.x),Math.round(ref.y),hi,ho)/c0>0.6){stay=false;break;}}}
          if(stay){found=i;break;}
        }
      }
      if(found<0){throw new Error(T('I could not see the ball leave. Move the slider to just before the hit and try again.','Não vi a bola sair. Põe o cursor mesmo antes da pancada e tenta outra vez.'));}
      let k=found-step;
      for(let i=found-1;i>found-step;i--){const L=await flGrab(i);if(flCtr(L,W,H,Math.round(ref.x),Math.round(ref.y),hi,ho)/c0>=0.6){k=i;break;}}
      K0=k;L0=await flGrab(K0);
    }
    pg(T('Tracking the ball…','A seguir a bola…'));
    const I0=new Int32Array((W+1)*(H+1));flInt(L0,W,H,I0);
    const I=new Int32Array((W+1)*(H+1)),th=Math.max(6,0.08*c0),maxD=95*dt*sc;
    const dirS=flS().dir;
    const frames={};
    const roi=(n)=>{const M=maxD*n;let x0=ref.x-M,x1=ref.x+M;if(dirS==='r')x0=ref.x-0.5*d;if(dirS==='l')x1=ref.x+0.5*d;return[x0,ref.y-0.8*M,x1,ref.y+0.25*d+0.1*M];};
    const near=(x,y)=>Math.hypot(x-ref.x,y-ref.y)>0.9*d;
    const C={};
    for(let n=1;n<=4;n++){
      const L=await flGrab(K0+n);frames[n]=L;flInt(L,W,H,I);const r=roi(n);
      C[n]=flCands(I,I0,W,H,r[0],r[1],r[2],r[3],hi,ho,th,5,2*d,near);
    }
    FL.dbg={K0:K0,C:C,th:th,c0:c0,maxD:maxD};
    // choose the best straight, even-speed triple
    const cand=[[1,2,3],[2,3,4]];let best=null;
    for(const tr of cand){
      for(const a of C[tr[0]])for(const b of C[tr[1]])for(const c of C[tr[2]]){
        const s12=Math.hypot(b[1]-a[1],b[2]-a[2]),s23=Math.hypot(c[1]-b[1],c[2]-b[2]);
        if(s12<1.2*d||s23<1.2*d)continue;const ratio=s23/s12;if(ratio<0.75||ratio>1.25)continue;
        const a1=Math.atan2(b[2]-a[2],b[1]-a[1]),a2=Math.atan2(c[2]-b[2],c[1]-b[1]);let da=Math.abs(a1-a2);if(da>Math.PI)da=2*Math.PI-da;if(da>7*Math.PI/180)continue;
        const dxs=b[1]-a[1];if(dirS==='r'&&dxs<=0)continue;if(dirS==='l'&&dxs>=0)continue;
        const el=Math.atan2(-(b[2]-a[2]),Math.abs(dxs))*180/Math.PI;if(el<-12||el>68)continue;
        const dr=Math.hypot(a[1]-ref.x,a[2]-ref.y);if(dr>1.25*(s12+s23)/2*tr[0])continue;
        const sc2=a[0]+b[0]+c[0]-60*da;
        if(!best||sc2>best.s)best={s:sc2,n:tr,p:[a,b,c]};
      }
      if(best)break;
    }
    if(!best)throw new Error(T('I could not follow the ball. Check the ball is in the clip, in focus, and flying across the screen.','Não consegui seguir a bola. Vê se a bola aparece no vídeo, nítida, a cruzar o ecrã.'));
    const pts=[];
    const ux0=(best.p[1][1]-best.p[0][1]),uy0=(best.p[1][2]-best.p[0][2]),ul0=Math.hypot(ux0,uy0);
    best.n.forEach((n,i)=>{const p=best.p[i],a=0.55*ul0+0.8*d;const q=flRefine(frames[n],L0,W,H,p[1],p[2],ux0/ul0,uy0/ul0,a,1.2*d);pts.push({n:n,x:q[0],y:q[1]});});
    // extend along the flight
    let miss=0;const NM=Math.min(44,FL.nF-K0-2);
    for(let n=best.n[2]+1;n<=NM;n++){
      const p1=pts[pts.length-1],p2=pts[pts.length-2],gap=p1.n-p2.n,vx=(p1.x-p2.x)/gap,vy=(p1.y-p2.y)/gap,st=Math.hypot(vx,vy);
      const px=p1.x+vx*(n-p1.n),py=p1.y+vy*(n-p1.n);
      if(px<2*ho||px>W-2*ho||py<2*ho||py>H-2*ho)break;
      const L=await flGrab(K0+n);flInt(L,W,H,I);const g=Math.max(1.6*d,0.15*st);
      const cs=flCands(I,I0,W,H,px-g,py-g,px+g,py+g,hi,ho,th,3,1,(x,y)=>Math.hypot(x-px,y-py)<=g);
      if(!cs.length){miss++;if(miss>=2)break;continue;}miss=0;
      const q=flRefine(L,L0,W,H,cs[0][1],cs[0][2],vx/st,vy/st,0.55*st+0.8*d,1.2*d);
      pts.push({n:n,x:q[0],y:q[1]});pg(T('Tracking the ball… ','A seguir a bola… ')+pts.length);
    }
    FL.dbg.pts=pts.map(q=>[q.n,Math.round(q.x),Math.round(q.y)]);
    if(pts.length<5)throw new Error(T('Only '+pts.length+' frames of ball found. Move the phone further back so the ball stays in view longer.','Só encontrei a bola em '+pts.length+' imagens. Afasta o telemóvel para a bola ficar mais tempo no ecrã.'));
    // snapshot of the rest frame for the result picture
    const snap=document.createElement('canvas');snap.width=W;snap.height=H;
    await flSeek(FL.vid,(K0+0.5)*FL.d);snap.getContext('2d').drawImage(FL.vid,0,0,W,H);
    FL.snap=snap;FL.pts=pts;FL.K0=K0;FL.logged=false;
    flFit();FL.st='result';
  }catch(e){FL.err=String(e.message||e);FL.st='pick';}
  FL.busy=false;flRender();
}

/* ---------- fit: speed, launch angle, carry ---------- */
function flFit(){
  const ref=FL.ref,pts=FL.pts,s=flS(),sc=ref.d/FLD,dt=1/flFps(),phi=(s.tilt||0)*Math.PI/180,cp=Math.cos(phi),sp=Math.sin(phi);
  const cl=S.clubs.find(c=>c.id===S.rsel)||null;
  let M=pts.map(p=>{const X=(p.x-ref.x)/sc,Y=(ref.y-p.y)/sc;return{n:p.n,X:X*cp-Y*sp,Y:X*sp+Y*cp,px:p};});
  const fs=M.reduce((a,m)=>a+m.X,0)>=0?1:-1;M.forEach(m=>m.X*=fs);
  FL.fs=fs;
  const run=(use,spin)=>{
    const f=use[0],l=use[use.length-1];
    let v0=Math.max(10,Math.hypot(l.X-f.X,l.Y-f.Y)/((l.n-f.n)*dt)),th=Math.atan2(l.Y-f.Y,l.X-f.X),tau=Math.max(-0.4*dt,Math.min(3.5*dt,f.n*dt-Math.hypot(f.X,f.Y)/v0)),lam=1e-3;
    const ts=use.map(m=>m.n*dt);
    const resid=(p)=>{const tt=ts.map(t=>Math.max(0,t-p[2]));const o=flSim(p[0],p[1],spin,tt[tt.length-1]+0.002,tt);
      // flSim requires sorted ts; sorted because n increases
      const r=[];for(let i=0;i<use.length;i++){const q=o.pos[i]||[0,0];r.push(q[0]-use[i].X,q[1]-use[i].Y);}return r;};
    let p=[v0,th,tau],r=resid(p),cost=r.reduce((a,x)=>a+x*x,0);
    for(let it=0;it<18;it++){
      const J=[],eps=[0.05,0.0004,0.00004];
      for(let k=0;k<3;k++){const q=p.slice();q[k]+=eps[k];const rk=resid(q);J.push(rk.map((x,i)=>(x-r[i])/eps[k]));}
      const A=[[0,0,0],[0,0,0],[0,0,0]],g=[0,0,0];
      for(let a=0;a<3;a++){for(let b=0;b<3;b++){let t=0;for(let i=0;i<r.length;i++)t+=J[a][i]*J[b][i];A[a][b]=t;}let t=0;for(let i=0;i<r.length;i++)t+=J[a][i]*r[i];g[a]=t;}
      for(let a=0;a<3;a++)A[a][a]*=(1+lam);
      const det=A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1])-A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0])+A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0]);
      if(Math.abs(det)<1e-30)break;
      const inv=(m)=>{const c=[];c[0]=[A[1][1]*A[2][2]-A[1][2]*A[2][1],A[0][2]*A[2][1]-A[0][1]*A[2][2],A[0][1]*A[1][2]-A[0][2]*A[1][1]];c[1]=[A[1][2]*A[2][0]-A[1][0]*A[2][2],A[0][0]*A[2][2]-A[0][2]*A[2][0],A[0][2]*A[1][0]-A[0][0]*A[1][2]];c[2]=[A[1][0]*A[2][1]-A[1][1]*A[2][0],A[0][1]*A[2][0]-A[0][0]*A[2][1],A[0][0]*A[1][1]-A[0][1]*A[1][0]];return c;};
      const iv=inv(A),dl=[0,1,2].map(a=>-(iv[a][0]*g[0]+iv[a][1]*g[1]+iv[a][2]*g[2])/det);
      const q=[p[0]+dl[0],p[1]+dl[1],Math.max(-0.5*dt,Math.min(4*dt,p[2]+dl[2]))],rq=resid(q),cq=rq.reduce((a,x)=>a+x*x,0);
      if(cq<cost){p=q;r=rq;cost=cq;lam=Math.max(1e-6,lam/3);if(Math.sqrt(dl[0]*dl[0])<1e-4&&Math.abs(dl[1])<1e-6)break;}else lam*=5;
    }
    const res=[];for(let i=0;i<use.length;i++)res.push(Math.hypot(r[2*i],r[2*i+1])*sc);
    return{p:p,res:res};
  };
  let use=M.slice(0,14),spin=flSpin(cl,40,15),f=null;
  for(let pass=0;pass<2;pass++){
    f=run(use,spin);
    const med=f.res.slice().sort((a,b)=>a-b)[f.res.length>>1],lim=Math.max(2.5,3*med);
    const keep=use.filter((m,i)=>f.res[i]<=lim);
    if(keep.length>=5&&keep.length<use.length){use=keep;f=run(use,spin);}
    spin=flSpin(cl,f.p[0],f.p[1]*180/Math.PI);
  }
  f=run(use,spin);
  const v0=f.p[0],thD=f.p[1]*180/Math.PI,rms=Math.sqrt(f.res.reduce((a,x)=>a+x*x,0)/f.res.length);
  const sim=flSim(v0,f.p[1],spin);
  const conf=(use.length>=8&&rms<=1.5&&ref.d>=8)?2:(use.length>=6&&rms<=3.5)?1:0;
  FL.out={v:v0,th:thD,carry:sim.carry,apex:sim.apex,tof:sim.tof,land:sim.land,spin:spin,rms:rms,n:use.length,conf:conf,used:use.map(m=>m.px.n),club:cl?cl.id:null,fps:flFps(),fs:fs};
}

/* ---------- UI ---------- */
const flSpdU=v=>S.units==='y'?(v*2.23694).toFixed(0)+' mph':(v*3.6).toFixed(0)+' km/h';
function flStat(l,v,s){return '<div class="stat"><div class="lbl" style="font-size:11px">'+l+'</div><div style="font-size:21px;font-weight:800;margin-top:2px">'+v+'</div>'+(s?'<div class="sub" style="font-size:11px">'+s+'</div>':'')+'</div>';}
function flHist(){
  const h=S.trk||[];if(!h.length)return '';
  const u=ul();
  return '<div class="lbl" style="margin:16px 0 6px">'+T('Tracked shots','Tacadas seguidas')+'</div>'+h.slice(0,8).map(r=>{const c=S.clubs.find(x=>x.id===r.club);
    return '<div class="shot" style="font-size:14px"><span>'+new Date(r.t).toLocaleDateString(undefined,{day:'numeric',month:'short'})+' · <b>'+esc(c?tc(c.name):'–')+'</b></span><span>'+flSpdU(r.spd)+' · '+r.la.toFixed(0)+'° · ≈'+d1(r.carry)+' '+u+'</span></div>';}).join('');
}
function flSetupHTML(){
  const s=flS(),act=S.clubs.filter(c=>c.on),sel=S.clubs.find(c=>c.id===S.rsel&&c.on)||act[0];
  const cam=navigator.mediaDevices&&navigator.mediaDevices.getUserMedia;
  return '<div class="hint" style="margin-top:0">'+T('Film one swing from the side with the phone on a tripod, then the app follows the ball and gives you ball speed, launch angle and an estimated carry. Use slo-mo (240 fps) for accurate numbers.','Filma uma pancada de lado com o telemóvel num tripé, e a app segue a bola e dá-te a velocidade da bola, o ângulo de saída e um voo estimado. Usa slo-mo (240 fps) para números precisos.')+'</div>'+
  (FL.err?'<div class="aim" style="background:#fdecea;color:#8a1c1c">'+esc(FL.err)+'</div>':'')+
  '<label class="cta" style="display:block;text-align:center;margin-top:6px">🎞️ '+T('Import slo-mo clip','Importar vídeo slo-mo')+'<input type="file" id="flfile" accept="video/*" hidden></label>'+
  (cam?'<button class="sec" style="width:100%;margin-top:10px" data-fl="camopen">🎥 '+T('Record in the app (up to ~60 fps)','Gravar na app (até ~60 fps)')+'</button>':'')+
  '<div class="lbl" style="margin:10px 0 6px">'+T('Club','Taco')+'</div><div class="chiprow" style="flex-wrap:wrap;margin:0 0 6px">'+act.map(c=>'<button class="cond'+(sel&&c.id===sel.id?' pickon':'')+'" data-fl="club" data-id="'+c.id+'">'+esc(tc(c.name))+'</button>').join('')+'</div>'+
  '<div class="lbl" style="margin:10px 0 6px">'+T('Clip recorded at','Vídeo gravado a')+'</div><div class="seg" style="margin-bottom:10px">'+[240,120,60].map(f=>'<button class="'+(s.fps===f?'on':'')+'" data-fl="fps" data-v="'+f+'">'+f+' fps</button>').join('')+'</div>'+
  '<details class="hint"><summary style="font-weight:700;cursor:pointer">'+T('How to film','Como filmar')+'</summary><div style="margin-top:8px;line-height:1.5">'+
  '1. '+T('Phone on a tripod about 4–5 m (13–16 ft) from the ball, at ball height, square to your target line, so the ball flies across the screen.','Telemóvel num tripé a cerca de 4–5 m da bola, à altura da bola, em ângulo reto com a linha do alvo, para a bola cruzar o ecrã.')+'<br>'+
  '2. '+T('Camera app → Slo-mo. Settings → Camera → Record Slo-mo → 1080p at 240 fps. Keep the 1x lens, no zoom.','App Câmara → Slo-mo. Definições → Câmara → Gravar Slo-mo → 1080p a 240 fps. Lente 1x, sem zoom.')+'<br>'+
  '3. '+T('Put the ball near the edge of the picture on the side you are hitting away from, so it has room to fly across.','Põe a bola perto do bordo do ecrã, do lado contrário ao da direção da bola, para ter espaço para voar.')+'<br>'+
  '4. '+T('Settings → Camera → Grid on, and keep the phone level. 1° of tilt is 1° of launch angle.','Definições → Câmara → Grelha ligada, e mantém o telemóvel nivelado. 1° de inclinação é 1° de ângulo de saída.')+'<br>'+
  '5. '+T('Good light, one swing per clip, about 3 seconds.','Boa luz, uma pancada por vídeo, cerca de 3 segundos.')+'<br>'+
  '6. '+T('Import the clip here. If you see the speed 8× too slow, save the clip to Files first and pick it from there.','Importa o vídeo aqui. Se a velocidade sair 8× mais lenta, guarda o vídeo em Ficheiros e escolhe-o a partir daí.')+'</div></details>'+
  flHist();
}
function flCamHTML(){
  const c=FL.cam||{};
  const warn=c.fps&&c.fps<100?'<div class="aim">'+T('This browser gives only '+c.fps+' fps. The ball will show in just a few frames, so expect rough numbers. For accurate ones use the slo-mo import.','Este navegador só dá '+c.fps+' fps. A bola aparece em poucas imagens, por isso os números serão aproximados. Para números precisos usa a importação slo-mo.')+'</div>':'';
  return '<video id="flcam" autoplay muted playsinline style="width:100%;border-radius:12px;background:#000"></video>'+
  '<div class="sub center" style="margin:6px 0">'+T('Camera running at','Câmara a')+' <b>'+(c.fps||'?')+' fps</b>'+(c.max?' · '+T('max','máx.')+' '+c.max:'')+'</div>'+warn+
  '<div id="flcd" class="big-msg center" style="min-height:34px">'+esc(c.msg||'')+'</div>'+
  (c.rec?'<button class="cta" data-fl="camstop">'+T('Stop','Parar')+'</button>':(c.count?'<button class="sec" style="width:100%" data-fl="camcancel">'+T('Cancel','Cancelar')+'</button>':'<button class="cta" data-fl="camrec">'+T('Start (5 s countdown, records 6 s)','Começar (5 s de contagem, grava 6 s)')+'</button><button class="link" style="width:100%" data-fl="camclose">'+T('Back','Voltar')+'</button>'));
}
function flPickHTML(){
  const s=flS(),r=FL.ref,t=(FL.cur+0.5)*FL.d;
  return (FL.err?'<div class="aim" style="background:#fdecea;color:#8a1c1c">'+esc(FL.err)+'</div>':'')+
  '<div class="sub" style="margin-bottom:6px">'+(r?T('Ball found: '+r.d.toFixed(1)+' px wide. Check the circle, then Analyze.','Bola encontrada: '+r.d.toFixed(1)+' px. Confirma o círculo e carrega em Analisar.'):T('Scrub to a frame before the swing where the ball is still, then tap the ball.','Move o cursor para uma imagem antes da pancada com a bola parada, e toca na bola.'))+'</div>'+
  '<canvas id="flc" style="width:100%;border-radius:12px;background:#000;display:block"></canvas>'+
  '<input type="range" id="flsl" min="0" max="'+(FL.nF-1)+'" value="'+FL.cur+'" style="width:100%;margin:8px 0 2px">'+
  '<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span class="sub" style="font-size:12px">'+T('Frame','Imagem')+' '+FL.cur+' / '+FL.nF+' · '+t.toFixed(2)+' s</span><span class="row" style="gap:4px;flex-wrap:nowrap">'+[['-10','«'],['-1','‹'],['1','›'],['10','»']].map(x=>'<button class="cond" style="min-height:40px;padding:0 14px" data-fl="nudge" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</span></div>'+
  (r?'<div class="lbl" style="margin:10px 0 4px">'+T('Zoom on the ball (tap to re-centre)','Zoom na bola (toca para centrar)')+'</div><div class="row" style="flex-wrap:nowrap;align-items:flex-start"><canvas id="flz" width="200" height="200" style="width:150px;height:150px;border-radius:10px;background:#000;flex:none"></canvas><div style="flex:1"><div class="sub" style="font-size:12px">'+T('Ball size','Tamanho da bola')+'</div><div class="stepper" style="gap:8px"><button data-fl="bsz" data-v="-0.5" style="width:44px;height:44px">−</button><div class="v" style="font-size:18px;min-width:56px">'+r.d.toFixed(1)+'</div><button data-fl="bsz" data-v="0.5" style="width:44px;height:44px">+</button></div></div></div>':'')+
  '<div class="lbl" style="margin:10px 0 4px">'+T('Ball flies to the','A bola vai para a')+'</div><div class="seg" style="margin-bottom:6px">'+[['auto',T('Auto','Auto')],['r',T('Right','Direita')],['l',T('Left','Esquerda')]].map(x=>'<button class="'+(s.dir===x[0]?'on':'')+'" data-fl="dir" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
  '<div class="lbl" style="margin:10px 0 4px">'+T('Camera tilt (green line vs. the ground or mat edge)','Inclinação da câmara (linha verde vs. chão ou tapete)')+'</div><div class="stepper" style="justify-content:center;gap:8px"><button data-fl="tilt" data-v="-0.5">−</button><div class="v" style="font-size:20px;min-width:70px">'+(s.tilt||0).toFixed(1)+'°</div><button data-fl="tilt" data-v="0.5">+</button></div>'+
  '<button class="cta" style="margin-top:12px" data-fl="go"'+(r?'':' disabled style="opacity:.4;margin-top:12px"')+'>'+T('Analyze','Analisar')+'</button>'+
  (r?'<button class="link" style="width:100%" data-fl="gohere">'+T('Impact is right after this frame','O impacto é logo a seguir a esta imagem')+'</button>':'')+
  '<button class="link" style="width:100%" data-fl="new">'+T('Choose another clip','Escolher outro vídeo')+'</button>';
}
function flResultHTML(){
  const o=FL.out,u=ul(),cl=S.clubs.find(c=>c.id===o.club)||S.clubs.find(c=>c.id===S.rsel),real=cl?rbReal(cl,o.carry):o.carry,s=flS();
  const cf=[T('Low','Baixa'),T('OK','OK'),T('Good','Boa')][o.conf];
  const warn=(o.v<14||o.v>88)?'<div class="aim" style="background:#fdecea;color:#8a1c1c">'+T('This speed looks wrong. Check “Clip recorded at” (240, 120 or 60 fps) and the ball size.','Esta velocidade parece errada. Verifica “Vídeo gravado a” (240, 120 ou 60 fps) e o tamanho da bola.')+'</div>':'';
  return '<canvas id="flr" style="width:100%;border-radius:12px;background:#000;display:block"></canvas>'+warn+
  '<div class="stats" style="margin-top:10px">'+flStat(T('Ball speed','Vel. da bola'),flSpdU(o.v))+flStat(T('Launch angle','Ângulo de saída'),o.th.toFixed(1)+'°')+flStat(T('Carry (est.)','Voo (est.)'),'≈'+d1(real)+' '+u,(S.rball==='real'||!cl?'':T('range ball','bola de range')+' '+d1(o.carry)))+flStat(T('Apex','Altura máx.'),d1(o.apex)+' '+u)+flStat(T('Flight time','Tempo de voo'),o.tof.toFixed(1)+' s')+flStat(T('Confidence','Confiança'),cf,o.n+' '+T('frames','imagens')+' · '+o.rms.toFixed(1)+' px')+'</div>'+
  '<div class="sub" style="font-size:12px;margin:8px 0">'+T('Speed and launch angle come from the video. Carry is a physics estimate (about ±10%) because spin cannot be seen. Sideways distance needs a view from behind.','Velocidade e ângulo vêm do vídeo. O voo é uma estimativa física (cerca de ±10%) porque o spin não se vê. A distância lateral precisa de uma vista por trás.')+'</div>'+
  '<div class="row" style="justify-content:space-between;flex-wrap:nowrap;margin:6px 0"><span style="font-size:14px">'+T('Tilt','Inclinação')+' '+(s.tilt||0).toFixed(1)+'°</span><span class="row" style="gap:4px;flex-wrap:nowrap"><button class="cond" style="min-height:40px" data-fl="rtilt" data-v="-0.5">−</button><button class="cond" style="min-height:40px" data-fl="rtilt" data-v="0.5">+</button></span></div>'+
  '<div class="row" style="justify-content:space-between;flex-wrap:nowrap;margin:6px 0"><span style="font-size:14px">'+T('Recorded at','Gravado a')+' '+o.fps+' fps</span><span class="row" style="gap:4px;flex-wrap:nowrap">'+[240,120,60].map(f=>'<button class="cond'+(o.fps===f?' pickon':'')+'" style="min-height:40px" data-fl="rfps" data-v="'+f+'">'+f+'</button>').join('')+'</span></div>'+
  '<div class="lbl" style="margin:10px 0 6px">'+T('Club','Taco')+'</div><div class="chiprow" style="flex-wrap:wrap;margin:0 0 6px">'+S.clubs.filter(c=>c.on).map(c=>'<button class="cond'+(cl&&c.id===cl.id?' pickon':'')+'" data-fl="rclub" data-id="'+c.id+'">'+esc(tc(c.name))+'</button>').join('')+'</div>'+
  '<button class="cta" data-fl="log"'+(FL.logged?' disabled style="opacity:.5"':'')+'>'+(FL.logged?T('Saved ✓','Guardado ✓'):T('Save this shot','Guardar esta tacada'))+'</button>'+
  '<button class="sec" style="width:100%;margin-top:8px" data-fl="logr">'+T('Also add carry to my range data','Juntar também o voo aos dados do range')+'</button>'+
  '<button class="sec" style="width:100%;margin-top:8px" data-fl="new">'+T('Another shot','Outra tacada')+'</button>'+flHist();
}
function flHTML(){
  if(FL.st==='loading'||FL.st==='run')return '<div class="center" style="padding:40px 10px"><div class="big-msg" id="flpg">'+esc(FL.pg||'…')+'</div><div class="sub">'+T('This takes a few seconds.','Demora alguns segundos.')+'</div></div>';
  if(FL.st==='cam')return flCamHTML();
  if(FL.st==='pick')return flPickHTML();
  if(FL.st==='result'&&FL.out)return flResultHTML();
  return flSetupHTML();
}
function flRender(){
  const box=document.getElementById('flbox');if(!box)return;
  box.innerHTML=flHTML();
  if(FL.st==='pick')flPaint();
  else if(FL.st==='result')flPaintRes();
  else if(FL.st==='cam')flCamAttach();
}
function flPaint(){
  const c=document.getElementById('flc');if(!c||!FL.cvs)return;
  c.width=FL.W;c.height=FL.H;const g=c.getContext('2d');g.drawImage(FL.cvs,0,0);
  const r=FL.ref,tilt=(flS().tilt||0)*Math.PI/180;
  g.lineWidth=Math.max(2,FL.W/700);
  if(r){
    g.strokeStyle='#22c55e';g.beginPath();g.arc(r.x,r.y,r.d*0.5+2,0,7);g.stroke();
    const L2=FL.W*0.6;g.strokeStyle='rgba(34,197,94,.75)';g.beginPath();g.moveTo(r.x-L2*Math.cos(tilt),r.y+L2*Math.sin(tilt));g.lineTo(r.x+L2*Math.cos(tilt),r.y-L2*Math.sin(tilt));g.stroke();
    const z=document.getElementById('flz');
    if(z){const R=Math.max(20,2.4*r.d),zc=z.getContext('2d');zc.imageSmoothingEnabled=false;zc.clearRect(0,0,200,200);zc.drawImage(FL.cvs,r.x-R,r.y-R,2*R,2*R,0,0,200,200);zc.strokeStyle='#22c55e';zc.lineWidth=2;zc.beginPath();zc.arc(100,100,r.d/2*200/(2*R),0,7);zc.stroke();FL.zR=R;}
  }
}
function flPaintRes(){
  const c=document.getElementById('flr');if(!c||!FL.snap||!FL.pts)return;
  const ref=FL.ref,pts=FL.pts,xs=[ref.x].concat(pts.map(p=>p.x)),ys=[ref.y].concat(pts.map(p=>p.y));
  const pad=ref.d*8;let x0=Math.max(0,Math.min.apply(null,xs)-pad),x1=Math.min(FL.W,Math.max.apply(null,xs)+pad),y0=Math.max(0,Math.min.apply(null,ys)-pad),y1=Math.min(FL.H,Math.max.apply(null,ys)+pad);
  const w=x1-x0,h=Math.max(y1-y0,w*0.4);y1=Math.min(FL.H,y0+h);
  c.width=Math.round(w);c.height=Math.round(y1-y0);const g=c.getContext('2d');g.drawImage(FL.snap,x0,y0,w,y1-y0,0,0,c.width,c.height);
  const used=FL.out.used;g.lineWidth=Math.max(1.5,c.width/500);
  pts.forEach(p=>{const u=used.indexOf(p.n)>=0;g.strokeStyle=u?'#22c55e':'#f59e0b';g.beginPath();g.arc(p.x-x0,p.y-y0,ref.d*0.8,0,7);g.stroke();});
  g.strokeStyle='#38bdf8';g.beginPath();g.arc(ref.x-x0,ref.y-y0,ref.d*0.8,0,7);g.stroke();
}

/* ---------- in-app recording ---------- */
async function flCamOpen(){
  FL.err='';
  try{
    const st=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:240}}});
    const tr=st.getVideoTracks()[0];
    try{await tr.applyConstraints({frameRate:{ideal:240}});}catch(e){}
    const set=tr.getSettings?tr.getSettings():{},cap=tr.getCapabilities?tr.getCapabilities():{};
    FL.cam={st:st,tr:tr,fps:Math.round(set.frameRate||30),max:cap.frameRate?Math.round(cap.frameRate.max):null,msg:'',rec:false,count:false};
    FL.st='cam';flRender();
  }catch(e){FL.err=T('Camera not available: ','Câmara indisponível: ')+(e.message||e.name);FL.st='setup';flRender();}
}
function flCamAttach(){const v=document.getElementById('flcam');if(v&&FL.cam){v.srcObject=FL.cam.st;v.play().catch(()=>{});}}
function flCamClose(){
  const c=FL.cam;if(c){clearInterval(c.tm);clearTimeout(c.to);try{if(c.mr&&c.mr.state!=='inactive'){c.mr.onstop=null;c.mr.stop();}}catch(e){}try{c.st.getTracks().forEach(t=>t.stop());}catch(e){}}
  FL.cam=null;FL.st='setup';flRender();
}
function flCamRec(){
  const c=FL.cam;if(!c)return;let n=5;c.count=true;c.msg=String(n);flRender();
  c.tm=setInterval(()=>{n--;if(n>0){c.msg=String(n);const e=document.getElementById('flcd');if(e)e.textContent=c.msg;return;}
    clearInterval(c.tm);c.count=false;c.rec=true;c.msg='● REC';
    const types=['video/mp4','video/webm;codecs=vp9','video/webm'],mt=types.find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||'';
    const chunks=[];
    try{c.mr=new MediaRecorder(c.st,mt?{mimeType:mt,videoBitsPerSecond:30e6}:{videoBitsPerSecond:30e6});}catch(e){c.mr=new MediaRecorder(c.st);}
    c.mr.ondataavailable=ev=>{if(ev.data&&ev.data.size)chunks.push(ev.data);};
    c.mr.onstop=async()=>{const fps=c.fps,type=c.mr.mimeType||mt||'video/mp4',blob=new Blob(chunks,{type:type});
      try{c.st.getTracks().forEach(t=>t.stop());}catch(e){}FL.cam=null;await flLoad(blob,fps);};
    c.mr.start();flRender();c.to=setTimeout(()=>flCamStop(),6000);
  },1000);
}
function flCamStop(){const c=FL.cam;if(c&&c.mr&&c.mr.state!=='inactive'){clearTimeout(c.to);c.mr.stop();}}

/* ---------- events ---------- */
async function flGoto(i){
  if(!FL.vid||FL.busy)return;i=Math.max(0,Math.min(FL.nF-1,Math.round(i)));FL.cur=i;
  const my=FL.seekTok=(FL.seekTok||0)+1;
  FL.L=await flGrab(i);if(my!==FL.seekTok)return;
  if(FL.ref&&FL.refAuto){} flPaint();
  const sl=document.getElementById('flsl');if(sl&&+sl.value!==i)sl.value=i;
}
document.addEventListener('change',e=>{
  if(e.target&&e.target.id==='flfile'&&e.target.files&&e.target.files[0]){const f=e.target.files[0];e.target.value='';flLoad(f,null);}
});
document.addEventListener('input',e=>{
  if(e.target&&e.target.id==='flsl'){FL.cur=+e.target.value;clearTimeout(FL.sT);FL.sT=setTimeout(()=>flGoto(FL.cur),30);const t=document.querySelector('#flbox .sub[style*="font-size:12px"]');}
});
document.addEventListener('click',async e=>{
  const cv=e.target.closest&&e.target.closest('#flc,#flz');
  if(cv&&FL.cvs&&!FL.busy){
    const rc=cv.getBoundingClientRect();
    if(cv.id==='flc'){
      const x=(e.clientX-rc.left)/rc.width*FL.W,y=(e.clientY-rc.top)/rc.height*FL.H;
      FL.L=FL.L||await flGrab(FL.cur);
      const b=flFindBall(FL.L,FL.W,FL.H,x,y,Math.max(60,FL.W*0.04));
      if(b){FL.ref=b;FL.err='';}else FL.err=T('I could not find the ball there. Tap closer to it, or move to a sharper frame.','Não encontrei a bola aí. Toca mais perto, ou escolhe uma imagem mais nítida.');
      flRender();
    }else if(FL.ref){
      const R=FL.zR||30,x=FL.ref.x-R+(e.clientX-rc.left)/rc.width*2*R,y=FL.ref.y-R+(e.clientY-rc.top)/rc.height*2*R;
      const m=flMeasureBall(FL.L,FL.W,FL.H,x,y,FL.ref.d);FL.ref=m;flRender();
    }
    return;
  }
  const b=e.target.closest&&e.target.closest('[data-fl]');if(!b)return;
  const a=b.dataset.fl,v=b.dataset.v,s=flS();
  if(a==='club'){S.rsel=b.dataset.id;save();flRender();}
  else if(a==='fps'){s.fps=+v;save();flRender();}
  else if(a==='dir'){s.dir=v;save();flRender();}
  else if(a==='tilt'){s.tilt=Math.max(-8,Math.min(8,Math.round(((s.tilt||0)+ +v)*10)/10));save();flRender();}
  else if(a==='nudge'){await flGoto(FL.cur+ +v);}
  else if(a==='bsz'){if(FL.ref){FL.ref.d=Math.max(3,FL.ref.d+ +v);flRender();}}
  else if(a==='go'){flRun(false);}
  else if(a==='gohere'){flRun(true);}
  else if(a==='new'){flFree();FL.st='setup';flRender();}
  else if(a==='camopen'){flCamOpen();}
  else if(a==='camrec'){flCamRec();}
  else if(a==='camstop'){flCamStop();}
  else if(a==='camcancel'||a==='camclose'){flCamClose();}
  else if(a==='rtilt'){s.tilt=Math.max(-8,Math.min(8,Math.round(((s.tilt||0)+ +v)*10)/10));save();flFit();flRender();}
  else if(a==='rfps'){FL.recFps=+v;flFit();flRender();}
  else if(a==='rclub'){S.rsel=b.dataset.id;save();flFit();flRender();}
  else if(a==='log'||a==='logr'){
    const o=FL.out,cl=S.clubs.find(c=>c.id===S.rsel);if(!o||!cl)return;
    const real=rbReal(cl,o.carry);
    if(a==='log'&&!FL.logged){S.trk=S.trk||[];S.trk.unshift({t:Date.now(),club:cl.id,spd:o.v,la:o.th,raw:o.carry,carry:real,apex:o.apex,conf:o.conf,fps:o.fps});S.trk=S.trk.slice(0,200);FL.logged=true;save();}
    if(a==='logr'){S.rlog=S.rlog||[];S.rlog.push({club:cl.id,d:real,raw:o.carry,lat:null,fl:'n',src:'free',t:Date.now(),trk:1});S.rlog=S.rlog.slice(-400);if(!FL.logged){S.trk=S.trk||[];S.trk.unshift({t:Date.now(),club:cl.id,spd:o.v,la:o.th,raw:o.carry,carry:real,apex:o.apex,conf:o.conf,fps:o.fps});S.trk=S.trk.slice(0,200);FL.logged=true;}save();}
    flRender();
  }
});

/* ---------- Play tab: a 'Track' button next to Play / Target / My holes / Goals ---------- */
const _playHFl=playHTML;
playHTML=function(){
  const trk=PL.sub==='track';
  if(trk)PL.sub='goals';
  let h;try{h=_playHFl();}finally{if(trk)PL.sub='track';}
  const i=h.indexOf('data-gm="sub"');if(i<0)return h;
  const s=h.lastIndexOf('<div class="seg"',i),e=h.indexOf('</div>',i)+6;
  let nav=h.slice(s,e);
  if(trk)nav=nav.replace(' class="on" data-gm="sub"',' class="" data-gm="sub"');
  nav=nav.replace(/<\/div>$/,'<button class="'+(trk?'on':'')+'" data-gm="sub" data-v="track">🎥 '+T('Track','Bola')+'</button></div>');
  if(!trk)return h.slice(0,s)+nav+h.slice(e);
  return h.slice(0,s)+nav+'<div id="flbox"></div>';
};
const _opFl=openPanel;
openPanel=function(t){
  _opFl.apply(this,arguments);
  try{if(ptab==='play'&&PL.sub==='track'&&!PL.on)setTimeout(flRender,0);}catch(e){}
};
