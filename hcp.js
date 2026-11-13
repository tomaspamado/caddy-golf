"use strict";
/* ============ Handicap index (World Handicap System) from scores you add by hand ============
   Differential = (adjusted gross score - course rating) x 113 / slope.  Index = average of the best differentials of the last 20. */
const HC={edit:null,del:null,msg:''};
const hcList=()=>{S.hcp=S.hcp||[];return S.hcp;};
function hcDiff(r,exp){const d=(r.score-r.cr)*113/r.slope;return Math.round((r.holes===9?d+exp(d):d)*10)/10;}
function hcWHS(ds){ // ds: [{r,d}] differentials (18-hole equivalent)
  const n=ds.length;if(n<3)return null;
  const tb=[[3,1,-2],[4,1,-1],[5,1,0],[6,2,-1],[8,2,0],[11,3,0],[14,4,0],[16,5,0],[18,6,0],[19,7,0],[20,8,0]];
  let k=8,adj=0;for(const t of tb){if(n<=t[0]){k=t[1];adj=t[2];break;}}
  const best=ds.slice().sort((a,b)=>a.d-b.d).slice(0,k);best.forEach(x=>x.use=true);
  return{k:k,idx:Math.max(-10,Math.min(54,Math.round((best.reduce((a,x)=>a+x.d,0)/k+adj)*10)/10))};
}
function hcCalc(){
  const ok=hcList().filter(r=>isFinite(r.score)&&isFinite(r.cr)&&isFinite(r.slope)&&r.slope>0).slice().sort((a,b)=>b.date-a.date).slice(0,20);
  /* a 9-hole round counts as 9 real holes plus the 9 you did not play, expected from your 18-hole index (WHS) */
  const full=ok.filter(r=>r.holes!==9).map(r=>({r:r,d:hcDiff(r),use:false})),f=hcWHS(full.map(x=>({r:x.r,d:x.d}))),i18=f?f.idx:null;
  const exp=d9=>i18!=null?Math.max(0,i18)*0.52+1.2:d9;
  const ds=ok.map(r=>({r:r,d:hcDiff(r,exp),use:false}));
  const n=ds.length;if(n<3)return{n:n,idx:null,ds:ds};
  const w=hcWHS(ds);return{n:n,idx:w.idx,ds:ds,k:w.k};
}
function hcFmt(v){return v==null?'–':(v<0?'+'+Math.abs(v).toFixed(1):v.toFixed(1));}
function hcHTML(){
  const c=hcCalc(),pt=S.lang==='pt';
  const dt=r=>new Date(r.date).toLocaleDateString(pt?'pt-PT':undefined,{day:'numeric',month:'short',year:'2-digit'});
  let h='<h4 class="lbl" style="margin:18px 0 8px">'+T('Handicap','Handicap')+'</h4><div class="hint" style="margin:0 0 8px;background:var(--ink);color:#fff"><div class="lbl" style="color:#9fb3a7">'+T('Handicap index (estimate)','Índice de handicap (estimativa)')+'</div><div style="font-size:38px;font-weight:800;line-height:1.1">'+(c.idx==null?'–':hcFmt(c.idx))+'</div><div style="font-size:13px;opacity:.85;margin-top:4px">'+
    (c.idx==null?T('Add at least 3 rounds (18 or 9 holes) to get an index. You have '+c.n+'.','Junta pelo menos 3 voltas (18 ou 9 buracos) para teres um índice. Tens '+c.n+'.'):T('Best '+c.k+' of your last '+c.n+' rounds. Course rating and slope decide how hard each round was.','As melhores '+c.k+' das tuas últimas '+c.n+' voltas. O rating e o slope do campo medem a dificuldade de cada volta.'))+'</div></div>'+
    '<button class="cta" style="font-size:16px;padding:13px" data-hc="add">+ '+T('Add a past round','Juntar uma volta antiga')+'</button>';
  if(c.ds.length)h+='<div style="margin-top:8px">'+c.ds.map(x=>'<button class="pick" data-hc="edit" data-id="'+x.r.id+'" style="margin-bottom:6px"><span><b>'+esc(x.r.course||'–')+'</b><br><small>'+dt(x.r)+' · '+(x.r.holes===9?'9 · ':'')+x.r.score+' · '+x.r.cr+'/'+x.r.slope+'</small></span><span style="font-size:18px;font-weight:'+(x.use?800:500)+';color:'+(x.use?'var(--accd)':'var(--mut)')+'">'+x.d.toFixed(1)+(x.use?' ✓':'')+'</span></button>').join('')+'<div class="sub" style="font-size:12px">'+T('✓ = counts towards your index. Tap a round to edit it.','✓ = conta para o teu índice. Toca numa volta para a editar.')+'</div></div>';
  return h;
}
function hcForm(id,keep){
  const L=hcList(),r=id!=null?L.find(x=>String(x.id)===String(id)):null,last=L.slice().sort((a,b)=>b.date-a.date)[0];
  HC.edit=r?r.id:null;HC.del=null;if(!keep||keep.nh==null){HC.nh=r&&r.holes===9?9:18;}else HC.nh=keep.nh;
  const nine=HC.nh===9;
  const d=r?new Date(r.date):new Date(),iso=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const v=(x,def)=>r?x:def;
  const fld=(lbl,html)=>'<div class="field" style="margin:10px 0"><div class="lbl" style="margin-bottom:4px">'+lbl+'</div>'+html+'</div>';
  $('#mcard').innerHTML='<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><h3>'+(r?T('Edit round','Editar volta'):T('Add a past round','Juntar uma volta antiga'))+'</h3><button class="x" data-hc="close">✕</button></div>'+
    (HC.msg?'<div class="aim" style="background:#fdecea;color:#8a1c1c">'+esc(HC.msg)+'</div>':'')+
    '<div class="seg" style="margin:8px 0">'+[18,9].map(n=>'<button class="'+(HC.nh===n?'on':'')+'" data-hc="nh" data-v="'+n+'">'+n+' '+T('holes','buracos')+'</button>').join('')+'</div>'+
    fld(T('Date','Data'),'<input type="date" id="hcd" value="'+iso+'" style="width:100%;border:1.5px solid var(--line);border-radius:12px;padding:11px;font-size:16px;background:#fff;color:var(--ink)">')+
    fld(T('Course','Campo'),'<input type="text" id="hcc" value="'+esc(v(r&&r.course,last?last.course:''))+'" placeholder="'+T('Course name','Nome do campo')+'">')+
    '<div class="row" style="flex-wrap:nowrap;gap:10px">'+
    '<div style="flex:1">'+fld((nine?T('Score (9 holes)','Resultado (9)'):T('Score (18 holes)','Resultado (18)')),'<input type="number" inputmode="numeric" id="hcs" value="'+(r?r.score:'')+'" placeholder="'+(nine?'43':'85')+'">')+'</div>'+
    '<div style="flex:1">'+fld(T('Rating','Rating'),'<input type="number" inputmode="decimal" step="0.1" id="hcr" value="'+(r?r.cr:(last&&(last.holes===9)===nine?last.cr:''))+'" placeholder="'+(nine?'36.0':'72.0')+'">')+'</div>'+
    '<div style="flex:1">'+fld('Slope','<input type="number" inputmode="numeric" id="hcl" value="'+(r?r.slope:(last&&(last.holes===9)===nine?last.slope:''))+'" placeholder="113">')+'</div></div>'+
    '<div class="sub" style="font-size:12px">'+(nine?T('For 9 holes use the 9-hole rating (about 36). If the card only shows an 18-hole rating, enter half of it. The other 9 holes are filled in from your index.','Para 9 buracos usa o rating de 9 (cerca de 36). Se o cartão só tem o de 18, mete metade. Os outros 9 buracos vêm do teu índice.')+' ':'')+T('Rating and slope are on the scorecard (white / yellow tees for men). Not sure? Leave 72 and 113: it counts the round at average difficulty. Use your adjusted score (max net double bogey per hole).','Rating e slope estão no cartão (tees brancos / amarelos para homens). Sem certeza? Deixa 72 e 113: conta a volta com dificuldade média. Usa o resultado ajustado (máx. duplo bogey líquido por buraco).')+'</div>'+
    '<button class="cta" style="margin-top:12px" data-hc="save">'+(r?T('Save','Guardar'):T('Save and add another','Guardar e juntar outra'))+'</button>'+
    (r?'<button class="sec" style="width:100%;margin-top:8px;color:#8a1c1c" data-hc="del">'+T('Delete this round','Apagar esta volta')+'</button>':'')+
    '<div class="center"><button class="link" data-hc="close">'+(r?T('Cancel','Cancelar'):T('Done','Concluído'))+'</button></div>';
  $('#modal').hidden=false;HC.msg='';
}
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-hc]');if(!b)return;
  const a=b.dataset.hc;
  if(a==='add'){hcForm(null);return;}
  if(a==='nh'){const g=id=>document.getElementById(id),v={d:g('hcd').value,c:g('hcc').value,e:HC.edit};hcForm(v.e,{nh:+b.dataset.v});g('hcd').value=v.d;g('hcc').value=v.c;return;}
  if(a==='edit'){hcForm(b.dataset.id);return;}
  if(a==='close'){$('#modal').hidden=true;if(!$('#panel').hidden)openPanel('round');return;}
  if(a==='del'){
    if(HC.del!==HC.edit){HC.del=HC.edit;b.textContent=T('Tap again to delete','Toca outra vez para apagar');return;}
    S.hcp=hcList().filter(x=>x.id!==HC.edit);save();$('#modal').hidden=true;openPanel('round');return;
  }
  if(a==='save'){
    const g=id=>document.getElementById(id),sc=parseInt(g('hcs').value,10),cr=parseFloat(String(g('hcr').value).replace(',','.')||(HC.nh===9?'36':'72')),sl=parseInt(g('hcl').value||'113',10),dv=g('hcd').value;
    const nine=HC.nh===9,bad=!(nine?(sc>=25&&sc<=100):(sc>=50&&sc<=200))?(nine?T('Enter the 9-hole score (25 to 100).','Põe o resultado dos 9 buracos (25 a 100).'):T('Enter the 18-hole score (50 to 200).','Põe o resultado das 18 voltas (50 a 200).')):!(nine?(cr>=25&&cr<=45):(cr>=55&&cr<=85))?(nine?T('9-hole rating should be about 30 to 40.','O rating de 9 buracos deve ser cerca de 30 a 40.'):T('Rating should be about 60 to 80.','O rating deve ser cerca de 60 a 80.')):!(sl>=55&&sl<=155)?T('Slope must be between 55 and 155.','O slope tem de estar entre 55 e 155.'):'';
    if(bad){HC.msg=bad;const keep=HC.edit;hcForm(keep,{nh:HC.nh});
      const f=(id,v)=>{const el=g(id);if(el)el.value=v;};f('hcd',dv);f('hcs',isNaN(sc)?'':sc);f('hcr',isNaN(cr)?'':cr);f('hcl',isNaN(sl)?'':sl);f('hcc',g('hcc')?g('hcc').value:'');return;}
    const rec={id:HC.edit!=null?HC.edit:Date.now(),date:dv?new Date(dv+'T12:00:00').getTime():Date.now(),course:(g('hcc').value||'').trim(),score:sc,cr:Math.round(cr*10)/10,slope:sl,holes:HC.nh===9?9:18};
    const L=hcList();const i=L.findIndex(x=>x.id===rec.id);if(i>=0)L[i]=rec;else L.push(rec);
    S.hcp=L.slice(-60);save();
    if(i>=0){$('#modal').hidden=true;openPanel('round');}
    else{HC.msg='';hcForm(null,{nh:HC.nh});const el=g('hcs');if(el)el.focus();if(!$('#panel').hidden)openPanel('round');$('#modal').hidden=false;}
    return;
  }
});
/* the card sits at the top of the Round tab's stats area */
const _statsHcp=statsHTML;
statsHTML=function(){return hcHTML()+_statsHcp();};
