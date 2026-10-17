import Link from 'next/link';
import styles from './home.module.css';

/* Placeholder home until the organizer flow exists: what it is, and the demo. */
export default function Home() {
  return (
    <main className={styles.main}>
      <p className={styles.kicker}>YOURVIRTUALSCRAPBOOK</p>
      <h1 className={styles.title}>A birthday book from everyone who loves them.</h1>
      <p className={styles.lede}>
        Every friend sends a note and a few photos. Each one becomes its own page, designed around what they wrote,
        in a book you flip through like the real thing.
      </p>
      <Link className={styles.cta} href="/demo">Flip through a demo book →</Link>
    </main>
  );
}
