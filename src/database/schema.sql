-- Schema pour Vibes Arc - Identity Tracker
-- Base de données SQLite

-- Table des identités
CREATE TABLE
IF NOT EXISTS identities
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des habitudes
CREATE TABLE
IF NOT EXISTS habits
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK
(type IN
('start', 'stop')),
    total_days INTEGER NOT NULL DEFAULT 92,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison habitudes-identités (relation many-to-many)
CREATE TABLE
IF NOT EXISTS habit_identities
(
    habit_id INTEGER NOT NULL,
    identity_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY
(habit_id, identity_id),
    FOREIGN KEY
(habit_id) REFERENCES habits
(id) ON
DELETE CASCADE,
    FOREIGN KEY (identity_id)
REFERENCES identities
(id) ON
DELETE CASCADE
);

-- Table de progression des habitudes (un jour = une ligne)
CREATE TABLE
IF NOT EXISTS habit_progress
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    day_index INTEGER NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE
(habit_id, day_index),
    FOREIGN KEY
(habit_id) REFERENCES habits
(id) ON
DELETE CASCADE
);

-- Index pour optimiser les requêtes
CREATE INDEX
IF NOT EXISTS idx_habit_progress_habit_id ON habit_progress
(habit_id);
CREATE INDEX
IF NOT EXISTS idx_habit_progress_day ON habit_progress
(habit_id, day_index);
CREATE INDEX
IF NOT EXISTS idx_habit_identities_habit ON habit_identities
(habit_id);
CREATE INDEX
IF NOT EXISTS idx_habit_identities_identity ON habit_identities
(identity_id);

-- Triggers pour mettre à jour updated_at automatiquement
CREATE TRIGGER
IF NOT EXISTS update_identities_timestamp 
    AFTER
UPDATE ON identities
BEGIN
    UPDATE identities SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER
IF NOT EXISTS update_habits_timestamp 
    AFTER
UPDATE ON habits
BEGIN
    UPDATE habits SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER
IF NOT EXISTS update_habit_progress_timestamp 
    AFTER
UPDATE ON habit_progress
BEGIN
    UPDATE habit_progress SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
