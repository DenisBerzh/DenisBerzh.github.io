(() => {
  const root=document.documentElement, body=document.body;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), pointer=matchMedia('(hover: hover) and (pointer: fine)');
  const storage={get(key){try{return sessionStorage.getItem(key);}catch{return null;}},set(key,value){try{sessionStorage.setItem(key,value);}catch{}},remove(key){try{sessionStorage.removeItem(key);}catch{}}};
  body.classList.toggle('motion-paused',storage.get('portfolio.motionPaused')==='true');
  const canMove=()=>!reduced.matches && !body.classList.contains('motion-paused');
  const animate=async(element,frames,options)=>{
    if(!canMove())return;
    const animation=element.animate(frames,options);
    try{await animation.finished;}catch{}finally{animation.cancel();}
  };

  // Native dialog keeps the background inert. Explicit wrapping keeps Tab inside the page instead of moving to browser chrome.
  const menu=document.querySelector('#menu'), toggle=document.querySelector('.menu-toggle');
  let closing=null, opening;
  const openMenu=()=>{
    if(menu.open || closing || body.classList.contains('page-leaving'))return;
    menu.showModal();body.classList.add('menu-open');toggle.setAttribute('aria-expanded','true');
    if(!canMove())return;
    menu.classList.add('is-opening');
    opening=menu.animate([{transform:'translateX(115%)'},{transform:'translateX(0)'}],{duration:650,easing:'cubic-bezier(.65,0,.2,1)'});
    opening.finished.catch(()=>{}).finally(()=>{menu.classList.remove('is-opening');opening=null;});
  };
  const closeMenu=()=>{
    if(closing)return closing;
    if(!menu.open)return Promise.resolve();
    const from=getComputedStyle(menu).transform;
    opening?.cancel();menu.classList.remove('is-opening');menu.classList.add('is-closing');
    closing=(async()=>{
      await animate(menu,[{transform:from},{transform:'translateX(115%)'}],{duration:420,easing:'cubic-bezier(.65,0,.35,1)'});
      menu.close();menu.classList.remove('is-closing');closing=null;
    })();
    return closing;
  };
  toggle.addEventListener('click',openMenu);
  menu.querySelector('.menu-close').addEventListener('click',closeMenu);
  menu.addEventListener('cancel',event=>{event.preventDefault();closeMenu();});
  menu.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const controls=[...menu.querySelectorAll('button:not(:disabled),a[href]')].filter(element=>element.getClientRects().length);
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  });
  menu.addEventListener('close',()=>{body.classList.remove('menu-open');toggle.setAttribute('aria-expanded','false');toggle.focus({preventScroll:true});});
  menu.addEventListener('click',event=>{
    if(event.target!==menu)return;
    const r=menu.getBoundingClientRect();
    if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom)closeMenu();
  });
  const normalize=path=>path.replace(/index\.html$/,'').replace(/\/$/,'');
  menu.querySelectorAll('a').forEach(link=>{
    const url=new URL(link.href);
    if(normalize(url.pathname)===normalize(location.pathname) && (!url.hash || url.hash===location.hash))link.setAttribute('aria-current','page');
  });

  // Introduction and page changes share a curved curtain. All wording is the user's own.
  const curtain=document.querySelector('.page-curtain'), label=curtain.querySelector('.curtain-label');
  const pageName=body.classList.contains('resume-page')?'Резюме':'Портфолио';
  let entryStopped=false, entryTimers=[];
  const finishEntry=()=>{
    entryStopped=true;entryTimers.forEach(clearTimeout);entryTimers=[];
    curtain.getAnimations().forEach(animation=>animation.cancel());
    curtain.classList.remove('is-active');body.classList.remove('page-entering');curtain.style.transform='';delete root.dataset.motionEntry;
    storage.set('portfolio.introSeen','true');
  };
  const mode=root.dataset.motionEntry;
  if(!mode || !canMove())finishEntry();
  else{
    curtain.classList.add('is-active');body.classList.add('page-entering');label.textContent=mode==='intro'?'Исследовать.':pageName;
    // Words cross-fade: the old one rises and fades out, the next rises in from below.
    const swap=text=>{
      if(entryStopped)return;
      const out=label.animate([{opacity:1,transform:'translateY(0)',filter:'blur(0)'},{opacity:0,transform:'translateY(-14px)',filter:'blur(4px)'}],{duration:220,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
      out.finished.catch(()=>{}).then(()=>{
        if(entryStopped)return;
        label.textContent=text;out.cancel();
        label.animate([{opacity:0,transform:'translateY(14px)',filter:'blur(4px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});
      });
    };
    if(mode==='intro'){
      label.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});
      entryTimers.push(setTimeout(()=>swap('Создавать.'),420));
      entryTimers.push(setTimeout(()=>swap('Денис Бержанин'),860));
    }
    entryTimers.push(setTimeout(async()=>{
      if(entryStopped)return;
      label.animate([{opacity:1},{opacity:0}],{duration:300,easing:'ease-out',fill:'forwards'});
      await animate(curtain,[{transform:'translateY(0)'},{transform:'translateY(-125vh)'}],{duration:900,easing:'cubic-bezier(.76,0,.24,1)'});
      finishEntry();
    },mode==='intro'?1400:120));
    entryTimers.push(setTimeout(finishEntry,4000));
  }
  // Let visitors dismiss the short intro without activating a covered link.
  curtain.addEventListener('click', event => {if(root.dataset.motionEntry==='intro'){event.preventDefault();event.stopPropagation();finishEntry();}});
  document.addEventListener('keydown', event => {if(root.dataset.motionEntry==='intro'){finishEntry();}});
  let navigating=false;
  document.addEventListener('click',async event=>{
    const link=event.target.closest('a[href]');
    if(!link || event.defaultPrevented || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target!=='_self'))return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin)return;
    const same=normalize(url.pathname)===normalize(location.pathname) && url.search===location.search;
    if(same && url.hash && link.closest('#menu')){
      const section=document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if(!section)return;
      event.preventDefault();await closeMenu();
      section.scrollIntoView({behavior:canMove()?'smooth':'instant'});
      if(!section.hasAttribute('tabindex'))section.setAttribute('tabindex','-1');
      section.focus({preventScroll:true});history.pushState(null,'',url.href);return;
    }
    if(same || (!/(?:^|\/)(?:index|resume)\.html$/.test(url.pathname) && !url.pathname.endsWith('/')))return;
    event.preventDefault();if(navigating)return;navigating=true;
    finishEntry();await closeMenu();
    if(canMove()){
      label.textContent=/resume\.html$/.test(url.pathname)?'Резюме':'Портфолио';
      curtain.classList.add('is-active');body.classList.add('page-leaving');
      storage.set('portfolio.navigation',JSON.stringify({path:url.pathname,time:Date.now()}));
      await animate(curtain,[{transform:'translateY(125vh)'},{transform:'translateY(0)'}],{duration:640,easing:'cubic-bezier(.65,0,.35,1)'});
    }
    location.assign(url.href);
  });
  addEventListener('pageshow',event=>{
    if(event.persisted){navigating=false;body.classList.remove('page-leaving');finishEntry();if(menu.open)menu.close();storage.remove('portfolio.navigation');}
  });

  // Every skill bar knows its value, so the end dot can sit at the end of the fill.
  document.querySelectorAll('.skill-track').forEach(track=>{const fill=track.querySelector('.skill-fill');if(fill)track.style.setProperty('--v',getComputedStyle(fill).getPropertyValue('--p'));});

  // Text roll on pill buttons: the label slides up and an identical copy rises from below.
  // The copy is CSS-generated with empty alt text, so screen readers hear the label once.
  document.querySelectorAll('.header-write,.download-resume,.all-filter,.hero-link-label').forEach(button=>{
    const node=[...button.childNodes].find(n=>n.nodeType===3 && n.textContent.trim());
    if(!node)return;
    const label=node.textContent.trim(),roll=document.createElement('span'),inner=document.createElement('span');
    roll.className='roll';inner.className='roll-inner';inner.dataset.text=label;inner.textContent=label;
    roll.append(inner);node.replaceWith(roll,' ');
  });

  // Kinetics Magnetic Button recipe, implemented with our spring and stable original box.
  const magnets=[...document.querySelectorAll('.magnetic')].map(element=>{
    const fill=document.createElement('i');fill.className='magnetic-fill';fill.setAttribute('aria-hidden','true');element.append(fill);
    return{element,text:element.matches('.menu-toggle')?null:element.querySelector('span'),x:0,y:0,vx:0,vy:0,tx:0,ty:0};
  });
  let magnetFrame=0,magnetTime=0;
  const stepMagnets=time=>{
    const dt=magnetTime?Math.min((time-magnetTime)/1000,.033):1/60;magnetTime=time;
    let moving=false;
    magnets.forEach(m=>{
      m.vx+=((m.tx-m.x)*230-m.vx*26)*dt;m.vy+=((m.ty-m.y)*230-m.vy*26)*dt;
      m.x+=m.vx*dt;m.y+=m.vy*dt;
      const unsettled=Math.abs(m.tx-m.x)+Math.abs(m.ty-m.y)+Math.abs(m.vx)+Math.abs(m.vy)>.08;
      if(!unsettled){m.x=m.tx;m.y=m.ty;m.vx=m.vy=0;}
      m.element.style.translate=`${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;
      if(m.text)m.text.style.translate=`${(m.x*.2).toFixed(2)}px ${(m.y*.2).toFixed(2)}px`;
      moving ||=unsettled;
    });
    if(moving && canMove())magnetFrame=requestAnimationFrame(stepMagnets);else{magnetFrame=0;magnetTime=0;}
  };
  const runMagnets=()=>{if(!magnetFrame)magnetFrame=requestAnimationFrame(stepMagnets);};
  magnets.forEach(m=>{
    m.element.addEventListener('pointermove',event=>{
      if(!canMove() || !pointer.matches || event.pointerType==='touch')return;
      const r=m.element.getBoundingClientRect();
      m.tx=Math.max(-22,Math.min(22,(event.clientX-(r.left-m.x)-r.width/2)*.3));
      m.ty=Math.max(-22,Math.min(22,(event.clientY-(r.top-m.y)-r.height/2)*.3));runMagnets();
    });
    const leave=()=>{m.tx=m.ty=0;if(canMove())runMagnets();};
    m.element.addEventListener('pointerleave',leave);m.element.addEventListener('blur',leave);
  });

  // Kinetics Pointer Tooltip concept: independently eased cursor and category preview.
  const cursor=document.createElement('div');cursor.className='work-cursor';cursor.setAttribute('aria-hidden','true');
  const cursorText=document.createElement('span');cursor.append(cursorText);body.append(cursor);
  const preview=document.querySelector('.category-preview'),track=preview?.querySelector('.category-preview-track');
  let hoverTarget=null,hoverFrame=0,hoverTime=0;
  const position={x:0,y:0,tx:0,ty:0,px:0,py:0,ptx:0,pty:0};
  const hideHover=()=>{hoverTarget=null;cursor.classList.remove('is-visible');preview?.classList.remove('visible');body.classList.remove('cursor-over-work');cancelAnimationFrame(hoverFrame);hoverFrame=0;hoverTime=0;};
  const stepHover=time=>{
    const dt=hoverTime?Math.min((time-hoverTime)/16.67,3):1;hoverTime=time;
    const fast=1-Math.pow(.75,dt),slow=1-Math.pow(.85,dt);
    position.x+=(position.tx-position.x)*fast;position.y+=(position.ty-position.y)*fast;
    position.px+=(position.ptx-position.px)*slow;position.py+=(position.pty-position.py)*slow;
    cursor.style.transform=`translate3d(${position.x}px,${position.y}px,0)`;
    if(preview)preview.style.transform=`translate3d(${position.px}px,${position.py}px,0)`;
    const moving=Math.abs(position.tx-position.x)+Math.abs(position.ty-position.y)+Math.abs(position.ptx-position.px)+Math.abs(position.pty-position.py)>.15;
    if(hoverTarget && moving)hoverFrame=requestAnimationFrame(stepHover);else{hoverFrame=0;hoverTime=0;}
  };
  document.addEventListener('pointermove',event=>{
    if(!canMove() || !pointer.matches || event.pointerType==='touch' || menu.open || body.classList.contains('viewer-open') || curtain.classList.contains('is-active')){hideHover();return;}
    const target=event.target.closest('.category-row,.slide-open');
    if(!target){hideHover();return;}
    const category=target.matches('.category-row'),fresh=!hoverTarget;
    position.tx=event.clientX;position.ty=event.clientY;
    if(preview){const hw=preview.offsetWidth/2+12,hh=preview.offsetHeight/2+12;position.ptx=Math.max(hw,Math.min(innerWidth-hw,event.clientX));position.pty=Math.max(hh,Math.min(innerHeight-hh,event.clientY));}
    if(fresh){position.x=position.tx;position.y=position.ty;position.px=position.ptx;position.py=position.pty;}
    if(target!==hoverTarget){
      hoverTarget=target;cursorText.textContent=category?'Выбрать':'Смотреть';
      if(category && preview){track.style.transform=`translateY(-${Number(target.dataset.preview)*100}%)`;preview.classList.add('visible');}else preview?.classList.remove('visible');
      cursor.classList.toggle('is-visible',!category);body.classList.toggle('cursor-over-work',!category);
    }
    if(!hoverFrame)hoverFrame=requestAnimationFrame(stepHover);
  },{passive:true});
  document.addEventListener('pointerout',event=>{if(!event.relatedTarget)hideHover();});
  document.addEventListener('click',hideHover);document.addEventListener('keydown',hideHover);

  // Momentum marquee: the CSS animation owns `transform`, this loop owns the
  // independent `translate` property. Both compose, so the name keeps moving
  // on its own and is additionally pushed sideways by scrolling.
  // The offset is tied to the scroll POSITION, not to its deltas, so it is
  // reversible and cannot drift; a lerp smooths out wheel jitter. Three spans
  // are needed because the translate adds to the animation's own -33% travel.
  // Reference: data-scroll-direction="horizontal" data-scroll-speed="4".
  const marquee=document.querySelector('.name-track');
  let resetMarquee=()=>{};
  if(marquee){
    const PUSH=.75;   // how far the scroll drags the name, px per px scrolled
    const EASE=.12;   // per-frame catch-up; lower = softer
    let shift=0, target=0, frame=0;
    const stepMarquee=()=>{
      const gap=target-shift;
      const settled=Math.abs(gap)<.05;
      shift=settled?target:shift+gap*EASE;
      const unit=marquee.scrollWidth/3;
      const drawn=unit>0?((shift%unit)+unit)%unit-unit:shift;
      marquee.style.translate=`${drawn.toFixed(2)}px`;
      frame=settled?0:requestAnimationFrame(stepMarquee);
    };
    const queueMarquee=()=>{
      if(!canMove())return;
      target=-scrollY*PUSH;
      if(!frame)frame=requestAnimationFrame(stepMarquee);
    };
    addEventListener('scroll',queueMarquee,{passive:true});
    addEventListener('resize',queueMarquee);
    addEventListener('pageshow',queueMarquee);
    resetMarquee=()=>{shift=0;target=0;marquee.style.translate='';
      cancelAnimationFrame(frame);frame=0;};
    reduced.addEventListener('change',resetMarquee);
    if(body.classList.contains('motion-paused'))resetMarquee();
    else queueMarquee();   // pick up the current scroll position after reload
  }

  // Footer reveal shifts its contents, never the document's flow or scroll position.
  const contacts=[...document.querySelectorAll('.contact')].map(element=>{
    const inner=document.createElement('div');inner.className='contact-motion-inner';
    while(element.firstChild)inner.append(element.firstChild);element.append(inner);return element;
  });
  const hero=document.querySelector('.hero');let scrollFrame=0;
  const updateScroll=()=>{
    scrollFrame=0;body.classList.toggle('is-scrolled',scrollY>(hero?hero.clientHeight*.55:120));
    body.classList.toggle('is-over-contact',contacts.some(element=>{const r=element.getBoundingClientRect();return r.top<80 && r.bottom>80;}));
    contacts.forEach(element=>{
      const r=element.getBoundingClientRect(),progress=Math.max(0,Math.min(1,(innerHeight-r.top)/Math.min(innerHeight,r.height))),remaining=canMove()?1-progress:0;
      element.style.setProperty('--footer-curve',`${(remaining*48).toFixed(2)}px`);element.style.setProperty('--footer-shift',`${(remaining*28).toFixed(2)}px`);
    });
  };
  const scheduleScroll=()=>{hideHover();if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);};
  addEventListener('scroll',scheduleScroll,{passive:true});addEventListener('resize',scheduleScroll);updateScroll();
  if('ResizeObserver' in window)new ResizeObserver(scheduleScroll).observe(document.querySelector('main'));
  // Scroll entrances: headings rise line by line from a mask, images wipe up, scores count,
  // round buttons pop. Opt-in like all motion here: nothing hides unless motion is allowed.
  const splitLines=element=>{
    const groups=[[]];
    // A <br> that CSS may hide (classed, or in resume section headings) stays inline.
    const hard=node=>node.nodeName==='BR' && !node.className && !node.closest('.resume-section-heading');
    [...element.childNodes].forEach(node=>{if(hard(node))groups.push([]);else groups.at(-1).push(node);});
    element.textContent='';
    groups.filter(group=>group.some(node=>node.nodeType!==3 || node.textContent.trim())).forEach((group,i)=>{
      const line=document.createElement('span');line.className='line';line.style.setProperty('--i',i);
      const inner=document.createElement('span');inner.className='line-inner';
      group.forEach(node=>inner.append(node));line.append(inner);element.append(line);
    });
  };
  const countUp=element=>{
    const node=element.firstChild;
    if(!node || node.nodeType!==3)return;
    const text=node.textContent.trim(),target=parseFloat(text),decimals=(text.split('.')[1]||'').length;
    // Figure spaces keep the width constant while the digits change, so nothing beside it moves.
    const format=value=>value.toFixed(decimals).padStart(text.length,' ');
    // A tool row drives its bar from the same clock as the number, so the bar reaches 90%
    // exactly when the counter reads 90. Rows start one after another.
    const row=element.closest('.tool'),fill=row?.querySelector('.skill-fill');
    const delay=row?Number(getComputedStyle(row).getPropertyValue('--d')||0)*90:0;
    const duration=row?1600:1300,start=performance.now()+delay;
    const ease=p=>1-Math.pow(1-p,3);
    const tick=now=>{
      const p=Math.max(0,Math.min(1,(now-start)/duration)),v=ease(p);
      node.textContent=format(target*v);
      if(fill){fill.style.transform=`scaleX(${(target/100)*v})`;fill.parentElement.style.setProperty('--v',(target/100)*v);}
      if(p<1 && canMove())requestAnimationFrame(tick);
      else{node.textContent=text;if(fill){fill.style.transform='';fill.parentElement.style.setProperty('--v',target/100);}}
    };
    node.textContent=format(0);requestAnimationFrame(tick);
  };
  if('IntersectionObserver' in window && canMove()){
    document.querySelectorAll('.about h2,.portfolio-heading,.contact h2,.resume-section-heading h2,.category-name,.award-result>span').forEach(element=>{
      element.removeAttribute('data-reveal');element.setAttribute('data-split','');splitLines(element);
    });
    document.querySelectorAll('.portfolio-card:not([hidden]),.certificate-card,.event-photo').forEach(element=>{
      element.setAttribute('data-wipe','');
      element.style.setProperty('--d',[...element.parentElement.children].filter(c=>!c.hidden).indexOf(element)%3);
    });
    document.querySelectorAll('.language-score,.skill-pct').forEach(element=>element.setAttribute('data-count',''));
    document.querySelectorAll('.round-link').forEach(element=>element.setAttribute('data-pop',''));
    const entrances=[...document.querySelectorAll('[data-split],[data-wipe],[data-count],[data-pop]')];
    // On screen at load: shown as is. Only what scrolling reaches gets an entrance.
    entrances.forEach(element=>{const r=element.getBoundingClientRect();if(r.top<innerHeight && r.bottom>0)element.classList.add('visible');});
    // Bars of tools still below the fold start empty; countUp fills them in step with the number.
    document.querySelectorAll('.skill-pct[data-count]:not(.visible)').forEach(element=>{const fill=element.closest('.tool')?.querySelector('.skill-fill');if(fill){fill.style.transform='scaleX(0)';fill.parentElement.style.setProperty('--v',0);}});
    const entranceObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.classList.add('visible');
      if(entry.target.hasAttribute('data-count') && canMove())countUp(entry.target);
      entranceObserver.unobserve(entry.target);
    });},{threshold:.15,rootMargin:'0px 0px -6% 0px'});
    entrances.filter(element=>!element.classList.contains('visible')).forEach(element=>entranceObserver.observe(element));
  }
  if('IntersectionObserver' in window && canMove()){
    // What is already on screen when the page opens stays put: hiding it only to fade it
    // back in reads as the page jumping. Only content reached by scrolling is revealed.
    document.querySelectorAll('[data-reveal]').forEach(element=>{const r=element.getBoundingClientRect();if(r.top<innerHeight && r.bottom>0)element.classList.add('visible');});
    root.classList.add('motion-ready');
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.1});
    document.querySelectorAll('[data-reveal]:not(.visible)').forEach(element=>observer.observe(element));
  }
  const resetMotion=()=>{
    hideHover();resetMarquee();cancelAnimationFrame(magnetFrame);magnetFrame=0;magnetTime=0;
    magnets.forEach(m=>{m.x=m.y=m.vx=m.vy=m.tx=m.ty=0;m.element.style.translate='';if(m.text)m.text.style.translate='';});
    if(!canMove()){
      finishEntry();root.classList.remove('motion-ready');
      document.getAnimations().forEach(animation=>{if(animation.effect?.target?.closest?.('.menu,.page-curtain,[data-reveal],.portfolio-card'))animation.cancel();});
    }
    updateScroll();
  };
  const pause=document.querySelector('.pause-motion');
  const updatePause=()=>{
    const paused=body.classList.contains('motion-paused');pause?.setAttribute('aria-pressed',String(paused));pause?.setAttribute('aria-label',paused?'Включить анимации':'Остановить анимации');
    pause?.querySelector('path').setAttribute('d',paused?'M5 3l8 5-8 5V3Z':'M5 3v10M11 3v10');
  };
  pause?.addEventListener('click',()=>{body.classList.toggle('motion-paused');storage.set('portfolio.motionPaused',String(body.classList.contains('motion-paused')));resetMotion();updatePause();});updatePause();
  reduced.addEventListener('change',resetMotion);pointer.addEventListener('change',resetMotion);
  addEventListener('blur',()=>{hideHover();magnets.forEach(m=>{m.tx=m.ty=0;});if(canMove())runMagnets();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)resetMotion();});
})();
