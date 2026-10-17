/* Applies supabase/migrations/*.sql in order, each once, recorded in public._migrations.
   Reads POSTGRES_URL_NON_POOLING from .env.local (pull it with: npx vercel env pull .env.local).
   Run: node scripts/db-migrate.mjs */
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const ROOT = path.resolve(import.meta.dirname, '..');
for (const line of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const url = process.env.POSTGRES_URL_NON_POOLING;
if (!url || url === '[SENSITIVE]') throw new Error('POSTGRES_URL_NON_POOLING missing: run npx vercel env pull .env.local');

// Supabase signs database certificates with its own CA, which Node doesn't trust by default. Download it from
// Supabase → Project Settings → Database → SSL Configuration and point SUPABASE_DB_CA at the file to verify the server.
const caPath = process.env.SUPABASE_DB_CA;
const ssl = caPath ? { ca: fs.readFileSync(caPath, 'utf8') } : { rejectUnauthorized: false };
if (!caPath) console.warn('warning: SUPABASE_DB_CA not set, so the database certificate is not being verified (connection still encrypted)');
const db = new pg.Client({ connectionString: url.replace(/[?&]sslmode=[^&]*/, ''), ssl });
await db.connect();
await db.query('create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now())');
await db.query('alter table public._migrations enable row level security'); // no policies: invisible to app users

const dir = path.join(ROOT, 'supabase', 'migrations');
const done = new Set((await db.query('select name from public._migrations')).rows.map(r => r.name));
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
  if (done.has(file)) continue;
  const sql = fs.readFileSync(path.join(dir, file), 'utf8');
  try {
    await db.query('begin');
    await db.query(sql);
    await db.query('insert into public._migrations (name) values ($1)', [file]);
    await db.query('commit');
    console.log(`applied ${file}`);
  } catch (e) {
    await db.query('rollback');
    console.error(`failed ${file}: ${e.message}`);
    process.exitCode = 1;
    break;
  }
}
await db.end();
