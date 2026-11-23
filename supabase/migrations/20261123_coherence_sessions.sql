-- Cohérence cardiaque — séances réelles (caméra PPG ou ceinture BLE), une ligne par séance.
-- Migration: 20261123_coherence_sessions
--
-- Écrites par l'app en fin de séance ; lues par l'app sur tous tes appareils
-- (avant : localStorage, donc un historique séparé par navigateur) et par
-- coach-api (/review-context) pour que le coach voie ta pratique.
-- Le Mode Démo n'est jamais enregistré.
--
-- algo_version : 1 = calcul d'avant le 2026-11-23 (signal caméra inversé, score
-- biaisé la 1re minute, pic limité à 0.15 Hz) — gardé pour l'historique mais
-- exclu des comparaisons ; 2 = calcul corrigé.
--
-- Sans cette migration, l'app reste fonctionnelle (historique local seulement).

CREATE TABLE IF NOT EXISTS coherence_sessions (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id TEXT NOT NULL CHECK (char_length(id) BETWEEN 1 AND 64),   -- identifiant créé par l'app
    ended_at TIMESTAMPTZ NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('guide', 'libre')),
    source TEXT NOT NULL CHECK (source IN ('camera', 'ble')),
    duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
    beats INTEGER NOT NULL CHECK (beats >= 0),
    avg_score NUMERIC(3, 1) CHECK (avg_score BETWEEN 0 AND 10),
    high_pct SMALLINT NOT NULL CHECK (high_pct BETWEEN 0 AND 100),
    -- Bornes larges : une ancienne séance au signal erratique ne doit pas bloquer la reprise de l'historique
    avg_bpm SMALLINT CHECK (avg_bpm BETWEEN 0 AND 400),
    rmssd SMALLINT CHECK (rmssd >= 0),
    sdnn SMALLINT CHECK (sdnn >= 0),
    algo_version SMALLINT NOT NULL DEFAULT 1 CHECK (algo_version >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS coherence_sessions_user_ended_idx
    ON coherence_sessions (user_id, ended_at DESC);

ALTER TABLE coherence_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coherence_sessions' AND policyname = 'Users can read own coherence sessions') THEN
        CREATE POLICY "Users can read own coherence sessions"
            ON coherence_sessions FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coherence_sessions' AND policyname = 'Users can insert own coherence sessions') THEN
        CREATE POLICY "Users can insert own coherence sessions"
            ON coherence_sessions FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coherence_sessions' AND policyname = 'Users can update own coherence sessions') THEN
        CREATE POLICY "Users can update own coherence sessions"
            ON coherence_sessions FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coherence_sessions' AND policyname = 'Users can delete own coherence sessions') THEN
        CREATE POLICY "Users can delete own coherence sessions"
            ON coherence_sessions FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

COMMENT ON TABLE coherence_sessions IS 'Cohérence cardiaque : séances réelles (caméra/BLE) — une ligne par séance, tous appareils';
