/* Shared helpers: confetti, ransom-note lettering, cursor trail, lightbox */
(() => {
  const C = window.SCRAPBOOK;
  const SB = (window.SB = {});

  SB.palette = ['#ff6f61', '#f6a821', '#3fae95', '#9b7ede', '#3f9fe8', '#ff6fa8'];
  SB.letters = [...C.name.toUpperCase()].filter(ch => /\S/.test(ch));
  SB.rand = (a, b) => a + Math.random() * (b - a);
  SB.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  SB.shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(p => p[1]);
  SB.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  SB.coarse = matchMedia('(pointer: coarse)').matches;

  const confettiBase = { colors: SB.palette, zIndex: 9999, disableForReducedMotion: true };

  SB.burst = (x, y, o = {}) => {
    if (!window.confetti) return;
    confetti({
      ...confettiBase, particleCount: o.count || 40, spread: o.spread || 70, startVelocity: o.velocity || 30,
      scalar: o.scalar || 0.9, ticks: 140, origin: { x: x / innerWidth, y: y / innerHeight },
    });
  };

  SB.celebrate = (ms = 1800) => {
    if (!window.confetti) return;
    const end = Date.now() + ms;
    (function frame() {
      confetti({ ...confettiBase, particleCount: 4, angle: 60, spread: 65, origin: { x: 0, y: 0.75 } });
      confetti({ ...confettiBase, particleCount: 4, angle: 120, spread: 65, origin: { x: 1, y: 0.75 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  // Ransom-note lettering: every letter cut from a different "magazine"
  const RANSOM = SB.shuffle([
    { ff: 'var(--display)', fw: 700, fs: 'italic', bg: '#fff', fg: 'var(--ink)' },
    { ff: 'var(--chunky)', fw: 800, fs: 'normal', bg: 'var(--butter)', fg: 'var(--ink)' },
    { ff: 'var(--hand)', fw: 700, fs: 'normal', bg: 'var(--pink-soft)', fg: 'var(--ink)', size: '1.15em' },
    { ff: 'var(--body)', fw: 700, fs: 'normal', bg: 'var(--ink)', fg: 'var(--paper)', size: '.9em' },
    { ff: "'Courier New', monospace", fw: 700, fs: 'normal', bg: 'var(--sky-soft)', fg: 'var(--ink)' },
    { ff: 'var(--chunky)', fw: 800, fs: 'normal', bg: 'var(--coral)', fg: '#fff' },
    { ff: 'var(--display)', fw: 600, fs: 'normal', bg: 'var(--mint)', fg: 'var(--ink)' },
  ]);
  SB.ransom = el => {
    el.textContent = '';
    [...C.name].forEach((ch, i) => {
      const s = document.createElement('span');
      if (ch === ' ') { s.className = 'gap'; s.innerHTML = '&nbsp;'; el.appendChild(s); return; }
      const st = RANSOM[i % RANSOM.length];
      s.textContent = i % 3 === 1 ? ch.toLowerCase() : ch.toUpperCase();
      Object.assign(s.style, {
        fontFamily: st.ff, fontWeight: st.fw, fontStyle: st.fs, background: st.bg, color: st.fg,
        fontSize: st.size || '1em', transform: `rotate(${SB.rand(-9, 9).toFixed(1)}deg) translateY(${SB.rand(-4, 4).toFixed(1)}px)`,
      });
      el.appendChild(s);
    });
  };

  // Cursor trail that spells their name as you move
  if (!SB.coarse && !SB.reduced) {
    let i = 0, lx = -999, ly = -999;
    addEventListener('pointermove', e => {
      if (Math.hypot(e.clientX - lx, e.clientY - ly) < 48) return;
      lx = e.clientX; ly = e.clientY;
      const s = document.createElement('span');
      s.className = 'trail';
      s.textContent = SB.letters[i % SB.letters.length];
      s.style.color = SB.palette[i++ % SB.palette.length];
      document.body.appendChild(s);
      gsap.fromTo(s,
        { left: lx, top: ly, xPercent: -50, yPercent: -50, scale: 0.4, opacity: 0.9, rotate: SB.rand(-30, 30) },
        { y: SB.rand(-40, -80), x: SB.rand(-20, 20), scale: 1, opacity: 0, duration: 1.1, ease: 'power2.out', onComplete: () => s.remove() });
    }, { passive: true });
  }

  // Lightbox shared by the polaroid wall and the film reel
  SB.lightbox = (() => {
    const lb = document.getElementById('lightbox');
    const media = lb.querySelector('.lb-media');
    const cap = lb.querySelector('.lb-cap');
    let list = [], idx = 0;
    let resume = [];

    function render() {
      const it = list[idx];
      media.querySelector('video')?.pause();
      media.innerHTML = '';
      let node;
      if (it.type === 'video') {
        node = document.createElement('video');
        Object.assign(node, { src: it.src, controls: true, autoplay: true, playsInline: true });
        node.poster = it.poster || it.thumb || '';
      } else {
        node = document.createElement('img');
        Object.assign(node, { src: it.src, alt: it.caption || '' });
      }
      media.appendChild(node);
      cap.textContent = it.caption || '';
      lb.querySelectorAll('.lb-nav').forEach(b => (b.hidden = list.length < 2));
      gsap.fromTo(lb.querySelector('.lb-frame'), { scale: 0.9, opacity: 0, rotate: -3 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.4, ease: 'back.out(1.7)' });
    }
    function open(items, i) {
      list = items; idx = i;
      if (lb.hidden) {
        resume = [...document.querySelectorAll('.page video')].filter(v => !v.paused);
        resume.forEach(v => v.pause());
      }
      lb.hidden = false;
      document.dispatchEvent(new CustomEvent('sb:lightbox'));
      document.body.style.overflow = 'hidden';
      render();
    }
    function close() {
      media.querySelector('video')?.pause();
      media.innerHTML = '';
      lb.hidden = true;
      document.dispatchEvent(new CustomEvent('sb:lightbox'));
      resume.forEach(v => { if (SB.book.visible().includes(v.closest('.page'))) v.play().catch(() => {}); });
      resume = [];
      document.body.style.overflow = '';
      SB.music?.check();
    }
    const step = d => { idx = (idx + d + list.length) % list.length; render(); };

    lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lb-close')) close(); });
    lb.querySelector('.lb-prev').addEventListener('click', () => step(-1));
    lb.querySelector('.lb-next').addEventListener('click', () => step(1));
    addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
    return { open };
  })();

  // tiny DOM helper: SB.el('div', 'cls', 'text')
  SB.el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // shrink a message's font (in cqw) until it fits its box; starts from its CSS size each time
  SB.fitText = box => {
    box.style.removeProperty('--fs');
    let fs = parseFloat(getComputedStyle(box).getPropertyValue('--fs')) || 5;
    while (box.scrollHeight > box.clientHeight + 1 && fs > 3.4) { // below this it scrolls instead
      fs -= 0.15;
      box.style.setProperty('--fs', fs.toFixed(2) + 'cqw');
    }
    box.classList.toggle('scrolls', box.scrollHeight > box.clientHeight + 1);
  };

  // every emoji inside `root` becomes a sticker you can peel off and drag around its page
  const EMOJI = /\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})*(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})*)*/gu;
  SB.stickerize = root => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach(t => {
      const s = t.nodeValue;
      if (!s.match(EMOJI) || t.parentElement.closest('.sticker-emoji, button, svg, .block, .stamp, .cam, .story')) return;
      const frag = document.createDocumentFragment();
      let last = 0;
      for (const m of s.matchAll(EMOJI)) {
        frag.append(s.slice(last, m.index), SB.el('span', 'sticker-emoji', m[0]));
        last = m.index + m[0].length;
      }
      frag.append(s.slice(last));
      t.replaceWith(frag);
    });
    root.querySelectorAll('.sticker-emoji:not(.live)').forEach(e => {
      e.classList.add('live', 'no-swipe');
      gsap.set(e, { rotate: SB.rand(-14, 14) });
      Draggable.create(e, {
        zIndexBoost: true,
        // bounds only once grabbed: applying them at creation, before the fonts load, can shove an emoji off its line
        onPress() { this.applyBounds(e.closest('.page')); gsap.to(e, { scale: 1.35, duration: 0.15 }); },
        onRelease() { gsap.to(e, { scale: 1, duration: 0.35, ease: 'back.out(3)' }); },
      });
    });
  };

  // thumbnail for a friend's photo or video (videos show their poster + a play badge)
  SB.thumb = (it, big) => {
    const wrap = SB.el('div', 'thumb' + (it.type === 'video' ? ' is-video' : ''));
    const img = SB.el('img');
    Object.assign(img, { src: big && it.type === 'photo' ? it.src : it.thumb, alt: '', loading: 'lazy', draggable: false });
    wrap.appendChild(img);
    if (it.type === 'video') wrap.appendChild(SB.el('span', 'play', '▶'));
    return wrap;
  };
})();

export {}; // loaded as a module by ../mount.ts, which provides the globals it uses
