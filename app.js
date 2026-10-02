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
  const preview = document.querySelector('.project-preview');
  document.querySelectorAll('.project').forEach((project) => {
    project.addEventListener('pointerenter', (event) => {
      if (!finePointer.matches || reducedMotion.matches) return;
      preview.querySelector('img').src = project.dataset.preview;
      preview.style.left = `${event.clientX}px`;
      preview.style.top = `${event.clientY}px`;
      preview.classList.add('visible');
    });
    project.addEventListener('pointermove', (event) => {
      if (!finePointer.matches || reducedMotion.matches) return;
      preview.style.left = `${event.clientX}px`;
      preview.style.top = `${event.clientY}px`;
    });
    project.addEventListener('pointerleave', () => preview.classList.remove('visible'));
  });
})();
