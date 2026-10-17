'use client';

/* What a friend fills in from the invite link: name, note, photos and videos. Everything is prepared on the phone,
   uploaded straight to storage, then the page is saved. Retrying never duplicates: the page id is fixed per form. */
import { useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { prepare, videoType, withRetry, MAX_VIDEO_BYTES, type Prepared } from '@/lib/media-client';
import ui from '@/components/ui.module.css';

type Picked = { id: string; name: string; state: 'preparing' | 'ready' | 'failed'; item?: Prepared; error?: string };
const MAX = 40;

export default function ContributeForm({ token, nickname }: { token: string; nickname: string }) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState<Picked[]>([]);
  const [phase, setPhase] = useState<'editing' | 'sending' | 'done'>('editing');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const contributionId = useMemo(() => crypto.randomUUID(), []);
  const storage = useMemo(
    () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } }).storage.from('media'),
    [],
  );

  async function addFiles(files: File[]) {
    const room = MAX - picked.length;
    const batch = files.slice(0, room).map(file => ({ file, entry: { id: crypto.randomUUID(), name: file.name, state: 'preparing' as const } }));
    if (files.length > room) setError(`Up to ${MAX} photos and videos. The first ${room} were added.`);
    setPicked(p => [...p, ...batch.map(b => b.entry)]);
    for (const { file, entry } of batch) { // one at a time keeps phone memory in check
      try {
        const item = await prepare(file);
        setPicked(p => p.map(x => (x.id === entry.id ? { ...x, state: 'ready', item } : x)));
      } catch (e) {
        const msg = (e as Error).message === 'too-big' ? `Over ${MAX_VIDEO_BYTES / 1048576} MB: trim it and try again` : 'Couldn’t read this one';
        setPicked(p => p.map(x => (x.id === entry.id ? { ...x, state: 'failed', error: msg } : x)));
      }
    }
  }

  async function send() {
    setError('');
    const ready = picked.filter(p => p.state === 'ready').map(p => p.item!);
    if (!name.trim()) return setError('Add your name so they know who it’s from.');
    if (!note.trim() && !ready.length) return setError('Write a note or add at least one photo.');
    if (picked.some(p => p.state === 'preparing')) return setError('Still getting your photos ready, one moment…');
    setPhase('sending');
    setProgress(0);
    try {
      // one upload slot per file: photos send a full + thumbnail, videos the file + poster
      const files = ready.flatMap(m => (m.kind === 'photo'
        ? [{ type: 'image/jpeg', blob: m.full }, { type: 'image/jpeg', blob: m.thumb }]
        : [{ type: videoType(m.file), blob: m.file as Blob }, { type: 'image/jpeg', blob: m.thumb }]));
      let slots: { path: string; token: string }[] = [];
      if (files.length) {
        const r = await withRetry(() => fetch(`/api/invite/${token}/uploads`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ contributionId, files: files.map(f => ({ type: f.type })) }),
        }));
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Couldn’t start the upload.');
        slots = j.slots;
      }
      let done = 0;
      for (const [i, f] of files.entries()) {
        await withRetry(async () => {
          const { error: e } = await storage.uploadToSignedUrl(slots[i].path, slots[i].token, f.blob, { contentType: f.type, upsert: true });
          if (e) throw e;
        });
        setProgress(Math.round((++done / files.length) * 100));
      }
      const media = ready.map((m, k) => ({ kind: m.kind, path: slots[k * 2].path, thumbPath: slots[k * 2 + 1].path, w: m.w, h: m.h }));
      const r = await withRetry(() => fetch(`/api/invite/${token}/submit`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contributionId, name, note, media }),
      }));
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Couldn’t save your page.');
      setPhase('done');
    } catch (e) {
      setError(`${(e as Error).message || 'Something went wrong.'} Your note and photos are still here: tap send again.`);
      setPhase('editing');
    }
  }

  if (phase === 'done') {
    return (
      <div className={ui.card} role="status">
        <h2 className={ui.h2}>Sent! 🎉</h2>
        <p className={ui.muted}>Your page is in {nickname}’s book. They’ll see it when it’s given to them.</p>
      </div>
    );
  }

  const ready = picked.filter(p => p.state === 'ready').length;
  return (
    <form className={ui.card} onSubmit={e => { e.preventDefault(); send(); }}>
      <label className={ui.field}>
        Your name
        <input className={ui.input} value={name} onChange={e => setName(e.target.value)} maxLength={40} autoComplete="given-name" required />
      </label>
      <label className={ui.field}>
        Your note to {nickname}
        <textarea className={ui.textarea} value={note} onChange={e => setNote(e.target.value)} maxLength={4000}
          placeholder="A memory, an inside joke, what they mean to you…" />
        <small>{note.length > 3500 ? `${4000 - note.length} characters left` : 'Emoji welcome. They become stickers.'}</small>
      </label>

      <div className={ui.field}>
        Photos and videos <small>up to {MAX}; videos up to {MAX_VIDEO_BYTES / 1048576} MB each</small>
        <button type="button" className={ui.drop} onClick={() => fileInput.current?.click()} disabled={phase === 'sending' || picked.length >= MAX}>
          <span style={{ fontSize: 28 }}>📸</span>
          <span>{picked.length ? 'Add more' : 'Choose photos and videos'}</span>
        </button>
        <input ref={fileInput} type="file" accept="image/*,video/*" multiple hidden
          onChange={e => { addFiles([...(e.target.files ?? [])]); e.target.value = ''; }} />
      </div>
      {picked.length > 0 && (
        <div className={ui.picked}>
          {picked.map(p => (
            <figure key={p.id}>
              {p.item && <img src={p.item.preview} alt="" />}
              <figcaption>
                {p.state === 'preparing' ? 'getting ready…' : p.state === 'failed' ? p.error : p.item?.kind === 'video' ? '▶ video' : ''}
              </figcaption>
              {phase === 'editing' && (
                <button type="button" aria-label="Remove" onClick={() => setPicked(x => x.filter(y => y.id !== p.id))}
                  style={{ position: 'absolute', top: 4, right: 4, width: 28, height: 28, borderRadius: 99, border: 0, background: 'rgba(0,0,0,.6)', color: '#fff', cursor: 'pointer' }}>✕</button>
              )}
            </figure>
          ))}
        </div>
      )}

      {phase === 'sending' && (
        <>
          <div className={ui.progress} aria-hidden><i style={{ width: `${progress}%` }} /></div>
          <p className={ui.muted} role="status">Sending{ready ? ` ${ready} photo${ready > 1 ? 's' : ''}/video${ready > 1 ? 's' : ''}` : ''}… {progress}%</p>
        </>
      )}
      <button className={`${ui.btn} ${ui.btnAccent}`} disabled={phase === 'sending'}>{phase === 'sending' ? 'Sending…' : `Send my page to ${nickname}’s book`}</button>
      {error && <p className={ui.error} role="alert">{error}</p>}
    </form>
  );
}
