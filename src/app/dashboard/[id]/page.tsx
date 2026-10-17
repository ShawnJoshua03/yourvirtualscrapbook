import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getMyBook } from '@/lib/books';
import { publicMediaUrl } from '@/lib/supabase/server';
import { setPublished, rotateInvite } from '../actions';
import CopyLink from './CopyLink';
import ContributionCard from './ContributionCard';
import BookSettings from './BookSettings';
import ui from '@/components/ui.module.css';

export const metadata: Metadata = { title: 'Your book · Yourvirtualscrapbook' };

export default function BookPage({ params }: PageProps<'/dashboard/[id]'>) {
  return (
    <main className={ui.page}>
      <div className={ui.wrap}>
        <div className={ui.top}>
          <Link className={ui.brand} href="/dashboard">← YOUR BOOKS</Link>
        </div>
        <Suspense fallback={<p className={ui.muted}>Loading the book…</p>}>
          <Manager params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function Manager({ params }: { params: PageProps<'/dashboard/[id]'>['params'] }) {
  const { id } = await params;
  const found = await getMyBook(id);
  if (!found) notFound();
  const { book, contributions } = found;
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
  const published = book.status === 'published';

  return (
    <>
      <h1 className={ui.h1}>{book.recipient_name}’s {book.age}</h1>
      <p className={ui.lede}>
        {contributions.length
          ? `${contributions.length} ${contributions.length === 1 ? 'friend has' : 'friends have'} added a page.`
          : 'No pages yet. Share the invite link with their friends.'}
      </p>

      <section className={ui.card}>
        <h2 className={ui.h2}>Invite friends</h2>
        <p className={ui.muted}>Share this in the group chat. Anyone with it can add a note and photos, no account needed.</p>
        <CopyLink url={`${origin}/invite/${book.invite_token}`} label="Invite link" />
        <form action={rotateInvite.bind(null, book.id)} style={{ marginTop: 10 }}>
          <button className={`${ui.btn} ${ui.btnGhost}`}>Make a new link (the old one stops working)</button>
        </form>
      </section>

      <section className={ui.card}>
        <h2 className={ui.h2}>{published ? 'Published ✓' : 'Ready to give it?'}</h2>
        {published ? (
          <>
            <p className={ui.muted}>This is the link for {book.nickname}. Only people with it can open the book.</p>
            <CopyLink url={`${origin}/b/${book.public_slug}`} label="Book link" />
          </>
        ) : (
          <p className={ui.muted}>Preview it first. Publishing makes a private link you send to {book.nickname}.</p>
        )}
        <div className={ui.row} style={{ marginTop: 12 }}>
          {/* a full page load: the book engine starts once per page */}
          <a className={ui.btn} href={`/dashboard/${book.id}/preview`}>Preview the book</a>
          <form action={setPublished.bind(null, book.id, !published)}>
            <button className={`${ui.btn} ${published ? ui.btnGhost : ui.btnAccent}`} disabled={!published && !contributions.length}>
              {published ? 'Unpublish' : 'Publish'}
            </button>
          </form>
        </div>
      </section>

      {contributions.length > 0 && <h2 className={ui.h2} style={{ marginTop: 28 }}>Pages</h2>}
      <ul className={ui.list}>
        {contributions.map(c => (
          <ContributionCard
            key={c.id}
            id={c.id}
            name={c.name}
            note={c.note}
            page={c.page}
            thumbs={c.media.map(m => ({ url: publicMediaUrl(m.thumb_path), video: m.kind === 'video' }))}
          />
        ))}
      </ul>

      <div style={{ marginTop: 28 }}>
        <BookSettings book={book} />
      </div>
    </>
  );
}
