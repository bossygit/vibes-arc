-- L'Arc : Vision → Identité → Action → Évolution
-- Migration: 20261116_arc_vision_inner_world
--
-- 1. arc_vision            : la « boussole » — une phrase « Je deviens… » par utilisateur
--                            (étape 1 · Vision, affichée en tête de l'arc)
-- 2. inner_world_snapshots : instantané Image Streaming × rêves lu dans le coffre Obsidian
--                            (étape 4 · Évolution, module « Monde intérieur ») — publié depuis
--                            `npm run dev` pour être lisible sur les autres appareils
--
-- Les deux tables : une ligne par utilisateur, RLS propriétaire uniquement.
-- Sans cette migration, l'app reste fonctionnelle (repli localStorage).

-- ============================================================
-- 1. Boussole de vision
-- ============================================================

CREATE TABLE IF NOT EXISTS arc_vision (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    statement TEXT NOT NULL DEFAULT '' CHECK (char_length(statement) <= 2000),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE arc_vision ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'arc_vision' AND policyname = 'Users can read own arc vision') THEN
        CREATE POLICY "Users can read own arc vision"
            ON arc_vision FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'arc_vision' AND policyname = 'Users can insert own arc vision') THEN
        CREATE POLICY "Users can insert own arc vision"
            ON arc_vision FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'arc_vision' AND policyname = 'Users can update own arc vision') THEN
        CREATE POLICY "Users can update own arc vision"
            ON arc_vision FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

COMMENT ON TABLE arc_vision IS 'Boussole de l''arc (étape Vision) : « Je deviens… » — une ligne par utilisateur';

-- ============================================================
-- 2. Monde intérieur (Image Streaming × rêves)
-- ============================================================

CREATE TABLE IF NOT EXISTS inner_world_snapshots (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot JSONB NOT NULL,
    generated_at TIMESTAMPTZ,              -- construction de l'instantané (lecture du coffre)
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE inner_world_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inner_world_snapshots' AND policyname = 'Users can read own inner world') THEN
        CREATE POLICY "Users can read own inner world"
            ON inner_world_snapshots FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inner_world_snapshots' AND policyname = 'Users can insert own inner world') THEN
        CREATE POLICY "Users can insert own inner world"
            ON inner_world_snapshots FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inner_world_snapshots' AND policyname = 'Users can update own inner world') THEN
        CREATE POLICY "Users can update own inner world"
            ON inner_world_snapshots FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inner_world_snapshots' AND policyname = 'Users can delete own inner world') THEN
        CREATE POLICY "Users can delete own inner world"
            ON inner_world_snapshots FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

COMMENT ON TABLE inner_world_snapshots IS 'Monde intérieur (étape Évolution) : sessions Image Streaming, symboles et rêves lus dans le coffre Obsidian — une ligne par utilisateur';
