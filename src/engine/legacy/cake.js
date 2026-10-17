/* Final spread: a cake with letter candles (tap or blow into the mic), then a sealed letter opens */
(() => {
  const C = window.SCRAPBOOK;
  const { el, letters, palette, rand } = SB;
  let finale = () => {};
  let letterReady = false;

  SB.pages.cake = () => {
    const p = SB.page('cake-page', 'make a wish');
    p.innerHTML = `
      <h2 class="cake-title">Make a wish</h2>
      <p class="cake-sub">blow out the candles: tap them, or blow into your mic</p>
      <div class="cake"><div class="candles"></div><div class="tier tier-top"></div><div class="tier tier-bottom"></div><div class="plate"></div></div>
      <button class="pill" type="button">🎤 blow for real</button>`;
    const wrap = p.querySelector('.candles'), micBtn = p.querySelector('.pill');
    const candles = letters.map((ch, i) => {
      const c = el('button', 'candle');
      c.type = 'button';
      c.setAttribute('aria-label', `Blow out the ${ch} candle`);
      c.style.setProperty('--c', palette[i % palette.length]);
      c.style.setProperty('--d', rand(0, 0.3).toFixed(2) + 's');
      c.append(el('span', 'flame'), el('span', 'wick'), el('span', 'stick', ch));
      c.addEventListener('click', e => { e.stopPropagation(); blow(c); });
      wrap.appendChild(c);
      return c;
    });
    const lit = () => candles.filter(c => !c.classList.contains('out'));
    let stopMic = () => {};

    function blow(c) {
      if (c.classList.contains('out')) return;
      c.classList.add('out');
      for (let i = 0; i < 3; i++) {
        const puff = el('span', 'puff');
        c.appendChild(puff);
        gsap.fromTo(puff, { y: 0, x: 0, opacity: 0.55, scale: 0.4 },
          { y: -40 - rand(0, 30), x: rand(-14, 14), opacity: 0, scale: 1.8, duration: 1.5 + rand(0, 0.5), delay: i * 0.14, onComplete: () => puff.remove() });
      }
      if (!lit().length) setTimeout(finale, 700);
    }

    // blowing into the mic = sustained loud input; knocks candles out one at a time
    micBtn.addEventListener('click', async e => {
      e.stopPropagation();
      if (micBtn.disabled || !lit().length) return;
      if (!navigator.mediaDevices?.getUserMedia) { micBtn.textContent = 'no mic here, just tap them!'; return; }
      micBtn.disabled = true;
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { micBtn.disabled = false; micBtn.textContent = 'mic blocked, tap the candles instead!'; return; }
      if (!SB.book.visible().includes(p) || document.hidden || !lit().length) {
        stream.getTracks().forEach(tr => tr.stop());
        micBtn.disabled = false;
        return;
      }
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const an = ac.createAnalyser();
      an.fftSize = 1024;
      ac.createMediaStreamSource(stream).connect(an);
      const buf = new Float32Array(an.fftSize);
      micBtn.textContent = 'listening… now blow! 🌬️';
      let hot = 0, last = 0, frame = 0;
      stopMic = () => {
        cancelAnimationFrame(frame);
        stream.getTracks().forEach(tr => tr.stop());
        ac.close();
        wrap.style.setProperty('--lean', '0deg');
        micBtn.disabled = false;
        micBtn.textContent = '🎤 blow for real';
        stopMic = () => {};
      };
      const tick = t => {
        an.getFloatTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += v * v;
        const rms = Math.sqrt(sum / buf.length);
        wrap.style.setProperty('--lean', Math.min(rms * 140, 28).toFixed(1) + 'deg');
        hot = rms > 0.09 ? hot + 1 : 0;
        if (hot > 3 && t - last > 130) { const l = lit(); if (l.length) blow(SB.pick(l)); last = t; }
        if (lit().length) { frame = requestAnimationFrame(tick); return; }
        stopMic();
        micBtn.hidden = true;
      };
      frame = requestAnimationFrame(tick);
    });
    document.addEventListener('book:turn', () => { if (!SB.book.visible().includes(p)) stopMic(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopMic(); });

    let done = false;
    finale = () => {
      if (done) return;
      done = true;
      micBtn.hidden = true;
      const dark = document.getElementById('lightsOut');
      gsap.timeline()
        .to(dark, { autoAlpha: 1, duration: 0.6 })
        .fromTo(dark.querySelector('p'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8 })
        .to(dark, { autoAlpha: 0, duration: 0.8, delay: 1.5 })
        .add(() => {
          SB.celebrate(2400);
          letterReady = true;
          document.dispatchEvent(new CustomEvent('sb:wished'));
        });
    };
    return p;
  };

  SB.pages.letter = mine => {
    const p = SB.page('letter-page', `from ${C.from}`);
    const paras = mine?.note ? mine.note.split(/\n+/).map(s => s.trim()).filter(Boolean) : C.letter;
    p.innerHTML = `
      <div class="envelope"><div class="env-flap"></div><div class="env-seal">♥</div><p class="env-to"></p><p class="env-hint">opens after the candles go out</p></div>
      <article class="letter" hidden><p class="lt-to"></p><div class="lt-body"></div><p class="lt-from"></p></article>`;
    p.querySelector('.env-to').textContent = `for ${C.nickname}`;
    const env = p.querySelector('.envelope'), letter = p.querySelector('.letter');
    letter.querySelector('.lt-to').textContent = `Dear ${C.nickname},`;
    const body = letter.querySelector('.lt-body'), from = letter.querySelector('.lt-from');
    (mine?.media || []).filter(m => m.type === 'photo').slice(0, 2).forEach(m => {
      const t = SB.thumb(m);
      t.classList.add('lt-photo');
      t.addEventListener('click', () => SB.lightbox.open(mine.media, mine.media.indexOf(m)));
      letter.appendChild(t);
    });

    env.addEventListener('click', () => {
      if (!letterReady) return gsap.fromTo(env, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      openLetter();
    });

    let opened = false;
    function openLetter() {
      if (opened) return;
      opened = true;
      gsap.timeline()
        .to(env.querySelector('.env-flap'), { rotateX: 180, duration: 0.5 })
        .to(env, { y: 40, opacity: 0, duration: 0.5, delay: 0.1 })
        .add(() => { env.hidden = true; letter.hidden = false; })
        .fromTo(letter, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
        .add(type);
    }

    // typewriter; tapping skips to the end
    function type() {
      let i = 0, j = 0, node = null, skip = false;
      letter.addEventListener('click', () => (skip = true));
      const sign = () => { from.textContent = `with love, ${C.from}`; SB.stickerize(body); };
      (function step() {
        if (skip) { body.replaceChildren(...paras.map(t => el('p', null, t))); return sign(); }
        if (i >= paras.length) return sign();
        if (!node) node = body.appendChild(el('p'));
        const chars = Array.from(paras[i]); // whole emoji at a time
        node.textContent = chars.slice(0, ++j).join("");
        if (j >= chars.length) { i++; j = 0; node = null; setTimeout(step, 380); } else setTimeout(step, 24);
      })();
    }

    // after the wish: on a phone turn to the letter; on a spread it's already visible
    document.addEventListener('sb:wished', async () => {
      if (!SB.book.visible().includes(p)) await SB.book.next();
      setTimeout(openLetter, 500);
    });
    return p;
  };
})();

export {}; // loaded as a module by ../mount.ts, which provides the globals it uses
