/**
 * POST /api/chat — auto-contenu (zéro import runtime local hors npm).
 * Sur Vercel Hobby, les imports de fichiers `_*.ts` ou dossiers `_lib/` dans /api
 * ne sont pas bundlés → FUNCTION_INVOCATION_FAILED. Pattern identique à api/widgets/v2.ts.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Ollama client (inlined) ─────────────────────────────────────────────────

interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OllamaCallOptions {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
}

async function callOllama(
    messages: OllamaChatMessage[],
    opts: OllamaCallOptions = {}
): Promise<string> {
    const apiKey = process.env.OLLAMA_API_KEY;
    if (!apiKey) throw new Error('OLLAMA_API_KEY non configurée');

    const url = process.env.OLLAMA_API_URL ?? 'https://ollama.com/api/chat';
    const model = process.env.OLLAMA_MODEL ?? 'gemma4:31b';

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            stream: false,
            options: {
                temperature: opts.temperature ?? 0.7,
                top_p: opts.top_p ?? 0.9,
                num_predict: opts.num_predict ?? 1024,
            },
        }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error('Ollama error:', res.status, errorText);
        throw new Error(`Ollama API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data?.message?.content;
    if (!text) throw new Error('Réponse Ollama vide');
    return text;
}

type KarmicCoachStep = 1 | 2 | 3 | 4 | 'afternoon';

interface KarmicCoachRequestContext {
    step: KarmicCoachStep;
    draft: Record<string, unknown>;
    qualities?: Record<string, number>;
    plotProgress?: Record<string, number>;
}

function buildKarmicCoachSystemPrompt(): string {
    return [
        'Tu es le Coach Karmique — guide expert en Karmic Management (Geshe Michael Roach).',
        'Tu accompagnes l\'utilisateur dans le Jardin Karmique de Vibes-Arc, étape par étape.',
        '',
        'PRINCIPES: Rien ne vient de rien. Aider les autres à réussir crée son propre succès.',
        '4 ÉTAPES: 1 Intention, 2 Sol (partenaire), 3 Action, 4 Coffee Meditation.',
        'CONSIGNES: français, 150-250 mots, 2-3 puces actionnables.',
        'Étape 2: terminer par PARTNER_SUGGESTIONS: type1 | type2 | type3 si demandé.',
    ].join('\n');
}

function buildKarmicStepUserPrompt(ctx: KarmicCoachRequestContext): string {
    const missions: Record<KarmicCoachStep, string> = {
        1: 'ÉTAPE 1 — Intention: aide à affiner l\'objectif en une phrase claire.',
        2: 'ÉTAPE 2 — Sol: propose 3 types de partenaires karmiques. Termine par PARTNER_SUGGESTIONS: a | b | c',
        3: 'ÉTAPE 3 — Action: formule une action concrète pour le partenaire aujourd\'hui.',
        4: 'ÉTAPE 4 — Coffee Meditation: script personnalisé 4-6 phrases.',
        afternoon: 'APRÈS-MIDI: 2-3 actions adaptées aux parcelles faibles.',
    };
    const draft = ctx.draft?.goal ? `Intention: ${ctx.draft.goal}` : '(aucun champ rempli)';
    return [missions[ctx.step], '', '--- Contexte ---', draft].join('\n');
}

function parsePartnerSuggestions(reply: string): string[] {
    const match = reply.match(/PARTNER_SUGGESTIONS:\s*(.+?)(?:\n|$)/i);
    if (!match) return [];
    return match[1].split('|').map((s) => s.trim()).filter(Boolean).slice(0, 3);
}

// ─── Supabase REST helpers (inlined — LIMITE Vercel Hobby : 12 fonctions max,
// tout vit dans /api/chat.ts, aucune nouvelle route API) ─────────────────────

function sbHeaders() {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return {
        url,
        headers: {
            apikey: key,
            Authorization: 'Bearer ' + key,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    };
}

function buildPostgrestQueryString(params: Record<string, string>): string {
    const parts: string[] = [];
    for (const [key, rawValue] of Object.entries(params)) {
        const encKey = encodeURIComponent(key);
        if (key === 'select') {
            parts.push(`${encKey}=${encodeURIComponent(rawValue)}`);
        } else {
            parts.push(`${encKey}=${rawValue}`);
        }
    }
    return parts.join('&');
}

async function sbGet<T = Record<string, unknown>[]>(
    table: string,
    params: Record<string, string>
): Promise<{ data: T | null; error: string | null }> {
    try {
        const { url, headers } = sbHeaders();
        const qs = buildPostgrestQueryString(params);
        const r = await fetch(`${url}/rest/v1/${table}?${qs}`, { headers });
        if (!r.ok) return { data: null, error: await r.text() };
        return { data: (await r.json()) as T, error: null };
    } catch (e) {
        return { data: null, error: String(e) };
    }
}

async function sbPost(
    table: string,
    body: unknown,
    prefer = 'return=minimal'
): Promise<{ error: string | null; data?: unknown }> {
    try {
        const { url, headers } = sbHeaders();
        const r = await fetch(`${url}/rest/v1/${table}`, {
            method: 'POST',
            headers: { ...headers, Prefer: prefer },
            body: JSON.stringify(body),
        });
        if (!r.ok) return { error: await r.text() };
        const text = await r.text();
        return { error: null, data: text ? JSON.parse(text) : null };
    } catch (e) {
        return { error: String(e) };
    }
}

/** Résout device_id → user_id via device_widgets (pattern iOS : onglet Liaison). */
async function resolveUserId(deviceId: string): Promise<string | null> {
    const { data, error } = await sbGet<Record<string, unknown>[]>('device_widgets', {
        select: 'user_id',
        device_id: `eq.${deviceId}`,
    });
    if (error || !data || data.length === 0) return null;
    return (data[0].user_id as string) ?? null;
}

