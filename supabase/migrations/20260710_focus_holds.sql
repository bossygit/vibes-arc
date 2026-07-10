-- =====================================================================
-- Focus Radar — Migration : Focus 17/68
-- Pratique de concentration sur une pensée unique
-- (règle des 17/68 secondes, Abraham-Hicks)
-- =====================================================================
-- Note sur les conventions : ton schéma local (src/database/schema.sql,
-- SQLite) utilise des ID entiers auto-incrémentés et n'a pas de user_id
-- (app mono-utilisateur en local). Cette migration cible ta prod Supabase
-- (confirmée par tes Edge Functions/cron), qui utilise normalement des
-- uuid + RLS pour le multi-device. Cette table est autonome (aucune FK
-- vers habits ici), donc pas de risque de conflit de type pour l'instant.
-- =====================================================================

create table public.focus_holds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intention_label text,                          -- pensée/désir visé (optionnel)
  started_at timestamptz not null default now(),
  duration_seconds numeric not null,
  milestone_reached integer not null default 0
    check (milestone_reached between 0 and 4),    -- 0=aucun, 1=17s, 2=34s, 3=51s, 4=68s (cycle complet)
  created_at timestamptz not null default now()
);

create index idx_focus_holds_user_date on public.focus_holds(user_id, started_at desc);

alter table public.focus_holds enable row level security;

create policy "Users manage own focus holds"
  on public.focus_holds for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
