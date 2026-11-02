"use strict";
/* ================= Range tab: ball-distance calculator (range balls -> course ball) ================= */
Object.assign(PT,{
 'Calculator':'Calculadora','Range-ball carries':'Voos com bola de range','Type the carries you hit, separated by commas':'Escreve os voos que bateste, separados por vírgulas',
 'Course-ball carry':'Voo com bola de campo','Average':'Média','Shots used':'Tacadas usadas','Range ball average':'Média com bola de range','Spread':'Variação',
 'Your bag has {0} at {1} {2}.':'O teu saco tem {0} a {1} {2}.','Set my {0} to {1} {2}':'Definir o meu {0} para {1} {2}','Hit 3 or 4 solid shots and ignore the mishits. Pick the club first.':'Bate 3 ou 4 tacadas boas e ignora as más. Escolhe primeiro o taco.',
 'Enter at least one carry.':'Escreve pelo menos um voo.'
});
function calcVals(txt){return String(txt||'').split(/[\s,;]+/).map(Number).filter(x=>isFinite(x)&&x>5&&x<500);}
function calcResHTML(cl){
  const v=calcVals(R.calcText);if(!v.length)return'<div class="sub">'+tr('Enter at least one carry.')+'</div>';
  const raw=v.map(toM),real=raw.map(x=>rbReal(cl,x)),avgR=raw.reduce((a,b)=>a+b,0)/raw.length,avg=real.reduce((a,b)=>a+b,0)/real.length,u=ul();
  const mn=Math.min.apply(null,real),mx=Math.max.apply(null,real);
  return '<div class="hero" style="margin-top:6px"><div><div class="lbl">'+tr('Course-ball carry')+'</div><div class="dist" style="text-align:left">'+d1(avg)+'<small>'+u+'</small></div></div><div class="plays">'+tr('Range ball average')+' '+d1(avgR)+'<br>'+tr('Shots used')+' '+raw.length+'</div></div>'+
  '<div class="sub" style="margin:8px 0">'+tr('Spread')+': '+d1(mn)+'–'+d1(mx)+' '+u+' · '+tr('Your bag has {0} at {1} {2}.',esc(tc(cl.name)),d1(cl.carry),u)+'</div>'+
  '<button class="cta" data-act="calcapply">'+tr('Set my {0} to {1} {2}',esc(tc(cl.name)),d1(avg),u)+'</button>';
}
function calcHTML(act,sel){
  return '<div class="hint" style="margin-top:0">'+tr('Hit 3 or 4 solid shots and ignore the mishits. Pick the club first.')+'</div>'+
  '<div class="chiprow" style="flex-wrap:wrap">'+act.map(c=>'<button class="cond'+(c.id===sel.id?' pickon':'')+'" data-act="rsel" data-id="'+c.id+'">'+esc(tc(c.name))+'</button>').join('')+'</div>'+
  '<div class="lbl" style="margin:6px 0">'+tr('Range-ball carries')+' ('+ul()+')</div><input type="text" id="calcin" inputmode="decimal" placeholder="148, 151, 150, 149" value="'+esc(R.calcText||'')+'"><div class="sub" style="margin:6px 0 10px">'+tr('Type the carries you hit, separated by commas')+'</div><div id="calcres">'+calcResHTML(sel)+'</div>';
}
const _rangeBase=rangeHTML;
rangeHTML=function(){
  const act=S.clubs.filter(c=>c.on);if(!act.length)return _rangeBase();
  const sel=S.clubs.find(c=>c.id===S.rsel&&c.on)||act[0];S.rsel=sel.id;
  const tog='<div class="seg" style="margin-bottom:12px">'+[['free','Free practice'],['hole','Play a hole'],['calc','Calculator']].map(m=>'<button class="'+((R.rmode||'free')===m[0]?'on':'')+'" data-act="rmode" data-v="'+m[0]+'">'+tr(m[1])+'</button>').join('')+'</div>';
  if(R.rmode==='calc')return tog+rBallUI()+calcHTML(act,sel);
  return _rangeBase().replace(/^<div class="seg"[^>]*>[\s\S]*?<\/div>/,tog);
};
document.addEventListener('input',e=>{
  if(!e.target||e.target.id!=='calcin')return;R.calcText=e.target.value;
  const cl=S.clubs.find(c=>c.id===S.rsel),el=document.getElementById('calcres');if(cl&&el)el.innerHTML=calcResHTML(cl);
});
const _actCalc=act;
act=function(a,b){
  if(a==='calcapply'){const cl=S.clubs.find(c=>c.id===S.rsel),v=calcVals(R.calcText);
    if(cl&&v.length){cl.carry=v.map(toM).map(x=>rbReal(cl,x)).reduce((a2,b2)=>a2+b2,0)/v.length;S.setup=true;save();}
    openPanel('range');return;}
  _actCalc(a,b);
};