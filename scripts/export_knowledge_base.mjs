/**
 * export_knowledge_base.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Flux Supabase → MD  (sens inverse, manuel)
 * Lit `raw_markdown` depuis Supabase et écrase COACH_KNOWLEDGE_BASE.md.
 *
 * À utiliser après une mise à jour directe via MCP ou Supabase Studio,
 * pour garder le fichier .md en phase avec la base.
 *
 * Usage :
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... KNOWLEDGE_BASE_USER_ID=... \
 *   node scripts/export_knowledge_base.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KNOWLEDGE_BASE_USER_ID   = process.env.KNOWLEDGE_BASE_USER_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !KNOWLEDGE_BASE_USER_ID) {
  console.error('❌  Variables manquantes. Requis :');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('   KNOWLEDGE_BASE_USER_ID');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🔄  Export Supabase → COACH_KNOWLEDGE_BASE.md...');

const { data, error } = await supabase
  .from('user_knowledge_base')
  .select('raw_markdown, updated_at')
  .eq('user_id', KNOWLEDGE_BASE_USER_ID)
  .single();

if (error) {
  console.error('❌  Échec lecture Supabase :', error.message);
  process.exit(1);
}

if (!data?.raw_markdown) {
  console.error('❌  Colonne raw_markdown vide. Lance d\'abord sync_knowledge_base.mjs.');
  process.exit(1);
}

const mdPath = join(__dirname, '..', 'COACH_KNOWLEDGE_BASE.md');
writeFileSync(mdPath, data.raw_markdown, 'utf-8');

console.log('✅  Export réussi → COACH_KNOWLEDGE_BASE.md');
console.log(`   → dernière mise à jour Supabase : ${data.updated_at}`);
