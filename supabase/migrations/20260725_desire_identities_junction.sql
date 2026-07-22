-- ============================================================
-- Junction table: desire_identities (many-to-many)
-- Remplace linked_identity_id dans desires
-- ============================================================

CREATE TABLE IF NOT EXISTS desire_identities (
    desire_id INTEGER NOT NULL REFERENCES desires(id) ON DELETE CASCADE,
    identity_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (desire_id, identity_id)
);

CREATE INDEX IF NOT EXISTS desire_identities_desire_idx ON desire_identities (desire_id);
CREATE INDEX IF NOT EXISTS desire_identities_identity_idx ON desire_identities (identity_id);

-- Migrer les données existantes (linked_identity_id → junction table)
INSERT INTO desire_identities (desire_id, identity_id)
SELECT id, linked_identity_id FROM desires
WHERE linked_identity_id IS NOT NULL
ON CONFLICT (desire_id, identity_id) DO NOTHING;

-- Supprimer l'ancienne colonne
ALTER TABLE desires DROP COLUMN IF EXISTS linked_identity_id;

-- RLS sur la junction
ALTER TABLE desire_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own desire_identities" ON desire_identities
    FOR ALL USING (
        EXISTS (SELECT 1 FROM desires d WHERE d.id = desire_identities.desire_id AND d.user_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM desires d WHERE d.id = desire_identities.desire_id AND d.user_id = auth.uid())
    );

COMMENT ON TABLE desire_identities IS
    'Liaison many-to-many entre désirs et identités. Un désir peut exiger plusieurs identités.';
