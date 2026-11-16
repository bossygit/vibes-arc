/**
 * Lecture tolérante du frontmatter Obsidian.
 *
 * Pourquoi pas un parseur YAML strict : les notes de rêve contiennent des valeurs
 * libres sur une ligne (`Details: … il m'a dit: bonjour`) qui ne sont pas du YAML
 * valide — js-yaml lèverait une erreur et la note serait perdue. Ici, on lit ligne
 * par ligne : `clé: valeur`, listes `  - élément`, tableaux en ligne `[a, b]`.
 *
 * Module pur (aucune dépendance DOM ni Node) : utilisé par le lecteur de coffre
 * côté serveur de développement et par les tests.
 */

export type FrontmatterValue = string | string[];

export interface ParsedNote {
    data: Record<string, FrontmatterValue>;
    body: string;
    /** false si la note n'a pas de bloc `---` en tête */
    hasFrontmatter: boolean;
}

const KEY_LINE = /^("?)([^"\s][^"]*?)\1:(?:\s+(.*))?$/;
const LIST_ITEM = /^\s+-\s*(.*)$/;

function unquote(value: string): string {
    const v = value.trim();
    if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
        return v.slice(1, -1).trim();
    }
    return v;
}

function parseInlineArray(value: string): string[] | null {
    const v = value.trim();
    if (!v.startsWith('[') || !v.endsWith(']')) return null;
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    return inner
        .split(',')
        .map((s) => unquote(s))
        .filter((s) => s.length > 0);
}

export function parseFrontmatter(text: string): ParsedNote {
    const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    if (!normalized.startsWith('---\n')) {
        return { data: {}, body: normalized, hasFrontmatter: false };
    }
    const end = normalized.indexOf('\n---', 4);
    if (end === -1) {
        return { data: {}, body: normalized, hasFrontmatter: false };
    }
    const front = normalized.slice(4, end);
    const afterFence = normalized.indexOf('\n', end + 4);
    const body = afterFence === -1 ? '' : normalized.slice(afterFence + 1);

    const data: Record<string, FrontmatterValue> = {};
    let currentKey: string | null = null;
    /** Clé d'un bloc littéral YAML (`key: |` / `key: >-`) : ses lignes indentées sont du texte */
    let blockKey: string | null = null;

    for (const line of front.split('\n')) {
        if (!line.trim()) continue;

        if (blockKey && /^\s/.test(line)) {
            data[blockKey] = `${data[blockKey] as string} ${line.trim()}`.trim();
            continue;
        }
        blockKey = null;

        const item = LIST_ITEM.exec(line);
        if (item && currentKey) {
            const existing = data[currentKey];
            const value = unquote(item[1]);
            if (Array.isArray(existing)) {
                if (value) existing.push(value);
            } else if (!existing) {
                data[currentKey] = value ? [value] : [];
            }
            continue;
        }

        // Clé de premier niveau (colonne 0)
        if (!/^\s/.test(line)) {
            const kv = KEY_LINE.exec(line);
            if (kv) {
                const key = kv[2].trim();
                const raw = (kv[3] ?? '').trim();
                currentKey = key;
                if (!raw) {
                    data[key] = [];
                } else if (/^[|>][-+]?$/.test(raw)) {
                    data[key] = '';
                    blockKey = key;
                } else {
                    const arr = parseInlineArray(raw);
                    data[key] = arr ?? unquote(raw);
                }
                continue;
            }
        }

        // Continuation d'une valeur texte sur plusieurs lignes
        if (currentKey && typeof data[currentKey] === 'string') {
            data[currentKey] = `${data[currentKey] as string} ${line.trim()}`.trim();
        }
    }

    return { data, body, hasFrontmatter: true };
}

/** Valeur texte d'une clé (le premier élément si c'est une liste). */
export function fmString(data: Record<string, FrontmatterValue>, key: string): string | undefined {
    const v = data[key];
    if (Array.isArray(v)) return v.length > 0 ? v[0] : undefined;
    return v && v.length > 0 ? v : undefined;
}

/** Valeur liste d'une clé (une valeur texte devient une liste à un élément). */
export function fmList(data: Record<string, FrontmatterValue>, key: string): string[] {
    const v = data[key];
    if (Array.isArray(v)) return v.filter((s) => s.length > 0);
    return v ? [v] : [];
}

/**
 * Contenu d'une section Markdown `## <titre>` (jusqu'au titre de même niveau suivant).
 * La comparaison ignore les émojis et la casse : `## 📝 Transcription` ↔ « transcription ».
 */
export function extractSection(body: string, title: string): string {
    const lines = body.split('\n');
    const wanted = title.toLowerCase();
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
        const m = /^##\s+(.*)$/.exec(lines[i]);
        if (m && m[1].toLowerCase().includes(wanted)) {
            start = i + 1;
            break;
        }
    }
    if (start === -1) return '';
    const out: string[] = [];
    for (let i = start; i < lines.length; i++) {
        if (/^##\s+/.test(lines[i])) break;
        out.push(lines[i]);
    }
    return out.join('\n').trim();
}

/** Coupe un texte à ~`max` caractères sur une frontière de mot. */
export function excerpt(text: string, max = 320): string {
    const flat = text.replace(/\s+/g, ' ').trim();
    if (flat.length <= max) return flat;
    const cut = flat.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace >= max * 0.5 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
