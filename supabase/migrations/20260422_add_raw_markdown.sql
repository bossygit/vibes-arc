-- ============================================================
-- VIBES ARC — Ajout de la colonne raw_markdown
-- ============================================================
-- Stocke le corps markdown de COACH_KNOWLEDGE_BASE.md (partie
-- narrative humaine) en complément des colonnes structurées déjà
-- présentes (psychological_profile, practices, coaching_style, ...).
--
-- Alimenté par scripts/sync_knowledge_base.mjs (MD → DB).
-- Lu par scripts/export_knowledge_base.mjs (DB → MD).
-- ============================================================

ALTER TABLE user_knowledge_base
  ADD COLUMN IF NOT EXISTS raw_markdown TEXT;

COMMENT ON COLUMN user_knowledge_base.raw_markdown IS
  'Corps markdown narratif de COACH_KNOWLEDGE_BASE.md (hors frontmatter). Source humaine versionnée dans Git.';
