-- Schéma Supabase pour Vibes Arc
-- À exécuter dans l'éditeur SQL de Supabase

-- Activer RLS (Row Level Security)
ALTER TABLE
IF EXISTS identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE
IF EXISTS habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE
IF EXISTS habit_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE
IF EXISTS habit_progress ENABLE ROW LEVEL SECURITY;

-- Table des identités
CREATE TABLE
IF NOT EXISTS identities
(
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users
(id) ON
DELETE CASCADE,
    created_at TIMESTAMPTZ
DEFAULT NOW
(),
    updated_at TIMESTAMPTZ DEFAULT NOW
()
);

-- Table des habitudes
CREATE TABLE
IF NOT EXISTS habits
(
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK
(type IN
('start', 'stop')),
    total_days INTEGER NOT NULL DEFAULT 92,
    user_id UUID NOT NULL REFERENCES auth.users
(id) ON
DELETE CASCADE,
    created_at TIMESTAMPTZ
DEFAULT NOW
(),
    updated_at TIMESTAMPTZ DEFAULT NOW
()
);

-- Table de liaison habitudes-identités (relation many-to-many)
CREATE TABLE
IF NOT EXISTS habit_identities
(
    habit_id BIGINT NOT NULL REFERENCES habits
(id) ON
DELETE CASCADE,
    identity_id BIGINT
NOT NULL REFERENCES identities
(id) ON
DELETE CASCADE,
    created_at TIMESTAMPTZ
DEFAULT NOW
(),
    PRIMARY KEY
(habit_id, identity_id)
);

-- Table de progression des habitudes (un jour = une ligne)
CREATE TABLE
IF NOT EXISTS habit_progress
(
    id BIGSERIAL PRIMARY KEY,
    habit_id BIGINT NOT NULL REFERENCES habits
(id) ON
DELETE CASCADE,
    day_index INTEGER
NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW
(),
    updated_at TIMESTAMPTZ DEFAULT NOW
(),
    UNIQUE
(habit_id, day_index)
);

-- Index pour optimiser les requêtes
CREATE INDEX
IF NOT EXISTS idx_identities_user_id ON identities
(user_id);
CREATE INDEX
IF NOT EXISTS idx_habits_user_id ON habits
(user_id);
CREATE INDEX
IF NOT EXISTS idx_habit_progress_habit_id ON habit_progress
(habit_id);
CREATE INDEX
IF NOT EXISTS idx_habit_progress_day ON habit_progress
(habit_id, day_index);
CREATE INDEX
IF NOT EXISTS idx_habit_identities_habit ON habit_identities
(habit_id);
CREATE INDEX
IF NOT EXISTS idx_habit_identities_identity ON habit_identities
(identity_id);

-- Triggers pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column
()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW
();
RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_identities_updated_at 
    BEFORE
UPDATE ON identities 
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();

CREATE TRIGGER update_habits_updated_at 
    BEFORE
UPDATE ON habits 
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();

CREATE TRIGGER update_habit_progress_updated_at 
    BEFORE
UPDATE ON habit_progress 
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();

-- Politiques RLS (Row Level Security)

-- Identités : l'utilisateur ne peut voir que ses propres identités
CREATE POLICY "Users can view their own identities" ON identities
    FOR
SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own identities" ON identities
    FOR
INSERT WITH CHECK (auth.uid() =
user_id);

CREATE POLICY "Users can update their own identities" ON identities
    FOR
UPDATE USING (auth.uid()
= user_id);

CREATE POLICY "Users can delete their own identities" ON identities
    FOR
DELETE USING (auth.uid
() = user_id);

-- Habitudes : l'utilisateur ne peut voir que ses propres habitudes
CREATE POLICY "Users can view their own habits" ON habits
    FOR
SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits" ON habits
    FOR
INSERT WITH CHECK (auth.uid() =
user_id);

CREATE POLICY "Users can update their own habits" ON habits
    FOR
UPDATE USING (auth.uid()
= user_id);

CREATE POLICY "Users can delete their own habits" ON habits
    FOR
DELETE USING (auth.uid
() = user_id);

-- Liaisons habitudes-identités : l'utilisateur ne peut modifier que ses propres liaisons
CREATE POLICY "Users can view their own habit identities" ON habit_identities
    FOR
SELECT USING (
        EXISTS (
            SELECT 1
    FROM habits
    WHERE habits.id = habit_identities.habit_id
        AND habits.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own habit identities" ON habit_identities
    FOR
INSERT WITH CHECK
    (
    E
ISTS (
    
abits
    WHERE habits.id = habit_identitie
    AND habits.user_id = auth.uid()
        )
);

CREATE POLICY "Users can delete their own habit identities" ON habit_identities
    FOR
DELETE USING (
        EXISTS
(
            SELECT 1
FROM habits
WHERE habits.id = habit_identities.habit_id
    AND habits.user_id = auth.uid()
        )
);

-- Progression des habitudes : l'utilisateur ne peut modifier que sa propre progression
CREATE POLICY "Users can view their own habit progress" ON habit_progress
    FOR
SELECT USING (
        EXISTS (
            SELECT 1
    FROM habits
    WHERE habits.id = habit_progress.habit_id
        AND habits.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own habit progress" ON habit_progress
    FOR
INSERT WITH CHECK
    (
    E
ISTS (
    
abits
    WHERE habits.id = habit_progres
    AND habits.user_id = auth.uid()
        )
);

CREATE POLICY "Users can update their own habit progress" ON habit_progress
    FOR
UPDATE USING (
        EXISTS (
            SELECT 1
FROM habits
WHERE habits.id = habit_progress.habit_id
    AND habits.user_id = auth.uid()
        )
);

CREATE POLICY "Users can delete their own habit progress" ON habit_progress
    FOR
DELETE USING (
        EXISTS
(
            SELECT 1
FROM habits
WHERE habits.id = habit_progress.habit_id
    AND habits.user_id = auth.uid()
        )
);
