/**
 * Lecture du coffre Obsidian pour le module « Monde intérieur » (Node uniquement).
 *
 * Utilisé par le middleware de développement `/api/inner-world` (vite.config.ts).
 * Ce n'est PAS une fonction Vercel : en production, le coffre n'est pas accessible
 * et l'app lit l'instantané publié dans Supabase.
 *
 * Imports relatifs uniquement : ce fichier est embarqué par la config Vite, où
 * l'alias `@/` n'existe pas.
 */
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { excerpt, extractSection, fmList, fmString, parseFrontmatter } from '../src/utils/innerWorld/frontmatter';
import type {
    DreamEntry,
    ImageStreamingSession,
    ImageStreamingSymbol,
    InnerWorldSnapshot,
} from '../src/types/innerWorld';

export interface VaultConfig {
    vaultPath: string;
    imageStreamingDir: string;
    dreamsDir: string;
}

/**
 * Chemins par défaut : `~/Documents/Obsidian Vault`, sous-dossiers
 * `Practice/Image Streaming` et `Notion/Au pays des merveilles`.
 * Surchargés par OBSIDIAN_VAULT_PATH, INNER_WORLD_IS_DIR, INNER_WORLD_DREAMS_DIR.
 */
export function resolveVaultConfig(getEnv: (key: string) => string | undefined): VaultConfig {
    const vaultPath = getEnv('OBSIDIAN_VAULT_PATH')?.trim() || path.join(os.homedir(), 'Documents', 'Obsidian Vault');
    return {
        vaultPath,
        imageStreamingDir: path.resolve(vaultPath, getEnv('INNER_WORLD_IS_DIR')?.trim() || 'Practice/Image Streaming'),
        dreamsDir: path.resolve(vaultPath, getEnv('INNER_WORLD_DREAMS_DIR')?.trim() || 'Notion/Au pays des merveilles'),
    };
}

async function exists(p: string): Promise<boolean> {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

async function readJson<T>(file: string): Promise<T | null> {
    try {
        return JSON.parse(await fs.readFile(file, 'utf8')) as T;
    } catch {
        return null;
    }
}

function toNumber(value: string | undefined): number | undefined {
    if (value === undefined) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
}

function toIsoDate(value: string | undefined): string | null {
    if (!value) return null;
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
    return m ? m[1] : null;
}

function stringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0) : [];
}

/** `[[Note|Alias]]` → « Alias », `[[Note]]` → « Note » */
function cleanLink(value: string): string {
    const m = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/.exec(value.trim());
    return (m ? (m[2] ?? m[1]) : value).trim();
}

