-- 雲端同步 schema（見 docs/specs/cloud-sync.md）
-- 使用方式：貼到 Supabase Dashboard → SQL Editor 執行一次。
-- 單一通用表：本地 Dexie 各表的資料列以 (table_name, key, data jsonb) 形式存放，
-- 本地 schema 演進時雲端無需跟著遷移。

create table public.user_data (
  user_id uuid not null default auth.uid(),
  table_name text not null,
  key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  device_id text not null default '',
  primary key (user_id, table_name, key)
);

alter table public.user_data enable row level security;

create policy "使用者只能存取自己的資料"
  on public.user_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 拉取查詢（updated_at > 上次拉取時間）的索引
create index user_data_pull_idx on public.user_data (user_id, updated_at);
