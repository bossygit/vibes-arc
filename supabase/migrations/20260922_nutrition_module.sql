-- Module Nutrition — profil/objectifs + journal alimentaire
--
-- Alimente le suivi calories + nutriments (macros et micronutriments).
-- Les aliments eux-mêmes ne sont PAS stockés ici : ils proviennent
-- d'Open Food Facts, d'USDA FoodData Central ou de la base locale, et
-- chaque ligne du journal conserve un instantané de ses valeurs.
--
-- Migration: 20260922_nutrition_module

-- ------------------------------------------------------------
-- Profil nutritionnel et objectifs
-- ------------------------------------------------------------
-- Une seule ligne par utilisateur : le profil (sexe, âge, taille, poids,
-- activité, objectif) et les éventuelles cibles saisies manuellement.
-- Les cibles calculées ne sont pas stockées : elles sont dérivées du
-- profil à l'affichage, ce qui évite qu'elles divergent de la formule.

CREATE TABLE IF NOT EXISTS nutrition_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    profile JSONB NOT NULL,
    goal_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nutrition_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nutrition_profiles' AND policyname = 'Users can read own nutrition profile') THEN
        CREATE POLICY "Users can read own nutrition profile"
            ON nutrition_profiles FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nutrition_profiles' AND policyname = 'Users can insert own nutrition profile') THEN
        CREATE POLICY "Users can insert own nutrition profile"
            ON nutrition_profiles FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nutrition_profiles' AND policyname = 'Users can update own nutrition profile') THEN
        CREATE POLICY "Users can update own nutrition profile"
            ON nutrition_profiles FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nutrition_profiles' AND policyname = 'Users can delete own nutrition profile') THEN
        CREATE POLICY "Users can delete own nutrition profile"
            ON nutrition_profiles FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

COMMENT ON TABLE nutrition_profiles IS 'Profil nutritionnel (métabolisme, activité, objectif) et surcharges manuelles des cibles';

-- ------------------------------------------------------------
-- Journal alimentaire
-- ------------------------------------------------------------
-- `per100g` fige les valeurs nutritionnelles au moment de la saisie :
-- si Open Food Facts corrige la fiche plus tard, l'historique de
-- l'utilisateur reste stable.

CREATE TABLE IF NOT EXISTS food_entries (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal TEXT NOT NULL CHECK (meal IN ('petitDejeuner', 'dejeuner', 'diner', 'collation')),
    source TEXT NOT NULL CHECK (source IN ('local', 'off', 'usda', 'custom')),
    source_id TEXT NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    grams NUMERIC NOT NULL CHECK (grams > 0),
    basis TEXT NOT NULL DEFAULT 'g' CHECK (basis IN ('g', 'ml')),
    per100g JSONB NOT NULL,
    serving_label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'food_entries' AND policyname = 'Users can read own food entries') THEN
        CREATE POLICY "Users can read own food entries"
            ON food_entries FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'food_entries' AND policyname = 'Users can insert own food entries') THEN
        CREATE POLICY "Users can insert own food entries"
            ON food_entries FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'food_entries' AND policyname = 'Users can update own food entries') THEN
        CREATE POLICY "Users can update own food entries"
            ON food_entries FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'food_entries' AND policyname = 'Users can delete own food entries') THEN
        CREATE POLICY "Users can delete own food entries"
            ON food_entries FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Index : lecture du journal d'une journée, et historique par utilisateur.
CREATE INDEX IF NOT EXISTS idx_food_entries_user_date
    ON food_entries(user_id, date DESC, created_at DESC);

-- Index : aliments fréquemment consommés (« ajouté récemment »).
CREATE INDEX IF NOT EXISTS idx_food_entries_user_source
    ON food_entries(user_id, source, source_id);

COMMENT ON TABLE food_entries IS 'Journal alimentaire — une ligne par aliment consommé, avec instantané nutritionnel pour 100 g';
