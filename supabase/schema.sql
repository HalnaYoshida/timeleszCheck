-- Supabase の SQL Editor で実行してください

create table public.tv_appearances (
  pk            bigint generated always as identity primary key,
  appearance_id text        not null,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  title         text        not null default '',
  channel       text        not null default '',
  datetime      timestamptz not null,
  category      text        not null default '',
  role          text        not null default '出演',
  watched       boolean     not null default false,
  is_manual     boolean     not null default false,
  created_at    timestamptz not null default now(),

  constraint tv_appearances_appearance_id_user_id_key
    unique (appearance_id, user_id)
);

alter table public.tv_appearances enable row level security;

create policy "Users can manage their own appearances"
  on public.tv_appearances
  for all
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
