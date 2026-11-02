"use strict";
/* ================= Bag: drag the ≡ handle to reorder clubs ================= */
(function(){const st=document.createElement('style');st.textContent='.brow2{grid-template-columns:30px minmax(70px,1.5fr) 1fr 1fr 28px 44px}.dragh{touch-action:none;user-select:none;-webkit-user-select:none;font-size:24px;line-height:1;text-align:center;color:var(--mut);cursor:grab;padding:10px 0}.brow.dragging{position:relative;z-index:5;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.28);border-radius:12px}.dropline{height:4px;background:var(--acc);border-radius:2px;margin:0 0 4px}';document.head.appendChild(st);})();
const _bagHTMLBase=bagHTML;
bagHTML=function(){
  let h=_bagHTMLBase();
  h=h.replace('<div class="brow h"><div>','<div class="brow brow2 h"><div></div><div>');
  h=h.replace(/<div class="brow"><input type="text" data-f="cname" data-id="([^"]+)"/g,(m,id)=>'<div class="brow brow2" data-cid="'+id+'"><div class="dragh" data-drag="'+id+'">≡</div><input type="text" data-f="cname" data-id="'+id+'"');
  return h;
};
let BD=null;
function bdTarget(y){
  const others=BD.rows.filter(r=>r!==BD.row);let to=0;
  others.forEach(r=>{const b=r.getBoundingClientRect();if(b.top+b.height/2<y)to++;});
  return{to:to,others:others};
}
function bdLine(t){
  const old=document.querySelector('.dropline');if(old)old.remove();
  const l=document.createElement('div');l.className='dropline';
  if(t.to<t.others.length)t.others[t.to].parentNode.insertBefore(l,t.others[t.to]);
  else{const last=t.others[t.others.length-1];if(last){let n=last.nextElementSibling;while(n&&n.classList&&!n.classList.contains('brow'))n=n.nextElementSibling;last.parentNode.insertBefore(l,n||null);}}
}
function bdEnd(commit){
  if(!BD)return;const d=BD;BD=null;clearInterval(d.timer);
  const line=document.querySelector('.dropline');if(line)line.remove();
  d.row.classList.remove('dragging');d.row.style.transform='';
  if(commit&&d.to!=null){
    const i=S.clubs.findIndex(c=>c.id===d.id);if(i>=0){const c=S.clubs.splice(i,1)[0];S.clubs.splice(Math.max(0,Math.min(S.clubs.length,d.to)),0,c);save();}
    const p=document.getElementById('pbody'),st=p?p.scrollTop:0;openPanel('bag');if(p)p.scrollTop=st;
  }
}
document.addEventListener('pointerdown',e=>{
  const h=e.target.closest&&e.target.closest('[data-drag]');if(!h)return;const row=h.closest('.brow');if(!row)return;
  e.preventDefault();const pb=document.getElementById('pbody');
  BD={id:h.dataset.drag,row:row,rows:[...document.querySelectorAll('.brow[data-cid]')],y0:e.clientY,s0:pb?pb.scrollTop:0,pid:e.pointerId,y:e.clientY,to:null,timer:null};
  row.classList.add('dragging');try{h.setPointerCapture(e.pointerId);}catch(_){}
  BD.timer=setInterval(()=>{if(!BD||!pb)return;const H=window.innerHeight;if(BD.y>H-90)pb.scrollTop+=12;else if(BD.y<170)pb.scrollTop-=12;bdMove();},40);
});
function bdMove(){
  if(!BD)return;const pb=document.getElementById('pbody');
  BD.row.style.transform='translateY('+((BD.y-BD.y0)+((pb?pb.scrollTop:0)-BD.s0))+'px)';
  const t=bdTarget(BD.y);BD.to=t.to;bdLine(t);
}
document.addEventListener('pointermove',e=>{if(!BD||e.pointerId!==BD.pid)return;e.preventDefault();BD.y=e.clientY;bdMove();},{passive:false});
document.addEventListener('pointerup',e=>{if(BD&&e.pointerId===BD.pid)bdEnd(true);});
document.addEventListener('pointercancel',e=>{if(BD&&e.pointerId===BD.pid)bdEnd(false);});

/* show a message instead of failing silently if a course cannot start */
const _actBag=act;
act=function(a,x){
  if(a==='crsplay'){try{_actBag(a,x);}catch(err){R.vh=null;openPanel('range');const pb=document.getElementById('pbody');if(pb)pb.insertAdjacentHTML('afterbegin','<div class="hz">Could not start the course: '+esc(String(err&&err.message||err))+'</div>');}return;}
  _actBag(a,x);
};