/* Generates the demo book's placeholder media: illustrated scenes (gradient sky, sun, little figures, a caption)
   instead of real photos, and short slow-zoom videos made from them. Output: public/demo/<friend>/ + src/demo/media.json
   Run: node scripts/make-demo-media.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import ffmpeg from 'ffmpeg-static';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public', 'demo');

// palettes: [sky top, sky bottom, ground, sun]
const P = {
  dusk: ['#ff9a8b', '#ffd3a5', '#7a5c8e', '#fff3c4'],
  beach: ['#6ec6ff', '#c9f0ff', '#f3d9a4', '#fff6b0'],
  night: ['#141b4d', '#4b3f8f', '#221a3d', '#f5f0ff'],
  park: ['#9be7c4', '#e6fff2', '#5aa469', '#fffbd1'],
  city: ['#ffb199', '#ff7aa2', '#3d3550', '#ffe7a8'],
  party: ['#c471f5', '#fa71cd', '#432c5a', '#ffe0f7'],
  snow: ['#bcd7ff', '#f5f9ff', '#e9f0fa', '#ffffff'],
  diner: ['#ffcf70', '#ffef9f', '#c0392b', '#fff8e1'],
};
// one entry per friend: [palette, caption, orientation, type?]
const SCENES = {
  leah: [['city', 'lisbon, again', 'p']],
  theo: [['park', 'first day of uni', 'l'], ['party', '21st', 'p'], ['beach', 'that summer', 'l'], ['snow', 'snow day', 'p']],
  priya: [['party', 'birthday #22', 'l'], ['dusk', 'rooftop', 'p'], ['night', 'late drive', 'p', 'video'], ['beach', 'beach day', 'l'],
    ['city', 'concert', 'p'], ['park', 'picnic', 'l'], ['party', 'birthday #24', 'p', 'video'], ['diner', 'pancakes at 2am', 'l']],
  sam: [['night', 'road trip', 'p', 'video']],
  ines: [['city', 'first lecture', 'p'], ['park', 'conference', 'l'], ['diner', 'lab lunch', 'p'], ['party', 'graduation', 'l'], ['beach', 'reunion', 'l']],
  noor: [['beach', 'golden hour', 'p'], ['dusk', 'sunset walk', 'p']],
  ravi: [['diner', 'book club', 'p'], ['city', 'movie night', 'p'], ['park', 'frisbee', 'p']],
  kai: [['party', 'the wall', 'p'], ['night', 'karaoke', 'p', 'video'], ['dusk', 'sunset', 'l'], ['city', 'museum', 'p'], ['beach', 'swim', 'l'],
    ['snow', 'cabin trip', 'p'], ['diner', 'brunch', 'l'], ['park', 'hike', 'p'], ['party', 'halloween', 'p', 'video'], ['night', 'stargazing', 'l']],
  zoe: [['party', 'then vs now', 'p']],
  eli: [['park', 'graduation', 'l'], ['city', 'new job', 'p'], ['dusk', 'moving day', 'p'], ['diner', 'celebration', 'l'], ['beach', 'vacation', 'p'], ['party', 'housewarming', 'l']],
  mira: [['beach', 'home beach', 'p', 'video'], ['city', 'old street', 'l', 'video'], ['dusk', 'balcony', 'p', 'video'], ['party', 'our song', 'p', 'video']],
  ben: [['diner', 'ramen night', 'p']],
  june: [['dusk', 'orientation week', 'l'], ['party', 'the night we met', 'l'], ['park', 'same seminar', 'p'], ['snow', 'winter formal', 'p']],
  omar: [['park', 'saturday 5k', 'p'], ['city', 'office', 'l'], ['diner', 'lunch run', 'l'], ['night', 'the flat', 'l', 'video']],
};

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// a seeded random, so regenerating gives the same pictures
function rng(seed) { let x = 0; for (const c of seed) x = (x * 31 + c.charCodeAt(0)) >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32); }

function sceneSvg([pal, caption], w, h, seed) {
  const [top, bottom, ground, sun] = P[pal];
  const r = rng(seed);
  const horizon = h * (0.62 + r() * 0.08);
  const people = 2 + Math.floor(r() * 2);
  const figs = Array.from({ length: people }, (_, k) => {
    const cx = w * (0.32 + (k / Math.max(1, people - 1)) * 0.36) + (r() - 0.5) * w * 0.05;
    const s = Math.min(w, h) * (0.16 + r() * 0.03);
    const col = ['#2b2340', '#3b2f4a', '#4a3550', '#2f3a4a'][k % 4];
    return `<g fill="${col}" opacity=".92"><circle cx="${cx}" cy="${horizon - s * 1.55}" r="${s * 0.32}"/>
      <rect x="${cx - s * 0.42}" y="${horizon - s * 1.2}" width="${s * 0.84}" height="${s * 1.25}" rx="${s * 0.38}"/></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <circle cx="${w * (0.2 + r() * 0.6)}" cy="${horizon * (0.3 + r() * 0.25)}" r="${Math.min(w, h) * 0.11}" fill="${sun}" opacity=".9"/>
    <path d="M0 ${horizon} Q ${w * 0.3} ${horizon - h * 0.05} ${w * 0.55} ${horizon} T ${w} ${horizon - h * 0.02} V ${h} H 0 Z" fill="${ground}"/>
    ${figs}
    <text x="${w * 0.06}" y="${h * 0.93}" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="${Math.round(Math.min(w, h) * 0.075)}" fill="#fff" stroke="rgba(0,0,0,.25)" stroke-width="2" paint-order="stroke">${esc(caption)}</text>
  </svg>`;
}

const manifest = {};
for (const [friend, scenes] of Object.entries(SCENES)) {
  const dir = path.join(OUT, friend);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  manifest[friend] = [];
  for (const [i, scene] of scenes.entries()) {
    const n = String(i + 1).padStart(2, '0');
    const [w, h] = scene[2] === 'l' ? [1600, 1200] : [1200, 1600];
    const png = await sharp(Buffer.from(sceneSvg(scene, w, h, friend + n))).png().toBuffer();
    if (scene[3] === 'video') {
      const still = path.join(dir, `${n}-still.png`);
      fs.writeFileSync(still, png);
      const [vw, vh] = scene[2] === 'l' ? [1280, 720] : [720, 1280];
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-loop', '1', '-i', still, '-t', '6',
        '-vf', `scale=${vw * 2}:-2,zoompan=z='min(zoom+0.0012,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=${vw}x${vh}:fps=30,format=yuv420p`,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '28', '-movflags', '+faststart', path.join(dir, `${n}.mp4`)]);
      fs.rmSync(still);
      await sharp(png).resize({ width: 600, height: 600, fit: 'inside' }).jpeg({ quality: 78 }).toFile(path.join(dir, `${n}-poster.jpg`));
      const meta = await sharp(path.join(dir, `${n}-poster.jpg`)).metadata();
      manifest[friend].push({ type: 'video', src: `/demo/${friend}/${n}.mp4`, thumb: `/demo/${friend}/${n}-poster.jpg`, w: meta.width, h: meta.height });
    } else {
      await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(dir, `${n}-1600.jpg`));
      await sharp(png).resize({ width: 600, height: 600, fit: 'inside' }).jpeg({ quality: 78 }).toFile(path.join(dir, `${n}-600.jpg`));
      const meta = await sharp(path.join(dir, `${n}-600.jpg`)).metadata();
      manifest[friend].push({ type: 'photo', src: `/demo/${friend}/${n}-1600.jpg`, thumb: `/demo/${friend}/${n}-600.jpg`, w: meta.width, h: meta.height });
    }
  }
  console.log(`${friend}: ${scenes.length}`);
}
fs.writeFileSync(path.join(ROOT, 'src', 'demo', 'media.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log('wrote src/demo/media.json');
