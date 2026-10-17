'use client';

import { useActionState, useState } from 'react';
import { savePage, removeContribution, type FormState } from '../actions';
import { STYLES } from '@/engine/catalog';
import ui from '@/components/ui.module.css';

type Props = {
  id: string;
  name: string;
  note: string;
  page: { style: string; title?: string; quote?: string; [k: string]: unknown };
  thumbs: { url: string; video: boolean }[];
};

export default function ContributionCard({ id, name, note, page, thumbs }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePage.bind(null, id), {});
  const [style, setStyle] = useState(page.style);
  const [armed, setArmed] = useState(false);
  const { style: _s, title, quote, ...rest } = page;
  const info = STYLES.find(s => s.style === style);

  return (
    <li className={ui.card}>
      <div className={ui.row} style={{ justifyContent: 'space-between' }}>
        <h3 className={ui.h2} style={{ margin: 0 }}>{name}</h3>
        <span className={ui.muted}>{thumbs.length} {thumbs.length === 1 ? 'photo/video' : 'photos/videos'}</span>
      </div>
      {thumbs.length > 0 && (
        <div className={ui.thumbs}>
          {thumbs.slice(0, 10).map(t => <img key={t.url} src={t.url} alt="" loading="lazy" />)}
          {thumbs.length > 10 && <span className={ui.muted}>+{thumbs.length - 10}</span>}
        </div>
      )}
      {note ? <p className={ui.note}>{note}</p> : <p className={ui.muted}>No note, just photos.</p>}

      <form action={action} style={{ marginTop: 14 }}>
        <div className={ui.grid2}>
          <label className={ui.field}>
            Page style
            <select className={ui.select} name="style" value={style} onChange={e => setStyle(e.target.value)}>
              {STYLES.map(s => <option key={s.style} value={s.style}>{s.label}</option>)}
            </select>
            {info && <small>{info.about} Best with: {info.best}.</small>}
          </label>
          <label className={ui.field}>
            Page title <small>optional</small>
            <input className={ui.input} name="title" maxLength={80} defaultValue={title ?? ''} placeholder="e.g. run club of two" />
          </label>
        </div>
        <label className={ui.field}>
          Their line in the stars <small>a short quote from their note, shown on the “your people” page</small>
          <input className={ui.input} name="quote" maxLength={160} defaultValue={quote ?? ''} />
        </label>
        <details className={ui.details}>
          <summary>Extra options for this style</summary>
          <label className={ui.field} style={{ marginTop: 8 }}>
            <small>JSON, e.g. {'{"stamp": "LEGEND", "years": 4}'}. See the demo book for what each style accepts.</small>
            <textarea className={ui.textarea} name="options" style={{ minHeight: 90, fontFamily: 'ui-monospace, monospace', fontSize: 14 }}
              defaultValue={Object.keys(rest).length ? JSON.stringify(rest, null, 1) : ''} />
          </label>
        </details>
        <div className={ui.row} style={{ marginTop: 6 }}>
          <button className={ui.btn} disabled={pending}>{pending ? 'Saving…' : 'Save page'}</button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnDanger}`}
            onClick={async () => {
              if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 3000); return; }
              await removeContribution(id);
            }}
          >
            {armed ? 'Tap again to remove' : 'Remove'}
          </button>
          {state.saved && !pending && <span className={ui.ok} role="status">Saved ✓</span>}
        </div>
        {state.error && <p className={ui.error} role="alert">{state.error}</p>}
      </form>
    </li>
  );
}
