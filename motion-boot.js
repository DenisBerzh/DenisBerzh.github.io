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
  // The first screen enters once, starting hidden from the very first frame (no flash),
  // and waits for the curtain when there is one.
  const root = document.documentElement, entry = root.dataset.motionEntry;
  root.classList.add('motion-intro');
  root.style.setProperty('--intro-delay', entry === 'intro' ? '.85s' : entry === 'page' ? '.5s' : '0s');
})();
