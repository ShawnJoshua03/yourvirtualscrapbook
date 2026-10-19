# Yourvirtualscrapbook

**[Live site](https://yourvirtualscrapbook.vercel.app)** · **[Portfolio](https://shawnjoshua03.github.io/)**

A birthday book from everyone who loves them. Every friend sends a note and a few photos, and each one becomes its
own page, designed around what they wrote, in a book you flip through like the real thing.

**Demo:** run it locally and open `/demo`: a fictional book for Alex from fourteen fictional friends, one for each
page style. The images are generated illustrations, not real photos.

## Where this came from

This started as a one-off scrapbook I built for a friend's 22nd birthday: 15 friends, about 100 photos and videos,
used almost entirely on iPhones and iPads. That book stays private. This repo is the engine pulled out of it, with
every personal detail moved into data, on its way to becoming something anyone can make.

## Page styles

Each friend's page uses one design, chosen to fit what they sent:

| Style | What it does |
|---|---|
| `postcard` | A postcard from where they are, with the note on the back |
| `years` | Polaroids, a "friendship receipt" and a ring filling to the share of a life you've known each other |
| `clothesline` | Photos pegged to strings of fairy lights you drag sideways |
| `camcorder` | A home-video frame with a running timecode |
| `tickets` | A photo-booth strip and admit-one tickets for each step of the friendship |
| `sunshine` | Instant photos that develop when tapped, under a sun, with a plane towing a banner |
| `blocks` | Toy blocks spelling their name: knock them over, fling them, rebuild (real physics) |
| `stories` | Tap-through stories, plus a wall of polaroids to drag around |
| `arc` | A slider through the years: the photo goes from sepia to colour and a stamp lands at the end |
| `puzzle` | One photo as a 3×3 jigsaw to drag into place, with a "loading" bar of hard work |
| `flight` | Videos behind airplane window shades and a boarding pass to check in |
| `pasta` | Order plates at a little restaurant; the note is on the guest check |
| `paths` | Two neon lines that nearly meet at each shared moment, then merge |
| `run` | A route with a checkpoint for each title in their note, and a race bib |
| `birthdays`, `dump`, `auto` | Simpler layouts: a photo pile, a contact sheet, or picked automatically |

Every style reads its text (titles, stamps, checkpoints…) from the book data, with neutral defaults.
See `src/demo/book.ts` for an example of each.

## How it's built

- **`src/engine/`** is the book: 3D page turns, the photo viewer, stickers, sound and every page style. It began as
  plain browser scripts (`legacy/`); `mount.ts` supplies the globals they expect and loads them in order inside the
  `<Scrapbook>` client component. They will be ported to typed modules over time.
- **`src/engine/types.ts`** defines a `Book`: the recipient, the page setup for each friend, and their contributions.
- **`scripts/make-demo-media.mjs`** generates the demo's illustrated placeholder photos and videos.

Things learned the hard way on real phones, now built in:

- Long jumps from the contents page move silently to the page before the target and play one turn, instead of
  drawing every page in between (which crashed iPhones).
- Pages sit a fraction of a pixel apart in 3D, because Safari sorts 3D layers by depth and ignores z-index.
- The turning page's shadow is its own layer, faded by opacity, so iOS doesn't repaint the whole page each frame.
- No SVG `filter` effects: they are redrawn in software every frame of a 3D page turn.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000/demo
npm run build        # production build
node scripts/make-demo-media.mjs   # regenerate the demo images and videos
```

## Roadmap

1. ✅ Extract the engine, move personal details into data, demo book
2. Organizer creates a book and shares one invite link; friends add their note and media from their phone, no account
3. AI page suggestions: read each note and pick a style and its details, for the organizer to review
4. A live photo wall for the day itself, video support, and polish

Built with Next.js, GSAP and canvas-confetti. Planned: Supabase (accounts, database, storage) and the Claude API.
