-- Ajout de la colonne motivation (JSONB) à la table desires
-- Contient : raisons, future self, enjeux, ancrage NLP, implémentation intention
ALTER TABLE desires ADD COLUMN IF NOT EXISTS motivation JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN desires.motivation IS 'Données motivationnelles JSONB : raisons (pain/pleasure + émotions), future self, enjeux, ancrage NLP.';
