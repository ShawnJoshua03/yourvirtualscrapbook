import type { Metadata } from 'next';
import Scrapbook from '@/components/Scrapbook';
import { demoBook } from '@/demo/book';

export const metadata: Metadata = {
  title: 'Alex’s 25 ✦ · Yourvirtualscrapbook demo',
  description: 'A demo birthday scrapbook: every friend gets a page designed around what they wrote.',
};

export default function DemoPage() {
  return <Scrapbook book={demoBook} />;
}
