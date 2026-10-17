import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from './LoginForm';
import ui from '@/components/ui.module.css';

export const metadata: Metadata = { title: 'Sign in · Yourvirtualscrapbook' };

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <main className={ui.page}>
      <div className={`${ui.wrap} ${ui.narrow}`}>
        <div className={ui.top}><Link className={ui.brand} href="/">YOURVIRTUALSCRAPBOOK</Link></div>
        <h1 className={ui.h1}>Make a book</h1>
        <p className={ui.lede}>Sign in with your email. No password: we’ll send you a link.</p>
        <Suspense fallback={<LoginForm failed={false} />}>
          <Form searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<'/login'>['searchParams'] }) {
  const { error } = await searchParams;
  return <LoginForm failed={error === 'link'} />;
}