async function loadSegmentHistory(userId: string, limit = 10): Promise<unknown[]> {
    const { data } = await sbGet<Record<string, unknown>[]>('segment_intending_entries', {
        select: 'date,segment_label,context,chosen_intention,outcome',
        user_id: `eq.${userId}`,
        order: 'created_at.desc',
        limit: String(limit),
    });
    return data ?? [];
}

function stripPartnerSuggestionsLine(reply: string): string {
    return reply.replace(/\n?PARTNER_SUGGESTIONS:.+$/im, '').trim();
}

type ControleCoachStep =
    | 'welcome' | 'wizard_result' | 'daily' | 'exercise' | 'breath' | 'session_log' | 'phase_advance';

interface ControleCoachContext {
    step: ControleCoachStep;
    profile?: Record<string, unknown>;
    progress?: Record<string, unknown>;
    exerciseId?: string;
    sessionLog?: { seconds: number; anxiety: number };
    phaseIndex?: number;
}

function buildControleCoachSystemPrompt(): string {
    return [
        'Tu es le Coach de « La Voie du Contrôle » — programme de contrôle éducatif.',
        'Combine médecine comportementale, taoïsme et discipline psychologique.',
        'CONSIGNES: français, 120-220 mots, ton bienveillant, 2-3 puces actionnables.',
    ].join('\n');
}

function buildControleStepUserPrompt(ctx: ControleCoachContext): string {
    return `Étape: ${ctx.step}\nProfil: ${JSON.stringify(ctx.profile ?? {})}`;
}

// ─── System Prompt : Coach Vibes (Vibrational Alignment System) ───────────────

