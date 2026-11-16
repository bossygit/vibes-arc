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

export interface InnerWorldSnapshot {
    version: 1;
    /** Construction de l'instantané (ISO) */
    generatedAt: string;
    /** `updated_at` de symbols.json, s'il existe */
    sourceUpdatedAt?: string;
    sessions: ImageStreamingSession[];
    symbols: ImageStreamingSymbol[];
    dreams: DreamEntry[];
}
