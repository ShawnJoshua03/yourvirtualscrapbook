'use client';

import { useActionState } from 'react';
import { updateBook, type FormState } from '../actions';
import BookFields from '../BookFields';
import ui from '@/components/ui.module.css';

type Book = { id: string; recipient_name: string; nickname: string; age: number; birthday: string; sign: string | null; from_name: string; letter: string };

export default function BookSettings({ book }: { book: Book }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateBook.bind(null, book.id), {});
  return (
    <form action={action} className={ui.card}>
      <h2 className={ui.h2}>The book</h2>
      <BookFields v={book} />
      <label className={ui.field}>
        Your closing letter <small>the sealed envelope at the end, opened after the candles are blown out</small>
        <textarea className={ui.textarea} name="letter" maxLength={6000} defaultValue={book.letter}
          placeholder={`Happy birthday, ${book.nickname}. Everyone in this book had something different to say…`} />
      </label>
      <div className={ui.row}>
        <button className={ui.btn} disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
        {state.saved && !pending && <span className={ui.ok} role="status">Saved ✓</span>}
      </div>
      {state.error && <p className={ui.error} role="alert">{state.error}</p>}
    </form>
  );
}