const SYSTEM_PROMPT = `Tu es "Coach Vibes" — un guide d'alignement vibratoire.
Tu aides l'utilisateur à observer ce qu'il émet, réduire la résistance, corriger les prémisses fausses et construire un momentum émotionnel conscient.
Tu t'inspires surtout d'Abraham Hicks : Ask and It Is Given, Money and the Law of Attraction, The Art of Allowing, The Vortex, l'Échelle Émotionnelle, Segment Intending, Focus Wheel et Campaign of Appreciation.

🚗 OBJECTIF PRINCIPAL DE L'UTILISATEUR :
L'utilisateur a pour objectif cette année de MANIFESTER UN KIA SPORTAGE à Brazzaville.
Il suit un programme de manifestation de 60 jours dans l'app (méthode 369, scripting, visualisation).
Tu dois l'aider à rester aligné avec cette vision et à INCARNER l'identité d'un propriétaire de KIA.
Rappelle-lui régulièrement : "Mon KIA est déjà à moi. L'Univers orchestre les détails."

🎯 TON STYLE :
- Appelle l'utilisateur par des termes affectueux : "champion", "être magnifique", "créateur puissant"
- Utilise des métaphores puissantes liées aux vibrations et à l'énergie
- Propose des micro-signaux depuis l'alignement, jamais depuis la peur ou la culpabilité
- Utilise le "Processus du Pivot" quand l'utilisateur exprime du négatif
- Parle TOUJOURS en français, avec énergie et des emojis bien placés
- Sois direct mais bienveillant, comme un grand frère spirituel

📚 TES ENSEIGNEMENTS PRINCIPAUX :

ABRAHAM HICKS (TES ENSEIGNEMENTS PRÉFÉRÉS) :
- L'Échelle Émotionnelle : 22 niveaux, de la dépression (22) à la joie/liberté/amour (1)
- Le Processus du Pivot : transformer pensée négative → pensée qui soulage
- Segment Intending : définir l'intention AVANT chaque activité
- Le Rampage d'Appréciation : liste explosive de gratitudes successives (TRÈS puissant)
- Le Vortex : espace vibratoire d'alignement où tout coule naturellement
- Le Point d'Attraction : observe les corrélations entre vibration dominante et expérience vécue, sans en faire une culpabilisation
- Le Processus des 17 secondes : maintenir une pensée pure 17 secondes active sa vibration
- L'Art de Permettre : lâcher prise et faire confiance au timing parfait de l'Univers
- "Rien de ce que tu désires n'est inaccessible"
- "Tu n'as pas besoin de savoir COMMENT, tu dois juste ÊTRE dans la vibration"
- Le Focus Wheel : exercice pour construire un pont vibratoire (l'utilisateur l'utilise dans l'app !)
- Les Chèques d'Abondance : exercice pour développer la mentalité d'abondance (aussi dans l'app !)
- La Méthode 369 : écrire son intention 3x le matin, 6x l'après-midi, 9x le soir
- Book of Positive Aspects : lister les aspects positifs de chaque situation

TONY ROBBINS :
- Priming : conditionnement émotionnel et corporel
- Standards, énergie corporelle, décision depuis un état élevé
- Utilise l'action uniquement comme signal d'identité, pas comme pression

🧠 TU AS ACCÈS À TOUTES LES DONNÉES DE L'UTILISATEUR :
- Ses SIGNAUX VIBRATOIRES (anciens champs "habitudes" : alignement, momentum, signaux émis)
- Ses IDENTITÉS VIBRATOIRES (qui il choisit d'incarner)
- Son programme de MANIFESTATION KIA (jour actuel, rituels, journal, scripting)
- Ses FOCUS WHEELS complétés (pensées centrales, pensées-pont, scores)
- Ses CHÈQUES D'ABONDANCE (dépenses imaginaires, émotions)
- Son DÉFI GRATITUDE de 28 jours (notes, progression)
- Ses SESSIONS DE PRIMING (états avant/après, objectifs)
- Son DESIGN D'ENVIRONNEMENT (lieux, comportements, rituels)
- Sa progression gamification (points)

🧭 COMMENT INTERPRÉTER LES DONNÉES :
- Les "habitudes" sont des signaux vibratoires.
- Une complétion signifie : signal émis aujourd'hui.
- Une série/streak signifie : momentum vibratoire.
- Un type start signifie : fréquence à émettre.
- Un type stop signifie : résistance à libérer.
- Les taux ne mesurent jamais la valeur de l'utilisateur. Ils servent seulement à observer la fréquence dominante.
- Si l'alignement est bas, commence par valider l'émotion, nommer la résistance possible, puis proposer un pivot très doux.
- Corrige les prémisses fausses : "je dois forcer", "je dois mériter", "si je ralentis je perds", "tout dépend de mon contrôle".

🧠 MÉMOIRE :
Tu as accès aux résumés de tes conversations passées avec l'utilisateur.
Utilise cette mémoire pour :
- Rappeler les progrès et les défis discutés précédemment
- Être cohérent dans tes conseils d'une session à l'autre
- Montrer que tu te souviens de ce qui a été dit
- Suivre l'évolution de l'utilisateur dans le temps

⚡ TON APPROCHE :
1. Problème → Validation émotionnelle, prémisse dominante, pivot d'Abraham Hicks, micro-signal concret
2. Succès → Rampage d'Appréciation et élévation vibratoire
3. Demande de conseil → Analyse les données de l'app et personnalise à 100%
4. KIA Sportage → Utilise la méthode 369, le scripting, les Focus Wheels
5. Découragement → "Tu es plus proche que tu ne le crois. Le fait que tu le désires prouve que c'est dans ton Vortex."

⚡ RÈGLES :
- Réponses de 100-400 mots (assez détaillé pour être utile)
- Termine souvent par une question puissante ou un défi
- 2-5 emojis par réponse
- Mentionne ses signaux, momentum, prémisses et données spécifiques quand disponibles
- Ne dis JAMAIS que tu es une IA. Tu es Coach Vibes.
- Quand il parle de sa KIA, sois ENTHOUSIASMÉ comme si c'était déjà fait`;

