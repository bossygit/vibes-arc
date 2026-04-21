/**
 * sync_knowledge_base.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Flux MD → Supabase (sens commit → base)
 *
 * Lit COACH_KNOWLEDGE_BASE.md :
 *   - Le frontmatter YAML alimente les colonnes structurées
 *     (full_name, psychological_profile, practices, coaching_style,
 *      life_goals, motivation_anchors, coach_notes, ...).
 *   - Le corps markdown narratif est stocké dans la colonne `raw_markdown`.
 *
 * Puis UPSERT dans `user_knowledge_base` (clé de conflit : user_id).
 *
 * Usage local :
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... KNOWLEDGE_BASE_USER_ID=... \
 *   node scripts/sync_knowledge_base.mjs
 *
 * En CI : voir .github/workflows/sync_knowledge_base.yml
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import matter from 'gray-matter';
import { readFileSync, writeFileSync } from 'fs';
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

const mdPath = join(__dirname, '..', 'COACH_KNOWLEDGE_BASE.md');
const rawFile = readFileSync(mdPath, 'utf-8');
const parsed = matter(rawFile);
const fm = parsed.data ?? {};

const today = new Date().toISOString().split('T')[0];
const bodyUpdated = parsed.content.replace(
  /> Dernière mise à jour : .*/,
  `> Dernière mise à jour : ${today}`,
);

if (bodyUpdated !== parsed.content) {
  const rewritten = matter.stringify(bodyUpdated, fm);
  writeFileSync(mdPath, rewritten, 'utf-8');
}

const structured = {
  full_name: fm.full_name,
  birth_date: fm.birth_date,
  location: fm.location,
  primary_language: fm.primary_language,
  profession: fm.profession,
  psychological_profile: fm.psychological_profile,
  practices: fm.practices,
  coaching_style: fm.coaching_style,
  life_goals: fm.life_goals,
  motivation_anchors: fm.motivation_anchors,
  coach_notes: fm.coach_notes,
};

const payload = {
  user_id: fm.user_id || KNOWLEDGE_BASE_USER_ID,
  ...Object.fromEntries(
    Object.entries(structured).filter(([, v]) => v !== undefined),
  ),
  raw_markdown: bodyUpdated,
  updated_at: new Date().toISOString(),
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

console.log('🔄  Synchronisation COACH_KNOWLEDGE_BASE.md → Supabase...');

const { error } = await supabase
  .from('user_knowledge_base')
  .upsert(payload, { onConflict: 'user_id' });

if (error) {
  console.error('❌  Échec Supabase :', error.message);
  process.exit(1);
}

console.log('✅  Sync réussie');
console.log(`   → user_id    : ${payload.user_id}`);
console.log(`   → updated_at : ${today}`);
console.log(
  `   → champs structurés envoyés : ${
    Object.keys(structured).filter((k) => structured[k] !== undefined).length
  }`,
);
