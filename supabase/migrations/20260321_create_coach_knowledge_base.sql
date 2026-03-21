-- ============================================================
-- VIBES ARC — Base de Connaissance du Coach IA
-- Migration Supabase
-- ============================================================

-- 1. TABLE PRINCIPALE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Profil de base
  full_name TEXT DEFAULT 'Bienvenu',
  birth_date DATE,
  location TEXT DEFAULT 'Brazzaville, République du Congo',
  primary_language TEXT DEFAULT 'fr',
  profession TEXT DEFAULT 'Consultant digital & développeur web',

  -- Profil psychologique (JSONB pour flexibilité)
  psychological_profile JSONB DEFAULT '{
    "challenges": ["anxiety", "self_sabotage"],
    "anxiety_triggers": [
      "surcharge de travail et deadlines multiples",
      "incertitude financière",
      "sentiment de ne pas être à la hauteur",
      "manque de structure ou routine stable",
      "perfectionnisme bloquant"
    ],
    "self_sabotage_patterns": [
      "abandon des habitudes après 2-3 semaines",
      "procrastination sur les projets personnels importants",
      "minimisation des propres réussites",
      "surcharge volontaire pour éviter l essentiel"
    ],
    "strengths": [
      "intelligence technique élevée",
      "grande créativité dans la résolution de problèmes",
      "capacité à construire des systèmes complexes",
      "curiosité intellectuelle profonde",
      "engagement sincère dans le développement personnel",
      "vision claire de qui il veut devenir"
    ]
  }',

  -- Pratiques et routines
  practices JSONB DEFAULT '{
    "morning_routine": [
      "Joe Dispenza meditation",
      "Wim Hof breathwork",
      "cold exposure",
      "journaling"
    ],
    "frameworks": [
      "Joe Dispenza",
      "Wim Hof",
      "Abraham-Hicks",
      "chakras Anodea Judith",
      "Jim Kwik",
      "manifestation 60 jours"
    ],
    "interests": [
      "healthy living",
      "tech et programmation",
      "React TypeScript Supabase n8n",
      "développement personnel"
    ]
  }',

  -- Style de coaching préféré
  coaching_style JSONB DEFAULT '{
    "tone": "bienveillant_mais_direct",
    "language": "fr",
    "persona": "allié jamais juge",
    "preferred_approach": [
      "rappels identitaires positifs",
      "ancrage corporel et somatique",
      "références aux pratiques Dispenza et Wim Hof",
      "questions Socratiques plutôt que jugements",
      "célébration explicite des petites victoires",
      "métaphores corporelles et kinesthésiques"
    ],
    "avoid": [
      "culpabilisation",
      "pression excessive après un décrochage",
      "comparaisons négatives",
      "clichés motivationnels vides",
      "minimiser anxiété ou défis"
    ],
    "relapse_protocol": {
      "threshold_completion_rate": 40,
      "steps": [
        "Ne pas pointer le manque — demander ce qui s est passé",
        "Réduire à UNE seule habitude prioritaire",
        "Rappeler le pourquoi profond",
        "Proposer un reset doux plutôt qu un recommencement"
      ]
    }
  }',

  -- Objectifs de vie
  life_goals JSONB DEFAULT '[
    {
      "horizon": "court_terme",
      "label": "Stabiliser une routine matinale sur 90 jours consécutifs"
    },
    {
      "horizon": "court_terme",
      "label": "Livrer les projets CESE, AMC et État-Major avec excellence"
    },
    {
      "horizon": "court_terme",
      "label": "Développer Vibes Arc en produit fonctionnel"
    },
    {
      "horizon": "moyen_terme",
      "label": "Devenir une référence du consulting digital en Afrique centrale"
    },
    {
      "horizon": "moyen_terme",
      "label": "Générer des revenus stables et prévisibles"
    },
    {
      "horizon": "long_terme",
      "label": "Construire une vie alignée entre travail, santé et sens"
    },
    {
      "horizon": "long_terme",
      "label": "Transformer ses outils de croissance en produits pour aider d autres"
    }
  ]',

  -- Ancres motivationnelles (objets/symboles de manifestation)
  motivation_anchors JSONB DEFAULT '[
    {
      "label": "Kia Sportage",
      "type": "manifestation",
      "note": "Manifestation personnelle — peut servir d ancre motivationnelle"
    }
  ]',

  -- Notes libres évolutives
  coach_notes TEXT DEFAULT 'Bienvenu a créé Vibes Arc lui-même — il sait comment le système fonctionne. Il est plus réceptif le matin après sa méditation. Quand il parle de ses clients institutionnels, surveiller les signes de surcharge. Il est kinesthésique — les métaphores corporelles résonnent plus que les abstractions.',

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_knowledge_base_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_knowledge_base_updated_at
  BEFORE UPDATE ON user_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_base_timestamp();

