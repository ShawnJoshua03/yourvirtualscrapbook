'use client';

/* Renders the fixed frame the engine expects (desk, book, controls, lightbox) and starts the engine on the client. */
import { useEffect } from 'react';
import type { Book } from '@/engine/types';
import '@/engine/styles/style.css';
import '@/engine/styles/pages.css';
import '@/engine/styles/pages-more.css';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Caveat:wght@500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,500;1,9..144,700&family=Gochi+Hand&family=Homemade+Apple&family=Nanum+Pen+Script&family=Reenie+Beanie&family=Shadows+Into+Light&display=swap';

export default function Scrapbook({ book }: { book: Book }) {
  useEffect(() => {
    import('@/engine/mount').then(m => m.mountBook(book));
  }, [book]);

  return (
    <div className="yvs-book">
      {/* the signature page names its fonts directly, so they load as a stylesheet rather than through next/font */}
      <link rel="stylesheet" href={FONTS} precedence="default" />
      <main className="desk">
        <div className="book" id="book">
          <button className="corner corner-prev" aria-label="Previous page" />
          <button className="corner corner-next" aria-label="Next page" />
        </div>
        <nav className="book-nav">
          <button id="prevBtn" aria-label="Previous page">‹</button>
          <span id="pageLabel" />
          <button id="nextBtn" aria-label="Next page">›</button>
        </nav>
      </main>

      <button className="music" id="musicBtn" hidden aria-label="Sound on/off" title="Music and page sounds">
        <i /><i /><i />
      </button>

      <div className="lights-out" id="lightsOut"><p>make a wish…</p></div>

      <div className="lightbox" id="lightbox" hidden role="dialog" aria-modal="true" aria-label="Photo viewer">
        <button className="lb-btn lb-close" aria-label="Close">✕</button>
        <button className="lb-btn lb-nav lb-prev" aria-label="Previous">‹</button>
        <figure className="lb-frame"><div className="lb-media" /><figcaption className="lb-cap" /></figure>
        <button className="lb-btn lb-nav lb-next" aria-label="Next">›</button>
      </div>
    </div>
  );
}
