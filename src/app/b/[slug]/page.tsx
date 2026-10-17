import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Scrapbook from '@/components/Scrapbook';
import { publishedBook } from '@/lib/books';

// a published book is private to whoever has its link: keep it out of search engines
export const metadata: Metadata = { title: 'A birthday book ✦', robots: { index: false, follow: false } };

export default function PublishedBookPage({ params }: PageProps<'/b/[slug]'>) {
  return (
    <Suspense fallback={null}>
      <Published params={params} />
    </Suspense>
  );
}

async function Published({ params }: { params: PageProps<'/b/[slug]'>['params'] }) {
  const { slug } = await params;
  const book = await publishedBook(slug);
  if (!book) notFound();
  return <Scrapbook book={book} />;
}
