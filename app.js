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
  const groups = [...document.querySelectorAll('.portfolio-group')];
  filters.hidden = false;
  filters.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.filter;
      filters.querySelectorAll('button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      groups.forEach((group) => { group.hidden = category !== 'all' && group.dataset.category !== category; });
      const count = groups.filter((group) => !group.hidden).reduce((sum, group) => sum + group.querySelectorAll('.portfolio-card').length, 0);
      document.querySelector('#filter-status').textContent = `Показано работ: ${count}`;
    });
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
