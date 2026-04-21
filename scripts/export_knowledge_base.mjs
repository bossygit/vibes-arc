/**
 * export_knowledge_base.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Flux Supabase → MD (sens base → fichier, manuel)
 *
 * Lit la ligne `user_knowledge_base` depuis Supabase et reconstruit
 * COACH_KNOWLEDGE_BASE.md :
 *   - frontmatter YAML = colonnes structurées (full_name, psychological_profile,
 *     practices, coaching_style, life_goals, motivation_anchors, coach_notes, ...)
 *   - corps = `raw_markdown`
 *
 * À utiliser après une mise à jour directe via MCP Supabase ou Supabase Studio,
 * pour garder le fichier `.md` du dépôt en phase avec la base.
 *
 * Usage :
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... KNOWLEDGE_BASE_USER_ID=... \
 *   node scripts/export_knowledge_base.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import matter from 'gray-matter';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KNOWLEDGE_BASE_USER_ID = process.env.KNOWLEDGE_BASE_USER_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !KNOWLEDGE_BASE_USER_ID) {
  console.error('❌  Variables manquantes. Requis :');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('   KNOWLEDGE_BASE_USER_ID');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

console.log('🔄  Export Supabase → COACH_KNOWLEDGE_BASE.md...');

const { data, error } = await supabase
  .from('user_knowledge_base')
  .select(
    'user_id, full_name, birth_date, location, primary_language, profession, psychological_profile, practices, coaching_style, life_goals, motivation_anchors, coach_notes, raw_markdown, updated_at',
  )
  .eq('user_id', KNOWLEDGE_BASE_USER_ID)
  .single();

if (error) {
  console.error('❌  Échec lecture Supabase :', error.message);
  process.exit(1);
}

if (!data) {
  console.error('❌  Ligne introuvable pour user_id =', KNOWLEDGE_BASE_USER_ID);
  process.exit(1);
}

if (!data.raw_markdown) {
  console.error(
    '❌  Colonne raw_markdown vide. Lance d\'abord `npm run sync:kb`.',
  );
  process.exit(1);
}

const frontmatter = {
  user_id: data.user_id,
  full_name: data.full_name,
  birth_date: data.birth_date,
  location: data.location,
  primary_language: data.primary_language,
  profession: data.profession,
  psychological_profile: data.psychological_profile,
  practices: data.practices,
  coaching_style: data.coaching_style,
  life_goals: data.life_goals,
  motivation_anchors: data.motivation_anchors,
  coach_notes: data.coach_notes,
};

for (const k of Object.keys(frontmatter)) {
  if (frontmatter[k] === null || frontmatter[k] === undefined) {
    delete frontmatter[k];
  }
}

const rebuilt = matter.stringify(data.raw_markdown, frontmatter);

const mdPath = join(__dirname, '..', 'COACH_KNOWLEDGE_BASE.md');
writeFileSync(mdPath, rebuilt, 'utf-8');

console.log('✅  Export réussi → COACH_KNOWLEDGE_BASE.md');
console.log(`   → dernière mise à jour Supabase : ${data.updated_at}`);