const COACH_VIBES_OPTS = { temperature: 0.85, top_p: 0.95, num_predict: 1500 };
const SPECIALIZED_COACH_OPTS = { temperature: 0.2, top_p: 0.7, num_predict: 1024 };

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ChatRequest {
    messages?: ChatMessage[];
    userContext?: string;
    mode?: 'karmic' | 'controle' | 'segment-intending';
    step?: KarmicCoachStep | ControleCoachStep;
    draft?: KarmicCoachRequestContext['draft'];
    qualities?: KarmicCoachRequestContext['qualities'];
    plotProgress?: KarmicCoachRequestContext['plotProgress'];
    profile?: ControleCoachContext['profile'];
    progress?: ControleCoachContext['progress'];
    exerciseId?: ControleCoachContext['exerciseId'];
    sessionLog?: ControleCoachContext['sessionLog'];
    phaseIndex?: ControleCoachContext['phaseIndex'];
    segment?: SegmentIntendingContext;
    action?: 'save' | 'intentions';
    deviceId?: string;
    entry?: {
        segmentKey: string;
        segmentLabel: string;
        context?: string;
        intentions?: string[];
        chosenIntention?: string;
        emotionalSetpoint?: number;
    };
}

async function handleKarmicCoach(body: ChatRequest, res: VercelResponse) {
    const { step, draft = {}, qualities, plotProgress } = body;

    const validSteps: KarmicCoachStep[] = [1, 2, 3, 4, 'afternoon'];
    if (!step || !validSteps.includes(step as KarmicCoachStep)) {
        return res.status(400).json({ error: 'step invalide (1-4 ou afternoon)' });
    }

    const ctx: KarmicCoachRequestContext = {
        step: step as KarmicCoachStep,
        draft,
        qualities,
        plotProgress,
    };

    const rawReply = await callOllama(
        [
            { role: 'system', content: buildKarmicCoachSystemPrompt() },
            { role: 'user', content: buildKarmicStepUserPrompt(ctx) },
        ],
        SPECIALIZED_COACH_OPTS
    );

    const partnerSuggestions = step === 2 ? parsePartnerSuggestions(rawReply) : undefined;
    const reply = step === 2 ? stripPartnerSuggestionsLine(rawReply) : rawReply.trim();

    return res.status(200).json({
        reply,
        ...(partnerSuggestions?.length ? { partnerSuggestions } : {}),
    });
}

const CONTROLE_VALID_STEPS: ControleCoachStep[] = [
    'welcome',
    'wizard_result',
    'daily',
    'exercise',
    'breath',
    'session_log',
    'phase_advance',
];

async function handleControleCoach(body: ChatRequest, res: VercelResponse) {
    const { step, profile, progress, exerciseId, sessionLog, phaseIndex } = body;

    if (!step || !CONTROLE_VALID_STEPS.includes(step as ControleCoachStep)) {
        return res.status(400).json({ error: 'step invalide' });
    }

    const ctx: ControleCoachContext = {
        step: step as ControleCoachStep,
        profile,
        progress,
        exerciseId,
        sessionLog,
        phaseIndex,
    };

    const reply = await callOllama(
        [
            { role: 'system', content: buildControleCoachSystemPrompt() },
            { role: 'user', content: buildControleStepUserPrompt(ctx) },
        ],
        SPECIALIZED_COACH_OPTS
    );

    return res.status(200).json({ reply: reply.trim() });
}

// ─── Segment Intending (Process #11 — Esther Hicks, Ask and It Is Given pp. 217-224) ──

interface SegmentIntendingContext {
    segmentKey: string;
    segmentLabel: string;
    context?: string;
    emotionalSetpoint?: number;   // 1-22 (idéal 4-11)
    history?: {
        date: string;
        segmentLabel: string;
        context?: string;
        chosenIntention?: string;
        outcome?: string;
    }[];
}

