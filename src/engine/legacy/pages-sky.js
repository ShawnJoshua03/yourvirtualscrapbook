/* "Written in the stars": their name as a constellation + a star for every friend */
(() => {
  const C = window.SCRAPBOOK;
  const { el, rand } = SB;
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  // A tiny stroke font: each letter is polylines in a 1×1 box (y points down)
  const FONT = {
    A: [[[0, 1], [0.5, 0], [1, 1]], [[0.22, 0.6], [0.78, 0.6]]],
    B: [[[0, 1], [0, 0], [0.7, 0], [0.92, 0.2], [0.7, 0.48], [0, 0.48]], [[0.7, 0.48], [1, 0.74], [0.75, 1], [0, 1]]],
    C: [[[1, 0.12], [0.65, 0], [0.3, 0], [0, 0.3], [0, 0.7], [0.3, 1], [0.65, 1], [1, 0.88]]],
    D: [[[0, 0], [0, 1], [0.6, 1], [1, 0.7], [1, 0.3], [0.6, 0], [0, 0]]],
    E: [[[1, 0], [0, 0], [0, 1], [1, 1]], [[0, 0.5], [0.75, 0.5]]],
    F: [[[1, 0], [0, 0], [0, 1]], [[0, 0.5], [0.75, 0.5]]],
    G: [[[1, 0.15], [0.7, 0], [0.3, 0], [0, 0.3], [0, 0.7], [0.3, 1], [0.75, 1], [1, 0.75], [1, 0.55], [0.55, 0.55]]],
    H: [[[0, 0], [0, 1]], [[1, 0], [1, 1]], [[0, 0.5], [1, 0.5]]],
    I: [[[0.5, 0], [0.5, 1]]],
    J: [[[1, 0], [1, 0.75], [0.75, 1], [0.25, 1], [0, 0.75]]],
    K: [[[0, 0], [0, 1]], [[1, 0], [0, 0.55]], [[0.3, 0.38], [1, 1]]],
    L: [[[0, 0], [0, 1], [1, 1]]],
    M: [[[0, 1], [0, 0], [0.5, 0.55], [1, 0], [1, 1]]],
    N: [[[0, 1], [0, 0], [1, 1], [1, 0]]],
    O: [[[0.3, 0], [0.7, 0], [1, 0.3], [1, 0.7], [0.7, 1], [0.3, 1], [0, 0.7], [0, 0.3], [0.3, 0]]],
    P: [[[0, 1], [0, 0], [0.75, 0], [1, 0.25], [0.75, 0.5], [0, 0.5]]],
    Q: [[[0.3, 0], [0.7, 0], [1, 0.3], [1, 0.7], [0.7, 1], [0.3, 1], [0, 0.7], [0, 0.3], [0.3, 0]], [[0.6, 0.7], [1.05, 1.1]]],
    R: [[[0, 1], [0, 0], [0.75, 0], [1, 0.25], [0.75, 0.5], [0, 0.5]], [[0.4, 0.5], [1, 1]]],
    S: [[[1, 0.12], [0.7, 0], [0.3, 0], [0, 0.22], [0.3, 0.48], [0.7, 0.52], [1, 0.78], [0.7, 1], [0.3, 1], [0, 0.88]]],
    T: [[[0, 0], [1, 0]], [[0.5, 0], [0.5, 1]]],
    U: [[[0, 0], [0, 0.75], [0.3, 1], [0.7, 1], [1, 0.75], [1, 0]]],
    V: [[[0, 0], [0.5, 1], [1, 0]]],
    W: [[[0, 0], [0.25, 1], [0.5, 0.4], [0.75, 1], [1, 0]]],
    X: [[[0, 0], [1, 1]], [[1, 0], [0, 1]]],
    Y: [[[0, 0], [0.5, 0.5], [1, 0]], [[0.5, 0.5], [0.5, 1]]],
    Z: [[[0, 0], [1, 0], [0, 1], [1, 1]]],
  };

  // faint twinkling background stars, drawn once per page
  function starfield(svg, w, h, n) {
    const g = svgEl('g', { class: 'bg-stars' });
    for (let i = 0; i < n; i++) {
      g.appendChild(svgEl('circle', { cx: rand(0, w), cy: rand(0, h), r: rand(0.15, 0.55), style: `animation-delay:${rand(0, 4).toFixed(2)}s` }));
    }
    svg.appendChild(g);
  }

  function star(g, x, y, r) {
    const s = svgEl('g', { class: 'c-star' });
    s.append(svgEl('circle', { cx: x, cy: y, r: r * 4, class: 'hit' }),
      svgEl('circle', { cx: x, cy: y, r: r * 1.9, class: 'glow', style: `animation-delay:${rand(0, 3).toFixed(2)}s` }),
      svgEl('circle', { cx: x, cy: y, r, class: 'core' }));
    g.appendChild(s);
    return s;
  }

  function line(g, a, b) {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const l = svgEl('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'c-line', 'stroke-dasharray': len, 'stroke-dashoffset': len });
    g.appendChild(l);
    return l;
  }

  // ---- left page: their name, two rows, letter by letter ----
  SB.pages.skyName = () => {
    const p = SB.page('night sky-name', 'your stars');
    const W = 100, H = 110, svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sky-svg' });
    starfield(svg, W, H, 90);
    const chars = [...C.name.toUpperCase().replace(/[^A-Z]/g, '')];
    const half = Math.ceil(chars.length / 2), rows = [chars.slice(0, half), chars.slice(half)].filter(r => r.length);
    const LH = 26, LW = 15, GAP = 6;
    const gL = svgEl('g'), gS = svgEl('g');
    svg.append(gL, gS);
    const letters = [];
    rows.forEach((row, r) => {
      const widthOf = ch => (ch === 'I' ? 4 : LW);
      const total = row.reduce((s, ch) => s + widthOf(ch) + GAP, -GAP);
      let x = (W - total) / 2;
      const top = 14 + r * (LH + 16);
      row.forEach((ch, i) => {
        const w = widthOf(ch), seen = new Map(), stars = [], lines = [];
        const oy = Math.sin((r * half + i) * 1.7) * 2.5;
        const pt = p2 => {
          const k = p2.join();
          if (!seen.has(k)) seen.set(k, { x: x + p2[0] * w + rand(-0.6, 0.6), y: top + oy + p2[1] * LH + rand(-0.6, 0.6) });
          return seen.get(k);
        };
        (FONT[ch] || []).forEach(s => { for (let j = 0; j < s.length - 1; j++) lines.push(line(gL, pt(s[j]), pt(s[j + 1]))); });
        seen.forEach(v => stars.push(star(gS, v.x, v.y, 0.9)));
        const letter = { stars, lines };
        stars.forEach(s => s.addEventListener('click', () => tapName(s, letter)));
        letters.push(letter);
        x += w + GAP;
      });
    });
    p.appendChild(svg);

    // every star in their name holds a short note for them
    const card = el('div', 'quote-card note-card');
    card.append(el('p', 'q-text', 'tap any star ✦'));
    p.appendChild(card);
    const notes = SB.shuffle(C.starNotes || []);
    let ni = 0;
    function tapName(s, letter) {
      gsap.fromTo(s.querySelector('.core'), { attr: { r: 0.9 } }, { attr: { r: 2.4 }, duration: 0.2, yoyo: true, repeat: 1 });
      gsap.fromTo(letter.lines, { stroke: '#ffd166', strokeWidth: 0.9 }, { stroke: 'rgba(255,236,200,.5)', strokeWidth: 0.35, duration: 1.6 });
      if (!notes.length) return;
      const t = card.querySelector('.q-text');
      t.textContent = notes[ni++ % notes.length];
      gsap.fromTo(t, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 });
    }
    const draw = gsap.timeline({ paused: true });
    letters.forEach(({ stars, lines }, k) => {
      draw.from(stars, { opacity: 0, scale: 0, transformOrigin: '50% 50%', duration: 0.35, stagger: 0.04, ease: 'back.out(3)' }, k * 0.28)
        .to(lines, { attr: { 'stroke-dashoffset': 0 }, duration: 0.4, stagger: 0.06, ease: 'power1.inOut' }, k * 0.28 + 0.12);
    });
    SB.onShow(p, () => draw.restart(true));
    return p;
  };

  // ---- right page: them at the centre, a star for every friend ----
  SB.pages.skyFriends = friends => {
    const p = SB.page('night sky-friends', 'your people');
    const W = 100, H = 110, svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sky-svg' });
    starfield(svg, W, H, 110);
    const gL = svgEl('g'), gS = svgEl('g'), gT = svgEl('g');
    svg.append(gL, gS, gT);
    const centre = { x: 50, y: 44 };
    const me = star(gS, centre.x, centre.y, 2);
    me.classList.add('me');
    gT.appendChild(Object.assign(svgEl('text', { x: centre.x, y: centre.y + 7.5, class: 'c-label me-label' }), { textContent: C.nickname }));
    const N = friends.length, lines = [], stars = [];
    friends.forEach((f, i) => {
      const a = i * 2.39996 - Math.PI / 2, r = 20 + 16 * Math.sqrt((i + 0.5) / N);
      const clamp = gsap.utils.clamp;
      const pos = { x: clamp(11, 89, centre.x + Math.cos(a) * r * 1.05), y: clamp(10, 82, centre.y + Math.sin(a) * r * 0.95) };
      lines.push(line(gL, centre, pos));
      const s = star(gS, pos.x, pos.y, 1.1);
      gT.appendChild(Object.assign(svgEl('text', { x: pos.x, y: pos.y - 4, class: 'c-label' }), { textContent: f.name }));
      s.setAttribute('tabindex', 0);
      s.setAttribute('role', 'button');
      s.setAttribute('aria-label', f.name);
      s.addEventListener('click', () => tap(f, s));
      stars.push(s);
    });
    p.appendChild(svg);

    const card = el('div', 'quote-card');
    card.innerHTML = '<p class="q-text">tap a star</p><p class="q-who"></p>';
    const go = el('button', 'q-go');
    go.hidden = true;
    card.appendChild(go);
    p.appendChild(card);

    function tap(f, s) {
      gsap.fromTo(s.querySelector('.core'), { attr: { r: 1.3 } }, { attr: { r: 3 }, duration: 0.2, yoyo: true, repeat: 1 });
      card.querySelector('.q-text').textContent = f.quote ? `“${f.quote}”` : `${f.name} let the photos do the talking 📸`;
      card.querySelector('.q-who').textContent = f.quote ? `— ${f.name}` : '';
      go.textContent = `turn to ${f.name}'s page →`;
      go.hidden = false;
      go.onclick = () => SB.book.goTo(SB.book.indexOf(f.firstPage));
      gsap.fromTo(card.children, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06 });
    }

    const draw = gsap.timeline({ paused: true })
      .from(me, { scale: 0, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(3)' })
      .to(lines, { attr: { 'stroke-dashoffset': 0 }, duration: 0.6, stagger: 0.08, ease: 'power1.inOut' }, 0.2)
      .from(stars, { scale: 0, transformOrigin: '50% 50%', duration: 0.4, stagger: 0.08, ease: 'back.out(3)' }, 0.5)
      .from(gT.children, { opacity: 0, duration: 0.4, stagger: 0.06 }, 0.8);
    SB.onShow(p, () => draw.restart(true));
    return p;
  };
})();

export {}; // loaded as a module by ../mount.ts, which provides the globals it uses
