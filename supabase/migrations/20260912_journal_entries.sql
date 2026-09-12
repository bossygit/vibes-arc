-- Journal de ressenti quotidien — entrées libres (plusieurs par jour possibles)
-- Alimente la cartographie émotionnelle + le coach IA (in-app et Telegram).
-- Migration: 20260912_journal_entries

CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    content TEXT NOT NULL,
    prompt TEXT,                          -- prompt d'amorçage affiché au moment de l'écriture (optionnel)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Lecture : propriétaire uniquement
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Users can read own journal entries') THEN
        CREATE POLICY "Users can read own journal entries"
            ON journal_entries FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Insertion : propriétaire uniquement
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Users can insert own journal entries') THEN
        CREATE POLICY "Users can insert own journal entries"
            ON journal_entries FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Mise à jour : propriétaire uniquement
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Users can update own journal entries') THEN
        CREATE POLICY "Users can update own journal entries"
            ON journal_entries FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Suppression : propriétaire uniquement
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Users can delete own journal entries') THEN
        CREATE POLICY "Users can delete own journal entries"
            ON journal_entries FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Index : historique par utilisateur + date
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date
    ON journal_entries(user_id, date DESC, created_at DESC);

COMMENT ON TABLE journal_entries IS 'Journal de ressenti quotidien — entrées libres multiples par jour (cartographie émotionnelle, nourrit le coach IA)';
