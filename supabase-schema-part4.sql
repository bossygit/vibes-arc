-- PARTIE 4: Politiques pour les tables de liaison
-- Exécutez cette partie après la partie 3

-- Politiques pour habit_identities
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

-- Politiques pour habit_progress
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
