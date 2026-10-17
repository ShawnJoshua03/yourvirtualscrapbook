/* Book furniture: cover, bookplate, contents, signatures, endpapers, back cover */
(() => {
  const C = window.SCRAPBOOK;
  const { el, palette, rand, burst } = SB;

  SB.page = (cls, label) => {
    const p = el('section', 'page ' + cls);
    if (label) p.dataset.label = label;
    return p;
  };
  SB.onShow = (p, fn) => p.addEventListener('page:show', e => fn(e.detail.first));

  const P = (SB.pages = {});
  const ordinal = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

  P.cover = () => {
    const p = SB.page('cover');
    p.innerHTML = `
      <div class="cover-stitch"></div>
      <div class="cover-label">
        <span class="cl-small">the book of</span>
        <h1 class="ransom cl-name"></h1>
        <span class="cl-small">a scrapbook from the people who love you</span>
      </div>
      <div class="sticker s-age"></div>
      <div class="sticker s-star">★</div>
      <div class="sticker s-heart">♥</div>
      <div class="sticker s-flower">✿</div>
      <div class="strap"><span></span></div>
      <p class="cover-hint">tap to open</p>`;
    SB.ransom(p.querySelector('.cl-name'));
    p.querySelector('.s-age').textContent = C.age;
    let opened = false;
    p.addEventListener('click', () => {
      if (SB.book.isOpen) return;
      if (opened) return SB.book.next();
      opened = true;
      SB.music.start(); // must run inside the tap so browsers allow sound
      const strap = p.querySelector('.strap'), r = strap.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, { count: 80, spread: 100 });
      gsap.timeline()
        .to(strap, { scaleX: 1.15, duration: 0.12 })
        .to(strap, { x: '+=40', y: 260, rotate: 35, opacity: 0, duration: 0.55, ease: 'power2.in' })
        .to(p.querySelector('.cover-hint'), { opacity: 0, duration: 0.2 }, 0)
        .add(() => SB.book.next(), 0.35);
    });
    return p;
  };

  P.insideCover = () => {
    const p = SB.page('endpaper');
    p.innerHTML = `
      <div class="bookplate">
        <p>this book belongs to</p>
        <h2 class="bp-name"></h2>
        <p class="bp-born"></p>
        <p class="bp-from">made with love</p>
      </div>`;
    p.querySelector('.bp-name').textContent = C.name;
    p.querySelector('.bp-born').textContent = `born ${C.birthday}${C.sign ? ` · ${C.sign}` : ''}`;
    return p;
  };

  // plain patterned inside back cover (keeps the back cover on the outside of the book)
  P.endpaper = () => SB.page('endpaper');

  // contents: entries = [{ title, page }] — filled in after every page exists
  P.title = () => {
    const p = SB.page('title-page', 'contents');
    p.innerHTML = `
      <p class="tp-hb">Happy ${ordinal(C.age)},</p>
      <h2 class="tp-name"></h2>
      <p class="tp-sub">a scrapbook made by the people who love you</p>
      <ol class="toc"></ol>`;
    const name = p.querySelector('.tp-name');
    [...C.nickname].forEach((ch, i) => {
      const s = el('span', null, ch);
      s.style.color = palette[i % palette.length];
      name.appendChild(s);
    });
    // letters start hidden so they never flash in during the page turn, then drop in once, the first time it opens
    if (!SB.reduced) gsap.set(name.children, { y: -40, opacity: 0, rotate: () => rand(-30, 30) });
    SB.onShow(p, first => first && !SB.reduced && gsap.to(name.children,
      { y: 0, opacity: 1, rotate: 0, duration: 0.8, stagger: 0.07, ease: 'bounce.out', delay: 0.05 }));
    p.setContents = entries => {
      const ol = p.querySelector('.toc');
      ol.classList.toggle('two-col', entries.length > 9);
      entries.forEach(({ title, target }) => {
        const li = el('li'), b = el('button');
        b.append(el('span', 'toc-t', title), el('span', 'toc-dots'), el('span', 'toc-n', SB.book.indexOf(target)));
        b.addEventListener('click', () => SB.book.goTo(SB.book.indexOf(target)));
        li.appendChild(b);
        ol.appendChild(li);
      });
    };
    return p;
  };

  // yearbook-style signatures in different "handwriting"
  const HANDS = ["'Reenie Beanie'", "'Gochi Hand'", "'Homemade Apple'", "'Shadows Into Light'", "'Nanum Pen Script'", 'Caveat'];
  P.signatures = names => {
    const p = SB.page('signatures', 'signed');
    p.appendChild(el('h2', 'sig-title', 'signed,'));
    const wall = el('div', 'sig-wall');
    names.forEach((n, i) => {
      const s = el('span', 'sig-name', n);
      Object.assign(s.style, { fontFamily: HANDS[i % HANDS.length], color: palette[i % palette.length], transform: `rotate(${rand(-10, 10).toFixed(1)}deg)` });
      if (i % 3 === 0) s.dataset.doodle = ['♡', '☆', '✿'][i % 3];
      wall.appendChild(s);
    });
    p.appendChild(wall);
    p.appendChild(el('p', 'sig-foot', 'and everyone who couldn’t fit on this page ♡'));
    return p;
  };

  P.backCover = () => {
    const p = SB.page('cover back-cover');
    p.innerHTML = `<div class="cover-stitch"></div><div class="bc-text"><p class="bc-end">the end</p><p class="bc-small">(for now)</p><p class="bc-made"></p></div>`;
    p.querySelector('.bc-made').textContent = `made with love by ${C.from}`;
    p.addEventListener('click', () => SB.book.prev());
    return p;
  };
})();

export {}; // loaded as a module by ../mount.ts, which provides the globals it uses