-- Index
CREATE INDEX IF NOT EXISTS idx_user_knowledge_base_user_id
  ON user_knowledge_base(user_id);


-- 2. TABLE DES TRIGGERS D'ANXIÉTÉ (historique détaillé)
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_anxiety_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_label TEXT NOT NULL,
  intensity INTEGER CHECK (intensity BETWEEN 1 AND 10),
  context TEXT,
  coping_used TEXT[],
  resolved BOOLEAN DEFAULT FALSE,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anxiety_events_user_id
  ON coach_anxiety_events(user_id);
CREATE INDEX IF NOT EXISTS idx_anxiety_events_date
  ON coach_anxiety_events(recorded_at DESC);


-- 3. TABLE DES INSIGHTS DU COACH (mémoire des sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT CHECK (insight_type IN (
    'pattern_detected',
    'breakthrough',
    'relapse_note',
    'identity_shift',
    'coaching_note'
  )),
  content TEXT NOT NULL,
  related_habit_id INTEGER,
  completion_rate_at_time NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_insights_user_id
  ON coach_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_insights_date
  ON coach_insights(created_at DESC);


-- 4. RLS POLICIES
-- ============================================================
ALTER TABLE user_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_anxiety_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_insights ENABLE ROW LEVEL SECURITY;

-- user_knowledge_base
CREATE POLICY "user_kb_select" ON user_knowledge_base
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_kb_insert" ON user_knowledge_base
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_kb_update" ON user_knowledge_base
  FOR UPDATE USING (auth.uid() = user_id);

-- coach_anxiety_events
CREATE POLICY "anxiety_select" ON coach_anxiety_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "anxiety_insert" ON coach_anxiety_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- coach_insights
CREATE POLICY "insights_select" ON coach_insights
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insights_insert" ON coach_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 5. DONNÉES INITIALES (remplace YOUR_USER_UUID par ton vrai UUID Supabase)
-- ============================================================
-- Pour retrouver ton UUID : SELECT id FROM auth.users WHERE email = 'ton@email.com';

/*
INSERT INTO user_knowledge_base (user_id, full_name, birth_date)
VALUES (
  'YOUR_USER_UUID',
  'Bienvenu KITUTU OLEONTWA',
  '1987-05-08'
)
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  birth_date = EXCLUDED.birth_date,
  updated_at = NOW();
*/


-- 6. VUE POUR LE COACH (agrège tout en un seul appel)
-- ============================================================
CREATE OR REPLACE VIEW coach_full_context AS
SELECT
  kb.user_id,
  kb.full_name,
  kb.location,
  kb.psychological_profile,
  kb.practices,
  kb.coaching_style,
  kb.life_goals,
  kb.motivation_anchors,
  kb.coach_notes,
  -- Derniers insights (5 max)
  COALESCE(
    (SELECT json_agg(i ORDER BY i.created_at DESC)
     FROM (
       SELECT * FROM coach_insights ci
       WHERE ci.user_id = kb.user_id
       ORDER BY created_at DESC LIMIT 5
     ) i),
    '[]'::json
  ) AS recent_insights,
  -- Derniers événements anxiété (3 max)
  COALESCE(
    (SELECT json_agg(e ORDER BY e.recorded_at DESC)
     FROM (
       SELECT * FROM coach_anxiety_events ae
       WHERE ae.user_id = kb.user_id
         AND ae.resolved = FALSE
       ORDER BY recorded_at DESC LIMIT 3
     ) e),
    '[]'::json
  ) AS active_anxiety_events,
  kb.updated_at
FROM user_knowledge_base kb;

-- Accès à la vue
GRANT SELECT ON coach_full_context TO authenticated;
