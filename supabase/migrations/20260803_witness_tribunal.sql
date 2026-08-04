-- ============================================================
-- Vibes Arc — Tribunal des Témoins (Witness System)
-- Migration : desire_required_habits (junction table)
-- ============================================================

-- Chaque Désir définit quelles habitudes, cochées ENSEMBLE
-- le même jour, constituent un témoin journalier.
-- Si toutes sont cochées → témoin. Sinon → accusateur.

CREATE TABLE IF NOT EXISTS desire_required_habits (
    desire_id INTEGER NOT NULL REFERENCES desires(id) ON DELETE CASCADE,
    habit_id  INTEGER NOT NULL,
    PRIMARY KEY (desire_id, habit_id)
);

CREATE INDEX IF NOT EXISTS desire_required_habits_desire_idx ON desire_required_habits (desire_id);
CREATE INDEX IF NOT EXISTS desire_required_habits_habit_idx ON desire_required_habits (habit_id);

COMMENT ON TABLE desire_required_habits IS
    'Habitudes qui, cochées ensemble le même jour, produisent un témoin journalier pour ce Désir.
     Règle : TOUTES doivent être cochées. Une seule manquante = accusateur.';

-- RLS via desires
ALTER TABLE desire_required_habits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'desire_required_habits' 
        AND policyname = 'Users manage own desire_required_habits'
    ) THEN
        CREATE POLICY "Users manage own desire_required_habits" ON desire_required_habits
            FOR ALL USING (
                EXISTS (SELECT 1 FROM desires d WHERE d.id = desire_required_habits.desire_id AND d.user_id = auth.uid())
            ) WITH CHECK (
                EXISTS (SELECT 1 FROM desires d WHERE d.id = desire_required_habits.desire_id AND d.user_id = auth.uid())
            );
    END IF;
END $$;
