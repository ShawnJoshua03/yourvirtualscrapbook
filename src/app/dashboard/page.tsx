import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { listMyBooks } from '@/lib/books';
import { signOutAndLeave } from './actions';
import CreateBookForm from './CreateBookForm';
import ui from '@/components/ui.module.css';

export const metadata: Metadata = { title: 'Your books · Yourvirtualscrapbook' };

export default function Dashboard() {
  return (
    <main className={ui.page}>
      <div className={ui.wrap}>
        <div className={ui.top}>
          <Link className={ui.brand} href="/">YOURVIRTUALSCRAPBOOK</Link>
          <form action={signOutAndLeave}><button className={`${ui.btn} ${ui.btnGhost}`}>Sign out</button></form>
        </div>
        <h1 className={ui.h1}>Your books</h1>
        <p className={ui.lede}>Each book collects notes and photos from friends through one invite link.</p>
        <Suspense fallback={<p className={ui.muted}>Loading your books…</p>}>
          <Books />
        </Suspense>
        <CreateBookForm />
      </div>
    </main>
  );
}

async function Books() {
  const books = await listMyBooks();
  if (!books.length) return null;
  return (
    <ul className={ui.list} style={{ marginBottom: 24 }}>
      {books.map(b => (
        <li key={b.id}>
          <Link className={ui.bookLink} href={`/dashboard/${b.id}`}>
            <span>
              <b>{b.recipient_name}’s {b.age}</b>
              <br />
              <span className={ui.muted}>{b.contributionCount} {b.contributionCount === 1 ? 'friend has' : 'friends have'} added a page</span>
            </span>
            <span className={`${ui.pill} ${b.status === 'published' ? ui.pillLive : ''}`}>{b.status === 'published' ? 'PUBLISHED' : 'COLLECTING'}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
