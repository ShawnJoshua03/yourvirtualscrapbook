/* Runs on the contributor's phone. Photos are re-encoded to a 1600px JPEG plus a 600px thumbnail, which keeps
   uploads quick on weak signal and turns iPhone HEIC photos into something every browser shows. Videos upload
   as they are, with a poster frame grabbed here. */

export type Prepared =
  | { kind: 'photo'; full: Blob; thumb: Blob; w: number; h: number; preview: string }
  | { kind: 'video'; file: File; thumb: Blob; w: number; h: number; preview: string };

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

function loadImage(file: Blob): Promise<{ img: HTMLImageElement; done: () => void }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    // an <img> applies the photo's EXIF rotation, and Safari decodes HEIC: the most forgiving decoder
    img.onload = () => resolve({ img, done: () => URL.revokeObjectURL(url) });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
    img.src = url;
  });
}

async function toJpeg(src: CanvasImageSource, w: number, h: number, max: number, quality: number) {
  const scale = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * scale));
  c.height = Math.max(1, Math.round(h * scale));
  c.getContext('2d')!.drawImage(src, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/jpeg', quality));
  const size = { w: c.width, h: c.height };
  c.width = c.height = 0; // iOS keeps canvas memory until it's emptied
  if (!blob) throw new Error('encode failed');
  return { blob, ...size };
}

async function preparePhoto(file: File): Promise<Prepared> {
  const { img, done } = await loadImage(file);
  try {
    const full = await toJpeg(img, img.naturalWidth, img.naturalHeight, 1600, 0.82);
    const thumb = await toJpeg(img, img.naturalWidth, img.naturalHeight, 600, 0.76);
    return { kind: 'photo', full: full.blob, thumb: thumb.blob, w: thumb.w, h: thumb.h, preview: URL.createObjectURL(thumb.blob) };
  } finally { done(); }
}

/** A poster frame from about half a second in. If this browser can't decode the video, a plain placeholder. */
async function prepareVideo(file: File): Promise<Prepared> {
  if (file.size > MAX_VIDEO_BYTES) throw new Error('too-big');
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    Object.assign(video, { muted: true, playsInline: true, preload: 'auto', src: url });
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout')), 8000);
      video.onloadeddata = () => { clearTimeout(t); resolve(); };
      video.onerror = () => { clearTimeout(t); reject(new Error('undecodable')); };
    });
    video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    await new Promise(r => { video.onseeked = r; setTimeout(r, 1500); });
    const poster = await toJpeg(video, video.videoWidth, video.videoHeight, 600, 0.76);
    return { kind: 'video', file, thumb: poster.blob, w: poster.w, h: poster.h, preview: URL.createObjectURL(poster.blob) };
  } catch {
    const c = document.createElement('canvas');
    c.width = 600; c.height = 600;
    const g = c.getContext('2d')!;
    g.fillStyle = '#2a211c'; g.fillRect(0, 0, 600, 600);
    g.fillStyle = '#fbf5ea'; g.font = '700 120px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('▶', 300, 300);
    const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/jpeg', 0.8));
    return { kind: 'video', file, thumb: blob!, w: 600, h: 600, preview: URL.createObjectURL(blob!) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function prepare(file: File): Promise<Prepared> {
  return file.type.startsWith('video/') ? prepareVideo(file) : preparePhoto(file);
}

/** The upload type the server expects for a video file (some phones leave the type blank). */
export function videoType(file: File) {
  if (['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type)) return file.type;
  return /\.mov$/i.test(file.name) ? 'video/quicktime' : /\.webm$/i.test(file.name) ? 'video/webm' : 'video/mp4';
}

export const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Retries a few times with backoff: on bar or train signal, the second try often works. */
export async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { last = e; if (i < tries - 1) await wait(1000 * 2 ** i); }
  }
  throw last;
}
