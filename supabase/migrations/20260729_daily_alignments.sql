-- Daily Alignment (Morning Intention → Evening Evidence)
-- Migration: 20260729_daily_alignments

CREATE TABLE IF NOT EXISTS daily_alignments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    morning JSONB,                              -- MorningIntention | null
    evening JSONB,                              -- EveningEvidence | null
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

ALTER TABLE daily_alignments ENABLE ROW LEVEL SECURITY;

-- Lecture : propriétaire uniquement
CREATE POLICY "Users can read own daily alignments"
    ON daily_alignments FOR SELECT
    USING (auth.uid() = user_id);

-- Insertion : propriétaire uniquement
CREATE POLICY "Users can insert own daily alignments"
    ON daily_alignments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Mise à jour : propriétaire uniquement
CREATE POLICY "Users can update own daily alignments"
    ON daily_alignments FOR UPDATE
    USING (auth.uid() = user_id);

-- Suppression : propriétaire uniquement
CREATE POLICY "Users can delete own daily alignments"
    ON daily_alignments FOR DELETE
    USING (auth.uid() = user_id);

-- Index pour les requêtes par date
CREATE INDEX IF NOT EXISTS idx_daily_alignments_date ON daily_alignments(user_id, date);

COMMENT ON TABLE daily_alignments IS 'Entrée journalière de la boucle Daily Alignment (morning + evening)';