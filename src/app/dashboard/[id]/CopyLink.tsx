'use client';

import { useState } from 'react';
import ui from '@/components/ui.module.css';

export default function CopyLink({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={ui.copyBox}>
      <input className={ui.input} readOnly value={url} aria-label={label} onFocus={e => e.currentTarget.select()} />
      <button
        type="button"
        className={ui.btn}
        onClick={async () => {
          try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
        }}
      >
        {copied ? 'Copied ✓' : 'Copy'}
      </button>
    </div>
  );
}
