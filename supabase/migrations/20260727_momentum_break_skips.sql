-- ============================================================
-- momentum_break_skips : table for Loop 3
-- Stores skip records from the MomentumBreakDialog so the
-- coach AI can read real patterns instead of relying on
-- static self_sabotage_patterns alone.
-- ============================================================

CREATE TABLE IF NOT EXISTS momentum_break_skips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consecutive_skips  INTEGER NOT NULL DEFAULT 0,
  week_skips       INTEGER NOT NULL DEFAULT 0,
  last_skip_tone   TEXT,
  last_skip_subtitle TEXT,
  last_skip_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT momentum_break_skips_user_date_key
    UNIQUE (user_id, last_skip_date)
);

CREATE INDEX IF NOT EXISTS momentum_break_skips_user_id_idx
  ON momentum_break_skips (user_id);

CREATE INDEX IF NOT EXISTS momentum_break_skips_user_date_idx
  ON momentum_break_skips (user_id, last_skip_date DESC);

COMMENT ON TABLE momentum_break_skips IS
  'Track how often the user dismisses momentum break dialogs.
   The coach AI reads this to adapt its tone and avoid
   recommending actions the user already knows dont work for them.';
