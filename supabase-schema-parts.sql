-- PARTIE 1: Création des tables
-- Exécutez cette partie d'abord

-- Table des identités
CREATE TABLE
IF NOT EXISTS identities
(
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users
(id) ON
DELETE CASCADE,
    created_at TIMESTAMPTZ
DEFAULT NOW
(),
    updated_at TIMESTAMPTZ DEFAULT NOW
()
);

-- Table des habitudes
CREATE TABLE
IF NOT EXISTS habits
(
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK
(type IN
('start', 'stop')),
    total_days INTEGER NOT NULL DEFAULT 92,
    user_id UUID NOT NULL REFERENCES auth.users
(id) ON
DELETE CASCADE,
    created_at TIMESTAMPTZ
DEFAULT NOW
(),
    updated_at TIMESTAMPTZ DEFAULT NOW
()
);

-- Table de liaison habitudes-identités
CREATE TABLE
IF NOT EXISTS habit_identities
(
    habit_id BIGINT NOT NULL REFERENCES habits
(id) ON
DELETE CASCADE,
    identity_id BIGINT
NOT NULL REFERENCES identities
(id) ON
DELETE CASCADE,
    created_at TIMESTAMPTZ
DEFAULT NOW
(),
    PRIMARY KEY
(habit_id, identity_id)
);

-- Table de progression des habitudes
CREATE TABLE
IF NOT EXISTS habit_progress
(
    id BIGSERIAL PRIMARY KEY,
    habit_id BIGINT NOT NULL REFERENCES habits
(id) ON
DELETE CASCADE,
    day_index INTEGER
NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW
(),
    updated_at TIMESTAMPTZ DEFAULT NOW
(),
    UNIQUE
(habit_id, day_index)
);
