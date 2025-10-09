-- POLITIQUES SIMPLIFIEES POUR SUPABASE
-- Version alternative si la version complète ne fonctionne pas

-- Politiques pour habit_identities
CREATE POLICY "habit_identities_select" ON habit_identities FOR
SELECT USING (true);
CREATE POLICY "habit_identities_insert" ON habit_identities FOR
INSERT WITH CHECK
    (true)
;
CREATE POLICY "habit_identities_delete" ON habit_identities FOR
DELETE USING (true);

-- Politiques pour habit_progress  
CREATE POLICY "habit_progress_select" ON habit_progress FOR
SELECT USING (true);
CREATE POLICY "habit_progress_insert" ON habit_progress FOR
INSERT WITH CHECK
    (true)
;
CREATE POLICY "habit_progress_update" ON habit_progress FOR
UPDATE USING (true);
CREATE POLICY "habit_progress_delete" ON habit_progress FOR
DELETE USING (true);
