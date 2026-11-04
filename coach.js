"use strict";
/* ============ Coach: end-of-session report with numbers, meaning and targets ============ */
const CM={
 tempo:['How long the backswing takes compared with the downswing. Smooth, repeatable swings are about 3 to 1.','Quanto tempo demora a subida comparada com a descida. Swings suaves e repetíveis rondam 3 para 1.'],
 sh:['How far your shoulders turn away from the target at the top. This stores power.','Quanto os ombros rodam para longe do alvo no topo. Guarda potência.'],
 hip:['How far your hips turn at the top. Less than your shoulders, so the body winds up.','Quanto a anca roda no topo. Menos do que os ombros, para o corpo "enrolar".'],
 xf:['Shoulder turn minus hip turn. The bigger the gap, the more stored power.','Rotação dos ombros menos a da anca. Quanto maior a diferença, mais potência guardada.'],
 tilt:['How much you bend forward from the hips at address. It sets the plane of your swing.','Quanto te inclinas a partir da anca no address. Define o plano do swing.'],
 tiltd:['Whether you keep that forward bend until impact. Standing up causes thin or blocked shots.','Se manténs essa inclinação até ao impacto. Levantar causa bolas finas ou bloqueadas.'],
 knee:['How much your knees are bent at address. An athletic base.','Quanto os joelhos estão fletidos no address. Uma base atlética.'],
 arm:['How straight your lead arm is at the top. A wide arc means more clubhead speed.','Quão esticado está o braço da frente no topo. Arco largo dá mais velocidade.'],
 top:['How high your hands get at the top. Shows the length of your backswing.','A que altura as mãos chegam no topo. Mostra o comprimento da subida.'],
 head:['How much your head moves before impact. A steady head gives clean contact.','Quanto a cabeça se mexe até ao impacto. Cabeça estável dá contacto limpo.'],
 hipTop:['Sideways hip movement in the backswing. You want to turn, not slide or sway.','Movimento lateral da anca na subida. Queres rodar, não deslizar.'],
 hipImp:['How far your hips shift toward the target by impact. Weight moves forward first, then you rotate.','Quanto a anca passa para o alvo no impacto. O peso vai primeiro para a frente, depois rodas.'],
 reach:['Distance of your hands from your body at impact versus address. Same distance means consistent contact.','Distância das mãos ao corpo no impacto face ao address. A mesma distância dá contacto consistente.'],
 finrot:['How far you rotate through to the finish. Shows that you accelerated through the ball.','Quanto rodas até ao final. Mostra que aceleraste através da bola.'],
 bal:['How much you wobble in the finish. Good balance means a controlled swing.','Quanto oscilas no final. Bom equilíbrio significa um swing controlado.']
};
function cmParse(v){const m=/^\s*([+-]?\d+(?:\.\d+)?)(.*)$/.exec(String(v));return m?{n:parseFloat(m[1]),u:m[2]}:null;}
/* ---------- retuned targets (amateur-realistic) and body scaling, patched onto swing.js at load ---------- */
Object.assign(SW_CLS.driver,{sh:[[75,105],[58,125]],hip:[[32,55],[22,65]],xf:[[25,55],[15,65]]});
Object.assign(SW_CLS.wood,{sh:[[72,102],[56,122]],hip:[[30,52],[20,62]],xf:[[24,52],[14,62]]});
Object.assign(SW_CLS.long,{sh:[[70,98],[54,118]],hip:[[28,48],[18,58]],xf:[[22,48],[12,58]]});
Object.assign(SW_CLS.short,{sh:[[64,92],[50,112]],hip:[[26,46],[16,56]],xf:[[20,46],[10,56]]});
Object.assign(SW_CLS.wedge,{sh:[[52,82],[40,98]],hip:[[20,40],[12,50]],xf:[[14,40],[6,50]]});
function swLvl(c){const m=S.mob==='low'?-10:S.mob==='high'?8:0;if(!m)return c;const sh=g=>g.map(r=>[r[0]+m,r[1]+m]),hp=g=>g.map(r=>[r[0]+m*.6,r[1]+m*.6]);return Object.assign({},c,{sh:sh(c.sh),hip:hp(c.hip),xf:hp(c.xf)});}
let _swAnalyzeBase=swAnalyze;
try{
  let src=swAnalyze.toString();
  const a="C=SW_CLS[o.cls]||SW_CLS.long",b="cm=v=>v/L0*50";
  if(src.indexOf(a)>0&&src.indexOf(b)>0){
    src=src.replace(a,"C=swLvl(SW_CLS[o.cls]||SW_CLS.long)").replace(b,"cm=v=>v/L0*(S.heightCm>120&&S.heightCm<230?S.heightCm*0.288:50)");
    _swAnalyzeBase=(0,eval)('('+src+')');
  }
}catch(e){}
const _swAnalyzeC=_swAnalyzeBase;
swAnalyze=function(F,o){const r=_swAnalyzeC(F,o);SWV.lastRes=r;return r;};
const _swAutoDoneC=swAutoDone;
swAutoDone=function(){
  const s=SWV.sess,n0=s?s.items.length:0;
  _swAutoDoneC.apply(this,arguments);
  if(s&&s.items.length>n0&&!SWV.home&&!SWV.drill&&SWV.lastRes&&SWV.lastRes.ok)
    s.items[s.items.length-1].fm=SWV.lastRes.M.map(m=>({key:m.key,label:m.label,val:m.val,st:m.st,target:m.target,tip:m.tip}));
};
function cmReport(s){
  const its=s.items.filter(x=>x.fm);if(!its.length)return '';
  const by={};its.forEach(it=>it.fm.forEach(m=>{(by[m.key]=by[m.key]||[]).push(m);}));
  const rows=Object.keys(by).map(k=>{
    const a=by[k],last=a[a.length-1],good=a.filter(m=>m.st==='good').length,ok=a.filter(m=>m.st==='ok').length;
    const ps=a.map(m=>cmParse(m.val)),num=ps.every(p=>p);
    let you;
    if(num){const ns=ps.map(p=>p.n),av=ns.reduce((x,y)=>x+y,0)/ns.length,u=ps[0].u,dec=/\./.test(String(a[0].val))?1:0,mn=Math.min(...ns),mx=Math.max(...ns);
      you=(av>0&&/^\s*\+/.test(String(a[0].val))?'+':'')+av.toFixed(dec)+u+(a.length>1&&mx-mn>0?'<br><small>'+mn.toFixed(dec)+' – '+mx.toFixed(dec)+'</small>':'');}
    else{const c={};a.forEach(m=>c[m.val]=(c[m.val]||0)+1);you=Object.keys(c).sort((x,y)=>c[y]-c[x])[0];}
    const tipSrc=a.slice().reverse().find(m=>m.tip);
    return{k:k,label:last.label,you:you,target:last.target,pct:Math.round((good+ok*0.5)/a.length*100),gp:Math.round(good/a.length*100),tip:tipSrc?tipSrc.tip:'',w:(a.length-good)};
  }).sort((x,y)=>x.gp-y.gp);
  const col=p=>p>=75?'#166534':p>=40?'#b45309':'#c62828',bg=p=>p>=75?'#dcfce7':p>=40?'#fef3c7':'#fee2e2';
  const sc=its.map(x=>x.score),avg=Math.round(sc.reduce((a,b)=>a+b,0)/sc.length);
  const tb=rows.map(r=>'<tr style="border-top:1px solid var(--line)"><td style="padding:8px 4px 8px 0;vertical-align:top"><b>'+esc(r.label)+'</b><div style="font-size:11px;color:var(--mut);line-height:1.25;margin-top:2px">'+esc((CM[r.k]||['',''])[T(0,1)])+'</div></td><td style="padding:8px 4px;vertical-align:top;font-weight:800;white-space:nowrap">'+r.you+'</td><td style="padding:8px 4px;vertical-align:top;font-size:12px">'+esc(r.target)+'</td><td style="padding:8px 0 8px 4px;vertical-align:top;text-align:center"><span style="display:inline-block;border-radius:999px;padding:2px 8px;font-weight:800;font-size:12px;background:'+bg(r.gp)+';color:'+col(r.gp)+'">'+r.gp+'%</span></td></tr>').join('');
  const fixes=rows.filter(r=>r.gp<75&&r.tip).slice(0,3);
  return '<div class="hint" style="background:#fff;border:1.5px solid var(--line);color:var(--ink)"><b style="font-size:16px">'+T('Coach report','Relatório do treinador')+'</b><div class="sub" style="margin:4px 0 8px">'+its.length+' '+T('swings · average score','swings · nota média')+' '+avg+'</div>'+
   '<table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--mut)"><td style="padding-bottom:4px">'+T('Metric','Medida')+'</td><td style="padding:0 4px 4px">'+T('You','Tu')+'</td><td style="padding:0 4px 4px">'+T('Target','Objetivo')+'</td><td style="padding-bottom:4px;text-align:center">'+T('On target','No alvo')+'</td></tr>'+tb+'</table>'+
   (fixes.length?'<div style="margin-top:12px;font-weight:800">'+T('Work on this next','Trabalha isto a seguir')+'</div>'+fixes.map((r,i)=>'<div style="margin-top:6px"><b>'+(i+1)+'. '+esc(r.label)+'</b><br><span style="font-size:13px">'+esc(r.tip)+'</span></div>').join(''):'<div style="margin-top:12px;font-weight:800;color:#166534">'+T('Everything is mostly on target. Keep repeating it.','Quase tudo no alvo. Continua a repetir.')+'</div>')+
   '<div class="sub" style="margin-top:10px;font-size:12px">'+T('"On target" = share of swings where the number was inside the target. Numbers come from the camera, so use them as a guide.','"No alvo" = percentagem de swings em que o número ficou dentro do objetivo. Os números vêm da câmara, por isso usa-os como guia.')+'</div></div>';
}
const _swSessEndC=swSessEnd;
swSessEnd=function(){
  const s=SWV.sess,rep=(s&&!SWV.home&&!SWV.drill)?cmReport(s):'';
  _swSessEndC.apply(this,arguments);
  if(rep){S.coachRep={t:Date.now(),h:rep};try{save();}catch(e){}const e=document.getElementById('swsess');if(e){e.innerHTML+=rep;e.style.display='block';}}
};
const _swMountC=swingMount;
swingMount=function(){_swMountC();const e=document.getElementById('swsess');
  if(e&&!SWV.sess&&!SWV.home&&DL.mode==='coach'&&S.coachRep&&!e.innerHTML.trim()){e.innerHTML='<div class="lbl" style="margin:8px 0 4px">'+T('Last session','Última sessão')+'</div>'+S.coachRep.h;e.style.display='block';}};

