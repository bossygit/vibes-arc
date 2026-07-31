-- Ajout de la colonne status (enum) à la table desires
-- Permet de clôturer un dossier une fois le verdict favorable
ALTER TABLE desires ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed'));

COMMENT ON COLUMN desires.status IS 'Statut du dossier : active = en cours, closed = gagné (verdict favorable + clôturé par l''utilisateur)';

CREATE INDEX IF NOT EXISTS desires_status_idx ON desires (status);
