"use strict";
/* ================= Session history: numbers table, photos, CSV ================= */
const HX={open:null,sel:0,key:'caddy_hx_v1'};
function hxLoad(){try{return JSON.parse(localStorage.getItem(HX.key)||'[]');}catch(e){return[];}}
function hxStore(a){
  for(let k=0;k<60;k++){
    try{localStorage.setItem(HX.key,JSON.stringify(a));return true;}catch(e){
      let i=a.length-1;while(i>=0&&!a[i].sw.some(x=>x.th&&x.th.length))i--;
      if(i>=0)a[i].sw.forEach(x=>{x.th=[];});else if(a.length)a.pop();else return false;
    }
  }
  return false;
}
function hxNear(F,k){for(let d=0;d<8;d++){for(const j of[k-d,k+d]){if(F[j]&&F[j].g)return F[j];}}return null;}
function hxThumb(f){
  const g=f.g,c=document.createElement('canvas');c.width=g.width;c.height=g.height;
  const x=c.getContext('2d');x.putImageData(g,0,0);const L=f.i;x.lineWidth=2;x.lineCap='round';x.strokeStyle='#4ade80';
  POSE_LINES.forEach(a=>{x.beginPath();x.moveTo(L[a[0]][0]*c.width,L[a[0]][1]*c.height);x.lineTo(L[a[1]][0]*c.width,L[a[1]][1]*c.height);x.stroke();});
  x.fillStyle='#fbbf24';[15,16].forEach(k=>{x.beginPath();x.arc(L[k][0]*c.width,L[k][1]*c.height,3,0,7);x.fill();});
  return c.toDataURL('image/jpeg',.65);
}
/* called after each analysed swing of a session */
function hxKeep(res,frames,extra){
  const s=SWV.sess;if(!s)return;
  s.rec=s.rec||[];s.labels=s.labels||{};
  res.M.forEach(m=>{s.labels[m.key]=m.label;});
  const th=res.idx.map(k=>{const f=hxNear(frames,k);try{return f?hxThumb(f):'';}catch(e){return'';}});
  s.rec.push(Object.assign({score:res.score,tempo:+res.tempo.toFixed(1),M:res.M.map(m=>[m.key,m.val,m.st]),th:th,tips:res.tips.map(t=>t.label),hp:res.hpath,pause:+res.pauseTop.toFixed(1),t:Date.now()},extra||{}));
}
function hxSave(s){
  if(!s||!s.rec||!s.rec.length)return;
  const c=swClub()||{},d=SWV.drill;
  const rec={id:Date.now(),t:Date.now(),name:d?d.name:null,club:c.name||'',cls:swCls(c.name),view:SWV.view,labels:s.labels,sw:s.rec};
  const a=hxLoad();a.unshift(rec);hxStore(a.slice(0,40));
  s.rec=null;
}
function hxFmt(t){return new Date(t).toLocaleString(S.lang==='pt'?'pt-PT':undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}
function hxHTML(){
  const a=hxLoad();
  if(HX.open){
    const r=a.find(x=>x.id===HX.open);if(!r){HX.open=null;return hxHTML();}
    const keys=r.sw.length?r.sw[0].M.map(m=>m[0]):[],col={good:'#16a34a',ok:'#f59e0b',work:'#dc2626'},isD=!!r.name;
    const sel=Math.min(HX.sel,r.sw.length-1),sw=r.sw[sel];
    let h='<button class="link" data-hx="back" style="padding:0">‹ '+T('All sessions','Todas as sessões')+'</button><div class="vhtitle" style="margin:6px 0">'+esc(isD?(S.lang==='pt'?r.name[1]:r.name[0]):T('Swing session','Sessão de swings'))+'</div><div class="sub">'+hxFmt(r.t)+' · '+esc(r.club?tc(r.club):'')+' · '+r.sw.length+' '+T('swings','swings')+' · '+(r.view==='fo'?T('face on','de frente'):T('down the line','por trás'))+'</div>';
    h+='<div class="lbl" style="margin:14px 0 6px">'+T('Photos','Fotos')+' · '+T('swing','swing')+' '+(sel+1)+'</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">'+['Address','Top','Impact','Finish'].map((n,i)=>'<div>'+(sw.th&&sw.th[i]?'<img src="'+sw.th[i]+'" style="width:100%;border-radius:8px;display:block">':'<div style="height:90px;background:var(--soft);border-radius:8px"></div>')+'<div class="sub" style="text-align:center;font-size:12px">'+T(n,['Address','Topo','Impacto','Final'][i])+'</div></div>').join('')+'</div>';
    if(sw.tips&&sw.tips.length)h+='<div class="sub" style="margin-top:8px"><b>'+T('Work on: ','Trabalhar: ')+'</b>'+esc(sw.tips.join(', '))+'</div>';
    if(r.view==='fo'&&sw.hp!=null)h+='<div class="sub">'+T('Hands path into impact: ','Trajetória das mãos no impacto: ')+sw.hp+'°</div>';
    h+='<div class="lbl" style="margin:16px 0 6px">'+T('All numbers (tap a row for its photos)','Todos os números (toca numa linha para ver as fotos)')+'</div><div style="overflow-x:auto;border:1px solid var(--line);border-radius:12px"><table style="border-collapse:collapse;font-size:13px;min-width:100%"><thead><tr style="background:var(--soft);text-align:left"><th style="padding:8px">#</th>'+(isD?'<th style="padding:8px">✓</th>':'')+'<th style="padding:8px">'+T('Score','Nota')+'</th>'+keys.map(k=>'<th style="padding:8px;white-space:nowrap">'+esc((r.labels&&r.labels[k])||k)+'</th>').join('')+'</tr></thead><tbody>'+
    r.sw.map((x,i)=>'<tr data-hx="sel" data-i="'+i+'" style="border-top:1px solid var(--line);cursor:pointer;'+(i===sel?'background:#effaf2':'')+'"><td style="padding:8px"><b>'+(i+1)+'</b></td>'+(isD?'<td style="padding:8px">'+(x.ok?'✓':'✗')+'</td>':'')+'<td style="padding:8px"><b>'+x.score+'</b></td>'+x.M.map(m=>'<td style="padding:8px;white-space:nowrap"><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+col[m[2]]+';margin-right:5px"></i>'+esc(m[1])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
    h+='<div class="row" style="margin-top:14px"><button class="sec" data-hx="csv">'+T('Download CSV','Descarregar CSV')+'</button><button class="sec" data-hx="del">'+T('Delete session','Apagar sessão')+'</button></div>';
    return h;
  }
  if(!a.length)return '<div class="hint" style="margin-top:0">'+T('No sessions yet. Do a hands-free session or a drill and it will be saved here with all the numbers and photos.','Ainda sem sessões. Faz uma sessão sem mãos ou um exercício e fica guardado aqui com todos os números e fotos.')+'</div>';
  return '<div class="hint" style="margin-top:0">'+T('Tap a session to see every swing: numbers, photos and tips.','Toca numa sessão para ver cada swing: números, fotos e dicas.')+'</div>'+a.map(r=>{const avg=Math.round(r.sw.reduce((s,x)=>s+x.score,0)/r.sw.length),isD=!!r.name,ps=isD?r.sw.filter(x=>x.ok).length:0;return'<button class="pick" data-hx="open" data-id="'+r.id+'"><span><b>'+esc(isD?(S.lang==='pt'?r.name[1]:r.name[0]):T('Swing session','Sessão de swings'))+'</b><br><small>'+hxFmt(r.t)+' · '+esc(r.club?tc(r.club):'')+' · '+r.sw.length+' '+T('swings','swings')+'</small></span><span><b style="font-size:20px">'+(isD?ps+'/'+r.sw.length:avg)+'</b></span></button>';}).join('');
}
function hxCSV(r){
  const keys=r.sw[0].M.map(m=>m[0]),q=v=>'"'+String(v).replace(/"/g,'""')+'"';
  const rows=[[q('#'),q('score'),q('tempo')].concat(keys.map(k=>q((r.labels&&r.labels[k])||k)))];
  r.sw.forEach((x,i)=>rows.push([i+1,x.score,x.tempo].concat(x.M.map(m=>q(m[1])))));
  return rows.map(a=>a.join(',')).join('\n');
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-hx]');if(!b)return;const a=b.dataset.hx;
  if(a==='open'){HX.open=+b.dataset.id;HX.sel=0;}
  else if(a==='back'){HX.open=null;}
  else if(a==='sel'){HX.sel=+b.dataset.i;}
  else if(a==='del'){if(!confirm(T('Delete this session?','Apagar esta sessão?')))return;const l=hxLoad().filter(x=>x.id!==HX.open);hxStore(l);HX.open=null;}
  else if(a==='csv'){const r=hxLoad().find(x=>x.id===HX.open);if(!r)return;const u=URL.createObjectURL(new Blob([hxCSV(r)],{type:'text/csv'})),l=document.createElement('a');l.href=u;l.download='caddy-session-'+r.id+'.csv';document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);return;}
  const p=document.getElementById('pbody');if(p&&typeof dlRender==='function'){const st=p.scrollTop;dlRender();p.scrollTop=st;}
});