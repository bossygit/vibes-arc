-- Ajouter la colonne color à la table identities
ALTER TABLE identities 
ADD COLUMN color VARCHAR(20) DEFAULT 'blue';

-- Mettre à jour les identités existantes avec une couleur par défaut
UPDATE identities 
SET color = 'blue' 
WHERE color IS NULL;

-- Ajouter une contrainte pour s'assurer que la couleur est valide
ALTER TABLE identities 
ADD CONSTRAINT check_color 
CHECK (color IN ('blue', 'green', 'purple', 'red', 'yellow', 'pink', 'indigo', 'teal'));
