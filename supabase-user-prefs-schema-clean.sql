-- Nettoyer et recréer la table user_prefs depuis zéro

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own prefs" ON user_prefs;
DROP POLICY IF EXISTS "Users can insert their own prefs" ON user_prefs;
DROP POLICY IF EXISTS "Users can update their own prefs" ON user_prefs;

-- Supprimer le trigger et la fonction
DROP TRIGGER IF EXISTS update_user_prefs_updated_at ON user_prefs;

-- Supprimer la table existante
DROP TABLE IF EXISTS user_prefs CASCADE;

-- Recréer la table avec toutes les colonnes
CREATE TABLE user_prefs (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    notif_enabled BOOLEAN DEFAULT FALSE,
    notif_hour INTEGER DEFAULT 20 CHECK (notif_hour >= 0 AND notif_hour <= 23),
    notif_timezone TEXT DEFAULT 'Europe/Paris',
    notif_channel TEXT DEFAULT 'none' CHECK (notif_channel IN ('none', 'telegram', 'whatsapp')),
    telegram_chat_id TEXT,
    telegram_username TEXT,
    whatsapp_number TEXT,
    weekly_email_enabled BOOLEAN DEFAULT FALSE,
    weekly_email_day INTEGER DEFAULT 6 CHECK (weekly_email_day >= 0 AND weekly_email_day <= 6),
    weekly_email_hour INTEGER DEFAULT 9 CHECK (weekly_email_hour >= 0 AND weekly_email_hour <= 23),
    last_notif_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_user_prefs_user_id ON user_prefs(user_id);
CREATE INDEX idx_user_prefs_notif_enabled ON user_prefs(notif_enabled);

-- Activer RLS (Row Level Security)
ALTER TABLE user_prefs ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir uniquement leurs propres préférences
CREATE POLICY "Users can view their own prefs" ON user_prefs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent insérer leurs propres préférences
CREATE POLICY "Users can insert their own prefs" ON user_prefs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres préférences
CREATE POLICY "Users can update their own prefs" ON user_prefs
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Recréer la fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recréer le trigger
CREATE TRIGGER update_user_prefs_updated_at 
    BEFORE UPDATE ON user_prefs
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour la documentation
COMMENT ON TABLE user_prefs IS 'Préférences utilisateur pour les notifications et emails hebdomadaires';
COMMENT ON COLUMN user_prefs.notif_channel IS 'Canal de notification: none, telegram, ou whatsapp';
COMMENT ON COLUMN user_prefs.notif_hour IS 'Heure locale pour envoyer les notifications (0-23)';
COMMENT ON COLUMN user_prefs.notif_timezone IS 'Fuseau horaire de l''utilisateur (format IANA)';
COMMENT ON COLUMN user_prefs.weekly_email_day IS 'Jour de la semaine pour l''email (0=dimanche, 6=samedi)';

