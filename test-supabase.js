// Script de test pour vérifier la configuration Supabase
// Exécutez avec: node test-supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    console.log('Veuillez créer un fichier .env.local avec :');
    console.log('VITE_SUPABASE_URL="https://votre-projet.supabase.co"');
    console.log('VITE_SUPABASE_ANON_KEY="votre-clé-anonyme-supabase"');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
    console.log('🧪 Test de la connexion Supabase...');

    try {
        // Test de connexion
        const { data, error } = await supabase.from('identities').select('count');

        if (error) {
            console.error('❌ Erreur de connexion:', error.message);
            return;
        }

        console.log('✅ Connexion Supabase réussie !');
        console.log('📊 Nombre d\'identités:', data);

        // Test des tables
        const tables = ['identities', 'habits', 'habit_identities', 'habit_progress'];

        for (const table of tables) {
            try {
                const { error: tableError } = await supabase.from(table).select('count');
                if (tableError) {
                    console.error(`❌ Table ${table} non accessible:`, tableError.message);
                } else {
                    console.log(`✅ Table ${table} accessible`);
                }
            } catch (err) {
                console.error(`❌ Erreur avec la table ${table}:`, err.message);
            }
        }

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

testSupabase();