/* ---------- your body: height and mobility make the numbers fit you ---------- */
const _wrapC=swingHTMLBase_wrap;
swingHTMLBase_wrap=function(){
  const h=_wrapC();if(DL.mode!=='coach')return h;
  const m=S.mob||'norm';
  return h+'<div class="hint" style="background:#fff;border:1.5px solid var(--line)"><b style="color:var(--ink)">'+T('Your body','O teu corpo')+'</b><div class="sub" style="font-size:13px;margin:4px 0 8px">'+T('Height makes the distances (head, hips, hands) accurate. Mobility moves the turn targets up or down. Set them once.','A altura torna as distâncias (cabeça, anca, mãos) precisas. A mobilidade ajusta os objetivos de rotação. Define uma vez.')+'</div><div class="row" style="margin-bottom:8px"><span style="font-weight:700">'+T('Height (cm)','Altura (cm)')+'</span><input type="number" inputmode="numeric" id="cbh" data-cb="height" value="'+(S.heightCm||'')+'" placeholder="175" style="width:90px"></div><div class="seg">'+[['low',T('Stiff','Rígido')],['norm',T('Normal','Normal')],['high',T('Very mobile','Muito flexível')]].map(x=>'<button class="'+(m===x[0]?'on':'')+'" data-cb="mob" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div></div>';
};
document.addEventListener('change',e=>{const t=e.target;if(t&&t.dataset&&t.dataset.cb==='height'){const v=parseFloat(t.value);S.heightCm=(v>120&&v<230)?Math.round(v):0;save();}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-cb="mob"]');if(!b)return;S.mob=b.dataset.v;save();dlRender();});
