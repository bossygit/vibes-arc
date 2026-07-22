-- ============================================================
-- Coaching sessions (Telegram coach bot reviews)
-- ============================================================

CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN (
    'daily', 'weekly', 'monthly', 'quarterly', 'midyear', 'yearly'
  )),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'paused', 'completed', 'abandoned'
  )),
  period_start DATE,
  period_end DATE,
  current_phase TEXT DEFAULT 'read' CHECK (current_phase IN (
    'read', 'analyze', 'interview', 'beliefs', 'willingness', 'close'
  )),
  question_index INT NOT NULL DEFAULT 0,
  data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  analysis JSONB,
  willingness_scores JSONB,
  summary TEXT,
  obsidian_path TEXT,
  telegram_chat_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coaching_sessions_user_status_idx
  ON coaching_sessions (user_id, status, started_at DESC);

COMMENT ON TABLE coaching_sessions IS
  'Sessions de coaching Telegram (daily/weekly/monthly/quarterly/midyear/yearly).';

-- ============================================================
-- Q&A pairs per coaching session
-- ============================================================

CREATE TABLE IF NOT EXISTS coaching_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  analysis TEXT,
  hypotheses JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coaching_qa_session_idx
  ON coaching_qa (session_id, created_at ASC);

COMMENT ON TABLE coaching_qa IS
  'Questions et réponses d''une session de coaching.';

-- ============================================================
-- Psychology data sync (from localStorage modules)
-- ============================================================

CREATE TABLE IF NOT EXISTS psychology_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL CHECK (module_type IN (
    'inner_child', 'priming', 'manifestation', 'focus_wheel',
    'money_mindset', 'magic_gratitude', 'environment'
  )),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS psychology_snapshots_user_module_idx
  ON psychology_snapshots (user_id, module_type, synced_at DESC);

COMMENT ON TABLE psychology_snapshots IS
  'Snapshots des modules psychologie synchronisés depuis le client web.';

-- ============================================================
-- Knowledge graph edges (Phase 4)
-- ============================================================

CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN (
    'correlates_with', 'triggers', 'blocks', 'enables'
  )),
  strength FLOAT NOT NULL DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_type, source_id, target_type, target_id, relationship)
);

CREATE INDEX IF NOT EXISTS knowledge_graph_edges_user_idx
  ON knowledge_graph_edges (user_id, detected_at DESC);

COMMENT ON TABLE knowledge_graph_edges IS
  'Graphe de connaissances personnel : objectifs ↔ habitudes ↔ émotions ↔ croyances.';

-- ============================================================
-- RLS : service role only (Edge Functions + coach bot)
-- ============================================================

ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychology_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_edges ENABLE ROW LEVEL SECURITY;
