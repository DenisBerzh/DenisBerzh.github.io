// Optional interface sounds. Off by default; a visitor turns them on with a «Звук» toggle.
// Every sound is synthesized with Web Audio, so no audio files are downloaded.
(() => {
  const KEY = 'portfolio.sound';
  const toggles = [...document.querySelectorAll('.sound-toggle')];
  if (!toggles.length || !('AudioContext' in window || 'webkitAudioContext' in window)) {
    toggles.forEach(t => t.hidden = true);
    return;
  }
  let on = false, ctx = null, master = null, lastHover = 0;
  try { on = localStorage.getItem(KEY) === 'on'; } catch {}

  const audio = () => {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.18;   // quiet overall
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  // A short sine «blip» with a fast exponential decay.
  const tone = (freq, length, gain, endFreq = freq) => {
    const c = audio(), t = c.currentTime, osc = c.createOscillator(), env = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + length);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(env).connect(master);
    osc.start(t); osc.stop(t + length + 0.02);
  };
  // Filtered noise swept up or down: a soft «whoosh».
  const whoosh = (up, length = 0.32, gain = 0.5) => {
    const c = audio(), t = c.currentTime;
    const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * length), c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), filter = c.createBiquadFilter(), env = c.createGain();
    src.buffer = buffer;
    filter.type = 'bandpass'; filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(up ? 500 : 2400, t);
    filter.frequency.exponentialRampToValueAtTime(up ? 2400 : 500, t + length);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + length * 0.35);
    env.gain.exponentialRampToValueAtTime(0.0001, t + length);
    src.connect(filter).connect(env).connect(master);
    src.start(t); src.stop(t + length);
  };
  const sounds = {
    hover: () => tone(2600, 0.03, 0.05),
    tap: () => tone(620, 0.09, 0.35, 380),
    open: () => whoosh(true),
    close: () => whoosh(false, 0.26, 0.4),
    swipe: () => whoosh(true, 0.18, 0.25),
    on: () => { tone(660, 0.08, 0.3); setTimeout(() => tone(990, 0.12, 0.3), 70); },
  };
  const play = name => { if (on) try { sounds[name](); } catch {} };

  const render = () => toggles.forEach(t => {
    t.setAttribute('aria-pressed', String(on));
    t.querySelector('.sound-state').textContent = on ? 'вкл' : 'выкл';
  });
  toggles.forEach(t => t.addEventListener('click', event => {
    event.stopPropagation();
    on = !on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
    render();
    if (on) sounds.on();
  }));
  render();

  const interactive = 'a[href],button:not(.sound-toggle),summary';
  const pointerFine = matchMedia('(hover: hover) and (pointer: fine)');
  document.addEventListener('pointerover', event => {
    if (!on || !pointerFine.matches) return;
    const target = event.target.closest(interactive);
    if (!target || target.contains(event.relatedTarget)) return;
    const now = performance.now();
    if (now - lastHover < 70) return;   // no machine-gun ticks when sweeping across links
    lastHover = now;
    play('hover');
  });
  document.addEventListener('click', event => {
    const target = event.target.closest(interactive);
    if (!target) return;
    if (target.matches('.menu-toggle')) play('open');
    else if (target.matches('.menu-close')) play('close');
    else if (target.matches('.slide-next,.slide-prev,.event-photo-next,.event-photo-prev')) play('swipe');
    else play('tap');
  }, true);
})();
