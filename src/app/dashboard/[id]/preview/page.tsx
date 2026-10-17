import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Scrapbook from '@/components/Scrapbook';
import { getMyBook, toEngineBook } from '@/lib/books';

export const metadata: Metadata = { title: 'Preview · Yourvirtualscrapbook', robots: { index: false } };

export default function PreviewPage({ params }: PageProps<'/dashboard/[id]/preview'>) {
  return (
    <Suspense fallback={null}>
      <Preview params={params} />
    </Suspense>
  );
}

async function Preview({ params }: { params: PageProps<'/dashboard/[id]/preview'>['params'] }) {
  const { id } = await params;
  const found = await getMyBook(id);
  if (!found) notFound();
  return <Scrapbook book={toEngineBook(found.book, found.contributions)} />;
}
