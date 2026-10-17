'use client';

import { useActionState } from 'react';
import { createBook, type FormState } from './actions';
import BookFields from './BookFields';
import ui from '@/components/ui.module.css';

export default function CreateBookForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createBook, {});
  return (
    <form action={action} className={ui.card}>
      <h2 className={ui.h2}>Start a book</h2>
      <BookFields />
      <button className={`${ui.btn} ${ui.btnAccent}`} disabled={pending}>{pending ? 'Creating…' : 'Create the book'}</button>
      {state.error && <p className={ui.error} role="alert">{state.error}</p>}
    </form>
  );
}
