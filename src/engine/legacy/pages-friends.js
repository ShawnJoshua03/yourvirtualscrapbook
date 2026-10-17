/* One spread per friend. Each style returns [leftPage, rightPage]. */
(() => {
  const C = window.SCRAPBOOK;
  const { el, rand, palette } = SB;
  const words = t => t.split(/\s+/).filter(Boolean).length;
  const open = (f, m) => SB.lightbox.open(f.media, f.media.indexOf(m));
  const photos = f => f.media.filter(m => m.type === 'photo');
  const videos = f => f.media.filter(m => m.type === 'video');

  const nameTag = (text, i) => {
    const t = el('div', 'name-tag', text);
    t.style.setProperty('--tape', ['#ffd166', '#ffb3cf', '#a8dcc8', '#c9b6f0', '#a9d4fa'][i % 5]);
    return t;
  };

  // their message, sized by length so short and long notes both fill the page nicely
  function message(f) {
    const box = el('div', 'msg');
    const n = words(f.note);
    box.classList.add(n > 190 ? 'xlong' : n > 115 ? 'long' : n < 70 ? 'short' : 'mid');
    f.note.split(/\n+/).map(s => s.trim()).filter(Boolean).forEach(par => box.appendChild(el('p', null, par)));
    if (!new RegExp(f.name + '\\W*$', 'i').test(f.note)) box.appendChild(el('p', 'sig', `— ${f.name}`));
    return box;
  }

  function polaroid(f, m, cls = '') {
    const fig = el('figure', 'pol ' + cls);
    fig.appendChild(SB.thumb(m));
    fig.style.setProperty('--r', rand(-7, 7).toFixed(1) + 'deg');
    fig.addEventListener('click', e => { e.stopPropagation(); open(f, m); });
    return fig;
  }

  // a messy pile: tap to send the top photo to the back, ⤢ to look closer
  function pile(f, list = f.media) {
    const wrap = el('div', 'pile');
    const cards = list.map(m => {
      const c = el('figure', 'pile-card');
      c.appendChild(SB.thumb(m, true));
      c._m = m;
      c._rest = { x: rand(-10, 10), y: rand(-8, 8), rotate: rand(-13, 13) };
      gsap.set(c, c._rest);
      wrap.appendChild(c);
      return c;
    });
    const order = cards.slice();
    const restack = () => order.forEach((c, k) => (c.style.zIndex = order.length - k));
    restack();
    const count = el('p', 'pile-count');
    const zoom = el('button', 'pile-zoom', '⤢');
    zoom.setAttribute('aria-label', 'Look closer');
    const update = () => (count.textContent = `${cards.indexOf(order[0]) + 1} of ${cards.length} · tap to shuffle`);
    update();
    wrap.addEventListener('click', e => {
      if (e.target === zoom) return open(f, order[0]._m);
      if (order.length < 2) return open(f, order[0]._m);
      const top = order.shift();
      order.push(top);
      const dir = Math.random() > 0.5 ? 1 : -1;
      gsap.timeline()
        .to(top, { x: dir * wrap.clientWidth * 0.75, rotate: dir * 25, duration: 0.22, ease: 'power2.out' })
        .add(restack)
        .to(top, { ...top._rest, duration: 0.35, ease: 'power2.inOut' });
      update();
    });
    wrap.appendChild(zoom);
    const box = el('div', 'pile-box');
    box.append(wrap, count);
    return box;
  }

  function msgPage(f, cls = 'lined') {
    const p = SB.page('friend-r ' + cls, f.name);
    p.appendChild(message(f));
    return p;
  }

  const S = (SB.friendStyles = {});
  SB.friendKit = { nameTag, message, msgPage, polaroid, open, photos, videos }; // shared with pages-friends-more.js

  S.postcard = (f, cfg, i) => {
    const L = SB.page('friend-l pc-page', f.name);
    const front = el('div', 'postcard pc-front');
    const ph = photos(f)[0] || f.media[0];
    if (ph) front.appendChild(polaroid(f, ph, 'pc-photo'));
    front.innerHTML += `<div class="stamp"><span>${cfg.place || '♥'}</span></div><div class="postmark"><span>${(cfg.place || 'home').toUpperCase()} · BACK HOME</span></div>`;
    front.querySelector('.pc-photo')?.addEventListener('click', () => open(f, ph));
    L.append(nameTag(`from ${f.name}`, i), front, el('p', 'hand-cap', `greetings from ${cfg.place || 'home'} ✈`));
    const R = SB.page('friend-r pc-page', f.name);
    const back = el('div', 'postcard pc-back');
    back.innerHTML = `<div class="pc-head"><p class="addr">To: ${C.nickname}${cfg.petName ? `<br><span>(${cfg.petName})</span>` : ''}</p><div class="stamp small"><span>♥</span></div></div>`;
    back.appendChild(message(f));
    R.appendChild(back);
    return [L, R];
  };

  S.years = (f, cfg, i) => {
    const L = SB.page('friend-l', f.name);
    const grid = el('div', 'pol-grid years');
    photos(f).slice(0, 4).forEach(m => grid.appendChild(polaroid(f, m)));
    const years = cfg.years || 5, frac = Math.min(1, years / (C.age || 22));
    const ring = el('div', 'ring');
    ring.innerHTML = `<svg viewBox="0 0 100 100"><circle class="ring-track" cx="50" cy="50" r="42"/><circle class="ring-fill" cx="50" cy="50" r="42" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg>
      <div class="ring-text"><b>${years}</b><span>years</span></div>`;
    // a friendship receipt, taped in
    const receipt = el('div', 'receipt');
    receipt.append(el('p', 'rc-head', 'FRIENDSHIP RECEIPT'), el('p', 'rc-sub', `${f.name} ♥ ${C.nickname}`));
    (cfg.receipt || []).forEach(([k, v]) => {
      const row = el('p', 'rc-row');
      row.append(el('span', null, k), el('span', 'rc-dots'), el('span', null, v));
      receipt.appendChild(row);
    });
    const total = el('p', 'rc-row rc-total');
    total.append(el('span', null, 'TOTAL'), el('span', 'rc-dots'), el('span', null, 'priceless'));
    receipt.append(total, el('p', 'rc-foot', '* thank you, come again *'), el('div', 'rc-barcode'));
    L.append(nameTag(`from ${f.name}`, i), grid, receipt, ring, el('p', 'ring-cap', cfg.caption || `${years} years of you ♡`));
    SB.onShow(L, () => {
      gsap.fromTo(ring.querySelector('.ring-fill'), { attr: { 'stroke-dashoffset': 100 } }, { attr: { 'stroke-dashoffset': 100 - frac * 100 }, duration: 1.6, ease: 'power2.out', delay: 0.4 });
      gsap.fromTo(receipt.querySelectorAll('.rc-row'), { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.18, delay: 0.5 });
    });
    return [L, msgPage(f)];
  };

  S.birthdays = (f, cfg, i) => {
    const L = SB.page('friend-l', f.name);
    L.append(nameTag(`from ${f.name}`, i), el('p', 'page-title', cfg.title || 'the photo dump'), pile(f));
    return [L, msgPage(f)];
  };

  S.camcorder = (f, cfg, i) => {
    const L = SB.page('friend-l', f.name);
    const v = videos(f)[0];
    L.appendChild(nameTag(`from ${f.name}`, i));
    if (!v) return S.auto(f, cfg, i);
    const cam = el('div', 'cam');
    const video = Object.assign(el('video'), { src: v.src, poster: v.thumb, muted: true, loop: true, playsInline: true, preload: 'metadata' });
    cam.innerHTML = `<span class="cam-rec">● REC</span><span class="cam-bat"></span><span class="cam-tc">SP 00:00:00</span><span class="cam-date">${(cfg.label || 'REWIND').toUpperCase()}</span><span class="cam-sound">🔇 tap for sound</span><i class="br tl"></i><i class="br tr"></i><i class="br bl"></i><i class="br br2"></i>`;
    cam.prepend(video);
    const tc = cam.querySelector('.cam-tc'), sound = cam.querySelector('.cam-sound');
    video.addEventListener('timeupdate', () => {
      const s = video.currentTime;
      tc.textContent = `SP 00:00:${String(Math.floor(s)).padStart(2, '0')}:${String(Math.floor((s % 1) * 30)).padStart(2, '0')}`;
    });
    cam.addEventListener('click', () => {
      video.muted = !video.muted;
      sound.textContent = video.muted ? '🔇 tap for sound' : '🔊 sound on';
      video.play().catch(() => {});
    });
    SB.onShow(L, () => video.play().catch(() => {}));
    L.appendChild(cam);
    if (cfg.caption) L.appendChild(el('p', 'hand-cap', cfg.caption));
    return [L, msgPage(f)];
  };

  S.tickets = (f, cfg, i) => {
    const L = SB.page('friend-l tix-page', f.name);
    const strip = el('div', 'booth');
    photos(f).slice(0, 4).forEach(m => {
      const t = SB.thumb(m);
      t.addEventListener('click', () => open(f, m));
      strip.appendChild(t);
    });
    const col = el('div', 'tickets');
    (cfg.steps || []).forEach((s, k) => {
      const t = el('div', 'ticket' + (k === cfg.steps.length - 1 ? ' last' : ''));
      t.innerHTML = `<span class="t-admit">ADMIT TWO · No. ${k + 1}</span><span class="t-step"></span>`;
      t.querySelector('.t-step').textContent = s;
      col.appendChild(t);
    });
    L.append(nameTag(`from ${f.name}`, i), strip, col);
    SB.onShow(L, () => gsap.fromTo(col.children, { scale: 1.6, opacity: 0, rotate: () => rand(-12, 12) },
      { scale: 1, opacity: 1, rotate: () => rand(-4, 4), duration: 0.45, stagger: 0.35, ease: 'back.out(2)', delay: 0.3 }));
    const R = msgPage(f);
    const extra = photos(f).slice(4);
    if (extra.length) {
      const row = el('div', 'extras');
      extra.forEach(m => row.appendChild(polaroid(f, m)));
      R.appendChild(row);
    }
    R.appendChild(el('div', 'sticker-cheers', cfg.sticker ?? '🥂🥂'));
    return [L, R];
  };

  S.blocks = (f, cfg, i) => {
    const L = SB.page('friend-l', f.name);
    const row = el('div', 'pol-row');
    photos(f).slice(0, 3).forEach(m => row.appendChild(polaroid(f, m)));
    const tower = el('div', 'blocks');
    // default tower spells the recipient's nickname under a heart, widest row at the bottom
    const letters = [...(C.nickname || C.name).toUpperCase()].filter(ch => /\S/.test(ch)).slice(0, 5);
    const layers = cfg.blocks || [['♥'], letters.slice(0, letters.length > 3 ? 2 : 1), letters.slice(letters.length > 3 ? 2 : 1)].filter(r => r.length);
    layers.forEach((lay, r) => {
      const line = el('div', 'b-row');
      lay.forEach((ch, k) => { const b = el('span', 'block', ch); b.style.setProperty('--c', palette[(r * 3 + k) % palette.length]); line.appendChild(b); });
      tower.appendChild(line);
    });
    const blocks = [...tower.querySelectorAll('.block')].reverse(); // build from the bottom up
    const capText = `${cfg.caption || 'built it together ✓'} (tap to knock over)`;
    const cap = el('p', 'hand-cap', capText);
    const rebuild = el('button', 'pill blocks-rebuild', 'rebuild ✓');
    rebuild.type = 'button';
    rebuild.hidden = true;
    tower.classList.add('no-swipe');
    L.append(nameTag(`from ${f.name}`, i), row, tower, cap, rebuild);
    const toy = SB.blockPhysics(L, tower, blocks);
    toy.onScatter = () => { rebuild.hidden = false; cap.textContent = 'oops. (fling them around)'; };
    toy.onBuilt = () => { rebuild.hidden = true; cap.textContent = capText; };
    rebuild.addEventListener('click', () => toy.build());
    SB.onShow(L, first => first && toy.build(true));

    const R = SB.page('friend-r', f.name);
    const card = el('div', 'libcard');
    card.innerHTML = `<div class="lc-head"><span>DATE DUE</span><span>BORROWER</span></div><div class="lc-row"><span>${cfg.since || 'since forever'}</span><span>${f.name} → ${C.nickname}</span></div>`;
    card.appendChild(message(f));
    const stamp = el('div', 'stamp-red', cfg.stamp || 'APPROVED');
    card.appendChild(stamp);
    R.appendChild(card);
    SB.onShow(R, () => gsap.fromTo(stamp, { scale: 3, opacity: 0, rotate: -30 }, { scale: 1, opacity: 0.85, rotate: -12, duration: 0.35, ease: 'power4.in', delay: 0.9 }));
    return [L, R];
  };

  S.dump = (f, cfg, i) => {
    const L = SB.page('friend-l', f.name);
    L.append(nameTag(`from ${f.name}`, i), el('p', 'page-title', cfg.title || `${f.name}'s camera roll`), pile(f));
    const R = SB.page('friend-r', f.name);
    if (f.note) R.appendChild(message(f));
    const grid = el('div', 'contact' + (f.note ? ' with-note' : ''));
    grid.style.setProperty('--cols', Math.max(4, Math.ceil(Math.sqrt(f.media.length * (f.note ? 2.2 : 1.25)))));
    f.media.forEach(m => {
      const t = SB.thumb(m);
      t.addEventListener('click', () => open(f, m));
      grid.appendChild(t);
    });
    R.append(el('p', 'contact-title', `contact sheet · ${f.media.length} frames`), grid);
    return [L, R];
  };

  // anyone without a custom style (new folders show up here automatically)
  S.auto = (f, cfg, i) => {
    if (!f.note) return S.dump(f, cfg, i);
    if (f.media.length > 4) return S.birthdays(f, { title: `${f.name}'s photos` }, i);
    const L = SB.page('friend-l', f.name);
    L.appendChild(nameTag(`from ${f.name}`, i));
    if (f.media.length) {
      const g = el('div', 'pol-grid n' + f.media.length);
      f.media.forEach(m => g.appendChild(polaroid(f, m)));
      L.appendChild(g);
    } else {
      L.appendChild(el('blockquote', 'pull', f.note.split(/(?<=[.!?])\s/)[0]));
    }
    return [L, msgPage(f)];
  };
})();

export {}; // loaded as a module by ../mount.ts, which provides the globals it uses
