// ============================================================
// Monde intérieur — Image Streaming (Win Wenger) × Carnet de rêves
//
// Instantané construit à partir du coffre Obsidian :
//   - Practice/Image Streaming : sessions_index.json, symbols.json, sessions .md
//   - Notion/Au pays des merveilles : un .md par rêve (frontmatter Date, Details…)
// Lu en direct par `npm run dev`, publiable dans Supabase pour les autres appareils.
// ============================================================

export interface ImageStreamingSession {
    /** Numéro global de session (session_number) */
    number: number;
    /** YYYY-MM-DD */
    date: string;
    /** HH:MM */
    time?: string;
    wordCount?: number;
    moodPre?: string;
    moodPost?: string;
    /** Début de la transcription, pour se remettre la séance en tête */
    excerpt: string;
    /** Nom du fichier dans le coffre (sans chemin) */
    file: string;
}

export interface ImageStreamingSymbol {
    name: string;
    count: number;
    /** Numéros des sessions où le symbole apparaît */
    sessions: number[];
    firstSession?: number;
    lastSession?: number;
    emotionArc?: string;
    evolution?: string;
    aliases: string[];
    associations: string[];
}

export interface DreamEntry {
    /** Chemin relatif au dossier des rêves */
    id: string;
    /** Nom de la note (sans .md) */
    title: string;
    /** YYYY-MM-DD (date du réveil), null si absente */
    date: string | null;
    /** Niveau de lucidité (V.1 → V.4, Layer 0 → 4) */
    lucidity?: string;
    motif?: string;
    people: string[];
    places: string[];
    details: string;
    wakeTime?: string;
}

/**
 * Parallèle rare rêve ↔ séance, détecté par le bot Image Streaming
 * (`dream_parallels.json` dans le dossier Image Streaming) : un mot présent dans
 * ≤ 5 % des séances, partagé avec un rêve noté à ±7 jours.
 */
export interface RareParallel {
    /** Nom de la note de séance (sans .md) */
    session: string;
    /** YYYY-MM-DD */
    sessionDate: string;
    /** Titre du rêve */
    dream: string;
    /** YYYY-MM-DD */
    dreamDate: string;
    /** Écart en jours (valeur absolue) */
    gapDays: number;
    direction: 'session → rêve' | 'rêve → session' | 'même jour';
    /** Mots rares partagés, les plus rares d'abord */
    words: string[];
    sessionExcerpt: string;
    dreamExcerpt: string;
}

/** Exercice ou point d'attention proposé par l'analyse d'une séance (`practice_reminders.json`). */
export interface PracticeItem {
    id: string;
    sessionNumber: number;
    /** « exercice » ou « attention » */
    type: string;
    title: string;
    criterion: string;
    status: 'active' | 'done' | 'dropped';
    /** ISO */
    createdAt: string;
    doneAt: string | null;
    /** Où il a été confirmé : telegram, ios */
    doneVia: string | null;
}

export interface InnerWorldSnapshot {
    version: 1;
    /** Construction de l'instantané (ISO) */
    generatedAt: string;
    /** `updated_at` de symbols.json, s'il existe */
    sourceUpdatedAt?: string;
    sessions: ImageStreamingSession[];
    symbols: ImageStreamingSymbol[];
    dreams: DreamEntry[];
    /** Absent des instantanés publiés avant le 2026-11-23 */
    parallels?: RareParallel[];
    /** Absent des instantanés publiés avant le 2026-11-23 */
    practice?: PracticeItem[];
}