/** Retire les blocs de code, citations d'instructions et intégrations d'une transcription. */
function cleanTranscript(text: string): string {
    return text
        .split('\n')
        .filter((line) => !/^\s*(```|>|!\[\[)/.test(line))
        .join('\n')
        .replace(/\[COLLER TRANSCRIPTION ICI\]/g, '')
        .trim();
}

// ── Image Streaming ─────────────────────────────────────────────────────────

const SESSION_FILE = /^Image Streaming - (\d{4}-\d{2}-\d{2}) (\d{2})(\d{2})\.md$/;

interface SessionIndexFile {
    sessions?: { session_number?: number; date?: string; time?: string; filename?: string }[];
}

interface SymbolsFile {
    updated_at?: string;
    symbols?: Record<string, {
        count?: number;
        sessions?: unknown[];
        first_session?: number;
        last_session?: number;
        emotion_arc?: string;
        evolution?: string;
        aliases?: unknown;
        associations?: unknown;
    }>;
}

async function readSessions(dir: string): Promise<ImageStreamingSession[]> {
    const index = await readJson<SessionIndexFile>(path.join(dir, 'sessions_index.json'));
    let entries: { number?: number; date?: string; time?: string; file: string }[];

    if (index?.sessions?.length) {
        entries = index.sessions
            .filter((s) => typeof s.filename === 'string')
            .map((s) => ({ number: s.session_number, date: s.date, time: s.time, file: s.filename! }));
    } else {
        // Pas d'index : on déduit les séances des noms de fichiers
        const files = (await fs.readdir(dir)).filter((f) => SESSION_FILE.test(f)).sort();
        entries = files.map((file) => {
            const m = SESSION_FILE.exec(file)!;
            return { date: m[1], time: `${m[2]}:${m[3]}`, file };
        });
    }

    const sessions: ImageStreamingSession[] = [];
    for (const [i, entry] of entries.entries()) {
        let text = '';
        try {
            text = await fs.readFile(path.join(dir, entry.file), 'utf8');
        } catch {
            // Fichier listé mais absent : on garde la séance avec les métadonnées de l'index
        }
        const { data, body } = parseFrontmatter(text);
        const date = toIsoDate(fmString(data, 'date')) ?? toIsoDate(entry.date);
        if (!date) continue;
        sessions.push({
            number: entry.number ?? toNumber(fmString(data, 'session_number')) ?? i + 1,
            date,
            time: entry.time ?? fmString(data, 'time'),
            wordCount: toNumber(fmString(data, 'word_count')),
            moodPre: fmString(data, 'mood_pre'),
            moodPost: fmString(data, 'mood_post'),
            excerpt: excerpt(cleanTranscript(extractSection(body, 'transcription')), 320),
            file: entry.file,
        });
    }
    return sessions.sort((a, b) => a.number - b.number);
}

async function readSymbols(dir: string): Promise<{ symbols: ImageStreamingSymbol[]; updatedAt?: string }> {
    const raw = await readJson<SymbolsFile>(path.join(dir, 'symbols.json'));
    const symbols = Object.entries(raw?.symbols ?? {}).map(([name, v]) => {
        const sessions = (v.sessions ?? []).map(Number).filter((n) => Number.isFinite(n));
        return {
            name,
            count: Number(v.count) || sessions.length,
            sessions,
            firstSession: v.first_session,
            lastSession: v.last_session,
            emotionArc: v.emotion_arc?.trim() || undefined,
            evolution: v.evolution?.trim() || undefined,
            aliases: stringArray(v.aliases),
            associations: stringArray(v.associations),
        } satisfies ImageStreamingSymbol;
    });
    return { symbols, updatedAt: raw?.updated_at };
}

// ── Rêves ───────────────────────────────────────────────────────────────────

/** Clés qui signalent une note de rêve (modèle « Au pays des merveilles ») */
const DREAM_KEYS = ['Details', 'Lucid?', 'People in the Dream', 'Places in the Dream'];

async function listMarkdown(dir: string): Promise<string[]> {
    const out: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...(await listMarkdown(full)));
        else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
    }
    return out;
}

async function readDreams(dir: string): Promise<DreamEntry[]> {
    const dreams: DreamEntry[] = [];
    for (const file of await listMarkdown(dir)) {
        const { data, body, hasFrontmatter } = parseFrontmatter(await fs.readFile(file, 'utf8'));
        if (!hasFrontmatter || !DREAM_KEYS.some((k) => k in data)) continue;

        // Corps de note : on garde le récit, sans intégrations, titres ni phrase du modèle Notion
        const extra = body
            .split('\n')
            .filter((line) => !/^\s*!\[\[/.test(line))
            .filter((line) => !/^\s*#{1,6}\s/.test(line))
            .filter((line) => !/^\s*here is where you write/i.test(line))
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        const details = [fmString(data, 'Details') ?? '', extra].filter(Boolean).join('\n\n');

        dreams.push({
            id: path.relative(dir, file),
            title: path.basename(file, '.md'),
            date: toIsoDate(fmString(data, 'Date')),
            lucidity: fmList(data, 'Lucid?').join(', ') || undefined,
            motif: fmString(data, 'Motif'),
            people: fmList(data, 'People in the Dream').map(cleanLink),
            places: fmList(data, 'Places in the Dream').map(cleanLink),
            details,
            wakeTime: fmString(data, 'Wake Time'),
        });
    }
    return dreams.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

// ── Instantané ──────────────────────────────────────────────────────────────

/** `null` si aucun des deux dossiers n'existe. */
export async function readInnerWorldSnapshot(config: VaultConfig): Promise<InnerWorldSnapshot | null> {
    const [hasIs, hasDreams] = await Promise.all([exists(config.imageStreamingDir), exists(config.dreamsDir)]);
    if (!hasIs && !hasDreams) return null;

    const noSymbols: { symbols: ImageStreamingSymbol[]; updatedAt?: string } = { symbols: [] };
    const [sessions, symbolData, dreams] = await Promise.all([
        hasIs ? readSessions(config.imageStreamingDir) : Promise.resolve([]),
        hasIs ? readSymbols(config.imageStreamingDir) : Promise.resolve(noSymbols),
        hasDreams ? readDreams(config.dreamsDir) : Promise.resolve([]),
    ]);

    return {
        version: 1,
        generatedAt: new Date().toISOString(),
        sourceUpdatedAt: symbolData.updatedAt,
        sessions,
        symbols: symbolData.symbols,
        dreams,
    };
}
