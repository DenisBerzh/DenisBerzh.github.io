// Runs before paint. Storage failures must not gate the content.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    if (sessionStorage.getItem('portfolio.motionPaused') === 'true') return;
    const pending = JSON.parse(sessionStorage.getItem('portfolio.navigation') || 'null');
    sessionStorage.removeItem('portfolio.navigation');
    if (pending?.path === location.pathname && Date.now() - pending.time < 8000) document.documentElement.dataset.motionEntry = 'page';
    else if (!sessionStorage.getItem('portfolio.introSeen')) document.documentElement.dataset.motionEntry = 'intro';
  } catch { document.documentElement.dataset.motionEntry = 'intro'; }
})();
