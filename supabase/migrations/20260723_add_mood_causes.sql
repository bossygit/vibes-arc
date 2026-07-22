-- Ajout de la colonne causes à daily_moods (cartographie émotionnelle)
ALTER TABLE daily_moods ADD COLUMN IF NOT EXISTS causes TEXT;

COMMENT ON COLUMN daily_moods.causes IS 'Ce qui a influencé l''état émotionnel du jour (contexte, triggers, événements).';
