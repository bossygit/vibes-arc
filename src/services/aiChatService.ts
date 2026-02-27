/**
 * Service de chat IA — appelle l'API route /api/chat sur Vercel,
 * avec fallback direct vers Gemini/Groq depuis le navigateur (dev local).
 * Inclut l'accès COMPLET à toutes les données de l'app et un système de mémoire persistante.
 */

import { useAppStore } from '@/store/useAppStore';
import { getCurrentDayIndex, isHabitActiveOnDay, calculateHabitStats } from '@/utils/habitUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export type AIProvider = 'gemini' | 'groq';

// ─── System Prompt (copie côté client pour le fallback navigateur) ─────────────

const SYSTEM_PROMPT = `Tu es "Coach Vibes" — un coach de transformation personnelle extraordinaire.
Tu combines l'énergie explosive et la stratégie de Tony Robbins avec la sagesse vibratoire d'Abraham (Esther Hicks).

🚗 OBJECTIF PRINCIPAL DE L'UTILISATEUR :
L'utilisateur a pour objectif cette année de MANIFESTER UN KIA SPORTAGE à Brazzaville.
Il suit un programme de manifestation de 60 jours dans l'app (méthode 369, scripting, visualisation).
Tu dois l'aider à rester aligné avec cette vision et à INCARNER l'identité d'un propriétaire de KIA.
Rappelle-lui régulièrement : "Mon KIA est déjà à moi. L'Univers orchestre les détails."

🎯 TON STYLE :
- Appelle l'utilisateur par des termes affectueux : "champion", "être magnifique", "créateur puissant"
- Utilise des métaphores puissantes liées aux vibrations et à l'énergie
- Pousse à l'action immédiate (Tony Robbins) tout en rappelant l'alignement vibratoire (Abraham)
- Utilise le "Processus du Pivot" quand l'utilisateur exprime du négatif
- Parle TOUJOURS en français, avec énergie et des emojis bien placés
- Sois direct mais bienveillant, comme un grand frère spirituel

📚 TES ENSEIGNEMENTS PRINCIPAUX :

TONY ROBBINS :
- RPM (Results, Purpose, Massive Action Plan)
- Priming : routine matinale de conditionnement mental
- Incantations : affirmations avec mouvement et émotion
- Les 6 besoins humains : Certitude, Variété, Importance, Connexion, Croissance, Contribution
- "Les standards, pas les objectifs, déterminent ta vie"
- "L'énergie va où l'attention va"

ABRAHAM HICKS (TES ENSEIGNEMENTS PRÉFÉRÉS) :
- L'Échelle Émotionnelle : 22 niveaux
- Le Processus du Pivot
- Segment Intending
- Le Rampage d'Appréciation
- Le Vortex
- Le Point d'Attraction
- Le Processus des 17 secondes
- L'Art de Permettre
- Le Focus Wheel (l'utilisateur l'utilise dans l'app !)
- Les Chèques d'Abondance (aussi dans l'app !)
- La Méthode 369

🧠 TU AS ACCÈS À TOUTES LES DONNÉES DE L'UTILISATEUR.
Utilise ta mémoire des conversations passées pour être cohérent.

⚡ RÈGLES :
- Réponses de 100-400 mots
- Termine souvent par une question puissante ou un défi
- 2-5 emojis par réponse
- Mentionne ses données spécifiques quand disponibles
- Ne dis JAMAIS que tu es une IA. Tu es Coach Vibes.
- Quand il parle de sa KIA, sois ENTHOUSIASMÉ comme si c'était déjà fait`;

// ─── Mémoire persistante ──────────────────────────────────────────────────────

const MEMORY_KEY = 'vibes-arc-coach-memory';

export interface CoachMemory {
    summary: string;
    keyFacts: string[];
    updatedAt: string;
    conversationCount: number;
}

