import React, { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
    Brain,
    Home,
    Target,
    Sparkles,
    Crosshair,
    Sprout,
    Heart,
    Star,
    Coins,
} from 'lucide-react';
import { EnvironmentMap } from '@/types';

// ============================================================
// Types d'outils pouvant générer des preuves complémentaires
// ============================================================

export interface ToolEvidence {
    key: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    recentCount: number;
    totalCount: number;
    description: string;
}

// ============================================================
// Helpers localStorage
// ============================================================

function readLocalStorageJSON<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function countRecentByDateField(
    items: any[],
    daysBack: number = 7,
    dateField: string = 'createdAt'
): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);
    cutoff.setHours(0, 0, 0, 0);

    return items.filter((item) => {
        const dateStr = item[dateField] || item.date;
        if (!dateStr) return false;
        try {
            return new Date(dateStr) >= cutoff;
        } catch {
            return false;
        }
    }).length;
}

function countLowRiskEnvironments(envs: EnvironmentMap[]): number {
    return envs.filter((e) => e.riskLevel <= 2).length;
}

// ============================================================
// ComplementaryEvidence + Hook pour bonus
// ============================================================

/**
 * Lit tous les outils et retourne les preuves + le nombre d'outils actifs.
 * Actif = au moins 1 action dans les 7 derniers jours.
 */
export function useToolEvidence(): {
    tools: ToolEvidence[];
    activeToolCount: number;
} {
    const { primingSessions, environments } = useAppStore();

    return useMemo(() => {
        const tools: ToolEvidence[] = [];

        // --- Priming (store) ---
        if (primingSessions.length > 0) {
            const recent = countRecentByDateField(primingSessions, 7, 'createdAt');
            const alignedCount = primingSessions.filter(
                (s) => (s.postIntensity ?? 0) >= 2 && s.postState === 'calme'
            ).length;
            tools.push({
                key: 'priming',
                name: 'Priming vibratoire',
                icon: <Brain className="w-4 h-4" />,
                color: 'text-violet-600',
                bgColor: 'bg-violet-50',
                recentCount: recent,
                totalCount: primingSessions.length,
                description:
                    alignedCount > 0
                        ? `${alignedCount} sessions avec état de calme atteint`
                        : 'Régulation du système nerveux',
            });
        }

        // --- Environnement (store) ---
        if (environments.length > 0) {
            const lowRisk = countLowRiskEnvironments(environments);
            tools.push({
                key: 'environment',
                name: 'Environnement',
                icon: <Home className="w-4 h-4" />,
                color: 'text-teal-600',
                bgColor: 'bg-teal-50',
                recentCount: lowRisk,
                totalCount: lowRisk,
                description:
                    lowRisk > 0
                        ? `${lowRisk} espaces à risque bas — structure protectrice`
                        : 'Design énergétique configuré',
            });
        }

        // --- Karmic Garden (localStorage) ---
        const karmicData = readLocalStorageJSON<any>('vibes-arc-karmic-garden');
        if (karmicData) {
            const morningSessions = karmicData.morningSessions || [];
            const freeSeeds = karmicData.freeSeeds || [];
            const karmaTotal = karmicData.karmaTotal || 0;
            const recentMorning = countRecentByDateField(morningSessions, 7, 'date');
            const recentFree = countRecentByDateField(freeSeeds, 7, 'date');
            const recent = recentMorning + recentFree;
            tools.push({
                key: 'karmic',
                name: 'Jardin Karmique',
                icon: <Sprout className="w-4 h-4" />,
                color: 'text-emerald-600',
                bgColor: 'bg-emerald-50',
                recentCount: recent,
                totalCount: morningSessions.length + freeSeeds.length,
                description:
                    karmaTotal > 0
                        ? `${karmaTotal} Karma accumulé — ${recent} actions cette semaine`
                        : 'Graines de générosité plantées',
            });
        }

        // --- Focus 17/68 (localStorage — focusHoldSessions ou vibes-arc-focus-holds) ---
        const focusData =
            readLocalStorageJSON<any>('vibes-arc-focus-holds') ||
            readLocalStorageJSON<any>('focusHoldSessions');
        if (focusData && Array.isArray(focusData)) {
            const recent = countRecentByDateField(focusData, 7, 'startedAt');
            const fullCycles = focusData.filter((f: any) => f.milestoneReached === 4).length;
            tools.push({
                key: 'focus',
                name: 'Focus 17/68',
                icon: <Crosshair className="w-4 h-4" />,
                color: 'text-indigo-600',
                bgColor: 'bg-indigo-50',
                recentCount: recent,
                totalCount: focusData.length,
                description:
                    fullCycles > 0
                        ? `${fullCycles} cycles complets (68s) — concentration maîtrisée`
                        : 'Sessions de focus vibratoire',
            });
        }

        // --- Inner Child (localStorage) ---
        const innerChildData = readLocalStorageJSON<any>('vibes-arc-inner-child');
        if (innerChildData) {
            const checkins = innerChildData.checkins || innerChildData.sessions || [];
            const recent = countRecentByDateField(checkins, 7, 'date');
            tools.push({
                key: 'innerChild',
                name: 'Inner Child',
                icon: <Heart className="w-4 h-4" />,
                color: 'text-pink-600',
                bgColor: 'bg-pink-50',
                recentCount: recent,
                totalCount: checkins.length,
                description:
                    recent > 0
                        ? `${recent} check-ins cette semaine — connexion intérieure`
                        : 'Check-ins avec l\'enfant intérieur',
            });
        }

        // --- Magic Gratitude (localStorage) ---
        const gratitudeData = readLocalStorageJSON<any>('magicGratitudeChallenge');
        if (gratitudeData) {
            const days = gratitudeData.completedDays || gratitudeData.days || [];
            const recentDays = Array.isArray(days)
                ? days.filter((d: any) => {
                      const dateStr = typeof d === 'string' ? d : d.date;
                      if (!dateStr) return false;
                      try {
                          const cutoff = new Date();
                          cutoff.setDate(cutoff.getDate() - 7);
                          return new Date(dateStr) >= cutoff;
                      } catch {
                          return false;
                      }
                  }).length
                : 0;
            const totalDays = Array.isArray(days) ? days.length : (gratitudeData.totalDays || 0);
            tools.push({
                key: 'gratitude',
                name: 'Campagne d\'appréciation',
                icon: <Star className="w-4 h-4" />,
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-50',
                recentCount: recentDays,
                totalCount: totalDays,
                description:
                    totalDays > 0
                        ? `${totalDays} jours de gratitude — fréquence d'appréciation`
                        : 'Pratique de la gratitude',
            });
        }

        // --- Manifestation (localStorage) ---
        const manifestationData = readLocalStorageJSON<any>('vibes-arc-manifestation');
        if (manifestationData) {
            const sessions = manifestationData.sessions || manifestationData.entries || [];
            const recent = countRecentByDateField(sessions, 7, 'createdAt');
            tools.push({
                key: 'manifestation',
                name: 'Manifestation consciente',
                icon: <Sparkles className="w-4 h-4" />,
                color: 'text-purple-600',
                bgColor: 'bg-purple-50',
                recentCount: recent,
                totalCount: sessions.length,
                description:
                    recent > 0
                        ? `${recent} sessions cette semaine — visualisation créatrice`
                        : 'Pratique de manifestation',
            });
        }

        // --- Money Mindset (localStorage) ---
        const moneyData = readLocalStorageJSON<any>('moneyMindsetGame');
        if (moneyData) {
            const sessions = moneyData.sessions || moneyData.plays || [];
            const recent = countRecentByDateField(sessions, 7, 'createdAt');
            tools.push({
                key: 'money',
                name: 'Abondance',
                icon: <Coins className="w-4 h-4" />,
                color: 'text-amber-600',
                bgColor: 'bg-amber-50',
                recentCount: recent,
                totalCount: sessions.length,
                description:
                    recent > 0
                        ? `${recent} exercices cette semaine — mindset d'abondance`
                        : 'Exercices de mentalité d\'abondance',
            });
        }

        // Calculer le nombre d'outils actifs (≥1 action dans les 7 jours)
        const activeToolCount = tools.filter((t) => t.recentCount > 0).length;

        return { tools, activeToolCount };
    }, [primingSessions, environments]);
}

