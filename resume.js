// The portrait matches the name's height: pass the name's font size to CSS.
(() => {
  const name = document.querySelector('.resume-heading h1'), grid = document.querySelector('.resume-intro-grid');
  if (!name || !grid) return;
  const sync = () => grid.style.setProperty('--name-fs', getComputedStyle(name).fontSize);
  sync();
  if ('ResizeObserver' in window) new ResizeObserver(sync).observe(name);
  document.fonts?.ready.then(sync);
})();

(() => {
  const viewer = document.querySelector('#certificate-viewer');
  const image = viewer.querySelector('#certificate-image');
  const original = viewer.querySelector('.certificate-original');
  document.querySelectorAll('[data-certificate]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const card = link.closest('.certificate-card');
      const thumbnail = link.querySelector('img');
      viewer.querySelector('#certificate-title').textContent = link.dataset.title || `${card.querySelector('h3').textContent} — ${card.querySelector('.certificate-meta').firstElementChild.textContent}`;
      image.src = link.dataset.image || thumbnail.src;
      image.alt = link.dataset.title || thumbnail.alt;
      original.href = link.href;
      viewer.showModal();
      document.body.classList.add('viewer-open');
      viewer.querySelector('.slide-close').focus();
    });
  });
  viewer.querySelector('.slide-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => document.body.classList.remove('viewer-open'));
  viewer.addEventListener('click', event => {
    const rect = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) viewer.close();
  });
})();

(() => {
  const viewer = document.querySelector('#event-photo-viewer');
  if (!viewer) return;
  // Photo folder relative to this page (works from / and from /en/).
  const base = (document.querySelector('[data-event-photo]')?.getAttribute('href') || 'assets/events/x').replace(/[^/]+$/, '');
  const en = document.documentElement.lang === 'en';
  const groups = en ? {
    teams: {
      title: 'Ya v Dele',
      photos: [
        ['team-meeting', 'Meeting with project participants'],
        ['team-discussion', 'Working through a problem statement with a team'],
        ['team-workshop', 'Discussing a project with the audience'],
        ['team-group', 'Group photo after a session'],
        ['project-discussion', 'Project discussion around a table']
      ]
    },
    vtb: {
      title: 'VTB · training and case',
      photos: [
        ['vtb-stage', 'VTB event participants on stage'],
        ['vtb-team', 'Team photo at the VTB event'],
        ['vtb-learning', 'Training at the VTB event']
      ]
    },
    events: {title: 'Events', photos: [['event-visit', 'Photo at a stand during an event']]}
  } : {
    teams: {
      title: '«Я в деле»',
      photos: [
        ['team-meeting', 'Встреча с участниками проекта'],
        ['team-discussion', 'Разбор формулировки проблемы с командой'],
        ['team-workshop', 'Обсуждение проекта с аудиторией'],
        ['team-group', 'Групповая фотография после встречи'],
        ['project-discussion', 'Обсуждение проекта за общим столом']
      ]
    },
    vtb: {
      title: 'ВТБ · обучение и кейс',
      photos: [
        ['vtb-stage', 'Участники мероприятия ВТБ на сцене'],
        ['vtb-team', 'Командная фотография на мероприятии ВТБ'],
        ['vtb-learning', 'Обучение на мероприятии ВТБ']
      ]
    },
    events: {title: 'Мероприятия', photos: [['event-visit', 'Фотография у стенда на мероприятии']]}
  };
  const image = viewer.querySelector('#event-photo-image');
  const caption = viewer.querySelector('#event-photo-caption');
  const counter = viewer.querySelector('#event-photo-counter');
  const original = viewer.querySelector('.event-photo-original');
  const previous = viewer.querySelector('.event-photo-prev');
  const next = viewer.querySelector('.event-photo-next');
  let group, index = 0;

  function render() {
    const [file, description] = group.photos[index];
    viewer.querySelector('#event-photo-title').textContent = group.title;
    image.classList.add('is-loading');
    image.src = `${base}${file}.webp`;
    image.alt = description;
    caption.textContent = description;
    original.href = `${base}${file}.jpg`;
    counter.textContent = `${index + 1} / ${group.photos.length}`;
    previous.disabled = index === 0;
    next.disabled = index === group.photos.length - 1;
    viewer.querySelector('.slide-controls').hidden = group.photos.length === 1;
  }
  function step(delta) {
    if (!group || index + delta < 0 || index + delta >= group.photos.length) return;
    index += delta;
    image.style.setProperty('--dir', delta);
    render();
  }
  document.querySelectorAll('[data-event-photo]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      group = groups[link.dataset.eventPhoto];
      index = Number(link.dataset.eventIndex || 0);
      image.style.setProperty('--dir', 0);
      render();
      viewer.showModal();
      document.body.classList.add('viewer-open');
      viewer.querySelector('.slide-close').focus();
    });
  });
  image.addEventListener('load', () => image.classList.remove('is-loading'));
  image.addEventListener('error', () => image.classList.remove('is-loading'));
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  viewer.querySelector('.slide-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('viewer-open');
  });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      step(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  viewer.addEventListener('click', event => {
    const rect = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) viewer.close();
  });

  // Move the existing figures, keeping one focusable copy of each photo group.
  const home = document.querySelector('.cv-event-photos');
  const figures = [...home.querySelectorAll('[data-mobile-target]')];
  const mobile = window.matchMedia('(max-width:1280px)');
  function placePhotos() {
    figures.forEach(figure => {
      const destination = mobile.matches ? document.getElementById(figure.dataset.mobileTarget) : home;
      if (mobile.matches) destination.append(figure);
      else {
        // Restore the photo's original slot between the paired images.
        const slot = home.querySelector(`[data-photo-slot="${figure.dataset.photoGroup}"]`);
        slot.after(figure);
      }
    });
  }
  figures.forEach(figure => {
    const slot = document.createElement('span');
    slot.dataset.photoSlot = figure.dataset.photoGroup;
    slot.hidden = true;
    figure.before(slot);
  });
  placePhotos();
  mobile.addEventListener('change', placePhotos);
})();