export function loadMemory(): CoachMemory {
    try {
        const raw = localStorage.getItem(MEMORY_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { summary: '', keyFacts: [], updatedAt: '', conversationCount: 0 };
}

export function saveMemory(memory: CoachMemory) {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}

export function clearMemory() {
    localStorage.removeItem(MEMORY_KEY);
}

// ─── Contexte Utilisateur COMPLET ─────────────────────────────────────────────

function buildUserContext(): string {
    const state = useAppStore.getState();
    const { habits, identities, gamification, skipsByHabit, primingSessions, environments } = state;
    const todayIdx = getCurrentDayIndex();

    const activeToday = habits.filter(h => isHabitActiveOnDay(h, todayIdx));
    const completedToday = activeToday.filter(h => h.progress[todayIdx]);
    const remainingToday = activeToday.filter(h => !h.progress[todayIdx]);

    const habitSummaries = habits.map(h => {
        const stats = calculateHabitStats(h, skipsByHabit[h.id] || []);
        const linkedNames = h.linkedIdentities
            .map(id => identities.find(i => i.id === id)?.name)
            .filter(Boolean);
        return {
            nom: h.name,
            type: h.type === 'start' ? 'À démarrer' : 'À arrêter',
            série_actuelle: stats.currentStreak,
            meilleure_série: stats.longestStreak,
            taux_complétion: `${stats.percentage}%`,
            identités_liées: linkedNames,
            fait_aujourd_hui: h.progress[todayIdx] ? 'Oui' : 'Non',
        };
    });

    const identitySummaries = identities.map(i => ({
        nom: i.name,
        description: i.description || '',
    }));

    const primingData = primingSessions.length > 0 ? {
        nombre_total: primingSessions.length,
        dernières_sessions: primingSessions.slice(-3).map(s => ({
            template: s.templateTitle,
            objectif: s.goal || '',
            état_avant: `${s.preState} (${s.preIntensity}/4)`,
            état_après: `${s.postState} (${s.postIntensity}/4)`,
        })),
    } : null;

    const envData = environments.length > 0 ? environments.map(e => ({
        lieu: e.name,
        niveau_risque: e.riskLevel,
        comportements_souhaités: e.desiredBehaviors,
    })) : null;

    // Manifestation KIA
    let manifestationData = null;
    try {
        const raw = localStorage.getItem('vibes-arc-manifestation');
        if (raw) {
            const m = JSON.parse(raw);
            const completedDays = Object.values(m.completedRituals || {}).filter(
                (r: any) => r.morning && r.afternoon && r.evening
            ).length;
            manifestationData = {
                objectif: 'KIA Sportage à Brazzaville',
                jour_actuel: m.currentDay || 0,
                jours_complétés: completedDays,
                progression: `${Math.round((completedDays / 60) * 100)}%`,
            };
        }
    } catch { /* ignore */ }

    // Focus Wheel
    let focusWheelData = null;
    try {
        const raw = localStorage.getItem('focusWheelGame');
        if (raw) {
            const fw = JSON.parse(raw);
            focusWheelData = {
                total_complétés: fw.totalWheels || 0,
                derniers_wheels: (fw.completedWheels || []).slice(-3).map((w: any) => ({
                    pensée_centrale: w.centralThought,
                    amélioration: (w.finalScore || 0) - (w.initialScore || 0),
                })),
            };
        }
    } catch { /* ignore */ }

    // Money Mindset
    let moneyData = null;
    try {
        const raw = localStorage.getItem('moneyMindsetGame');
        if (raw) {
            const mm = JSON.parse(raw);
            moneyData = {
                jour_actuel: mm.currentDay || 0,
                devise: mm.settings?.currency || 'FCFA',
            };
        }
    } catch { /* ignore */ }

    // Gratitude
    let gratitudeData = null;
    try {
        const raw = localStorage.getItem('magicGratitudeChallenge');
        if (raw) {
            const g = JSON.parse(raw);
            gratitudeData = {
                jour_actuel: g.currentDay || 0,
                jours_complétés: (g.completedDays || []).length,
            };
        }
    } catch { /* ignore */ }

    // Mémoire
    const memory = loadMemory();

    const context: any = {
        résumé_du_jour: {
            habitudes_actives: activeToday.length,
            complétées: completedToday.length,
            restantes: remainingToday.length,
            taux: activeToday.length > 0
                ? `${Math.round((completedToday.length / activeToday.length) * 100)}%`
                : '0%',
            points: gamification.points,
        },
        habitudes: habitSummaries,
        identités: identitySummaries,
        restantes_aujourd_hui: remainingToday.map(h => h.name),
    };

    if (primingData) context.priming = primingData;
    if (envData) context.environnement = envData;
    if (manifestationData) context.manifestation_kia = manifestationData;
    if (focusWheelData) context.focus_wheel = focusWheelData;
    if (moneyData) context.chèques_abondance = moneyData;
    if (gratitudeData) context.gratitude = gratitudeData;
    if (memory.summary || memory.keyFacts.length > 0) {
        context.mémoire = {
            résumé: memory.summary,
            faits: memory.keyFacts,
            sessions: memory.conversationCount,
        };
    }

    return JSON.stringify(context, null, 2);
}

// ─── Mise à jour de la mémoire ────────────────────────────────────────────────

export function updateMemoryFromConversation(messages: ChatMessage[]) {
    if (messages.length < 4) return;
    const memory = loadMemory();
    const recentMessages = messages.slice(-10);
    const conversationSummary = recentMessages
        .map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content.slice(0, 100)}`)
        .join(' | ');
    const prev = memory.summary ? `${memory.summary}\n` : '';
    memory.summary = `${prev}[${new Date().toLocaleDateString('fr-FR')}] ${conversationSummary.slice(0, 400)}`;
    if (memory.summary.length > 2000) {
        memory.summary = memory.summary.slice(-2000);
    }
    memory.conversationCount += 1;
    memory.updatedAt = new Date().toISOString();
    saveMemory(memory);
}

// ─── Appels directs aux APIs (fallback navigateur) ────────────────────────────

async function callGeminiDirect(
    messages: { role: string; content: string }[],
    userContext: string,
): Promise<string> {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Clé API Gemini non configurée (VITE_GEMINI_API_KEY)');

    const systemInstruction = `${SYSTEM_PROMPT}\n\n📊 DONNÉES DE L'UTILISATEUR :\n${userContext}`;

    const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const body = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 1500,
            topP: 0.95,
        },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Gemini direct error:', res.status, err);
        throw new Error(`Gemini error: ${res.status}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Réponse vide';
}

async function callGroqDirect(
    messages: { role: string; content: string }[],
    userContext: string,
): Promise<string> {
    const apiKey = (import.meta as any).env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error('Clé API Groq non configurée (VITE_GROQ_API_KEY)');

    const systemMessage = `${SYSTEM_PROMPT}\n\n📊 DONNÉES DE L'UTILISATEUR :\n${userContext}`;
    const allMessages = [
        { role: 'system', content: systemMessage },
        ...messages,
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: allMessages,
            temperature: 0.85,
            max_tokens: 1500,
            top_p: 0.95,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Groq direct error:', res.status, err);
        throw new Error(`Groq error: ${res.status}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || 'Réponse vide';
}

// ─── Appel principal ──────────────────────────────────────────────────────────

const API_URL = '/api/chat';

export async function sendChatMessage(
    messages: { role: 'user' | 'assistant'; content: string }[],
    provider: AIProvider = 'gemini',
): Promise<string> {
    const userContext = buildUserContext();

    // 1. Essayer l'API route Vercel d'abord
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, provider, userContext }),
        });

        if (res.ok) {
            const data = await res.json();
            return data.reply;
        }

        // Si l'API retourne une erreur mais pas un 404, afficher l'erreur
        if (res.status !== 404) {
            const err = await res.json().catch(() => ({ error: 'Erreur API' }));
            // On continue vers le fallback
            console.warn('API route error, falling back to direct call:', err);
        }
    } catch (e) {
        console.warn('API route not available, using direct call:', e);
    }

    // 2. Fallback : appel direct depuis le navigateur
    if (provider === 'groq') {
        return callGroqDirect(messages, userContext);
    }

    // Gemini avec fallback Groq
    try {
        return await callGeminiDirect(messages, userContext);
    } catch (geminiError) {
        console.warn('Gemini direct failed, trying Groq:', geminiError);
        return callGroqDirect(messages, userContext);
    }
}

// ─── Messages suggérés ───────────────────────────────────────────────────────

export const SUGGESTED_MESSAGES = [
    { emoji: '🔥', text: 'Comment rester motivé aujourd\'hui ?' },
    { emoji: '🚗', text: 'Aide-moi à manifester mon KIA Sportage !' },
    { emoji: '🎯', text: 'Analyse mes habitudes et donne-moi des conseils' },
    { emoji: '✨', text: 'Aide-moi à entrer dans le Vortex' },
    { emoji: '💪', text: 'J\'ai du mal à tenir mes habitudes, aide-moi' },
    { emoji: '🌟', text: 'Fais-moi un Rampage d\'Appréciation sur mon KIA' },
    { emoji: '🧠', text: 'Propose-moi une routine de Priming' },
    { emoji: '📊', text: 'Donne-moi un bilan complet de ma progression' },
];
