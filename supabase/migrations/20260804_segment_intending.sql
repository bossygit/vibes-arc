-- Segment Intending (Process #11 — Esther Hicks, Ask and It Is Given pp. 217-224)
-- Migration: 20260804_segment_intending
--
-- Chaque entrée = un segment de journée pré-pavé :
--   - segment prédéfini ou personnalisé
--   - contexte (ce qui se passe / risque de dérailler)
--   - intentions proposées par l'IA (gemma4 via Ollama Cloud)
--   - intention choisie + résultat après coup
-- L'historique nourrit le modèle pour proposer de meilleures intentions.

CREATE TABLE IF NOT EXISTS segment_intending_entries (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    segment_key TEXT NOT NULL,          -- clé prédéfinie ('morning_prep', 'phone_call', ...) ou 'custom'
    segment_label TEXT NOT NULL,        -- libellé affiché du segment
    context TEXT,                       -- ce qui se passe / ce qui pourrait dérailler
    intentions JSONB DEFAULT '[]'::jsonb,  -- intentions proposées par l'IA
    chosen_intention TEXT,              -- intention retenue (une seule par segment)
    outcome TEXT,                       -- retour après le segment (optionnel)
    emotional_setpoint INTEGER CHECK (emotional_setpoint BETWEEN 1 AND 22),  -- gate émotionnel (4-11 idéal)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE segment_intending_entries ENABLE ROW LEVEL SECURITY;

-- Lecture : propriétaire uniquement
CREATE POLICY "Users can read own segment intending entries"
    ON segment_intending_entries FOR SELECT
    USING (auth.uid() = user_id);

-- Insertion : propriétaire uniquement
CREATE POLICY "Users can insert own segment intending entries"
    ON segment_intending_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Mise à jour : propriétaire uniquement (outcome après coup)
CREATE POLICY "Users can update own segment intending entries"
    ON segment_intending_entries FOR UPDATE
    USING (auth.uid() = user_id);

-- Suppression : propriétaire uniquement
CREATE POLICY "Users can delete own segment intending entries"
    ON segment_intending_entries FOR DELETE
    USING (auth.uid() = user_id);

-- Index : historique par utilisateur + date
CREATE INDEX IF NOT EXISTS idx_segment_intending_user_date
    ON segment_intending_entries(user_id, date DESC, created_at DESC);

COMMENT ON TABLE segment_intending_entries IS 'Entrées du jeu Segment Intending (Process #11) — segments pré-pavés avec intentions IA et résultats';
