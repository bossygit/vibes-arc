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
    mode?: 'karmic' | 'controle';
    step?: KarmicCoachStep | ControleCoachStep;
    draft?: KarmicCoachRequestContext['draft'];
    qualities?: KarmicCoachRequestContext['qualities'];
    plotProgress?: KarmicCoachRequestContext['plotProgress'];
    profile?: ControleCoachContext['profile'];
    progress?: ControleCoachContext['progress'];
    exerciseId?: ControleCoachContext['exerciseId'];
    sessionLog?: ControleCoachContext['sessionLog'];
    phaseIndex?: ControleCoachContext['phaseIndex'];
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

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const body = req.body as ChatRequest;

        if (body.mode === 'karmic') {
            return await handleKarmicCoach(body, res);
        }

        if (body.mode === 'controle') {
            return await handleControleCoach(body, res);
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
