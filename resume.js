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
