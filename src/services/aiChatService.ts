/**
 * Service de chat IA — appelle l'API route /api/chat sur Vercel (Ollama Cloud).
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
            intention_vibratoire: h.type === 'start' ? 'Signal à émettre' : 'Résistance à libérer',
            momentum_actuel_jours: stats.currentStreak,
            meilleur_momentum_jours: stats.longestStreak,
            taux_alignement: `${stats.percentage}%`,
            identités_vibratoires_liées: linkedNames,
            signal_émis_aujourd_hui: h.progress[todayIdx] ? 'Oui' : 'Non',
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

    // Inner Child Check-in du jour
    let innerChildData = null;
    try {
        const raw = localStorage.getItem('vibes-arc-inner-child');
        if (raw) {
            const ic = JSON.parse(raw);
            const todayStr = new Date().toISOString().slice(0, 10);
            const todayEntry = (ic.entries || []).find((e: any) => e.date === todayStr);
            const last7 = (ic.entries || []).slice(-7).map((e: any) => e.emotion);
            if (todayEntry) {
                innerChildData = {
                    check_in_fait: true,
                    émotion_du_jour: todayEntry.emotion,
                    intensité: `${todayEntry.intensity}/5`,
                    déclencheur: todayEntry.trigger,
                    total_check_ins: (ic.entries || []).length,
                };
            } else {
                innerChildData = {
                    check_in_fait: false,
                    total_check_ins: (ic.entries || []).length,
                    émotions_7_derniers_jours: last7,
                };
            }
        }
    } catch { /* ignore */ }

    // Mémoire
    const memory = loadMemory();

    const context: any = {
        résumé_du_jour: {
            signaux_actifs: activeToday.length,
            signaux_émis: completedToday.length,
            signaux_non_émis: remainingToday.length,
            taux_alignement: activeToday.length > 0
                ? `${Math.round((completedToday.length / activeToday.length) * 100)}%`
                : '0%',
            points: gamification.points,
        },
        signaux_vibratoires: habitSummaries,
        identités_vibratoires: identitySummaries,
        signaux_à_émettre_aujourd_hui: remainingToday.map(h => h.name),
    };

    if (primingData) context.priming = primingData;
    if (envData) context.environnement = envData;
    if (manifestationData) context.manifestation_kia = manifestationData;
    if (focusWheelData) context.focus_wheel = focusWheelData;
    if (moneyData) context.chèques_abondance = moneyData;
    if (gratitudeData) context.gratitude = gratitudeData;
    if (innerChildData) context.inner_child_checkin = innerChildData;
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

// ─── Appel principal ──────────────────────────────────────────────────────────

const API_URL = '/api/chat';

export async function sendChatMessage(
    messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
    const userContext = buildUserContext();

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, userContext }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur API', details: `HTTP ${res.status}` }));
        throw new Error(err.details || err.error || `Erreur coach IA (${res.status})`);
    }

    const data = await res.json();
    return data.reply ?? 'Réponse vide';
}

// ─── Messages suggérés ───────────────────────────────────────────────────────

export const SUGGESTED_MESSAGES = [
    { emoji: '🫀', text: 'Je me sens anxieux aujourd\'hui, aide-moi' },
    { emoji: '🔥', text: 'Quel micro-signal émettre aujourd\'hui ?' },
    { emoji: '🚗', text: 'Aide-moi à manifester mon KIA Sportage !' },
    { emoji: '🎯', text: 'Analyse mes signaux et mon momentum' },
    { emoji: '✨', text: 'Aide-moi à entrer dans le Vortex' },
    { emoji: '💪', text: 'J\'ai de la résistance, aide-moi à pivoter' },
    { emoji: '🧒', text: 'Je me sens en mode auto-sabotage' },
    { emoji: '📊', text: 'Donne-moi une lecture vibratoire complète' },
];
