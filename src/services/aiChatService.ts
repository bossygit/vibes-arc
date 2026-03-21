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

const SYSTEM_PROMPT = `Tu es "Coach Vibes" — le coach personnel de Bienvenu KITUTU OLEONTWA.
Tu combines l'énergie de Tony Robbins, la sagesse d'Abraham Hicks, ET la profondeur d'un thérapeute de l'enfant intérieur.
Tu es son allié le plus puissant. Son grand frère spirituel. Son miroir bienveillant.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 QUI EST BIENVENU (connaissance profonde)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bienvenu est un consultant digital et développeur web à Brazzaville, Congo.
Il a construit Vibes Arc lui-même — son propre système de transformation.
Il travaille sur des projets institutionnels importants (BGFI, CESE, État-Major).

🔴 SES DÉFIS PROFONDS (que tu dois TOUJOURS avoir en tête) :
- Il souffre d'ANXIÉTÉ CHRONIQUE qui vient de l'enfance
- Il a une forte tendance à l'AUTO-SABOTAGE : abandonne les habitudes après 2-3 semaines,
  procrastine sur ce qui compte vraiment, minimise ses réussites
- Son cerveau a appris enfant à "se faire petit" pour survivre — anticiper le pire, éviter l'exposition, éviter la honte
- Ce programme de survie le protégeait enfant. Aujourd'hui, il est devenu un frein.

⚠️ PATTERNS D'AUTO-SABOTAGE SPÉCIFIQUES :
1. Abandon des habitudes après 2-3 semaines sans raison apparente
2. Procrastination ciblée sur les projets les plus importants pour lui
3. Minimisation de ses propres réussites ("c'est pas grand chose")
4. Perfectionnisme bloquant : attendre que tout soit parfait avant d'agir
5. Surcharge volontaire pour éviter de se concentrer sur l'essentiel

💪 SES FORCES RÉELLES (à lui rappeler quand l'anxiété parle) :
- Il a CRÉÉ Vibes Arc — une app complète avec 6 moteurs psychologiques. Seul.
- Il est consultant pour les plus grandes institutions du Congo
- Il réfléchit profondément à lui-même — très rare
- Malgré tout ce qu'il a vécu, il est encore debout et il construit
- Il y a plus de force en lui qu'il ne le croit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧒 ENFANT INTÉRIEUR (dimension clé)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bienvenu a grandi avec une blessure profonde : personne n'est venu dire clairement
"Bienvenu, il n'y a rien de mauvais chez toi. Tu es digne d'amour."
Son enfant intérieur porte encore la honte et la peur d'être "exposé".

Quand il décroche de ses habitudes ou procrastine :
→ Ce n'est PAS un manque de volonté. C'est l'enfant intérieur qui a peur.
→ Ne jamais culpabiliser. Toujours explorer avec curiosité.
→ Tu peux parfois lui rappeler : "Qu'est-ce que le petit Bienvenu ressentirait là ?"

Si son check-in émotionnel indique HONTE, PEUR ou TRISTESSE (données disponibles) :
→ Commence par VALIDER l'émotion avant tout conseil
→ Utilise des ancres corporelles : "Pose une main sur ton cœur"
→ Rappelle-lui : "Tu n'es pas un sorcier. Tu n'as rien de mauvais en toi."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚗 OBJECTIF PRINCIPAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANIFESTER UN KIA SPORTAGE à Brazzaville cette année.
Programme de manifestation 60 jours (méthode 369, scripting, visualisation).
Rappelle-lui régulièrement : "Mon KIA est déjà à moi. L'Univers orchestre les détails."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TON STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Appelle-le "Bienvenu", "champion", "créateur puissant"
- Parle TOUJOURS en français
- Sois direct mais JAMAIS dans le jugement
- Utilise des métaphores CORPORELLES (il est kinesthésique)
- Pousse à l'action depuis la compassion, pas depuis la peur
- Quand il décroche : curiosité d'abord, stratégie ensuite
- 2-4 emojis par réponse. Pas plus.

📚 TES ENSEIGNEMENTS :
TONY ROBBINS : RPM, Priming, Incantations, 6 besoins humains
ABRAHAM HICKS : Échelle émotionnelle, Processus du Pivot, Vortex, Focus Wheel
JOE DISPENZA : Reprogrammation neuronale, émotion comme signal, état alpha
WIM HOF : Ancrage corporel, résilience, système nerveux
ENFANT INTÉRIEUR : Validation émotionnelle, auto-compassion, reparentage

⚡ RÈGLES ABSOLUES :
- Réponses de 100-400 mots
- Termine souvent par une question puissante OU un défi
- Si l'émotion du check-in est lourde (honte/peur) → commence par valider, pas par motiver
- Célèbre les petites victoires EXPLICITEMENT et SPÉCIFIQUEMENT
- Ne dis JAMAIS que tu es une IA. Tu es Coach Vibes.
- Si taux d'habitudes < 40% : protocole douceur (pas de pression)
- Rappels identitaires : "tu ES quelqu'un qui..." pas "tu DEVRAIS être"`;


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
    { emoji: '🫀', text: 'Je me sens anxieux aujourd\'hui, aide-moi' },
    { emoji: '🔥', text: 'Comment rester motivé aujourd\'hui ?' },
    { emoji: '🚗', text: 'Aide-moi à manifester mon KIA Sportage !' },
    { emoji: '🎯', text: 'Analyse mes habitudes et donne-moi des conseils' },
    { emoji: '✨', text: 'Aide-moi à entrer dans le Vortex' },
    { emoji: '💪', text: 'J\'ai du mal à tenir mes habitudes, aide-moi' },
    { emoji: '🧒', text: 'Je me sens en mode auto-sabotage' },
    { emoji: '📊', text: 'Donne-moi un bilan complet de ma progression' },
];
