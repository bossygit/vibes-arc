-- PARTIE 2: Index et triggers
-- Exécutez cette partie après la partie 1

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
