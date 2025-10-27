import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Identity, Habit } from '@/types';

class DatabaseService {
    private db: Database.Database;
    private static instance: DatabaseService;

    private constructor() {
        // Créer le dossier data s'il n'existe pas
        const dataDir = join(process.cwd(), 'data');
        const dbPath = join(dataDir, 'vibes-arc.db');

        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');

        this.initializeDatabase();
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    private initializeDatabase(): void {
        try {
            const schemaPath = join(__dirname, 'schema.sql');
            const schema = readFileSync(schemaPath, 'utf-8');
            this.db.exec(schema);
            console.log('✅ Base de données initialisée avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
        }
    }

    // ===== IDENTITIES =====

    public createIdentity(name: string, description?: string, color: string = 'blue'): Identity {
        const stmt = this.db.prepare(`
      INSERT INTO identities (name, description, color) 
      VALUES (?, ?, ?)
    `);

        const result = stmt.run(name, description || null, color);

        return {
            id: result.lastInsertRowid as number,
            name,
            description,
            color,
            createdAt: new Date().toISOString()
        };
    }

    public getIdentities(): Identity[] {
        const stmt = this.db.prepare(`
      SELECT id, name, description, color, created_at as createdAt 
      FROM identities 
      ORDER BY created_at DESC
    `);

        return stmt.all() as Identity[];
    }

    public updateIdentity(id: number, name: string, description?: string): boolean {
        const stmt = this.db.prepare(`
      UPDATE identities 
      SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

        const result = stmt.run(name, description || null, id);
        return result.changes > 0;
    }

    public deleteIdentity(id: number): boolean {
        const stmt = this.db.prepare('DELETE FROM identities WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    // ===== HABITS =====

    public createHabit(name: string, type: 'start' | 'stop', totalDays: number, linkedIdentities: number[]): Habit {
        const transaction = this.db.transaction(() => {
            // Créer l'habitude
            const habitStmt = this.db.prepare(`
        INSERT INTO habits (name, type, total_days) 
        VALUES (?, ?, ?)
      `);

            const habitResult = habitStmt.run(name, type, totalDays);
            const habitId = habitResult.lastInsertRowid as number;

            // Lier aux identités
            if (linkedIdentities.length > 0) {
                const linkStmt = this.db.prepare(`
          INSERT INTO habit_identities (habit_id, identity_id) 
          VALUES (?, ?)
        `);

                for (const identityId of linkedIdentities) {
                    linkStmt.run(habitId, identityId);
                }
            }

            // Initialiser la progression (tous les jours à false)
            const progressStmt = this.db.prepare(`
        INSERT INTO habit_progress (habit_id, day_index, completed) 
        VALUES (?, ?, 0)
      `);

            for (let i = 0; i < totalDays; i++) {
                progressStmt.run(habitId, i);
            }

            return {
                id: habitId,
                name,
                type,
                totalDays,
                linkedIdentities,
                progress: new Array(totalDays).fill(false),
                createdAt: new Date().toISOString()
            };
        });

        return transaction();
    }

    public getHabits(): Habit[] {
        const stmt = this.db.prepare(`
      SELECT h.id, h.name, h.type, h.total_days as totalDays, h.created_at as createdAt
      FROM habits h
      ORDER BY h.created_at DESC
    `);

        const habits = stmt.all() as Omit<Habit, 'linkedIdentities' | 'progress'>[];

        return habits.map(habit => {
            // Récupérer les identités liées
            const identitiesStmt = this.db.prepare(`
        SELECT identity_id FROM habit_identities WHERE habit_id = ?
      `);
            const linkedIdentities = identitiesStmt.all(habit.id).map((row: any) => row.identity_id);

            // Récupérer la progression
            const progressStmt = this.db.prepare(`
        SELECT day_index, completed FROM habit_progress 
        WHERE habit_id = ? 
        ORDER BY day_index
      `);
            const progressRows = progressStmt.all(habit.id) as { day_index: number; completed: number }[];
            const progress = new Array(habit.totalDays).fill(false);

            progressRows.forEach(row => {
                progress[row.day_index] = Boolean(row.completed);
            });

            return {
                ...habit,
                linkedIdentities,
                progress
            };
        });
    }

    public updateHabit(id: number, updates: Partial<Habit>): boolean {
        const transaction = this.db.transaction(() => {
            // Mettre à jour l'habitude
            if (updates.name || updates.type || updates.totalDays) {
                const stmt = this.db.prepare(`
          UPDATE habits 
          SET name = COALESCE(?, name), 
              type = COALESCE(?, type), 
              total_days = COALESCE(?, total_days),
              updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `);
                stmt.run(updates.name, updates.type, updates.totalDays, id);
            }

            // Mettre à jour les identités liées si nécessaire
            if (updates.linkedIdentities) {
                // Supprimer les anciennes liaisons
                const deleteStmt = this.db.prepare('DELETE FROM habit_identities WHERE habit_id = ?');
                deleteStmt.run(id);

                // Ajouter les nouvelles liaisons
                if (updates.linkedIdentities.length > 0) {
                    const insertStmt = this.db.prepare(`
            INSERT INTO habit_identities (habit_id, identity_id) 
            VALUES (?, ?)
          `);

                    for (const identityId of updates.linkedIdentities) {
                        insertStmt.run(id, identityId);
                    }
                }
            }

            return true;
        });

        return transaction();
    }

    public deleteHabit(id: number): boolean {
        const stmt = this.db.prepare('DELETE FROM habits WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    // ===== HABIT PROGRESS =====

    public toggleHabitDay(habitId: number, dayIndex: number): boolean {
        const stmt = this.db.prepare(`
      UPDATE habit_progress 
      SET completed = NOT completed, 
          completed_at = CASE WHEN completed = 0 THEN CURRENT_TIMESTAMP ELSE NULL END,
          updated_at = CURRENT_TIMESTAMP 
      WHERE habit_id = ? AND day_index = ?
    `);

        const result = stmt.run(habitId, dayIndex);
        return result.changes > 0;
    }

    public getHabitProgress(habitId: number): boolean[] {
        const stmt = this.db.prepare(`
      SELECT day_index, completed FROM habit_progress 
      WHERE habit_id = ? 
      ORDER BY day_index
    `);

        const rows = stmt.all(habitId) as { day_index: number; completed: number }[];
        const progress: boolean[] = [];

        rows.forEach(row => {
            progress[row.day_index] = Boolean(row.completed);
        });

        return progress;
    }

    // ===== UTILITY METHODS =====

    public close(): void {
        this.db.close();
    }

    public getStats(): { identities: number; habits: number; totalProgress: number } {
        const identitiesCount = this.db.prepare('SELECT COUNT(*) as count FROM identities').get() as { count: number };
        const habitsCount = this.db.prepare('SELECT COUNT(*) as count FROM habits').get() as { count: number };
        const totalProgress = this.db.prepare('SELECT COUNT(*) as count FROM habit_progress WHERE completed = 1').get() as { count: number };

        return {
            identities: identitiesCount.count,
            habits: habitsCount.count,
            totalProgress: totalProgress.count
        };
    }
}

export default DatabaseService;
