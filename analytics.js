// Yandex Metrica goals (counter 113702455). Each goal must also be created in the
// Metrica interface as a "JavaScript event" with the same identifier.
(() => {
  const ID = 113702455;
  const lang = document.documentElement.lang;
  const goal = (name, params) => { if (typeof window.ym === 'function') window.ym(ID, 'reachGoal', name, { lang, ...params }); };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    const place = link.closest('.hero') ? 'hero' : link.closest('.sticky-write') || link.matches('.sticky-write') ? 'sticky' : link.closest('header') ? 'header' : link.closest('.menu') ? 'menu' : link.closest('.cv-contacts') ? 'cv' : link.closest('.contact,footer,.contact-links') ? 'footer' : 'page';
    if (href.startsWith('https://t.me/')) {
      // «Написать» is the main call to action; other Telegram links are contact rows.
      if (link.matches('.header-write,.round-link,.cta-primary,.sticky-write')) goal('write_click', { place });
      goal('telegram_click', { place });
    } else if (href.includes('linkedin.com/')) goal('linkedin_click', { place });
    else if (href.startsWith('mailto:')) goal('email_click', { place });
    else if (href.startsWith('tel:')) goal('phone_click', { place });
    else if (link.matches('.download-resume,.resume-cta a,.cta-secondary,.contact-cv') && href.endsWith('.pdf')) goal('resume_download', { file: href.split('/').pop() });
    else if (href.includes('doi.org/')) goal('article_click');
    else if (href.includes('assets/certificates/') && href.endsWith('.pdf')) goal('certificate_open', { file: href.split('/').pop() });
    else if (link.closest('.lang-switch')) goal('language_switch', { to: link.getAttribute('hreflang') });
  }, { capture: true });
})();
