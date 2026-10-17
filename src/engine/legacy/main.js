/* Assembles the book: cover → contents → stars → one spread per friend → cake → letter → the end */
(() => {
  const C = window.SCRAPBOOK, P = SB.pages;
  const data = window.FRIENDS || [];
  const key = s => s.trim().toLowerCase();
  const byName = new Map(data.map(f => [key(f.name), f]));
  const mine = byName.get(key(C.from));

  // friends in the order set in content.js, then any new folders at the end
  const cfgs = C.friends.filter(c => byName.has(key(c.name)));
  data.forEach(f => {
    if (f !== mine && !cfgs.some(c => key(c.name) === key(f.name))) cfgs.push({ name: f.name, style: 'auto' });
  });
  const friends = cfgs.map(c => ({ ...c, ...byName.get(key(c.name)) }));

  const title = P.title(), skyName = P.skyName(), skyFriends = P.skyFriends(friends);
  const pages = [P.cover(), P.insideCover(), title, skyName, skyFriends];
  friends.forEach((f, i) => {
    const style = SB.friendStyles[f.style] || SB.friendStyles.auto;
    const [L, R] = style(f, f, i);
    f.firstPage = L;
    pages.push(L, R);
  });
  const cake = P.cake(), signed = P.signatures([...friends.map(f => f.name), C.from]);
  const day22 = P.day22 ? P.day22() : []; // [left, right]: tonight's photo wall, after the letter
  pages.push(cake, P.letter(mine), ...day22, signed);
  // the back cover has to land on the outside of the last leaf; pad with an endpaper on two-page spreads
  if (pages.length % 2 === 0) { const e = P.endpaper(); e.classList.add('spread-only'); pages.push(e); }
  pages.push(P.backCover());

  pages.forEach((p, i) => { if (i > 1 && i < pages.length - 1 && !p.classList.contains('endpaper')) p.appendChild(SB.el('span', 'folio', i)); });

  // messages shrink to fit once fonts are in, and again if the layout switches phone ↔ spread
  const fitAll = () => document.querySelectorAll('.msg').forEach(SB.fitText);
  document.addEventListener('book:built', () => document.fonts.ready.then(fitAll));
  SB.book.init(pages);
  title.setContents([
    { title: 'Your stars', target: skyName },
    ...friends.map(f => ({ title: f.name, target: f.firstPage })),
    { title: 'Make a wish', target: cake },
    ...(day22.length ? [{ title: 'Day 22', target: day22[0] }] : []),
    { title: 'Signed,', target: signed },
  ]);

  // emojis in messages, captions and the bookplate become draggable stickers
  pages.forEach(p => p.querySelectorAll('.msg, .hand-cap, .page-title, .sticker-cheers, .bookplate, .q-text').forEach(SB.stickerize));

  document.title =`${C.name}'s ${C.age} ✦`;

  // the host's injected badge, in case it arrives with inline styles that beat the CSS rule
  const dropBadge = () => document.querySelectorAll('#nl-badge-frame, iframe[id^="nl-badge"]').forEach(f => f.remove());
  dropBadge();
  new MutationObserver(dropBadge).observe(document.body, { childList: true });
})();

export {}; // loaded as a module by ../mount.ts, which provides the globals it uses
