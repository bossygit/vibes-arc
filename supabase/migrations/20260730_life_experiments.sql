-- D17 — Life Experiment Engine
-- Migration: 20260730_life_experiments
-- Chaque expérience suit une hypothèse sur 7 jours avec 5 métriques

CREATE TABLE IF NOT EXISTS life_experiments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    hypothesis TEXT DEFAULT '',
    desire_id INTEGER REFERENCES desires(id) ON DELETE SET NULL,
    metrics TEXT[] DEFAULT '{mood,energy,behavior,performance,momentum}',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    entries JSONB DEFAULT '[]'::jsonb,
    conclusion TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE life_experiments ENABLE ROW LEVEL SECURITY;

-- Lecture : propriétaire uniquement
CREATE POLICY "Users can read own experiments"
    ON life_experiments FOR SELECT
    USING (auth.uid() = user_id);

-- Insertion : propriétaire uniquement
CREATE POLICY "Users can insert own experiments"
    ON life_experiments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Mise à jour : propriétaire uniquement
CREATE POLICY "Users can update own experiments"
    ON life_experiments FOR UPDATE
    USING (auth.uid() = user_id);

-- Suppression : propriétaire uniquement
CREATE POLICY "Users can delete own experiments"
    ON life_experiments FOR DELETE
    USING (auth.uid() = user_id);

-- Index pour filtrage par statut
CREATE INDEX IF NOT EXISTS idx_life_experiments_status ON life_experiments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_life_experiments_dates ON life_experiments(user_id, start_date, end_date);

COMMENT ON TABLE life_experiments IS 'Expériences personnelles de 7 jours (Life Experiment Engine D17)';
