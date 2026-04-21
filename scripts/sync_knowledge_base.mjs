/**
 * sync_knowledge_base.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Flux MD → Supabase
 * Lit COACH_KNOWLEDGE_BASE.md et met à jour la colonne `raw_markdown`
 * dans la table `user_knowledge_base`.
 *
 * Usage local :
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... KNOWLEDGE_BASE_USER_ID=... \
 *   node scripts/sync_knowledge_base.mjs
 *
 * En CI (GitHub Actions) : voir .github/workflows/sync_knowledge_base.yml
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Env vars ──────────────────────────────────────────────────────────────────
const SUPABASE_URL            = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KNOWLEDGE_BASE_USER_ID  = process.env.KNOWLEDGE_BASE_USER_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !KNOWLEDGE_BASE_USER_ID) {
  console.error('❌  Variables manquantes. Requis :');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('   KNOWLEDGE_BASE_USER_ID');
  process.exit(1);
}

// ── Lecture du .md ────────────────────────────────────────────────────────────
const mdPath  = join(__dirname, '..', 'COACH_KNOWLEDGE_BASE.md');
let markdown  = readFileSync(mdPath, 'utf-8');

// Met à jour la date "Dernière mise à jour" dans le fichier markdown
const today = new Date().toISOString().split('T')[0];
markdown = markdown.replace(
  /> Dernière mise à jour : .*/,
  `> Dernière mise à jour : ${today}`
);

// ── Sync vers Supabase ────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🔄  Synchronisation COACH_KNOWLEDGE_BASE.md → Supabase...');

const { error } = await supabase
  .from('user_knowledge_base')
  .update({
    raw_markdown: markdown,
    updated_at:   new Date().toISOString(),
  })
  .eq('user_id', KNOWLEDGE_BASE_USER_ID);

if (error) {
  console.error('❌  Échec Supabase :', error.message);
  process.exit(1);
}

console.log('✅  Sync réussie');
console.log(`   → user_id    : ${KNOWLEDGE_BASE_USER_ID}`);
console.log(`   → updated_at : ${today}`);
