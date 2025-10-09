-- POLITIQUES FINALES POUR SUPABASE
-- Copiez et collez ce contenu dans l'éditeur SQL de Supabase

CREATE POLICY "Users can view their own habit identities" ON habit_identities FOR
SELECT USING (EXISTS (SELECT 1
    FROM habits
    WHERE habits.id = habit_identities.habit_id AND habits.user_id = auth.uid()));

CREATE POLICY "Users can insert their own habit identities" ON habit_identities FOR
INSERT WITH CHECK
    (EXISTS (SELECT 1 
ROM habits 
HERE habits.id = habit_identities.habit_id AND habits.user_id = auth.uid()
)
);

CREATE POLICY "Users can delete their own habit identities" ON habit_identities FOR
DELETE USING (EXISTS
(SELECT 1
FROM habits
WHERE habits.id = habit_identities.habit_id AND habits.user_id = auth.uid())
);

CREATE POLICY "Users can view their own habit progress" ON habit_progress FOR
SELECT USING (EXISTS (SELECT 1
    FROM habits
    WHERE habits.id = habit_progress.habit_id AND habits.user_id = auth.uid()));

CREATE POLICY "Users can insert their own habit progress" ON habit_progress FOR
INSERT WITH CHECK
    (EXISTS (SELECT 1 
ROM habits 
HERE habits.id = habit_progress.habit_id AND habits.user_id = auth.uid()
)
);

CREATE POLICY "Users can update their own habit progress" ON habit_progress FOR
UPDATE USING (EXISTS (SELECT 1
FROM habits
WHERE habits.id = habit_progress.habit_id AND habits.user_id = auth.uid())
);

CREATE POLICY "Users can delete their own habit progress" ON habit_progress FOR
DELETE USING (EXISTS
(SELECT 1
FROM habits
WHERE habits.id = habit_progress.habit_id AND habits.user_id = auth.uid())
);
