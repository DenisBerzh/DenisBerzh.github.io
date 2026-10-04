(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const filters = document.querySelector('.portfolio-filters');
  const cards = [...document.querySelectorAll('.portfolio-card')];
  const more = document.querySelector('#more-presentations');
  const categoryNames = {all: 'Все работы', presentations: 'Презентации', interfaces: 'Интерфейсы', identity: 'Айдентика и графика'};
  const extraCards = cards.filter(card => card.hasAttribute('data-extra-presentation'));
  const results = document.querySelector('#portfolio-results');
  const reset = document.querySelector('#reset-filter');
  let activeCategory = 'all', expanded = false;
  const grid = document.querySelector('#portfolio-grid');
  const canMove = () => !reducedMotion.matches && !document.body.classList.contains('motion-paused');
  // Все работы одного размера в ровной сетке. Свёрнутая плитка «Ещё» стоит в сетке
  // как работа; раскрытая превращается в кнопку «Свернуть» на отдельной строке.
  const layoutGrid = () => {
    grid.style.setProperty('--more-col', expanded ? '1 / -1' : 'auto');
  };
  const updateCount = () => {
    const count = cards.filter(card => !card.hidden).length;
    const total = cards.filter(card => activeCategory === 'all' || card.dataset.category === activeCategory).length;
    document.querySelector('#visible-count').textContent = `Показано ${count} из ${total}`;
    document.querySelector('#filter-status').textContent = `${categoryNames[activeCategory]}. Показано работ: ${count} из ${total}`;
  };
  const animateCards = () => {
    if (!canMove()) return;
    cards.filter(card => !card.hidden).forEach((card, index) => {
      card.getAnimations().forEach(animation => animation.cancel());
      card.animate([{opacity: 0, transform: 'translateY(18px)'}, {opacity: 1, transform: 'translateY(0)'}],
        {duration: 480, delay: Math.min(index, 5) * 45, easing: 'cubic-bezier(.16,1,.3,1)'});
    });
  };
  const render = () => {
    cards.forEach(card => {
      card.hidden = (activeCategory !== 'all' && card.dataset.category !== activeCategory) || (extraCards.includes(card) && !expanded);
    });
    more.hidden = activeCategory !== 'all' && activeCategory !== 'presentations';
    more.setAttribute('aria-expanded', String(expanded));
    more.querySelector('.more-label').innerHTML = expanded ? 'Свернуть презентации <span aria-hidden="true">−</span>' : 'Ещё 5 презентаций <span aria-hidden="true">+</span>';
    filters.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === activeCategory)));
    reset.hidden = activeCategory === 'all';
    document.querySelector('#selected-category').textContent = categoryNames[activeCategory];
    layoutGrid();
    updateCount();
  };
  const showResults = () => {
    results.focus({preventScroll: true});
    results.scrollIntoView({behavior: canMove() ? 'smooth' : 'instant', block: 'start'});
  };
  filters.querySelectorAll('[data-filter]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      if (activeCategory !== button.dataset.filter) {
        activeCategory = button.dataset.filter;
        expanded = false;
        render(); animateCards();
      }
      showResults();
    });
  });
  reset.addEventListener('click', () => {activeCategory = 'all'; expanded = false; render(); animateCards(); showResults();});
  more.addEventListener('click', () => {
    expanded = !expanded;
    render();
    if (expanded) {
      animateCards();
      const first = extraCards[0];
      first.setAttribute('tabindex', '-1'); first.focus({preventScroll: true});
      first.scrollIntoView({behavior: canMove() ? 'smooth' : 'instant', block: 'start'});
    } else {showResults();}
  });
  render();
  let resizeFrame = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(layoutGrid);
  });
  reducedMotion.addEventListener('change', () => {
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
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      activeWork = Number(link.dataset.work);
      activeSlide = 0;
      slideImage.style.setProperty('--dir', 0);
      renderSlide();
      viewer.showModal();
      document.body.classList.add('viewer-open');
      viewer.querySelector('.slide-close').focus();
    });
  });
  // The incoming image slides in from the side of the arrow that was pressed.
  previous.addEventListener('click', () => { if (activeSlide > 0) { activeSlide--; slideImage.style.setProperty('--dir', -1); renderSlide(); } });
  next.addEventListener('click', () => { if (activeSlide < works[activeWork].slides.length - 1) { activeSlide++; slideImage.style.setProperty('--dir', 1); renderSlide(); } });
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
