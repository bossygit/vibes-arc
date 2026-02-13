-- Web Push subscriptions (Vibes Arc)
-- Create this table in Supabase (SQL editor).

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text,
  auth text,
  subscription jsonb not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists push_subscriptions_user_endpoint_uq
  on public.push_subscriptions(user_id, endpoint);

alter table public.push_subscriptions enable row level security;

-- Users can manage their own subscriptions (optional; API uses service role anyway)
drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions
  for select
  using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions
  for delete
  using (auth.uid() = user_id);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_push_subscriptions_updated_at on public.push_subscriptions;
create trigger trg_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();

-- ─── pg_cron + pg_net : notifications Web Push horaires ─────────────────────
-- Prerequis : remplacer <APP_URL> et <CRON_SECRET> par les vraies valeurs
-- avant d'executer ce bloc dans l'editeur SQL de Supabase.

-- Activer les extensions (disponibles sur tous les plans Supabase)
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Supprimer l'ancien job s'il existe (pour pouvoir re-executer le script)
select cron.unschedule('hourly-push-notifications')
where exists (
  select 1 from cron.job where jobname = 'hourly-push-notifications'
);

-- Job horaire : appeler /api/push/cron toutes les heures de 4h a 20h UTC
-- (~6h-22h Europe/Paris ; le endpoint filtre aussi par fuseau utilisateur)
select cron.schedule(
  'hourly-push-notifications',
  '0 4-20 * * *',
  $$
  select net.http_post(
    url    := 'https://<APP_URL>/api/push/cron',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
    ),
    body   := '{}'::jsonb
  );
  $$
);

