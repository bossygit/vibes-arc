-- PARTIE 3: RLS et politiques de sécurité
-- Exécutez cette partie en dernier

-- Activer RLS (Row Level Security)
ALTER TABLE
IF EXISTS identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE
IF EXISTS habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE
IF EXISTS habit_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE
IF EXISTS habit_progress ENABLE ROW LEVEL SECURITY;

-- Politiques pour les identités
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

-- Politiques pour les habitudes
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
