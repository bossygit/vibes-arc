-- Met à jour la contrainte CHECK de daily_moods.score pour supporter l'échelle 1-22 (Esther Hicks)
ALTER TABLE daily_moods DROP CONSTRAINT IF EXISTS daily_moods_score_check;
ALTER TABLE daily_moods ADD CONSTRAINT daily_moods_score_check CHECK (score >= 1 AND score <= 22);

COMMENT ON COLUMN daily_moods.score IS 'Échelle de guidance émotionnelle 1-22 (Esther Hicks). 1=Joie/Liberté/Amour, 22=Peur/Dépression/Impuissance.';
