"use strict";
/* clean: fewer things on screen. Practice = Target + Goals, quiet mapped bunkers, short sheet, tidy settings and handicap */
(function(){
  /* Play tab: Target and Goals become one "Practice" page; text no longer mentions the removed Data tab */
  const _pl=playHTML;
  playHTML=function(){
    let h=_pl.apply(this,arguments);
    try{
      h=h.replace(/<button class="[^"]*" data-gm="sub" data-v="goals">[\s\S]*?<\/button>/,'')
         .replace(/(data-gm="sub" data-v="target">)[^<]*/,'$1'+T('Practice','Treino'))
         .replace(/ and every shot is saved in Data\./,' and every shot is saved.')
         .replace(/ e cada tacada fica guardada em Dados\./,' e cada tacada fica guardada.');
      if((PL.sub||'play')==='target'&&typeof goalsHTML==='function')h+='<div class="lbl" style="margin:18px 0 8px">'+T('Goals this week','Metas desta semana')+'</div>'+goalsHTML();
    }catch(e){}
    return h;
  };

  /* mapped bunkers and water: a quiet grey line, not a red alarm */
  const _hz=hzCardHTML;
  hzCardHTML=function(){
    const h=_hz.apply(this,arguments);
    return h.split('<div class="hz">').map((s,i)=>i===0?s:(s.indexOf('hzh')<0&&s.indexOf('hzx')<0?'<div class="hz hza">'+s:'<div class="hz">'+s)).join('');
  };

  /* sheet: keep the warnings and the club, fold the "why" lines into one tap */
  const _sh=sheetHTML;
  sheetHTML=function(){
    let h=_sh.apply(this,arguments);
    try{
      const re=/<div class="why">[\s\S]*?<\/div>/g,keep=[];let first=-1,m;
      const parts=[];
      while((m=re.exec(h))){if(m[0].indexOf('⚠')>=0||m[0].indexOf('chance')>=0)continue;parts.push({i:m.index,s:m[0]});}
      if(parts.length>=2){
        const body=parts.map(p=>p.s).join('');
        for(let k=parts.length-1;k>=1;k--)h=h.slice(0,parts[k].i)+h.slice(parts[k].i+parts[k].s.length);
        h=h.slice(0,parts[0].i)+'<details class="fold"><summary class="link" style="list-style:none">'+T('Why this club?','Porquê este taco?')+'</summary>'+body+'</details>'+h.slice(parts[0].i+parts[0].s.length);
      }
    }catch(e){}
    return h;
  };

  /* settings: the long explanations live under one "How it works" row */
  const _st=settingsHTML;
  settingsHTML=function(){
    let h=_st.apply(this,arguments);
    try{
      const a=h.indexOf('<div class="hint" style="margin-top:18px">'),b=h.indexOf('<div style="margin-top:12px"><button class="sec" data-act="resetAll">');
      if(a>0&&b>a)h=h.slice(0,a)+'<details style="margin-top:18px"><summary class="link" style="list-style:none">'+T('How it works','Como funciona')+'</summary>'+h.slice(a,b)+'</details>'+h.slice(b);
    }catch(e){}
    return h;
  };

  /* handicap: show the two latest rounds, the rest one tap away */
  const _hc=hcHTML;
  hcHTML=function(){
    let h=_hc.apply(this,arguments);
    try{
      h=h.replace(/ · card (\d+)/g,function(m,n){return ' · '+T('card','cartão')+' '+n;});
      const mk='<button class="pick" data-hc="edit"',i=h.indexOf('<div style="margin-top:8px">'+mk);
      if(i>0){
        const pre=h.slice(0,i),body=h.slice(i+'<div style="margin-top:8px">'.length),items=body.split(mk);items.shift();
        if(items.length>3){
          const last=items[items.length-1],cut=last.lastIndexOf('</button>')+9,tail=last.slice(cut).replace(/<\/div>\s*$/,'');
          items[items.length-1]=last.slice(0,cut);
          const f=items.map(x=>mk+x);
          h=pre+'<div style="margin-top:8px">'+f.slice(0,2).join('')+'<details><summary class="link" style="list-style:none">'+T('Show all {0} rounds','Ver as {0} voltas').replace('{0}',items.length)+'</summary>'+f.slice(2).join('')+'</details>'+tail+'</div>';
        }
      }
    }catch(e){}
    return h;
  };
})();
