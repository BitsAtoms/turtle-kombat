const SFX = (() => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = AudioCtx ? new AudioCtx() : null;
  document.addEventListener('click', () => ctx?.resume(), { once: true });
  function tone(freq, duration, type = 'square', gain = .08, delay = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + delay, osc = ctx.createOscillator(), amp = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t); amp.gain.setValueAtTime(gain, t); amp.gain.exponentialRampToValueAtTime(.0001, t + duration); osc.connect(amp).connect(ctx.destination); osc.start(t); osc.stop(t + duration + .02);
  }
  function sweep(from, to, duration, type = 'sawtooth', gain = .1) {
    if (!ctx) return;
    const t = ctx.currentTime, osc = ctx.createOscillator(), amp = ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(from, t); osc.frequency.exponentialRampToValueAtTime(to, t + duration); amp.gain.setValueAtTime(gain, t); amp.gain.exponentialRampToValueAtTime(.0001, t + duration); osc.connect(amp).connect(ctx.destination); osc.start(t); osc.stop(t + duration + .02);
  }
  return {
    round() { [392, 523, 659].forEach((f, i) => tone(f, .12, 'square', .11, i * .11)); },
    punch() { sweep(180, 80, .12, 'sawtooth', .16); tone(110, .07, 'square', .12, .03); },
    kick() { sweep(130, 55, .18, 'triangle', .18); },
    hit() { tone(92, .08, 'square', .18); tone(160, .1, 'sawtooth', .12, .03); },
    block() { tone(660, .06, 'square', .1); tone(990, .08, 'square', .08, .05); },
    special() { sweep(180, 880, .35, 'square', .14); },
    ko() { [220, 175, 130, 90].forEach((f, i) => tone(f, .18, 'sawtooth', .14, i * .1)); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, 'square', .12, i * .12)); },
  };
})();
