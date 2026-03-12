import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Chemin vers la base de données
const dbPath = path.join(dataDir, 'vibes-arc.db');

// Créer la base de données
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Lire et exécuter le schéma
const schemaPath = path.join(__dirname, '..', 'src', 'database', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

try {
    db.exec(schema);
    console.log('✅ Base de données SQLite initialisée avec succès !');
    console.log(`📁 Emplacement: ${dbPath}`);

    // Afficher les statistiques
    const identitiesCount = db.prepare('SELECT COUNT(*) as count FROM identities').get();
    const habitsCount = db.prepare('SELECT COUNT(*) as count FROM habits').get();

    console.log(`📊 Statistiques:`);
    console.log(`   - Identités: ${identitiesCount.count}`);
    console.log(`   - Habitudes: ${habitsCount.count}`);

} catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
} finally {
    db.close();
}
