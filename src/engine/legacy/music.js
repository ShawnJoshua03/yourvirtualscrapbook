/* Music-box "Happy Birthday" (public domain) and paper-turn sounds, synthesised with Web Audio.
   Set `music: "media/song.mp3"` in content.js to play your own file instead. */
(() => {
  const C = window.SCRAPBOOK;
  const btn = document.getElementById('musicBtn');
  const BPM = 152, BEAT = 60 / BPM, BAR = 3; // waltz time, brisk
  let ac, master, noise, paper, paperLevel, file, playing = false, started = false, nextTime = 0, step = 0, timer = 0, ducked = false;
  let muted = false;
  try { muted = localStorage.getItem('sb-muted') === '1'; } catch {}

  const midi = n => { const m = /([A-G])(#?)(\d)/.exec(n); return 12 * (+m[3] + 1) + 'C D EF G A B'.indexOf(m[1]) + (m[2] ? 1 : 0); };
  const hz = n => 440 * 2 ** ((midi(n) - 69) / 12);
  const up = (n, oct) => n.replace(/\d/, d => +d + oct);

  // melody, 8 bars: [startInEighths, note, lengthInEighths]; pickup "hap-py" sits at the end of the bar before
  const PICKUP = [[4, 'G4', 1.5], [5.5, 'G4', 0.5]];
  const VERSE = [
    [[0, 'A4', 2], [2, 'G4', 2], [4, 'C5', 2]],
    [[0, 'B4', 4], ...PICKUP],
    [[0, 'A4', 2], [2, 'G4', 2], [4, 'D5', 2]],
    [[0, 'C5', 4], ...PICKUP],
    [[0, 'G5', 2], [2, 'E5', 2], [4, 'C5', 2]],
    [[0, 'B4', 2], [2, 'A4', 2], [4, 'F5', 1.5], [5.5, 'F5', 0.5]],
    [[0, 'E5', 2], [2, 'C5', 2], [4, 'D5', 2]],
    [[0, 'C5', 4], ...PICKUP],
  ];
  const CHORDS = { C: ['C3', 'E4', 'G4', 'C5'], G: ['G2', 'D4', 'G4', 'B4'], G7: ['G2', 'F4', 'G4', 'B4'], C7: ['C3', 'E4', 'G4', 'A#4'], F: ['F2', 'F4', 'A4', 'C5'] };
  const VERSE_CHORDS = [['C'], ['G'], ['G7'], ['C'], ['C7'], ['F'], ['C', 'C', 'G7'], ['C']];

  // one loop = 2 intro bars, verse on music box, verse an octave up with sparkle, 2 bars of arpeggios
  const BARS = [];
  BARS.push({ chords: ['C'], arp: true }, { chords: ['G7'], notes: PICKUP });
  VERSE.forEach((notes, i) => BARS.push({ chords: VERSE_CHORDS[i], notes, oct: 0 }));
  VERSE.forEach((notes, i) => BARS.push({ chords: VERSE_CHORDS[i], notes: i === 7 ? [[0, 'C5', 6]] : notes, oct: 1, sparkle: true }));
  BARS.push({ chords: ['F'], arp: true }, { chords: ['G7'], arp: true, notes: PICKUP });

  function voice(t, f, len, { type = 'sine', gain = 0.2, attack = 0.004 } = {}) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + len + 0.05);
  }
  const box = (t, n, d, oct) => {
    const f = hz(up(n, oct));
    voice(t, f, Math.min(d * 1.6, 1.4), { gain: 0.2 });
    voice(t, f * 2, 0.35, { gain: 0.05 });
    voice(t, f * 4, 0.12, { type: 'triangle', gain: 0.02 });
  };
  const pluck = (t, notes) => notes.slice(1).forEach(n => voice(t, hz(n), 0.28, { type: 'triangle', gain: 0.045 }));
  const bass = (t, n) => voice(t, hz(n), 0.45, { type: 'triangle', gain: 0.2 });
  function kick(t) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.2);
  }
  function shaker(t, gain) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise;
    f.type = 'highpass'; f.frequency.value = 7000;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    s.connect(f).connect(g).connect(master);
    s.start(t); s.stop(t + 0.07);
  }

  function playBar(bar, t) {
    const E = BEAT / 2;
    for (let beat = 0; beat < BAR; beat++) {
      const name = bar.chords[Math.min(beat, bar.chords.length - 1)], ch = CHORDS[name], bt = t + beat * BEAT;
      if (beat === 0) { bass(bt, ch[0]); kick(bt); } else pluck(bt, ch);
      shaker(bt, 0.05); shaker(bt + E, 0.025);
      if (bar.arp) ch.slice(1).concat(up(ch[1], 1)).forEach((n, k) => k < 2 && voice(bt + k * E, hz(up(n, 1)), 0.4, { gain: 0.06 }));
    }
    (bar.notes || []).forEach(([s, n, d]) => {
      box(t + s * E, n, d * E, bar.oct || 0);
      if (bar.sparkle && d >= 2) voice(t + s * E + E, hz(up(n, 2)), 0.25, { type: 'triangle', gain: 0.025 });
    });
  }

  function schedule() {
    while (nextTime < ac.currentTime + 0.25) {
      playBar(BARS[step % BARS.length], nextTime);
      nextTime += BAR * BEAT;
      step++;
    }
  }

  function setLevel(v, time = 0.4) {
    if (file) return gsap.to(file, { volume: v * 0.6, duration: time });
    if (master) master.gain.setTargetAtTime(v * 0.55, ac.currentTime, time / 3);
  }

  function initAudio() {
    try {
      if (!ac) {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain();
        master.gain.value = 0;
        paperLevel = ac.createGain();
        paperLevel.gain.value = 0.5;
        const comp = ac.createDynamicsCompressor();
        master.connect(comp).connect(ac.destination);
        paperLevel.connect(comp);
        noise = ac.createBuffer(1, ac.sampleRate * 0.1, ac.sampleRate);
        noise.getChannelData(0).forEach((_, i, d) => (d[i] = Math.random() * 2 - 1));
        // A soft swish with uneven little creases, cached for every page turn.
        paper = ac.createBuffer(1, Math.ceil(ac.sampleRate * 0.75), ac.sampleRate);
        let low = 0;
        paper.getChannelData(0).forEach((_, i, d) => {
          const t = i / ac.sampleRate, white = Math.random() * 2 - 1;
          low = (low + 0.04 * white) / 1.04;
          const flutter = 0.55 + 0.25 * Math.sin(t * 180) + 0.2 * Math.sin(t * 493);
          d[i] = (white * 0.65 + low * 2) * flutter;
        });
      }
      if (ac.state !== 'running') ac.resume().catch(() => {});
      return true;
    } catch { return false; }
  }

  // Page turns pick from a few soft paper sounds (never the same one twice running), kept well under the music.
  // Fast turns, like jumping from the contents page, get a short quiet flick so a run of them doesn't roar.
  let lastTurn = '';
  function paperNoise(t, len, { rate = 1, filter = 'bandpass', freq = [1000, 2600, 1100], q = 0.6, env }) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = paper;
    s.playbackRate.value = (paper.duration / len) * rate;
    s.detune.value = Math.random() * 120 - 60;
    f.type = filter; f.Q.value = q;
    f.frequency.setValueAtTime(freq[0], t);
    f.frequency.exponentialRampToValueAtTime(freq[1], t + len * 0.45);
    f.frequency.exponentialRampToValueAtTime(freq[2], t + len);
    g.gain.setValueAtTime(0, t);
    env.forEach(([at, v]) => g.gain.linearRampToValueAtTime(v, t + len * at));
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.connect(f).connect(g).connect(paperLevel);
    s.onended = () => { s.disconnect(); f.disconnect(); g.disconnect(); };
    s.start(t); s.stop(t + len);
  }
  function flick(t, gain, freq = 3200 + Math.random() * 1600) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.1;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    s.connect(f).connect(g).connect(paperLevel);
    s.onended = () => { s.disconnect(); f.disconnect(); g.disconnect(); };
    s.start(t); s.stop(t + 0.08);
  }
  const TURNS = {
    // a soft swish that swells as the page lifts
    swish: (t, len) => paperNoise(t, len, { env: [[0.15, 0.07], [0.32, 0.035], [0.55, 0.11]] }),
    // a slower, lower slide of paper over paper
    slide: (t, len) => paperNoise(t, len * 1.1, { rate: 0.8, filter: 'lowpass', freq: [900, 2000, 700], q: 0.4, env: [[0.3, 0.1], [0.6, 0.08]] }),
    // the edge of the page riffling past a thumb
    riffle: (t, len) => {
      paperNoise(t, len * 0.8, { freq: [1400, 3000, 1600], q: 0.8, env: [[0.2, 0.04], [0.5, 0.06]] });
      for (let i = 0; i < 3; i++) flick(t + len * (0.25 + i * 0.12) + Math.random() * 0.02, 0.035 - i * 0.008);
    },
  };
  function pageTurn(duration) {
    if (muted || document.hidden || !initAudio()) return;
    const t = ac.currentTime + 0.01, len = Math.max(0.14, Math.min(0.65, duration * 0.75));
    if (duration < 0.35) return flick(t, 0.03); // fast turns: just a light flick
    const names = Object.keys(TURNS).filter(n => n !== lastTurn);
    lastTurn = names[Math.floor(Math.random() * names.length)];
    TURNS[lastTurn](t, len);
  }


  // a short wooden knock for toy blocks; strength 0–1
  let lastTock = 0;
  function tock(strength = 1) {
    if (muted || document.hidden || !ac || ac.state !== 'running') return;
    const t = ac.currentTime + 0.005;
    if (t - lastTock < 0.035) return; // a pile settling shouldn't buzz
    lastTock = t;
    const v = Math.max(0.05, Math.min(1, strength)) * 0.35, f0 = 520 + Math.random() * 260;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f0 * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(f0, t + 0.03);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    const n = ac.createBufferSource(), nf = ac.createBiquadFilter(), ng = ac.createGain();
    n.buffer = noise;
    nf.type = 'bandpass'; nf.frequency.value = 2400; nf.Q.value = 1.2;
    ng.gain.setValueAtTime(v * 0.8, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
    o.connect(g).connect(paperLevel);
    n.connect(nf).connect(ng).connect(paperLevel);
    o.start(t); o.stop(t + 0.1);
    n.start(t); n.stop(t + 0.03);
    o.onended = () => { o.disconnect(); g.disconnect(); n.disconnect(); nf.disconnect(); ng.disconnect(); };
  }

  function play() {
    initAudio(); // unlock paper sounds in the opening tap, including when using a music file
    if (C.music) {
      file = file || Object.assign(new Audio(C.music), { loop: true, volume: 0 });
      file.play().catch(() => {});
    } else {
      if (!ac) return;
      nextTime = ac.currentTime + 0.1;
      clearInterval(timer);
      timer = setInterval(schedule, 40);
    }
    playing = true;
    if (paperLevel) paperLevel.gain.setTargetAtTime(0.5, ac.currentTime, 0.02);
    setLevel(ducked ? 0.15 : 1, 1.2);
    btn.classList.add('on');
  }

  function stop() {
    playing = false;
    if (paperLevel) paperLevel.gain.setTargetAtTime(0, ac.currentTime, 0.02);
    setLevel(0, 0.4);
    setTimeout(() => {
      if (playing) return;
      clearInterval(timer);
      file?.pause();
    }, 450);
    btn.classList.remove('on');
  }

  SB.music = {
    // called from the first opening gesture so browsers allow audio
    start() { if (started) return; started = true; btn.hidden = false; if (!muted) play(); },
    pageTurn,
    tock,
    // quieter while a video plays with sound
    duck(on) { if (on === ducked) return; ducked = on; if (playing) setLevel(on ? 0.15 : 1); },
    check: () => SB.music.duck([...document.querySelectorAll('video')].some(v => !v.paused && !v.muted && !v.ended)),
  };
  ['play', 'pause', 'ended', 'volumechange'].forEach(ev => document.addEventListener(ev, () => SB.music.check(), true));

  // browsers only allow sound after a gesture, so the very first tap or key anywhere starts the music
  // (iOS Safari only unlocks audio on the end of a tap, hence touchend/pointerup rather than pointerdown)
  const GESTURES = ['pointerup', 'touchend', 'click', 'keydown'];
  const firstGesture = e => {
    if (e.target.closest?.('#musicBtn')) return; // that button toggles on its own
    GESTURES.forEach(t => removeEventListener(t, firstGesture, true));
    SB.music.start();
  };
  GESTURES.forEach(t => addEventListener(t, firstGesture, true));

  btn.addEventListener('click', () => {
    muted = playing;
    try { localStorage.setItem('sb-muted', muted ? '1' : '0'); } catch {}
    playing ? stop() : play();
  });
  document.addEventListener('visibilitychange', () => {
    if (!started || muted) return;
    document.hidden ? stop() : play();
  });
})();

export {}; // loaded as a module by ../mount.ts, which provides the globals it uses
