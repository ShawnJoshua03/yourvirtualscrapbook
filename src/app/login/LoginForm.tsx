'use client';

import { useActionState } from 'react';
import { sendSignInLink, type LoginState } from './actions';
import ui from '@/components/ui.module.css';

export default function LoginForm({ failed }: { failed: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendSignInLink, {});
  if (state.sent) {
    return (
      <div className={ui.card} role="status">
        <h2 className={ui.h2}>Check your email ✉️</h2>
        <p className={ui.muted}>We sent a sign-in link to <b>{state.sent}</b>. Open it on this device to continue.</p>
      </div>
    );
  }
  return (
    <form action={action} className={ui.card}>
      <label className={ui.field}>
        Your email
        <input className={ui.input} type="email" name="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" />
      </label>
      <button className={`${ui.btn} ${ui.btnAccent}`} disabled={pending}>{pending ? 'Sending…' : 'Email me a sign-in link'}</button>
      {state.error && <p className={ui.error} role="alert">{state.error}</p>}
      {failed && !state.error && <p className={ui.error} role="alert">That sign-in link didn’t work or has expired. Send a new one.</p>}
    </form>
  );
}
