/* The book: a stack of leaves that flip in 3D.
   Spread mode (wide screens): leaf k = page 2k on its front, page 2k+1 on its back.
   Single mode (phones): one page per leaf, the back is plain paper. */
(() => {
  const book = document.getElementById('book');
  const label = document.getElementById('pageLabel');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  let all = [];          // every page element, in reading order
  let pages = [];        // pages in the current layout (phones skip .spread-only pages)
  let leaves = [];       // { el, front, back }
  let mode = '';
  let cur = 0;           // how many leaves are turned
  let busy = false;
  let opened = false;
  const shown = new WeakSet();

  const isSpread = () => innerWidth >= 900 && innerWidth > innerHeight * 1.1;

  function size() {
    const spread = mode === 'spread';
    const ratio = spread ? 1.32 : 1.45;
    const maxW = spread ? (innerWidth * 0.92) / 2 : innerWidth - 24;
    const maxH = innerHeight - (spread ? 120 : 96);
    const pw = Math.floor(Math.min(maxW, maxH / ratio, spread ? 560 : 520));
    book.style.setProperty('--pw', pw + 'px');
    book.style.setProperty('--ph', Math.floor(pw * ratio) + 'px');
  }

  function paper(cls) {
    const p = document.createElement('section');
    p.className = 'page ' + cls;
    return p;
  }

  function build(keepPage = all[0]) {
    mode = isSpread() ? 'spread' : 'single';
    pages = mode === 'spread' ? all : all.filter(p => !p.classList.contains('spread-only'));
    book.className = 'book ' + mode;
    size();
    leaves.forEach(l => l.el.remove());
    leaves = [];
    const faces = [];
    if (mode === 'spread') for (let i = 0; i < pages.length; i += 2) faces.push([pages[i], pages[i + 1] || paper('blank')]);
    else pages.forEach(p => faces.push([p, paper(p.classList.contains('cover') ? 'cover-inside' : 'blank')]));

    faces.forEach(([front, back]) => {
      const el = document.createElement('div');
      el.className = 'leaf';
      const f = document.createElement('div'), b = document.createElement('div');
      f.className = 'face front';
      b.className = 'face back';
      f.appendChild(front);
      b.appendChild(back);
      // the turning shadow is its own layer, faded with opacity: animating a gradient repaints the whole page every frame on iOS
      const shades = [f, b].map(face => face.appendChild(Object.assign(document.createElement('div'), { className: 'shade' })));
      el.append(f, b);
      book.appendChild(el);
      leaves.push({ el, front, back, shades });
    });
    const index = Math.max(0, pages.indexOf(keepPage));
    cur = mode === 'spread' ? Math.ceil(index / 2) : index;
    leaves.forEach((l, k) => gsap.set(l.el, { rotateY: k < cur ? -180 : 0 }));
    stack();
    gsap.set(book, { x: shift(cur) });
    refresh();
    document.dispatchEvent(new CustomEvent('book:built'));
  }

  // Safari sorts 3D layers by depth and ignores z-index, so flat leaves at the same depth can flicker through each other.
  // Space them a fraction of a pixel apart: the top of each pile sits highest.
  const LIFT = 0.4;
  function stack() {
    const L = leaves.length;
    leaves.forEach((l, k) => gsap.set(l.el, { z: (k < cur ? k + 1 : L - k + 1) * LIFT }));
  }

  // closed book sits centred on the desk; open book is centred on its spine
  function shift(c) {
    if (mode !== 'spread') return 0;
    const pw = parseFloat(book.style.getPropertyValue('--pw'));
    return c === 0 ? -pw / 2 : c === leaves.length ? pw / 2 : 0;
  }

  const visiblePages = () => mode === 'spread'
    ? [leaves[cur - 1]?.back, leaves[cur]?.front].filter(Boolean)
    : [leaves[cur]?.front].filter(Boolean);

  // wake = false moves the book without waking the pages it lands on (used mid-jump)
  function refresh(wake = true) {
    const L = leaves.length;
    leaves.forEach((l, k) => {
      l.el.style.zIndex = k < cur ? k + 1 : L - k + 1;
      l.el.style.pointerEvents = '';
      // the side facing away still catches clicks in 3D, so only the visible side gets them
      l.el.children[0].style.pointerEvents = k < cur ? 'none' : '';
      l.el.children[1].style.pointerEvents = k < cur ? '' : 'none';
      const near = mode === 'spread' ? k >= cur - 2 && k <= cur + 1 : k === cur || k === cur + 1;
      l.el.style.visibility = near ? 'visible' : 'hidden';
      l.el.style.willChange = near ? 'transform' : 'auto'; // only the pages around this one keep a GPU layer ready
    });
    book.dataset.state = cur === 0 ? 'closed' : cur >= L ? 'end' : 'open';
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur >= (mode === 'spread' ? L : L - 1);
    const vis = visiblePages();
    label.textContent = vis.map(p => p.dataset.label).filter(Boolean).join(' · ');
    // pause videos that are no longer on screen, wake up pages that are
    pages.forEach(p => { if (!vis.includes(p)) p.querySelectorAll('video').forEach(v => v.pause()); });
    if (!wake) return;
    vis.forEach(p => {
      p.dispatchEvent(new CustomEvent('page:show', { detail: { first: !shown.has(p) } }));
      shown.add(p);
    });
    document.dispatchEvent(new CustomEvent('book:turn', { detail: { cur, total: L } }));
  }

  function flip(dir, speed = 1) {
    if (!document.getElementById('lightbox').hidden || getComputedStyle(document.getElementById('lightsOut')).visibility !== 'hidden') return Promise.resolve(false);
    const k = dir > 0 ? cur : cur - 1;
    const last = mode === 'spread' ? leaves.length : leaves.length - 1;
    if (busy || k < 0 || k >= leaves.length || (dir > 0 && cur >= last)) return Promise.resolve(false);
    if (dir > 0 && !opened) {
      opened = true;
      SB.music.start();
    }
    busy = true;
    const leaf = leaves[k];
    leaves.slice(Math.max(0, k - 1), k + 2).forEach(l => (l.el.style.visibility = 'visible'));
    leaf.el.style.zIndex = 999;
    gsap.set(leaf.el, { z: (leaves.length + 3) * LIFT }); // the turning leaf rides above both piles
    const d = 0.95 * speed, next = cur + dir;
    SB.music.pageTurn(d);
    return new Promise(resolve => {
      gsap.timeline({ onComplete() { cur = next; busy = false; stack(); refresh(); resolve(true); } })
        .to(leaf.el, { rotateY: dir > 0 ? -180 : 0, duration: d, ease: 'power2.inOut' }, 0)
        .to(leaf.shades, { opacity: 1, duration: d / 2, ease: 'power1.in' }, 0)
        .to(leaf.shades, { opacity: 0, duration: d / 2, ease: 'power1.out' }, d / 2)
        .to(book, { x: shift(next), duration: d, ease: 'power2.inOut' }, 0);
    });
  }

  // jump to a page index (used by the contents page and the stars)
  // Long jumps don't turn through every page in between: drawing and waking 30 pages back to back (videos, the jigsaw,
  // the blocks…) is what made iPhones choke. Instead the book moves silently to the page just before the target and
  // plays one real turn into it, so only those two pages are ever drawn.
  async function goTo(pageIndex) {
    const target = mode === 'spread' ? Math.ceil(pageIndex / 2) : pageIndex;
    if (busy || target === cur) return;
    const dir = target > cur ? 1 : -1;
    if (Math.abs(target - cur) > 1) {
      const before = target - dir;
      leaves.forEach((l, k) => gsap.set(l.el, { rotateY: k < before ? -180 : 0 }));
      cur = before;
      stack();
      gsap.set(book, { x: shift(cur) });
      refresh(false);
    }
    await flip(dir, 0.7);
  }

  // ---- controls ----
  prevBtn.addEventListener('click', () => flip(-1));
  nextBtn.addEventListener('click', () => flip(1));
  addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').hidden || e.target.closest?.('input, textarea')) return;
    if (e.key === 'ArrowRight') flip(1);
    if (e.key === 'ArrowLeft') flip(-1);
  });

  // page corners: hover lifts the corner, click turns
  document.querySelectorAll('.corner').forEach(c => {
    const dir = c.classList.contains('corner-next') ? 1 : -1;
    const leafFor = () => leaves[dir > 0 ? cur : cur - 1];
    c.addEventListener('pointerenter', () => {
      const l = leafFor();
      if (!l || busy) return;
      l.el.style.pointerEvents = 'none'; // the lifted leaf must not cover its corner button
      gsap.to(l.el, { rotateY: dir > 0 ? -14 : -166, duration: 0.35 });
    });
    c.addEventListener('pointerleave', () => {
      const l = leafFor();
      if (!l) return;
      l.el.style.pointerEvents = '';
      if (!busy) gsap.to(l.el, { rotateY: dir > 0 ? 0 : -180, duration: 0.35 });
    });
    c.addEventListener('click', () => flip(dir));
  });

  // swipe on touch screens
  let sx = 0, sy = 0, st = 0;
  book.addEventListener('touchstart', e => {
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY;
    st = e.target.closest('.no-swipe') ? 0 : Date.now(); // dragging a sticker or photo isn't a page turn
  }, { passive: true });
  book.addEventListener('touchend', e => {
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - st < 700) flip(dx < 0 ? 1 : -1);
  }, { passive: true });

  let resizeTimer;
  function resize() {
    if (busy) { resizeTimer = setTimeout(resize, 100); return; }
    const first = visiblePages()[0];
    if (isSpread() !== (mode === 'spread')) build(first);
    else { size(); gsap.set(book, { x: shift(cur) }); }
  }
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  SB.book = {
    init(list) { all = list; build(); },
    next: () => flip(1),
    prev: () => flip(-1),
    goTo,
    indexOf: p => pages.indexOf(p),
    visible: visiblePages,
    get isOpen() { return cur > 0; },
  };
})();

export {}; // loaded as a module by ../mount.ts, which provides the globals it uses