// ============================================================
// Composant d'affichage
// ============================================================

const ComplementaryEvidence: React.FC<{ tools?: ToolEvidence[] }> = ({ tools: externalTools }) => {
    const { tools: computedTools, activeToolCount } = useToolEvidence();
    const tools = externalTools || computedTools;

    if (tools.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Preuves complémentaires
                    <span className="text-xs text-gray-400 font-normal">
                        (autres outils Vibes Arc)
                    </span>
                </h4>
                {activeToolCount > 0 && (
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        {activeToolCount} outil{activeToolCount > 1 ? 's' : ''} actif{activeToolCount > 1 ? 's' : ''}
                        {' '}→ bonus alignement +{Math.min(15, activeToolCount * 3)}
                    </span>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tools.map((tool) => (
                    <div
                        key={tool.key}
                        className={`flex items-center gap-2.5 p-2 ${tool.bgColor} rounded-lg`}
                    >
                        <div className={`${tool.color} flex-shrink-0`}>
                            {tool.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-gray-700 truncate">
                                    {tool.name}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {tool.totalCount}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500 truncate">
                                {tool.description}
                            </p>
                        </div>
                        {tool.recentCount > 0 && (
                            <div className="flex-shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-medium">
                                <Target className="w-2.5 h-2.5" />
                                {tool.recentCount}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ComplementaryEvidence;