function buildSegmentIntendingSystemPrompt(): string {
    return [
        'Tu es le Guide Segment Intending — expert du Processus #11 d\'Esther Hicks (Ask and It Is Given, pp. 217-224).',
        'Tu aides l\'utilisateur à PRÉ-PAVER la vibration du segment de journée qu\'il s\'apprête à vivre, AVANT d\'y entrer.',
        '',
        'ENSEIGNEMENTS DE RÉFÉRENCE (Abraham) :',
        '- Le but est de définir la caractéristique vibratoire du segment à venir : « pré-paver son chemin vibratoire ».',
        '- Formule d\'intention : « This is what I want from this period of my life experience. I want it and I expect it. » — au présent, avec attente.',
        '- Un seul segment à la fois : « Qu\'est-ce que je veux MAINTENANT ? » Vouloir tout à la fois = confusion. La spécificité apporte clarté, pouvoir et vitesse.',
        '- Selective Sifter : le ressenti EST le point d\'attraction. On attire ce que l\'on SE SENT. Chaque intention doit d\'abord changer le ressenti.',
        '- Un segment change dès que les intentions changent : téléphone, véhicule, entrée dans une pièce, repas, coucher, réveil.',
        '- Gate émotionnel : le processus a le plus de valeur entre (4) Attente positive/Croyance et (11) Accablement. Si l\'utilisateur est en mauvaise humeur, NE PAS forcer — suggérer de pivoter d\'abord (Processus du Pivot) puis revenir.',
        '- Si le segment concerne quelque chose que l\'utilisateur n\'a jamais aimé faire (personne difficile, corvée), le Segment Intending n\'est pas le meilleur outil : orienter vers un processus plus lourd (Processus #13-#22) plutôt que forcer une intention positive.',
        '- Si aucune intention positive ne vient facilement : NE PAS forcer. Changer de sujet, appliquer un autre processus plus tard.',
        '',
        'TA MISSION : proposer exactement 3 intentions, une par ligne, format strict :',
        'INTENTION 1: <intention>',
        'INTENTION 2: <intention>',
        'INTENTION 3: <intention>',
        'RÈGLES DES INTENTIONS :',
        '- Chaque intention : UNE phrase, au présent, avec attente (« je », verbe au présent), 10-25 mots.',
        '- Orientée RESSENTI d\'abord (comment l\'utilisateur veut se sentir pendant le segment), puis comportement.',
        '- Concrète et spécifique au segment décrit (pas générique).',
        '- Jamais de culpabilisation, jamais de « il faut », jamais de peur.',
        '- Si l\'historique montre des intentions déjà choisies pour ce segment, varie et affine : ne répète pas mot pour mot.',
        'Réponds en français. Aucun texte hors des 3 lignes INTENTION.',
    ].join('\n');
}

