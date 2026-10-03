(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#menu');
  const close = () => menu.close();
  toggle.addEventListener('click', () => { menu.showModal(); toggle.setAttribute('aria-expanded', 'true'); document.body.classList.add('menu-open'); });
  document.querySelector('.menu-close').addEventListener('click', close);
  menu.addEventListener('close', () => { toggle.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); });
  menu.addEventListener('click', (event) => {
    if (event.target === menu) {
      const rect = menu.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right) close();
    }
  });
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    close();
    target.scrollIntoView({behavior:reducedMotion.matches ? 'instant' : 'smooth'});
    history.replaceState(null, '', link.getAttribute('href'));
  }));
  const hero = document.querySelector('.hero');
  const updateScrolled = () => document.body.classList.toggle('is-scrolled', scrollY > hero.clientHeight * .55);
  addEventListener('scroll', updateScrolled, {passive:true});
  addEventListener('resize', updateScrolled);
  updateScrolled();
  // Kinetics Momentum Marquee: duplicate content and loop translateX(-50%).
  const pause = document.querySelector('.pause-motion');
  pause.addEventListener('click', () => {
    const paused = document.body.classList.toggle('motion-paused');
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Продолжить движение имени' : 'Остановить движение имени');
    pause.querySelector('path').setAttribute('d', paused ? 'M5 3l8 5-8 5V3Z' : 'M5 3v10M11 3v10');
  });
  // Kinetics Magnetic Button: move ~35% toward pointer; reset on leave.
  document.querySelectorAll('.magnetic').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      if (reducedMotion.matches || !finePointer.matches) return;
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * .35;
      const y = (event.clientY - rect.top - rect.height / 2) * .35;
      element.style.transform = `translate(${x}px, ${y}px)`;
    });
    element.addEventListener('pointerleave', () => { element.style.transform = ''; });
    element.addEventListener('blur', () => { element.style.transform = ''; });
  });
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
    }, {threshold:.12});
    document.documentElement.classList.add('motion-ready');
    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
  }
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) document.querySelectorAll('.magnetic').forEach((element) => { element.style.transform = ''; });
  });
  const filters = document.querySelector('.portfolio-filters');
  const cards = [...document.querySelectorAll('.portfolio-card')];
  const more = document.querySelector('#more-presentations');
  const categoryNames = {all: 'Все работы', presentations: 'Презентации', interfaces: 'Интерфейсы', identity: 'Айдентика и графика'};
  let activeCategory = 'all';
  const updateCount = () => {
    const count = cards.filter(card => !card.hidden && (!card.closest('details') || more.open)).length;
    const suffix = count === 1 ? 'работа' : count >= 2 && count <= 4 ? 'работы' : 'работ';
    document.querySelector('#visible-count').textContent = `${count} ${suffix}`;
    document.querySelector('#filter-status').textContent = `${categoryNames[activeCategory]}. Показано работ: ${count}`;
  };
  const animateCards = () => {
    if (reducedMotion.matches) return;
    cards.filter(card => !card.hidden && (!card.closest('details') || more.open)).forEach((card, index) => {
      card.getAnimations().forEach(animation => animation.cancel());
      card.animate([{opacity: 0, transform: 'translateY(18px)'}, {opacity: 1, transform: 'translateY(0)'}],
        {duration: 480, delay: Math.min(index, 5) * 45, easing: 'cubic-bezier(.16,1,.3,1)'});
    });
  };
  filters.querySelectorAll('[data-filter]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      if (activeCategory === button.dataset.filter) return;
      activeCategory = button.dataset.filter;
      filters.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      cards.forEach(card => { card.hidden = activeCategory !== 'all' && card.dataset.category !== activeCategory; card.classList.remove('lead'); });
      more.hidden = activeCategory !== 'all' && activeCategory !== 'presentations';
      cards.find(card => !card.hidden)?.classList.add('lead');
      document.querySelector('#selected-category').textContent = categoryNames[activeCategory];
      updateCount();
      animateCards();
    });
  });
  more.addEventListener('toggle', () => {
    more.querySelector('.more-label').firstChild.textContent = more.open ? 'Свернуть ' : 'Ещё ';
    more.querySelector('.more-label span').textContent = more.open ? '−' : '+';
    updateCount();
    if (more.open) animateCards();
  });
  updateCount();
  // Dennis Snellenberg's floating category preview and vertical image switch.
  // Cursor easing follows Kinetics Pointer Tooltip (lerp per animation frame).
  const preview = document.querySelector('.category-preview');
  const previewTrack = preview.querySelector('.category-preview-track');
  let followFrame = 0;
  let previewActive = false;
  let previewX = 0, previewY = 0, targetX = 0, targetY = 0;
  let lastFrameTime = 0;
  const hidePreview = () => {
    previewActive = false;
    preview.classList.remove('visible');
    cancelAnimationFrame(followFrame);
    followFrame = 0;
    lastFrameTime = 0;
  };
  const followPreview = time => {
    const frames = lastFrameTime ? Math.min((time - lastFrameTime) / 16.67, 3) : 1;
    const easing = 1 - Math.pow(1 - .18, frames);
    previewX += (targetX - previewX) * easing;
    previewY += (targetY - previewY) * easing;
    preview.style.transform = `translate3d(${previewX}px, ${previewY}px, 0)`;
    lastFrameTime = time;
    if (previewActive) followFrame = requestAnimationFrame(followPreview);
  };
  const setPreviewTarget = event => {
    const halfWidth = preview.offsetWidth / 2 + 12;
    const halfHeight = preview.offsetHeight / 2 + 12;
    targetX = Math.max(halfWidth, Math.min(innerWidth - halfWidth, event.clientX));
    targetY = Math.max(halfHeight, Math.min(innerHeight - halfHeight, event.clientY));
  };
  document.querySelectorAll('.category-row').forEach(row => {
    const showPreview = event => {
      if (!finePointer.matches || reducedMotion.matches) return;
      setPreviewTarget(event);
      if (!previewActive) { previewX = targetX; previewY = targetY; }
      previewActive = true;
      previewTrack.style.transform = `translateY(-${Number(row.dataset.preview) * 100}%)`;
      preview.classList.add('visible');
      if (!followFrame) followFrame = requestAnimationFrame(followPreview);
    };
    row.addEventListener('pointerenter', showPreview);
    row.addEventListener('pointermove', showPreview);
    row.addEventListener('pointerleave', hidePreview);
    row.addEventListener('click', hidePreview);
  });
  addEventListener('scroll', hidePreview, {passive: true});
  addEventListener('resize', hidePreview);
  addEventListener('blur', hidePreview);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hidePreview(); });
  reducedMotion.addEventListener('change', () => {
    hidePreview();
    if (reducedMotion.matches) cards.forEach(card => card.getAnimations().forEach(animation => animation.cancel()));
  });
  const works = JSON.parse(document.querySelector('#portfolio-data').textContent);
  const viewer = document.querySelector('#slide-viewer');
  const slideImage = viewer.querySelector('#slide-image');
  const loadStatus = viewer.querySelector('.slide-load-status');
  slideImage.addEventListener('load', () => { slideImage.classList.remove('is-loading'); loadStatus.hidden = true; });
  slideImage.addEventListener('error', () => { loadStatus.textContent = 'Не удалось загрузить изображение. Откройте изображение по ссылке ниже.'; loadStatus.hidden = false; });
  const previous = viewer.querySelector('.slide-prev');
  const next = viewer.querySelector('.slide-next');
  let activeWork = 0;
  let activeSlide = 0;
  const renderSlide = () => {
    const work = works[activeWork];
    const slide = work.slides[activeSlide];
    viewer.querySelector('#slide-title').textContent = work.title;
    viewer.classList.toggle('is-panorama', work.view === 'panorama');
    viewer.querySelector('.panorama-hint').hidden = work.view !== 'panorama';
    viewer.querySelector('.slide-stage').tabIndex = work.view === 'panorama' ? 0 : -1;
    viewer.querySelector('.slide-stage').scrollLeft = 0;
    slideImage.classList.add('is-loading');
    loadStatus.textContent = 'Загрузка изображения…';
    loadStatus.hidden = false;
    slideImage.src = slide.src;
    slideImage.alt = slide.alt;
    viewer.querySelector('#slide-status').textContent = `${activeSlide + 1} / ${work.slides.length}`;
    viewer.querySelector('.slide-original').href = slide.src;
    viewer.querySelector('.slide-original').textContent = slide.original ? 'Увеличенная версия ↗' : 'Открыть изображение ↗';
    viewer.querySelector('.slide-source').hidden = !slide.original;
    viewer.querySelector('.slide-source').href = slide.original || slide.src;
    previous.disabled = activeSlide === 0;
    next.disabled = activeSlide === work.slides.length - 1;
    viewer.querySelector('.slide-controls').hidden = work.slides.length === 1;
  };
  document.querySelectorAll('[data-work]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      activeWork = Number(link.dataset.work);
      activeSlide = 0;
      renderSlide();
      viewer.showModal();
      document.body.classList.add('viewer-open');
      viewer.querySelector('.slide-close').focus();
    });
  });
  previous.addEventListener('click', () => { if (activeSlide > 0) { activeSlide--; renderSlide(); } });
  next.addEventListener('click', () => { if (activeSlide < works[activeWork].slides.length - 1) { activeSlide++; renderSlide(); } });
  viewer.querySelector('.slide-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => document.body.classList.remove('viewer-open'));
  viewer.addEventListener('click', (event) => {
    const rect = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) viewer.close();
  });
  viewer.addEventListener('keydown', (event) => {
    if (works[activeWork].view === 'panorama') return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous.click(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); next.click(); }
  });
})();
