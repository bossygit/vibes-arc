-- ============================================================
-- Coach chat tables (persistent conversation + coach memory)
-- ============================================================

CREATE TABLE IF NOT EXISTS coach_messages (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  provider    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coach_messages_user_created_idx
  ON coach_messages (user_id, created_at DESC);

COMMENT ON TABLE coach_messages IS
  'Historique complet des échanges entre l''utilisateur et le Coach Vibes (iOS + web).';

CREATE TABLE IF NOT EXISTS coach_memory (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  summary             TEXT NOT NULL DEFAULT '',
  key_facts           JSONB NOT NULL DEFAULT '[]'::jsonb,
  conversation_count  INTEGER NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE coach_memory IS
  'Mémoire longue du coach : résumé évolutif + faits clés + nombre de sessions.';

-- ============================================================
-- RLS : service role only (l''accès passe par les Edge Functions)
-- ============================================================

ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_memory   ENABLE ROW LEVEL SECURITY;

-- Aucune policy pour anon/authenticated -> lecture/écriture refusées par défaut.
-- Le service_role bypass RLS, donc les Edge Functions (coach-chat, coach-api)
-- qui utilisent SUPABASE_SERVICE_ROLE_KEY continuent de fonctionner.
