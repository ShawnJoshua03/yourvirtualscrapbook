/* More friend styles: fairy-light clothesline, sunshine, stories, a character arc, a jigsaw, a flight home, and a trattoria */
(() => {
  const C = window.SCRAPBOOK;
  const { el, rand, palette } = SB;
  const { nameTag, message, msgPage, open, photos } = SB.friendKit;
  const S = SB.friendStyles;
  const clamp = gsap.utils.clamp(-20, 20);

  // ---- photos pegged to two strings of fairy lights; drag the strings sideways ----
  S.clothesline = (f, cfg, i) => {
    const L = SB.page('friend-l line-page', f.name);
    const view = el('div', 'line-view no-swipe');
    const track = el('div', 'line-track');
    const per = Math.ceil(f.media.length / 2), STEP = 27; // cqw between pegs
    const cards = [];
    [f.media.slice(0, per), f.media.slice(per)].forEach(items => {
      const row = el('div', 'line-row');
      row.style.width = items.length * STEP + 4 + 'cqw';
      // the wire sags between pegs, with a bulb in each dip
      const w = items.length * STEP + 4;
      let d = 'M0 2';
      const bulbs = [];
      items.forEach((_, k) => {
        const x = 2 + k * STEP + STEP / 2;
        d += ` Q ${x - STEP / 2} 7 ${x} 2`;
        bulbs.push(x - STEP / 4);
      });
      d += ` Q ${w - 1} 7 ${w} 2`;
      row.innerHTML = `<svg class="wire" viewBox="0 0 ${w} 8" preserveAspectRatio="none"><path d="${d}"/>${bulbs.map((x, k) =>
        `<circle class="bulb" cx="${x}" cy="5" r="1.1" style="fill:${palette[k % palette.length]};animation-delay:${rand(0, 2).toFixed(2)}s"/>`).join('')}</svg>`;
      items.forEach(m => {
        const card = el('figure', 'hang');
        card._r = rand(-7, 7);
        gsap.set(card, { rotate: card._r });
        card.append(el('i', 'peg'), SB.thumb(m));
        card.addEventListener('click', () => open(f, m));
        row.appendChild(card);
        cards.push(card);
      });
      track.appendChild(row);
    });
    view.appendChild(track);
    L.append(nameTag(`from ${f.name}`, i), el('p', 'page-title', cfg.title || `${f.name}'s photos`), view,
      el('p', 'hand-cap', '← scroll →'));

    let lastX = 0;
    SB.onShow(L, first => {
      if (!first) return;
      Draggable.create(track, {
        type: 'x', bounds: view, edgeResistance: 0.85,
        onPress() { lastX = this.x; },
        onDrag() {
          const v = this.x - lastX;
          lastX = this.x;
          cards.forEach(c => gsap.to(c, { rotate: c._r + clamp(-v * 1.4), duration: 0.25, overwrite: 'auto' }));
        },
        onRelease() { cards.forEach(c => gsap.to(c, { rotate: c._r, duration: 1.6, ease: 'elastic.out(1, 0.25)', overwrite: 'auto' })); },
      });
      gsap.from(cards.slice(0, 8), { y: -40, opacity: 0, rotate: () => rand(-30, 30), duration: 0.9, stagger: 0.08, ease: 'elastic.out(1, 0.4)' });
    });
    return [L, msgPage(f)];
  };

  // ---- sunshine: instant photos that develop when tapped, a sun, a paper plane trailing a banner ----
  S.sunshine = (f, cfg, i) => {
    const L = SB.page('friend-l sun-page', f.name);
    const sun = el('div', 'sun');
    sun.innerHTML = '<i class="rays"></i><i class="core"></i>';
    L.append(sun, nameTag(`from ${f.name}`, i));
    photos(f).slice(0, 2).forEach((m, k) => {
      const fig = el('figure', `pol dev dev-${k}`);
      gsap.set(fig, { rotate: k ? 5 : -6 });
      fig.appendChild(SB.thumb(m, true));
      fig.appendChild(el('figcaption', null, 'tap to develop'));
      let developed = false;
      fig.addEventListener('click', () => {
        if (developed) return open(f, m);
        developed = true;
        fig.querySelector('figcaption').textContent = '';
        gsap.timeline()
          .to(fig, { rotate: '+=8', duration: 0.08, yoyo: true, repeat: 5 })
          .to(fig, { '--dev': 1, duration: 2.6, ease: 'power1.inOut' }, 0.2)
          .add(() => (fig.querySelector('figcaption').textContent = (cfg.develop || ['there you are ✦', 'and again ✦'])[k] || '✦'));
      });
      L.appendChild(fig);
    });
    const plane = el('div', 'plane');
    plane.innerHTML = '<span class="banner"></span><svg viewBox="0 0 40 24"><path d="M1 12 L39 1 L27 23 L20 14 Z" fill="#fff" stroke="#2a211c" stroke-width="1.4" stroke-linejoin="round"/><path d="M39 1 L20 14" stroke="#2a211c" stroke-width="1.2"/></svg>';
    plane.querySelector('.banner').textContent = cfg.banner || 'time flies with you';
    L.append(plane, el('p', 'hand-cap sun-cap', 'shake them, they’re instant 📸'));
    SB.onShow(L, first => {
      if (!first) return;
      gsap.timeline({ repeat: -1, repeatDelay: 1.2 })
        .fromTo(plane, { xPercent: -110, left: '0%' }, { left: '100%', xPercent: 10, duration: 7, ease: 'none' })
        .fromTo(plane, { y: 0 }, { y: -18, duration: 1.75, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0);
    });
    return [L, msgPage(f)];
  };

  // ---- the character arc: drag through the years and watch the photo (and the drink) grow up ----
  S.arc = (f, cfg, i) => {
    const m = photos(f)[0];
    if (!m) return S.auto(f, cfg, i);
    // [label, emoji] per stop; default: the last few years, growing up
    const now = new Date().getFullYear(), span = Math.min(Math.max(cfg.years || 4, 2), 6);
    const steps = cfg.arc || Array.from({ length: span + 1 }, (_, k) => [String(now - span + k), ['🌱', '🌿', '🪴', '🌳', '🌲', '🌟', '✨'][k] || '✨']);
    const last = steps.length - 1;
    const L = SB.page('friend-l arc-page', f.name);
    const photo = el('button', 'arc-photo');
    photo.type = 'button';
    photo.setAttribute('aria-label', `Open ${f.name}'s photo`);
    const drink = el('span', 'arc-drink', steps[0][1]);
    const stamp = el('span', 'verdict-stamp', cfg.stamp || 'CHARACTER DEVELOPMENT ✓');
    stamp.hidden = true;
    photo.append(SB.thumb(m, true), drink, stamp);
    photo.addEventListener('click', () => open(f, m));
    const year = el('p', 'arc-year', steps[0][0]);
    year.setAttribute('aria-live', 'polite');
    const slider = Object.assign(el('input', 'arc-slider no-swipe'), { type: 'range', min: 0, max: last * 100, value: 0, step: 1 });
    slider.setAttribute('aria-label', 'Drag through the years');
    let shown = 0;
    const update = () => {
      const t = slider.value / (last * 100);
      photo.style.setProperty('--t', t);
      const k = Math.round(t * last);
      if (k === shown) return;
      shown = k;
      year.textContent = steps[k][0];
      drink.textContent = steps[k][1];
      if (!SB.reduced) gsap.fromTo(drink, { scale: 1.6, rotate: -25 }, { scale: 1, rotate: 8, duration: 0.45, ease: 'back.out(3)' });
      if (k === last && stamp.hidden) {
        stamp.hidden = false;
        gsap.fromTo(stamp, { scale: SB.reduced ? 1 : 2.5, opacity: 0, rotate: -12 },
          { scale: 1, opacity: 0.92, rotate: -12, duration: SB.reduced ? 0 : 0.3, ease: 'power4.in' });
      }
    };
    slider.addEventListener('input', update);
    L.append(nameTag(`from ${f.name}`, i), el('h2', 'friend-heading', cfg.title || 'the character arc'), photo, year, slider);

    const R = SB.page('friend-r arc-note', f.name);
    const tab = el('div', 'bar-tab');
    const head = el('div', 'gc-top');
    head.innerHTML = `<span>${cfg.tabTitle || 'THE TAB'}</span><span>open since ${steps[0][0]}</span>`;
    const bill = el('div', 'gc-bill');
    (cfg.tab || [['early days', 'legendary'], ['the middle bit', 'iconic'], ['right now', 'thriving'], ['TOTAL', 'no regrets']]).forEach(([k, v]) => {
      const row = el('p', 'rc-row');
      row.append(el('span', null, k), el('span', 'rc-dots'), el('span', null, v));
      bill.appendChild(row);
    });
    tab.append(head, message(f), bill, el('p', 'rc-foot', `* ${cfg.years || 4} years in · tab stays open *`));
    R.appendChild(tab);
    return [L, R];
  };

  // ---- it all comes together: a jigsaw of one photo, the rest of the pieces below ----
  S.puzzle = (f, cfg, i) => {
    const pics = photos(f);
    if (!pics.length) return S.auto(f, cfg, i);
    const m = pics[cfg.puzzle ?? 0] || pics[0];
    const N = 3;
    const L = SB.page('friend-l puzzle-page', f.name);
    const board = el('div', 'puzzle no-swipe');
    board.style.aspectRatio = `${m.w} / ${m.h}`;
    const pieces = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = el('span', 'piece');
      Object.assign(p.style, {
        left: `${(c * 100) / N}%`, top: `${(r * 100) / N}%`, width: `${100 / N}%`, height: `${100 / N}%`,
        backgroundImage: `url(${m.src})`, backgroundSize: `${N * 100}% ${N * 100}%`,
        backgroundPosition: `${(c * 100) / (N - 1)}% ${(r * 100) / (N - 1)}%`,
      });
      board.appendChild(p);
      pieces.push(p);
    }
    const caption = el('p', 'collage-caption', 'drag the pieces into place');
    caption.setAttribute('aria-live', 'polite');
    const button = el('button', 'pill friend-action', 'solve it for me');
    button.type = 'button';
    const strip = el('div', 'puzzle-strip');
    pics.filter(p => p !== m).slice(0, 5).forEach(p => {
      const t = SB.thumb(p);
      t.addEventListener('click', () => open(f, p));
      strip.appendChild(t);
    });
    L.append(nameTag(`from ${f.name}`, i), el('h2', 'friend-heading', cfg.title || 'it’s all coming together'), board, button, caption);
    if (strip.children.length) L.append(el('p', 'puzzle-label', 'the pieces so far'), strip);

    let placed = 0, done = false, drags = [];
    const finish = () => {
      done = true;
      board.classList.add('solved');
      caption.textContent = 'and look, it all came together ✦';
      button.textContent = 'scramble it again';
      const r = board.getBoundingClientRect();
      SB.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 70, spread: 90 });
    };
    const settle = p => {
      if (p._placed) return;
      p._placed = true;
      placed++;
      drags[pieces.indexOf(p)]?.disable();
      gsap.to(p, { x: 0, y: 0, rotate: 0, duration: SB.reduced ? 0 : 0.25, ease: 'back.out(2)', onComplete: () => p.classList.add('in') });
      if (placed === pieces.length) finish();
    };
    const scramble = () => {
      const w = board.clientWidth, h = board.clientHeight;
      placed = 0;
      done = false;
      board.classList.remove('solved');
      caption.textContent = 'drag the pieces into place';
      button.textContent = 'solve it for me';
      // shuffle the slots until no piece lands back in its own
      let slots;
      do slots = SB.shuffle(pieces.map((_, k) => k)); while (slots.some((s, k) => s === k));
      pieces.forEach((p, k) => {
        p._placed = false;
        p.classList.remove('in');
        p.style.zIndex = 1 + Math.floor(Math.random() * 9);
        const dx = (slots[k] % N) - (k % N), dy = Math.floor(slots[k] / N) - Math.floor(k / N);
        gsap.to(p, { x: dx * w / N + rand(-w * 0.05, w * 0.05), y: dy * h / N + rand(-h * 0.05, h * 0.05),
          rotate: rand(-20, 20), duration: SB.reduced ? 0 : 0.6, delay: SB.reduced ? 0 : k * 0.04, ease: 'power2.out' });
      });
      drags.forEach(d => d.enable());
    };
    button.addEventListener('click', () => {
      if (done) return scramble();
      pieces.forEach((p, k) => gsap.delayedCall(SB.reduced ? 0 : k * 0.06, () => settle(p)));
    });
    board.addEventListener('click', () => done && open(f, m));
    SB.onShow(L, first => {
      if (!first) return;
      drags = pieces.map(p => Draggable.create(p, {
        bounds: L, zIndexBoost: true,
        onPress() {
          gsap.killTweensOf(p, 'x,y'); // grabbing a piece mid-scramble shouldn't fight the scramble
          gsap.to(p, { scale: 1.06, rotate: 0, duration: 0.15 });
        },
        onRelease() {
          gsap.to(p, { scale: 1, duration: 0.2 });
          if (Math.hypot(this.x, this.y) < board.clientWidth * 0.12) settle(p);
        },
      })[0]);
      scramble();
    });

    const R = SB.page('friend-r collage-note', f.name);
    const bar = el('div', 'load-bar');
    const fill = el('i');
    const pct = el('span', 'load-pct', '0%');
    bar.append(fill, pct);
    R.append(el('p', 'friend-kicker', cfg.kicker || 'LOADING: ALL THE GOOD STUFF'), bar, el('h2', 'friend-heading', 'and you’re not done yet.'), message(f),
      el('p', 'collage-signoff', 'here’s to many more ♡'));
    SB.onShow(R, () => {
      const o = { v: 0 };
      gsap.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: SB.reduced ? 0 : 2.2, ease: 'power2.inOut', delay: 0.3 });
      gsap.fromTo(o, { v: 0 }, { v: 100, duration: SB.reduced ? 0 : 2.2, ease: 'power2.inOut', delay: 0.3,
        onUpdate: () => (pct.textContent = Math.round(o.v) + '%'), onComplete: () => (pct.textContent = '100% · next level unlocked') });
    });
    return [L, R];
  };

  // ---- a flight home: videos behind airplane window shades, and a boarding pass to check in ----
  S.flight = (f, cfg, i) => {
    const clips = f.media.slice(0, 4);
    if (!clips.length) return S.auto(f, cfg, i);
    const L = SB.page('friend-l flight-page', f.name);
    const cabin = el('div', 'cabin');
    const vids = [];
    clips.forEach((m, k) => {
      const win = el('button', 'porthole');
      win.type = 'button';
      win.setAttribute('aria-label', `Lift the window shade on ${f.name}'s clip ${k + 1}`);
      const glass = el('div', 'glass');
      if (m.type === 'video') {
        const v = Object.assign(el('video'), { src: m.src, poster: m.thumb, muted: true, loop: true, playsInline: true, preload: 'none' });
        glass.appendChild(v);
        vids.push(v);
      } else glass.appendChild(SB.thumb(m));
      const shade = el('span', 'shade');
      win.append(glass, shade);
      let up = false;
      win.addEventListener('click', () => {
        if (up) return open(f, m);
        up = true;
        win.classList.add('up');
        win.setAttribute('aria-label', `Watch ${f.name}'s clip ${k + 1}`);
        gsap.to(shade, { yPercent: -88, duration: SB.reduced ? 0 : 0.7, ease: 'power2.inOut' });
        glass.querySelector('video')?.play().catch(() => {});
      });
      cabin.appendChild(win);
    });
    L.append(nameTag(`from ${f.name}`, i), el('h2', 'friend-heading', cfg.title || `window seat to ${(cfg.to || ['HOM', 'home'])[1]}`), cabin,
      el('p', 'hand-cap', 'lift the shades · tap again to watch'));
    document.addEventListener('book:turn', () => { if (!SB.book.visible().includes(L)) vids.forEach(v => v.pause()); });
    SB.onShow(L, () => vids.forEach(v => v.closest('.porthole').classList.contains('up') && v.play().catch(() => {})));

    const R = SB.page('friend-r flight-note', f.name);
    const pass = el('div', 'boarding');
    const head = el('div', 'bp-top');
    head.innerHTML = '<span>BOARDING PASS</span><span></span>';
    head.lastChild.textContent = `✈ ${cfg.airline || 'BESTIE AIRWAYS'}`;
    const route = el('div', 'bp-route');
    const [fromCode, fromName] = cfg.from || ['ANY', 'wherever you are'], [toCode, toName] = cfg.to || ['HOM', 'home'];
    route.innerHTML = '<div><b></b><span></span></div><i>✈</i><div><b></b><span></span></div>';
    const ends = route.querySelectorAll('div');
    ends[0].querySelector('b').textContent = fromCode; ends[0].querySelector('span').textContent = fromName;
    ends[1].querySelector('b').textContent = toCode; ends[1].querySelector('span').textContent = toName;
    const grid = el('div', 'bp-grid');
    [['passenger', C.name.toUpperCase()], ['seat', `next to ${f.name}`], ['date', C.birthday], ['class', 'besties']].forEach(([k, v]) => {
      const cell = el('div');
      cell.append(el('span', null, k), el('b', null, v));
      grid.appendChild(cell);
    });
    const stamp = el('span', 'bp-stamp', 'CHECKED IN · COME HOME');
    stamp.hidden = true;
    pass.append(head, route, grid, message(f), stamp);
    const button = el('button', 'pill friend-action', 'check in ✈');
    button.type = 'button';
    const status = el('span', 'friend-status');
    status.setAttribute('aria-live', 'polite');
    button.addEventListener('click', () => {
      stamp.hidden = false;
      status.textContent = `Checked in. ${toName} is waiting.`;
      button.textContent = `see you in ${toName} ♡`;
      gsap.fromTo(stamp, { scale: SB.reduced ? 1 : 2.4, opacity: 0, rotate: -9 },
        { scale: 1, opacity: 0.9, rotate: -9, duration: SB.reduced ? 0 : 0.3, ease: 'power4.in', overwrite: true });
    });
    R.append(pass, button, status);
    return [L, R];
  };

  // ---- a little trattoria: order plates until they reach their usual three ----
  S.pasta = (f, cfg, i) => {
    const L = SB.page('friend-l pasta-page', f.name);
    const m = photos(f)[0] || f.media[0];
    L.append(nameTag(`from ${f.name}`, i), el('h2', 'friend-heading', cfg.title || `Trattoria ${f.name}`));
    if (m) {
      const frame = el('button', 'pasta-photo');
      frame.type = 'button';
      frame.setAttribute('aria-label', `Open ${f.name}'s photo`);
      frame.appendChild(SB.thumb(m, true));
      frame.addEventListener('click', () => open(f, m));
      L.appendChild(frame);
    }
    const table = el('div', 'pasta-table');
    const count = el('p', 'pasta-count', 'plates ordered: 0');
    count.setAttribute('aria-live', 'polite');
    const button = el('button', 'pill friend-action', `order a plate ${cfg.dish || '🍝'}`);
    button.type = 'button';
    const lines = cfg.lines || [`one for ${C.nickname}`, 'seconds, obviously', 'the usual 😭', 'chef is impressed', 'okay legend 👑'];
    let n = 0;
    button.addEventListener('click', () => {
      if (n >= 5) {
        n = 0;
        table.replaceChildren();
        count.textContent = 'plates ordered: 0';
        button.textContent = `order a plate ${cfg.dish || '🍝'}`;
        return;
      }
      const plate = el('span', 'pasta-plate', cfg.dish || '🍝');
      plate.style.setProperty('--x', `${(n % 3) * 30 + (n > 2 ? 15 : 0)}%`);
      plate.style.setProperty('--y', n > 2 ? '0%' : '48%');
      table.appendChild(plate);
      gsap.from(plate, { y: SB.reduced ? 0 : -60, scale: SB.reduced ? 1 : 0.4, opacity: 0, rotate: rand(-40, 40), duration: SB.reduced ? 0 : 0.5, ease: 'back.out(2)' });
      n++;
      count.textContent = `plates ordered: ${n} · ${lines[n - 1]}`;
      if (n === 3 && !SB.reduced) gsap.fromTo(count, { scale: 1.25 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      button.textContent = n >= 5 ? 'clear the table' : `another plate ${cfg.dish || '🍝'}`;
    });
    L.append(table, button, count);

    const R = SB.page('friend-r pasta-note', f.name);
    const check = el('div', 'guest-check');
    const top = el('div', 'gc-top');
    top.innerHTML = `<span>GUEST CHECK</span><span>table 22</span>`;
    const meta = el('div', 'gc-meta');
    meta.append(el('span', null, `server: ${f.name}`), el('span', null, `guest: ${C.nickname}`));
    const bill = el('div', 'gc-bill');
    (cfg.bill || [['dinner ×3', 'as usual'], ['smiles', 'always'], ['birthday', 'the best'], ['TOTAL', 'on the house ♡']]).forEach(([k, v]) => {
      const row = el('p', 'rc-row');
      row.append(el('span', null, k), el('span', 'rc-dots'), el('span', null, v));
      bill.appendChild(row);
    });
    check.append(top, meta, message(f), bill);
    R.appendChild(check);
    return [L, R];
  };

  // ---- in each other's peripheries: two lines that keep nearly meeting, until they do ----
  S.paths = (f, cfg, i) => {
    const m = photos(f)[cfg.main ?? 0] || photos(f)[0];
    const stops = cfg.stops || ['strangers', 'somehow friends', 'side by side', 'finally.'];
    const L = SB.page('friend-l paths-page', f.name);
    // the gap between the lines shrinks overall, and pinches almost shut at each milestone
    const xs = stops.map((_, k) => (k === stops.length - 1 ? 92 : 14 + k * (70 / (stops.length - 1))));
    const merge = xs[xs.length - 1];
    const gap = x => {
      if (x >= merge) return 0;
      const near = Math.min(...xs.slice(0, -1).map(s => Math.abs(x - s)));
      return (1 - x / merge) * 10 * Math.min(1, 0.12 + near / 11);
    };
    const line = sign => {
      let d = '';
      for (let x = 0; x <= 100; x += 1) d += `${x ? 'L' : 'M'}${x} ${(15 + sign * gap(x)).toFixed(2)} `;
      return d;
    };
    // the neon glow is a wide, faint copy of each line underneath: SVG drop-shadow filters stall every frame of a page turn
    const svg = `<svg class="paths" viewBox="0 0 100 30" preserveAspectRatio="none">
      <path class="path-a glow" d="${line(-1)}" pathLength="100"/><path class="path-b glow" d="${line(1)}" pathLength="100"/>
      <path class="path-a" d="${line(-1)}" pathLength="100"/><path class="path-b" d="${line(1)}" pathLength="100"/>
      ${xs.map((x, k) => `<g class="stop-dot" data-k="${k}"><circle class="stop-halo" cx="${x}" cy="15" r="2.6"/><circle cx="${x}" cy="15" r="1.4"/></g>`).join('')}</svg>`;
    const map = el('div', 'paths-map');
    map.innerHTML = svg;
    const legend = el('div', 'paths-legend');
    legend.innerHTML = `<span class="lg-a">${C.nickname}</span><span class="lg-b">${f.name}</span>`;
    const labels = el('div', 'paths-labels');
    const tags = stops.map((s, k) => {
      const t = el('span', 'stop-label', s);
      t.style.left = xs[k] + '%';
      labels.appendChild(t);
      return t;
    });
    L.append(nameTag(`from ${f.name}`, i), el('h2', 'friend-heading', cfg.title || 'in each other’s orbit'), legend, map, labels);
    let photo = null;
    if (m) {
      photo = el('button', 'paths-photo');
      photo.type = 'button';
      photo.setAttribute('aria-label', `Open ${f.name}'s photo`);
      photo.appendChild(SB.thumb(m, true));
      photo.addEventListener('click', () => open(f, m));
      L.appendChild(photo);
    }
    // any other photos wait at the edges of the page, then slide in around the main one
    photos(f).filter(p => p !== m).slice(0, 3).forEach((p, k) => {
      const peek = el('button', `paths-peek peek-${k}`);
      peek.type = 'button';
      peek.setAttribute('aria-label', `Open ${f.name}'s photo ${k + 2}`);
      peek.appendChild(SB.thumb(p));
      peek.addEventListener('click', () => open(f, p));
      L.appendChild(peek);
    });
    const caption = el('p', 'paths-caption', 'always just out of frame…');
    caption.setAttribute('aria-live', 'polite');
    const button = el('button', 'pill friend-action', 'close the distance');
    button.type = 'button';
    L.append(caption, button);

    const paths = map.querySelectorAll('path'), dots = map.querySelectorAll('.stop-dot');
    const reset = () => {
      gsap.set(paths, { strokeDasharray: 100, strokeDashoffset: 100 });
      gsap.set(dots, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(tags, { opacity: 0.3 });
      L.style.setProperty('--focus', 0);
      caption.textContent = 'always just out of frame…';
    };
    reset();
    let tl = null;
    button.addEventListener('click', () => {
      tl?.kill();
      reset();
      const D = SB.reduced ? 0 : 3.2;
      tl = gsap.timeline({ onComplete() { caption.textContent = 'there all along ♡'; button.textContent = 'one more time'; } })
        .to(paths, { strokeDashoffset: 0, duration: D, ease: 'none' }, 0);
      xs.forEach((x, k) => {
        tl.to(dots[k], { scale: 1, duration: SB.reduced ? 0 : 0.4, ease: 'back.out(3)' }, D * x / 100)
          .to(tags[k], { opacity: 1, duration: SB.reduced ? 0 : 0.3 }, D * x / 100);
      });
      tl.to(L, { '--focus': 1, duration: SB.reduced ? 0 : 1.4, ease: 'power2.out' }, D * merge / 100);
    });

    const R = SB.page('friend-r paths-note', f.name);
    const card = el('div', 'paths-letter');
    card.append(el('p', 'friend-kicker', 'TURNS OUT · THEY WERE THERE ALL ALONG'), message(f));
    R.appendChild(card);
    return [L, R];
  };

  // ---- a run with a checkpoint for every title in their note; a race bib holds the letter ----
  S.run = (f, cfg, i) => {
    const stops = (cfg.stops || []).map(([label, k]) => ({ label, m: f.media[k] })).filter(s => s.m);
    if (!stops.length) return S.auto(f, cfg, i);
    const L = SB.page('friend-l run-page', f.name);
    // a wiggly route left to right, checkpoints spaced along it
    const route = 'M4 40 C 16 8, 26 8, 34 26 S 52 48, 62 26 S 82 4, 96 22';
    const map = el('div', 'run-map no-swipe');
    map.innerHTML = `<svg viewBox="0 0 100 50" preserveAspectRatio="none"><path class="run-route" d="${route}"/><path class="run-done" d="${route}" pathLength="100"/></svg>`;
    const path = map.querySelector('.run-route'), done = map.querySelector('.run-done');
    let total = 0;
    const at = stops.map((_, k) => 0.16 + k * (0.68 / Math.max(1, stops.length - 1)));
    const runner = el('span', 'run-me', '🏃‍♀️');
    const finish = el('span', 'run-finish', '🏁');
    map.append(runner, finish);
    const place = (node, t) => {
      total = total || path.getTotalLength(); // only measurable once the page is in the document
      if (!total) return;
      const p = path.getPointAtLength(total * t);
      node.style.left = p.x + '%';
      node.style.top = (p.y / 50) * 100 + '%';
    };
    const dots = stops.map((s, k) => {
      const d = el('button', 'run-stop');
      d.type = 'button';
      d.setAttribute('aria-label', `Checkpoint ${k + 1}: ${s.label}`);
      d.append(el('span', 'run-stop-n', String(k + 1)), el('span', 'run-stop-label', s.label));
      d.addEventListener('click', () => {
        stopRun();
        place(runner, at[k]); // jump the runner to that checkpoint too
        done.style.strokeDashoffset = 100 - at[k] * 100;
        show(k);
      });
      map.appendChild(d);
      return d;
    });

    const frame = el('button', 'run-frame');
    frame.type = 'button';
    const shot = el('div', 'run-shot');
    const tag = el('span', 'run-tag', 'tap start, she’s off');
    tag.setAttribute('aria-live', 'polite');
    frame.append(shot, tag);
    let cur = -1;
    function show(k) {
      cur = k;
      dots.forEach((d, j) => d.classList.toggle('hit', j <= k));
      const { label, m } = stops[k];
      frame.setAttribute('aria-label', `Open ${label} ${m.type}`);
      let node;
      if (m.type === 'video') node = Object.assign(el('video'), { src: m.src, poster: m.thumb, muted: true, loop: true, playsInline: true, autoplay: true });
      else node = Object.assign(el('img'), { src: m.src, alt: '' });
      shot.replaceChildren(node);
      node.play?.().catch(() => {});
      tag.textContent = `checkpoint ${k + 1} · ${label}`;
      if (!SB.reduced) gsap.fromTo(shot, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.4 });
    }
    frame.addEventListener('click', () => { if (cur >= 0) open(f, stops[cur].m); });

    const button = el('button', 'pill friend-action', 'start the run');
    button.type = 'button';
    let tl = null;
    function stopRun() { tl?.kill(); tl = null; button.textContent = 'run it again'; }
    button.addEventListener('click', () => {
      tl?.kill();
      const pos = { t: 0 };
      const leg = SB.reduced ? 0 : 1.1, rest = SB.reduced ? 0 : 1.6;
      const draw = () => { place(runner, pos.t); done.style.strokeDashoffset = 100 - pos.t * 100; };
      tl = gsap.timeline({ onComplete() { button.textContent = 'run it again'; tag.textContent = 'finished ✓ new PR'; const r = finish.getBoundingClientRect(); SB.burst(r.left + r.width / 2, r.top, { count: 60, spread: 80 }); } });
      tl.set(pos, { t: 0, onUpdate: draw }).add(draw);
      at.forEach((t, k) => {
        tl.to(pos, { t, duration: leg, ease: 'sine.inOut', onUpdate: draw })
          .add(() => show(k))
          .to({}, { duration: rest });
      });
      tl.to(pos, { t: 1, duration: leg, ease: 'sine.in', onUpdate: draw });
      button.textContent = 'running…';
    });
    done.style.strokeDasharray = 100;
    done.style.strokeDashoffset = 100;
    SB.onShow(L, first => {
      if (!first) return;
      place(runner, 0);
      place(finish, 1);
      dots.forEach((d, k) => place(d, at[k]));
    });
    L.append(nameTag(`from ${f.name}`, i), el('h2', 'friend-heading', cfg.title || 'run club of two'), map, frame, button);
    document.addEventListener('book:turn', () => { if (!SB.book.visible().includes(L)) shot.querySelector('video')?.pause(); });

    const R = SB.page('friend-r run-note', f.name);
    const bib = el('div', 'bib');
    bib.innerHTML = '<i class="pin p1"></i><i class="pin p2"></i><i class="pin p3"></i><i class="pin p4"></i>';
    bib.append(el('p', 'bib-top', cfg.race || 'THE BIRTHDAY RUN'), el('p', 'bib-no', String(C.age)), el('p', 'bib-name', C.name.toUpperCase()), el('p', 'bib-foot', `${C.birthday.toUpperCase()} · ${stops.length} CHECKPOINTS · 1 FINISH`));
    const sheet = el('div', 'run-letter');
    sheet.appendChild(message(f));
    R.append(bib, sheet);
    return [L, R];
  };

  // ---- stories: tap through like Instagram; right page is a wall of photos you can drag around ----
  S.stories = (f, cfg, i) => {
    const L = SB.page('friend-l story-page', f.name);
    const n = f.media.length, first = photos(f)[0] || f.media[0];
    const phone = el('div', 'phone story no-swipe');
    phone.innerHTML = `<div class="st-bars"></div><div class="st-head"><span class="st-av"></span><b></b><span class="st-count"></span></div>
      <div class="st-media"></div><div class="st-tap st-prev"></div><div class="st-tap st-next"></div><button class="st-sound" type="button">🔇</button>`;
    phone.querySelector('.st-av').style.backgroundImage = `url(${first.thumb})`;
    phone.querySelector('.st-head b').textContent = f.name.toLowerCase();
    const bars = phone.querySelector('.st-bars'), media = phone.querySelector('.st-media'), count = phone.querySelector('.st-count');
    const fills = f.media.map(() => { const b = el('i'), fill = el('b'); b.appendChild(fill); bars.appendChild(b); return fill; });
    L.append(nameTag(`from ${f.name}`, i), phone, el('p', 'hand-cap', cfg.title || 'tap through ✦'));

    let idx = 0, tween = null, video = null, soundOn = false, running = false;
    function show(k) {
      idx = (k + n) % n;
      tween?.kill();
      fills.forEach((b, j) => gsap.set(b, { scaleX: j < idx ? 1 : 0 }));
      count.textContent = `${idx + 1}/${n}`;
      const m = f.media[idx];
      video = null;
      if (m.type === 'video') {
        video = Object.assign(el('video'), { src: m.src, poster: m.thumb, muted: !soundOn, playsInline: true, autoplay: true });
        media.replaceChildren(video);
        video.addEventListener('loadedmetadata', () => run(Math.min(video.duration || 6, 15)), { once: true });
        video.play().catch(() => {});
      } else {
        media.replaceChildren(Object.assign(el('img'), { src: m.src, alt: '' }));
        run(4);
      }
    }
    function run(seconds) {
      tween = gsap.fromTo(fills[idx], { scaleX: 0 }, { scaleX: 1, duration: seconds, ease: 'none', onComplete: () => show(idx + 1) });
      if (!running) pause();
    }
    function pause() { tween?.pause(); video?.pause(); }
    function resume() { tween?.resume(); video?.play().catch(() => {}); }

    phone.querySelector('.st-next').addEventListener('click', () => show(idx + 1));
    phone.querySelector('.st-prev').addEventListener('click', () => show(idx - 1));
    phone.querySelector('.st-sound').addEventListener('click', e => {
      soundOn = !soundOn;
      e.currentTarget.textContent = soundOn ? '🔊' : '🔇';
      if (video) video.muted = !soundOn;
    });
    // hold to pause, like the real thing
    media.parentElement.addEventListener('pointerdown', e => { if (e.target.closest('.st-tap')) pause(); });
    media.parentElement.addEventListener('pointerup', () => running && resume());
    SB.onShow(L, firstTime => { running = true; firstTime ? show(0) : resume(); });
    document.addEventListener('book:turn', () => { if (!SB.book.visible().includes(L)) { running = false; pause(); } });
    document.addEventListener('sb:lightbox', () => {
      if (!running) return;
      document.getElementById('lightbox').hidden ? resume() : pause();
    });

    // right page: a messy wall of polaroids to drag around
    const R = SB.page('friend-r wall-page', f.name);
    R.appendChild(el('p', 'page-title', 'a very messy wall · drag us around'));
    const pics = SB.shuffle(photos(f)).slice(0, 15);
    pics.forEach((m, k) => {
      const p = el('figure', 'pol wall-pol');
      p.appendChild(el('span', 'wall-tape'));
      p.appendChild(SB.thumb(m));
      p.style.left = 3 + (k % 3) * 31 + rand(-3, 3) + '%';
      p.style.top = 11 + Math.floor(k / 3) * 14 + rand(-2, 2) + '%';
      gsap.set(p, { rotate: rand(-14, 14) }); // via gsap so dragging keeps the tilt
      p.classList.add('no-swipe');
      R.appendChild(p);
    });
    SB.onShow(R, firstTime => firstTime && Draggable.create(R.querySelectorAll('.wall-pol'), {
      bounds: R, zIndexBoost: true,
      onPress() { gsap.to(this.target, { scale: 1.08, duration: 0.15 }); },
      onRelease() { gsap.to(this.target, { scale: 1, duration: 0.3 }); },
      onClick() { open(f, pics[[...R.querySelectorAll('.wall-pol')].indexOf(this.target)]); },
    }));
    return [L, R];
  };
})();

export {}; // loaded as a module by ../mount.ts, which provides the globals it uses
