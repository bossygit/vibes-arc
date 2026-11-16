/**
 * Analyse croisée Image Streaming × Rêves — module pur (aucune dépendance DOM).
 *
 * Reprend la démarche de `_diagnostic_chevauchement.py` (symboles IS cherchés dans
 * les récits de rêves) avec trois corrections :
 *   1. correspondance par MOT ENTIER, accents ignorés : « eau » ne matche plus
 *      « beaucoup », « mer » ne matche plus « merci » ;
 *   2. seuls le nom du symbole et ses alias servent de termes (les associations
 *      — « transition », « absence notable »… — sont des interprétations, pas des
 *      mots du récit) ;
 *   3. les échos temporels ignorent les symboles omniprésents (présents dans plus
 *      de 75 % des séances) : ils ne disent rien d'un parallèle précis.
 */
import type { DreamEntry, ImageStreamingSession, ImageStreamingSymbol, InnerWorldSnapshot } from '@/types/innerWorld';

// ── Normalisation & correspondance ──────────────────────────────────────────

export function normalizeText(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/œ/g, 'oe')
        .replace(/æ/g, 'ae')
        .replace(/[’`´]/g, "'");
}

/** Mots-outils qui ne peuvent pas servir de terme symbolique (« Son / Auditif » → « son »). */
const STOP_TERMS = new Set([
    'son', 'sa', 'ses', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'les', 'des', 'une', 'par',
    'pour', 'avec', 'dans', 'sur', 'sous', 'plus', 'tout', 'tous', 'bien', 'fait', 'etre', 'avoir',
]);

/** Formes fléchies qui sont d'autres mots courants (« cour » + s = « cours »). */
const FALSE_FRIENDS = new Set(['cours', 'fois']);

/**
 * Noms qui sont aussi des verbes conjugués : « la porte » (symbole) vs « il porte
 * un manteau » (verbe). Précédés d'un pronom sujet, ils ne comptent pas.
 */
const VERB_HOMOGRAPHS = new Set(['porte', 'portes', 'marche', 'marches', 'ferme', 'voile', 'vole']);
const SUBJECT_PRONOUNS = new Set(['je', 'j', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'qui']);

function previousWord(text: string, index: number): string {
    const before = text.slice(Math.max(0, index - 24), index);
    const words = before.split(/[^a-z0-9]+/).filter(Boolean);
    return words.length > 0 ? words[words.length - 1] : '';
}

const MIN_TERM_LENGTH = 3;

export function symbolTerms(symbol: Pick<ImageStreamingSymbol, 'name' | 'aliases'>): string[] {
    const fromName = symbol.name.split('/').map((part) => part.replace(/\(.*?\)/g, ''));
    const terms = new Set<string>();
    for (const raw of [...fromName, ...symbol.aliases]) {
        const t = normalizeText(raw).replace(/\s+/g, ' ').trim();
        if (t.length < MIN_TERM_LENGTH || STOP_TERMS.has(t)) continue;
        terms.add(t);
    }
    return [...terms];
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export type TermMatcher = (normalizedText: string) => string | null;

/**
 * Construit un détecteur « mot entier » pour une liste de termes déjà normalisés.
 * Accepte le pluriel simple (-s, -x) ; refuse les faux amis. Pas de lookbehind
 * (non supporté par les anciens Safari iOS).
 */
export function buildMatcher(terms: string[]): TermMatcher | null {
    if (terms.length === 0) return null;
    const alternation = [...terms]
        .sort((a, b) => b.length - a.length)
        .map((t) => escapeRegex(t).replace(/ /g, '\\s+'))
        .join('|');
    const source = `(^|[^a-z0-9])(${alternation})(s|x)?(?=$|[^a-z0-9])`;
    return (text: string) => {
        const re = new RegExp(source, 'g');
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
            const word = m[2] + (m[3] ?? '');
            const wordStart = m.index + m[1].length;
            const isVerbUse = VERB_HOMOGRAPHS.has(word) && SUBJECT_PRONOUNS.has(previousWord(text, wordStart));
            if (!FALSE_FRIENDS.has(word) && !isVerbUse) return m[2];
            re.lastIndex = m.index + m[0].length;
        }
        return null;
    };
}

function dreamSearchText(dream: DreamEntry): string {
    return normalizeText([dream.title, dream.details, dream.motif ?? '', ...dream.places].join(' \n '));
}

// ── Dates ───────────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;

function isoToDayNumber(iso: string): number {
    const [y, m, d] = iso.split('-').map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

function dayNumberToIso(day: number): string {
    return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** Lundi de la semaine (ISO) contenant la date. */
function mondayOf(iso: string): number {
    const day = isoToDayNumber(iso);
    const weekday = (new Date(day * DAY_MS).getUTCDay() + 6) % 7; // 0 = lundi
    return day - weekday;
}

export function daysBetween(fromIso: string, toIso: string): number {
    return isoToDayNumber(toIso) - isoToDayNumber(fromIso);
}

// ── Résultat ────────────────────────────────────────────────────────────────

export interface SymbolBridge {
    symbol: ImageStreamingSymbol;
    /** Rêves où le symbole apparaît (plus récents d'abord) */
    dreams: DreamEntry[];
    lastSessionDate: string | null;
    lastDreamDate: string | null;
    /** Symbole présent dans plus de 75 % des séances */
    pervasive: boolean;
}

export interface EchoLink {
    session: ImageStreamingSession;
    /** Jours entre le rêve et la séance (positif : la séance suit le rêve) */
    deltaDays: number;
    symbols: string[];
    /** 0–1 : plus les symboles partagés sont rares en IS, plus l'écho est spécifique */
    resonance: number;
}

export interface DreamEcho {
    dream: DreamEntry;
    links: EchoLink[];
}

export interface CountItem {
    name: string;
    count: number;
    /** Titres des rêves concernés */
    dreams: string[];
    /** Nom du symbole de ta base Image Streaming qui porte aussi ce nom (lieu, personnage…), sinon null */
    alsoInIS: string | null;
}

export interface WeekBucket {
    /** Lundi de la semaine (YYYY-MM-DD) */
    weekStart: string;
    sessions: number;
    dreams: number;
}

export interface InnerWorldAnalysis {
    bridges: SymbolBridge[];
    /** Symboles IS récurrents (≥ 2 séances) jamais retrouvés en rêve */
    isOnly: ImageStreamingSymbol[];
    echoes: DreamEcho[];
    dreamSymbols: Record<string, string[]>;
    sessionSymbols: Record<number, string[]>;
    people: CountItem[];
    places: CountItem[];
    motifs: CountItem[];
    weeks: WeekBucket[];
    latestSession: ImageStreamingSession | null;
    latestDream: DreamEntry | null;
    /** Symboles touchés par la dernière séance, avec leur évolution */
    latestEvolutions: ImageStreamingSymbol[];
    stats: {
        sessions: number;
        dreams: number;
        datedDreams: number;
        symbols: number;
        sharedSymbols: number;
    };
}

export interface AnalyzeOptions {
    /** Fenêtre des échos, en jours de part et d'autre du rêve (défaut 3) */
    echoWindowDays?: number;
    /** Date de fin de la chronologie (défaut : dernière donnée) */
    today?: string;
}

const PERVASIVE_SHARE = 0.75;

function countBy(
    dreams: DreamEntry[],
    pick: (d: DreamEntry) => string[],
    symbolMatchers: { name: string; matcher: TermMatcher }[],
): CountItem[] {
    const map = new Map<string, CountItem>();
    for (const dream of dreams) {
        for (const raw of pick(dream)) {
            const name = raw.trim();
            if (!name) continue;
            const key = normalizeText(name);
            const item = map.get(key) ?? {
                name,
                count: 0,
                dreams: [],
                alsoInIS: symbolMatchers.find((m) => m.matcher(key) !== null)?.name ?? null,
            };
            item.count += 1;
            item.dreams.push(dream.title);
            map.set(key, item);
        }
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function analyzeInnerWorld(snapshot: InnerWorldSnapshot, options: AnalyzeOptions = {}): InnerWorldAnalysis {
    const windowDays = options.echoWindowDays ?? 3;
    const sessions = [...snapshot.sessions].sort((a, b) => a.number - b.number);
    const sessionByNumber = new Map(sessions.map((s) => [s.number, s]));
    const sessionCount = Math.max(sessions.length, 1);
    const dreams = [...snapshot.dreams].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    const datedDreams = dreams.filter((d) => !!d.date);

    // Symboles par séance (inversion de symbols.json)
    const sessionSymbols: Record<number, string[]> = {};
    for (const symbol of snapshot.symbols) {
        for (const n of symbol.sessions) {
            (sessionSymbols[n] ??= []).push(symbol.name);
        }
    }

    // Symboles par rêve
    const dreamTexts = new Map(dreams.map((d) => [d.id, dreamSearchText(d)]));
    const dreamSymbols: Record<string, string[]> = {};
    const bridges: SymbolBridge[] = [];
    const isOnly: ImageStreamingSymbol[] = [];
    const symbolMatchers: { name: string; matcher: TermMatcher }[] = [];

    for (const symbol of snapshot.symbols) {
        const matcher = buildMatcher(symbolTerms(symbol));
        if (matcher) symbolMatchers.push({ name: symbol.name, matcher });
        const hits = matcher ? dreams.filter((d) => matcher(dreamTexts.get(d.id) ?? '') !== null) : [];
        for (const d of hits) (dreamSymbols[d.id] ??= []).push(symbol.name);

        const lastSession = symbol.sessions.length > 0
            ? sessionByNumber.get(Math.max(...symbol.sessions))
            : undefined;
        if (hits.length > 0) {
            bridges.push({
                symbol,
                dreams: hits,
                lastSessionDate: lastSession?.date ?? null,
                lastDreamDate: hits.find((d) => d.date)?.date ?? null,
                pervasive: symbol.count / sessionCount > PERVASIVE_SHARE,
            });
        } else if (symbol.count >= 2) {
            isOnly.push(symbol);
        }
    }
    bridges.sort((a, b) => b.dreams.length - a.dreams.length || b.symbol.count - a.symbol.count);
    isOnly.sort((a, b) => b.count - a.count);

    // Échos : rêve ↔ séances proches dans le temps qui partagent un symbole spécifique
    const symbolByName = new Map(snapshot.symbols.map((s) => [s.name, s]));
    const echoes: DreamEcho[] = [];
    for (const dream of datedDreams) {
        const shared = (dreamSymbols[dream.id] ?? []).filter((name) => {
            const s = symbolByName.get(name);
            return !!s && s.count / sessionCount <= PERVASIVE_SHARE;
        });
        if (shared.length === 0) continue;
        const links: EchoLink[] = [];
        for (const session of sessions) {
            const delta = daysBetween(dream.date!, session.date);
            if (Math.abs(delta) > windowDays) continue;
            const inSession = new Set(sessionSymbols[session.number] ?? []);
            const common = shared.filter((name) => inSession.has(name));
            if (common.length === 0) continue;
            const resonance = Math.min(
                1,
                common.reduce((sum, name) => sum + (1 - (symbolByName.get(name)!.count / sessionCount)), 0) / 1.5,
            );
            links.push({ session, deltaDays: delta, symbols: common, resonance });
        }
        if (links.length > 0) {
            links.sort((a, b) => b.resonance - a.resonance || Math.abs(a.deltaDays) - Math.abs(b.deltaDays));
            echoes.push({ dream, links });
        }
    }

    // Chronologie hebdomadaire sur la période de pratique IS
    const weeks: WeekBucket[] = [];
    if (sessions.length > 0) {
        const lastData = [sessions[sessions.length - 1].date, datedDreams[0]?.date ?? '']
            .filter(Boolean)
            .sort()
            .pop()!;
        const endIso = options.today && options.today > lastData ? options.today : lastData;
        const first = mondayOf(sessions[0].date);
        const last = mondayOf(endIso);
        const index = new Map<number, WeekBucket>();
        for (let w = first; w <= last; w += 7) {
            const bucket = { weekStart: dayNumberToIso(w), sessions: 0, dreams: 0 };
            index.set(w, bucket);
            weeks.push(bucket);
        }
        for (const s of sessions) index.get(mondayOf(s.date))!.sessions += 1;
        for (const d of datedDreams) {
            const bucket = index.get(mondayOf(d.date!));
            if (bucket) bucket.dreams += 1;
        }
    }

    const latestSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
    const latestEvolutions = latestSession
        ? snapshot.symbols
            .filter((s) => s.lastSession === latestSession.number && (s.evolution || s.emotionArc))
            .sort((a, b) => b.count - a.count)
        : [];

    return {
        bridges,
        isOnly,
        echoes,
        dreamSymbols,
        sessionSymbols,
        people: countBy(dreams, (d) => d.people, symbolMatchers),
        places: countBy(dreams, (d) => d.places, symbolMatchers),
        motifs: countBy(dreams, (d) => (d.motif ? [d.motif] : []), symbolMatchers),
        weeks,
        latestSession,
        latestDream: datedDreams[0] ?? null,
        latestEvolutions,
        stats: {
            sessions: sessions.length,
            dreams: dreams.length,
            datedDreams: datedDreams.length,
            symbols: snapshot.symbols.length,
            sharedSymbols: bridges.length,
        },
    };
}
