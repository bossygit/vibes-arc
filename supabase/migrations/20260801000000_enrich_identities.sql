-- ============================================================
-- Migration : Enrichir les identités perso (Identity Engine)
-- Ajoute : coreBeliefs, dailyPractices, habits, quotes, behavioralSignals
-- ============================================================

-- 1. Ajouter les colonnes JSONB à la table identities (si pas déjà présentes)
ALTER TABLE identities ADD COLUMN IF NOT EXISTS core_beliefs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE identities ADD COLUMN IF NOT EXISTS daily_practices JSONB DEFAULT '[]'::jsonb;
ALTER TABLE identities ADD COLUMN IF NOT EXISTS habits JSONB DEFAULT '[]'::jsonb;
ALTER TABLE identities ADD COLUMN IF NOT EXISTS quotes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE identities ADD COLUMN IF NOT EXISTS behavioral_signals JSONB DEFAULT '[]'::jsonb;

-- 2. S'assurer que RLS est activé
ALTER TABLE identities ENABLE ROW LEVEL SECURITY;

-- 3. Policy RLS (au cas où elle n'existerait pas)
CREATE POLICY IF NOT EXISTS "Users manage own identities" ON identities
    FOR ALL USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

COMMENT ON COLUMN identities.core_beliefs IS 'Croyances fondamentales que cette identité incarne';
COMMENT ON COLUMN identities.daily_practices IS 'Pratiques quotidiennes associées à cette identité';
COMMENT ON COLUMN identities.habits IS 'Habitudes déclaratives (texte libre) associées à cette identité';
COMMENT ON COLUMN identities.quotes IS 'Citations inspirantes liées à cette identité';
COMMENT ON COLUMN identities.behavioral_signals IS 'Signaux comportementaux observables (traits de personnalité)';
