-- ============================================================
-- Vibes Arc v2 — Tribunal de la Vie + Nature Vibratoire
-- Migration : Désirs, Daily Moods, Accusateurs
-- ============================================================

-- ============================================================
-- 1. DÉSIRS (nouvelle entité racine)
-- ============================================================

CREATE TABLE IF NOT EXISTS desires (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('avoir', 'être')),
    description TEXT,
    target TEXT,
    linked_identity_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS desires_user_idx ON desires (user_id, created_at DESC);

COMMENT ON TABLE desires IS
    'Désirs de l''utilisateur. Architecture: Désir → Identité → Signaux → Preuves.';

-- ============================================================
-- 2. CHECK-IN VIBRATOIRE QUOTIDIEN
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_moods (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 10),
    dominant_emotion TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS daily_moods_user_date_idx ON daily_moods (user_id, date DESC);

COMMENT ON TABLE daily_moods IS
    'Check-in vibratoire quotidien (échelle 1-10, Esther Hicks).
     1-3: Résistance | 4-6: Neutre | 7-8: Alignement | 9-10: Plein alignement.';

-- ============================================================
-- 3. ACCUSATEURS (anti-habitudes)
-- ============================================================

CREATE TABLE IF NOT EXISTS accusers (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    linked_desire_id INTEGER NOT NULL,
    total_days INTEGER NOT NULL DEFAULT 92,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accusers_user_desire_idx ON accusers (user_id, linked_desire_id);

COMMENT ON TABLE accusers IS
    'Comportements qui témoignent CONTRE le désir. L''utilisateur les définit explicitement.';

-- ============================================================
-- 4. PROGRESSION DES ACCUSATEURS
-- ============================================================

CREATE TABLE IF NOT EXISTS accuser_progress (
    id SERIAL PRIMARY KEY,
    accuser_id INTEGER NOT NULL REFERENCES accusers(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL,
    occurred BOOLEAN NOT NULL DEFAULT false,
    occurred_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (accuser_id, day_index)
);

CREATE INDEX IF NOT EXISTS accuser_progress_accuser_idx ON accuser_progress (accuser_id, day_index);

COMMENT ON TABLE accuser_progress IS
    'Progression journalière des accusateurs. occurred=true signifie que l''accusation a eu lieu.';

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE desires ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE accusers ENABLE ROW LEVEL SECURITY;
ALTER TABLE accuser_progress ENABLE ROW LEVEL SECURITY;

-- Policies: l'utilisateur ne voit que ses propres données
CREATE POLICY "Users manage own desires" ON desires
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own moods" ON daily_moods
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own accusers" ON accusers
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- accuser_progress hérite de la RLS via la FK sur accusers (mais on ajoute une policy directe)
CREATE POLICY "Users manage own accuser progress" ON accuser_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM accusers a
            WHERE a.id = accuser_progress.accuser_id AND a.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM accusers a
            WHERE a.id = accuser_progress.accuser_id AND a.user_id = auth.uid()
        )
    );
