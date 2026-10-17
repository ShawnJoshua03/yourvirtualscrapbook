import { Suspense } from 'react';
import type { Metadata } from 'next';
import { bookForInvite } from '@/lib/books';
import ContributeForm from './ContributeForm';
import ui from '@/components/ui.module.css';

export const metadata: Metadata = { title: 'Add your page ✦', robots: { index: false, follow: false } };

export default function InvitePage({ params }: PageProps<'/invite/[token]'>) {
  return (
    <main className={ui.page}>
      <div className={`${ui.wrap} ${ui.narrow}`}>
        <Suspense fallback={<p className={ui.muted}>Opening the book…</p>}>
          <Invite params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function Invite({ params }: { params: PageProps<'/invite/[token]'>['params'] }) {
  const { token } = await params;
  const book = await bookForInvite(token);
  if (!book || book.status !== 'collecting') {
    return (
      <>
        <h1 className={ui.h1}>This link isn’t open</h1>
        <p className={ui.lede}>It may have been replaced, or the book has already been given. Ask whoever sent it for the latest link.</p>
      </>
    );
  }
  return (
    <>
      <p className={ui.brand} style={{ marginBottom: 18 }}>YOURVIRTUALSCRAPBOOK</p>
      <h1 className={ui.h1}>A page for {book.nickname} ✦</h1>
      <p className={ui.lede}>
        {book.from_name} is making {book.recipient_name} a birthday book. Add a note and a few photos, and they’ll become your own page.
      </p>
      <ContributeForm token={token} nickname={book.nickname} />
    </>
  );
}
