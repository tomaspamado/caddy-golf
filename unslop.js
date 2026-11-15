"use strict";
/* unslop pass for Caddy: line icons instead of emoji, calmer inline type, no exclamation marks. */
(function(){
  const P=(d)=>d;
  const I={
    '⚠':P('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>'),
    '⛳':P('<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>'),
    '▶':'F<polygon points="7 3 20 12 7 21 7 3"/>','◀':'F<polygon points="17 3 4 12 17 21 17 3"/>',
    '✓':P('<path d="M20 6 9 17l-5-5"/>'),
    '✕':P('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
    '💨':P('<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>'),
    '🏠':P('<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
    '🏆':P('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-1.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98 1.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>'),
    '▾':P('<path d="m6 9 6 6 6-6"/>'),'▴':P('<path d="m18 15-6-6-6 6"/>'),
    '↻':P('<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>'),
    '📍':P('<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>'),
    '🌧':P('<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>'),
    '☀':P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
    '🔥':P('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
    '💧':P('<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>'),
    '🎥':P('<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>'),
    '📷':P('<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/>'),
    '🎞':P('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>'),
    '🌡':P('<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>'),
    '⏸':'F<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    '☰':P('<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>'),
    '◎':P('<circle cx="12" cy="12" r="10"/><path d="M22 12h-4"/><path d="M6 12H2"/><path d="M12 6V2"/><path d="M12 22v-4"/>')
  };
  I['✗']=I['✕'];I['▼']=I['▾'];I['▲']=I['▴'];I['🌦']=I['🌧'];I['🙌']=I['✓'];I['🌬']=I['💨'];
  const SAND='🏖';
  const RE=new RegExp('['+Object.keys(I).join('')+SAND+'️]+','g');
  function svg(ch){
    if(ch===SAND){const s=document.createElement('span');s.className='ic sd';return s;}
    const d=I[ch];if(!d)return null;
    const e=document.createElementNS('http://www.w3.org/2000/svg','svg');
    e.setAttribute('viewBox','0 0 24 24');e.setAttribute('class','ic'+(d[0]==='F'?' f':''));e.setAttribute('aria-hidden','true');
    e.innerHTML=d[0]==='F'?d.slice(1):d;return e;
  }
  function fixText(n){
    let t=n.nodeValue;if(!t)return;
    const pr=n.parentNode;if(!pr||/^(SCRIPT|STYLE|TEXTAREA|OPTION|TITLE)$/.test(pr.nodeName))return;
    if(RE.test(t)){RE.lastIndex=0;
      const frag=document.createDocumentFragment();let last=0,m;
      while((m=RE.exec(t))){
        if(m.index>last)frag.appendChild(document.createTextNode(t.slice(last,m.index)));
        for(const ch of m[0]){if(ch==='️')continue;const e=svg(ch);if(e)frag.appendChild(e);}
        last=m.index+m[0].length;
      }
      if(last<t.length)frag.appendChild(document.createTextNode(t.slice(last)));
      pr.replaceChild(frag,n);return;
    }
    RE.lastIndex=0;
    if(t.length<90&&t.indexOf('!')>=0&&!pr.closest('input,[contenteditable]')){
      const u=t.replace(/!+(\s+\S)/g,'.$1').replace(/!+(\s*)$/,'$1');
      if(u!==t)n.nodeValue=u;
    }
  }
  const WMAP={'800':'600','700':'500'};
  function fixEl(e){
    const st=e.style;if(!st||!e.getAttribute||!e.getAttribute('style'))return;
    if(WMAP[st.fontWeight])st.fontWeight=WMAP[st.fontWeight];
    if(st.textTransform==='uppercase'){st.textTransform='none';st.letterSpacing='0';}
    if(st.borderRadius==='999px')st.borderRadius='8px';
    const bg=st.backgroundColor;
    if(bg==='rgb(238, 242, 255)'){st.backgroundColor='#f4f4f2';st.color='#171717';}
    else if(bg==='rgb(255, 247, 230)'){st.backgroundColor='#f6f1e6';st.color='#7a4e12';}
  }
  function walk(root){
    if(root.nodeType===3){fixText(root);return;}
    if(root.nodeType!==1)return;
    if(root.closest&&root.closest('.leaflet-tile-pane'))return;
    fixEl(root);
    const w=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
    const tn=[],el=[];let n;
    while((n=w.nextNode())){if(n.nodeType===3)tn.push(n);else el.push(n);}
    el.forEach(fixEl);tn.forEach(fixText);
  }
  let queue=[],sched=false;
  function flush(){sched=false;const q=queue;queue=[];q.forEach(n=>{if(n.isConnected!==false)walk(n);});}
  new MutationObserver(ms=>{
    ms.forEach(m=>{
      if(m.type==='childList')m.addedNodes.forEach(n=>queue.push(n));
      else if(m.type==='characterData')queue.push(m.target);
    });
    if(!sched&&queue.length){sched=true;requestAnimationFrame(flush);}
  }).observe(document.body,{childList:true,subtree:true,characterData:true});
  walk(document.body);
})();
