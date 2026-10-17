/* Starts the flip-book inside the markup rendered by <Scrapbook>. The engine scripts in ./legacy were written as
   plain browser scripts that read a few globals (gsap, Draggable, confetti, the book data), so this provides those
   from npm and then loads the scripts in their original order. They run once per page load. */
import type { Book } from './types';

type EngineWindow = Window & Record<string, unknown>;

let started: Promise<void> | null = null;

export function mountBook(book: Book): Promise<void> {
  if (started) return started; // React may run effects twice in development; the book only starts once
  started = (async () => {
    const w = window as unknown as EngineWindow;
    const [{ gsap }, { Draggable }, confetti] = await Promise.all([
      import('gsap'),
      import('gsap/Draggable'),
      import('canvas-confetti').then(m => m.default),
    ]);
    gsap.registerPlugin(Draggable);
    Object.assign(w, { gsap, Draggable, confetti, SCRAPBOOK: book.config, FRIENDS: book.contributions });

    // order matters: helpers → sound → the book → page builders → assembly
    await import('./legacy/effects.js');
    await import('./legacy/music.js');
    await import('./legacy/book.js');
    await import('./legacy/pages-core.js');
    await import('./legacy/pages-sky.js');
    await import('./legacy/pages-friends.js');
    await import('./legacy/pages-friends-more.js');
    await import('./legacy/blocks.js');
    await import('./legacy/cake.js');
    await import('./legacy/main.js');
  })();
  return started;
}
