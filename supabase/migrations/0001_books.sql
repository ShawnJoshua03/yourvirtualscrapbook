-- Books, the friends' contributions to them, and their photos/videos.
-- Organizers reach their own rows through row-level security. Contributors have no database access at all:
-- they write through server routes that check the book's invite token and use the service key.

create table public.books (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users (id) on delete cascade,
  recipient_name text not null check (char_length(recipient_name) between 1 and 60),
  nickname       text not null check (char_length(nickname) between 1 and 30),
  age            int check (age between 1 and 130),
  birthday       text check (char_length(birthday) <= 40),
  sign           text check (char_length(sign) <= 40),
  from_name      text not null check (char_length(from_name) between 1 and 60),
  letter         text not null default '' check (char_length(letter) <= 6000),
  -- the link friends use to contribute; rotate it to cut off an old link
  invite_token   text not null unique default encode(extensions.gen_random_bytes(12), 'hex'),
  -- set when published: the recipient's link is /b/<public_slug>
  public_slug    text unique,
  status         text not null default 'collecting' check (status in ('collecting', 'published')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index books_owner_idx on public.books (owner_id);

create table public.contributions (
  id         uuid primary key,  -- made by the contributor's phone, so a retried submit can't duplicate
  book_id    uuid not null references public.books (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  note       text not null default '' check (char_length(note) <= 4000),
  -- how their page looks: {"style": "...", ...style options}; the organizer edits this
  page       jsonb not null default '{"style": "auto"}'::jsonb,
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index contributions_book_idx on public.contributions (book_id, position);

create table public.media (
  id              uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.contributions (id) on delete cascade,
  book_id         uuid not null references public.books (id) on delete cascade,
  kind            text not null check (kind in ('photo', 'video')),
  path            text not null,  -- storage path of the full photo or the video
  thumb_path      text not null,  -- storage path of the thumbnail or video poster
  w               int not null check (w > 0),
  h               int not null check (h > 0),
  position        int not null default 0
);
create index media_contribution_idx on public.media (contribution_id, position);

-- keep updated_at honest
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger books_touch before update on public.books for each row execute function public.touch_updated_at();

alter table public.books enable row level security;
alter table public.contributions enable row level security;
alter table public.media enable row level security;

create policy "organizers manage their books" on public.books
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- organizers read, edit and remove contributions to their books; inserts only come from the server
create policy "organizers read contributions" on public.contributions
  for select to authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.owner_id = (select auth.uid())));
create policy "organizers edit contributions" on public.contributions
  for update to authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.books b where b.id = book_id and b.owner_id = (select auth.uid())));
create policy "organizers remove contributions" on public.contributions
  for delete to authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.owner_id = (select auth.uid())));

create policy "organizers read media" on public.media
  for select to authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.owner_id = (select auth.uid())));
create policy "organizers remove media" on public.media
  for delete to authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.owner_id = (select auth.uid())));

-- Photos and videos. Public read by URL: every path contains random ids, so a file is only reachable by someone
-- who already has the book's link. Nobody can list the bucket, and uploads only happen through signed upload URLs
-- the server hands out after checking the invite token.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800, array['image/jpeg', 'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;