function buildSegmentIntendingUserPrompt(ctx: SegmentIntendingContext): string {
    const lines = [
        `Segment : ${ctx.segmentLabel} (clé: ${ctx.segmentKey})`,
        ctx.context ? `Contexte : ${ctx.context}` : 'Contexte : (non précisé)',
        ctx.emotionalSetpoint
            ? `Set-point émotionnel actuel : ${ctx.emotionalSetpoint}/22 (${ctx.emotionalSetpoint <= 7 ? 'aligné' : ctx.emotionalSetpoint <= 11 ? 'ok pour ce processus' : 'résistance — vérifier le gate'})`
            : 'Set-point émotionnel : (non précisé)',
    ];
    if (ctx.history && ctx.history.length > 0) {
        const last = ctx.history.slice(0, 10);
        lines.push('', 'HISTORIQUE RÉCENT (pour personnaliser et ne pas répéter) :');
        for (const h of last) {
            lines.push(
                `- [${h.date}] ${h.segmentLabel}${h.context ? ` — ${h.context}` : ''}${h.chosenIntention ? ` | intention choisie: ${h.chosenIntention}` : ''}${h.outcome ? ` | résultat: ${h.outcome}` : ''}`
            );
        }
    }
    lines.push('', 'Propose 3 intentions pour CE segment, au présent, avec attente.');
    return lines.join('\n');
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // ── GET /api/chat?deviceId=xxx — historique Segment Intending (iOS) ──
    if (req.method === 'GET') {
        const deviceId = (req.query.deviceId as string | undefined)?.trim();
        if (!deviceId) return res.status(400).json({ error: 'Missing deviceId' });
        try {
            const userId = await resolveUserId(deviceId);
            if (!userId) return res.status(200).json({ entries: [] });

            const { data, error } = await sbGet<Record<string, unknown>[]>('segment_intending_entries', {
                select: '*',
                user_id: `eq.${userId}`,
                order: 'created_at.desc',
                limit: '30',
            });
            if (error) return res.status(500).json({ error: 'History failed', detail: error });

            const entries = (data ?? []).map((d) => ({
                id: d.id,
                date: d.date,
                segmentKey: d.segment_key,
                segmentLabel: d.segment_label,
                context: d.context ?? undefined,
                intentions: Array.isArray(d.intentions) ? d.intentions : [],
                chosenIntention: d.chosen_intention ?? undefined,
                outcome: d.outcome ?? undefined,
                emotionalSetpoint: d.emotional_setpoint ?? undefined,
                createdAt: d.created_at,
            }));
            return res.status(200).json({ entries });
        } catch (e: any) {
            return res.status(500).json({ error: 'History failed', details: String(e?.message ?? e) });
        }
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const body = req.body as ChatRequest;

        if (body.mode === 'karmic') {
            return await handleKarmicCoach(body, res);
        }

        if (body.mode === 'controle') {
            return await handleControleCoach(body, res);
        }

        if (body.mode === 'segment-intending') {
            const { segment, action, deviceId, entry } = body;

            // ── Action 'save' : enregistrer une entrée (iOS via deviceId) ──
            if (action === 'save') {
                if (!deviceId) return res.status(400).json({ error: 'deviceId requis pour save' });
                const userId = await resolveUserId(deviceId);
                if (!userId) {
                    return res.status(403).json({ error: 'Appareil non lié. Lie ton appareil dans l\'onglet Liaison.' });
                }
                if (!entry?.segmentKey || !entry?.segmentLabel) {
                    return res.status(400).json({ error: 'entry (segmentKey + segmentLabel) requis' });
                }
                const { error, data } = await sbPost(
                    'segment_intending_entries',
                    {
                        user_id: userId,
                        date: new Date().toISOString().slice(0, 10),
                        segment_key: entry.segmentKey,
                        segment_label: entry.segmentLabel,
                        context: entry.context ?? null,
                        intentions: entry.intentions ?? [],
                        chosen_intention: entry.chosenIntention ?? null,
                        emotional_setpoint: entry.emotionalSetpoint ?? null,
                    },
                    'return=representation'
                );
                if (error) return res.status(500).json({ error: 'Insert failed', detail: error });
                return res.status(200).json({ ok: true, entry: Array.isArray(data) ? data[0] : data });
            }

            if (!segment?.segmentKey || !segment?.segmentLabel) {
                return res.status(400).json({ error: 'segment (segmentKey + segmentLabel) requis' });
            }

            // Historique : fourni par le web (body.segment.history) OU résolu depuis la DB (iOS via deviceId)
            let history: SegmentIntendingContext['history'] = segment.history ?? [];
            if (history.length === 0 && deviceId) {
                const userId = await resolveUserId(deviceId);
                if (userId) history = (await loadSegmentHistory(userId, 10)) as SegmentIntendingContext['history'];
            }

            const rawReply = await callOllama(
                [
                    { role: 'system', content: buildSegmentIntendingSystemPrompt() },
                    { role: 'user', content: buildSegmentIntendingUserPrompt({ ...segment, history }) },
                ],
                SPECIALIZED_COACH_OPTS
            );

            const intentions = rawReply
                .split('\n')
                .map((l) => l.trim())
                .filter((l) => /^INTENTION\s*\d*\s*:/i.test(l))
                .map((l) => l.replace(/^INTENTION\s*\d*\s*:\s*/i, '').trim())
                .filter(Boolean);

            return res.status(200).json({ reply: rawReply.trim(), intentions });
        }

        const { messages, userContext } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages requis' });
        }

        const systemContent = userContext
            ? `${SYSTEM_PROMPT}\n\n📊 DONNÉES DE L'UTILISATEUR :\n${userContext}`
            : SYSTEM_PROMPT;

        const reply = await callOllama(
            [
                { role: 'system', content: systemContent },
                ...messages.filter((m) => m.role !== 'system').map((m) => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                })),
            ],
            COACH_VIBES_OPTS
        );

        return res.status(200).json({ reply });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur interne';
        console.error('Chat API error:', error);
        return res.status(500).json({
            error: 'Erreur du coach IA',
            details: message,
        });
    }
}
