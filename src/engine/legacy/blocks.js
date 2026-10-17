/* Toy-block physics for the blocks page's tower: knock it over, fling the blocks, rebuild it.
   Positions are page-local pixels (offsets, not screen rects) so the book's scaling doesn't matter. */
(() => {
  const { rand } = SB;

  SB.blockPhysics = (page, tower, blocks) => {
    const B = blocks.map(el => ({ el, x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, held: false, grounded: false }));
    let state = 'built', running = false, quiet = 0, W, size, floor, gravity;
    const api = { onScatter() {}, onBuilt() {} };

    // where each block sits in the finished tower, in page coordinates
    function measure() {
      W = page.clientWidth;
      size = blocks[0].offsetWidth;
      floor = tower.offsetTop + tower.offsetHeight;
      gravity = W * 5.2;
      B.forEach(b => {
        b.cx = tower.offsetLeft + b.el.offsetLeft + size / 2;
        b.cy = tower.offsetTop + b.el.offsetTop + size / 2; // the tower is the blocks' offsetParent
      });
    }

    const render = b => gsap.set(b.el, { x: b.x, y: b.y, rotation: b.r });

    function step(dt) {
      const half = size / 2;
      B.forEach(b => {
        if (b.held) return;
        b.vy += gravity * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.r += b.vr * dt;
        b.grounded = false;
        const ax = b.cx + b.x, ay = b.cy + b.y;
        if (ay + half > floor) { // floor: bounce, scrub speed, clack if it hit hard
          b.y = floor - half - b.cy;
          if (b.vy > W * 0.5) SB.music.tock(b.vy / (W * 3));
          b.vy = Math.abs(b.vy) > W * 0.35 ? -b.vy * 0.38 : 0;
          b.vx *= 0.82;
          b.vr = b.vr * 0.6 + b.vx * 0.08;
          b.grounded = true;
        }
        if (ax - half < 0) { b.x = half - b.cx; b.vx = Math.abs(b.vx) * 0.5; b.vr *= -0.5; }
        if (ax + half > W) { b.x = W - half - b.cx; b.vx = -Math.abs(b.vx) * 0.5; b.vr *= -0.5; }
        if (ay - half < 0) { b.y = half - b.cy; b.vy = Math.abs(b.vy) * 0.3; }
      });
      // blocks are boxes: push overlapping pairs apart along the shallower axis
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
          const a = B[i], c = B[j];
          const dx = (c.cx + c.x) - (a.cx + a.x), dy = (c.cy + c.y) - (a.cy + a.y);
          const ox = size - Math.abs(dx), oy = size - Math.abs(dy);
          if (ox <= 0 || oy <= 0) continue;
          if (oy < ox) { // stacked: the upper one rests on the lower
            const [top, bot] = dy > 0 ? [a, c] : [c, a];
            if (!top.held) top.y -= bot.held ? oy : oy * 0.9;
            if (!bot.held && !bot.grounded) bot.y += oy * 0.1;
            const rel = top.vy - bot.vy;
            if (rel > 0) {
              if (rel > W * 0.5) SB.music.tock(rel / (W * 4));
              top.vy = bot.vy - rel * 0.25;
              top.vx = top.vx * 0.85 + bot.vx * 0.15;
            }
            if (Math.abs(top.vy) < W * 0.3) top.grounded = true;
          } else { // side by side: shove apart and trade some speed
            const s = Math.sign(dx) || 1;
            if (!a.held) a.x -= s * ox / 2;
            if (!c.held) c.x += s * ox / 2;
            const avx = a.vx, cvx = c.vx;
            if ((cvx - avx) * s < 0) { a.vx = cvx * 0.6; c.vx = avx * 0.6; }
          }
        }
      }
      // resting blocks tip over onto a flat face, so letters can end up sideways
      B.forEach(b => {
        if (b.held) return;
        if (b.grounded) {
          const flat = Math.round(b.r / 90) * 90;
          b.vr = (flat - b.r) * 14;
          if (Math.abs(b.vx) < W * 0.02) b.vx = 0;
        }
        render(b);
      });
    }

    function tick(time, ms) {
      const dt = Math.min(ms, 40) / 1000 * gsap.globalTimeline.timeScale();
      for (let k = 0; k < 3; k++) step(dt / 3);
      const moving = B.some(b => b.held || Math.abs(b.vx) + Math.abs(b.vy) > W * 0.05 || Math.abs(b.vr) > 20);
      quiet = moving ? 0 : quiet + dt;
      if (quiet > 0.6) sleep();
    }
    function wake() {
      quiet = 0;
      if (!running) { running = true; gsap.ticker.add(tick); }
    }
    function sleep() {
      if (running) { running = false; gsap.ticker.remove(tick); }
    }

    function knock(px) {
      measure();
      state = 'scattered';
      api.onScatter();
      SB.music.tock(1);
      B.forEach(b => {
        // blocks fly away from wherever the tap landed, higher ones further
        const away = (b.cx - px) / size;
        b.vx = (away * 0.35 + rand(-0.5, 0.5)) * W * 1.1;
        b.vy = -rand(0.7, 1.3) * W * (1.1 + (floor - b.cy) / size * 0.15);
        b.vr = rand(-900, 900);
      });
      wake();
    }

    function build(first) {
      measure();
      sleep();
      state = 'building';
      const tl = gsap.timeline({ onComplete() { state = 'built'; api.onBuilt(); } });
      B.forEach((b, k) => {
        b.vx = b.vy = b.vr = 0;
        b.r = ((b.r % 360) + 540) % 360 - 180; // take the short way round
        gsap.set(b.el, { rotation: b.r });
        if (first) gsap.set(b.el, { x: 0, y: -W * 0.9, rotation: rand(-30, 30), opacity: 0 });
        const at = k * (SB.reduced ? 0 : 0.13);
        tl.to(b.el, { opacity: 1, x: 0, y: -size * 1.6, rotation: 0, duration: SB.reduced ? 0 : 0.32, ease: 'power2.out' }, at)
          .to(b.el, { y: 0, duration: SB.reduced ? 0 : 0.16, ease: 'power3.in' }, '>')
          .add(() => {
            SB.music.tock(0.7);
            if (SB.reduced) return;
            gsap.fromTo(b.el, { scaleX: 1.18, scaleY: 0.78 }, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1.2, 0.35)', transformOrigin: '50% 100%' });
            // everything already standing gives a little shiver
            blocks.slice(0, k).forEach(o => gsap.fromTo(o, { rotation: rand(-4, 4) }, { rotation: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' }));
          });
        b.x = b.y = b.r = 0;
      });
    }
    api.build = build;

    // taps that land between blocks still count
    tower.addEventListener('pointerdown', e => {
      if (state !== 'built' || e.target.closest('.block')) return;
      const r = tower.getBoundingClientRect();
      knock(tower.offsetLeft + (e.clientX - r.left) * (tower.offsetWidth / r.width));
    });

    // grab and fling: track the last drag velocity and hand it to the simulation on release
    SB.onShow(page, first => {
      if (!first) return;
      B.forEach(b => {
        let lx = 0, ly = 0, lt = 0;
        Draggable.create(b.el, {
          bounds: page, zIndexBoost: true,
          onPress() {
            if (state === 'built') { knock(b.cx); return this.endDrag(); } // tapping the tower knocks it over
            if (state !== 'scattered') return this.endDrag();
            measure();
            b.held = true;
            gsap.killTweensOf(b.el);
            b.x = this.x; b.y = this.y;
            lx = this.x; ly = this.y; lt = performance.now();
            b.vx = b.vy = 0;
            wake();
          },
          onDrag() {
            const now = performance.now(), dt = Math.max(1, now - lt) / 1000;
            b.vx = b.vx * 0.4 + ((this.x - lx) / dt) * 0.6;
            b.vy = b.vy * 0.4 + ((this.y - ly) / dt) * 0.6;
            b.x = lx = this.x; b.y = ly = this.y; lt = now;
          },
          onRelease() {
            if (!b.held) return;
            b.held = false;
            const max = W * 4;
            b.vx = Math.max(-max, Math.min(max, b.vx));
            b.vy = Math.max(-max, Math.min(max, b.vy));
            b.vr = b.vx * 0.6;
            wake();
          },
        });
      });
    });
    return api;
  };
})();

export {}; // loaded as a module by ../mount.ts, which provides the globals it uses
