import { useAppStore } from '@/store/useAppStore';
import { Identity, VibesData, VizDesireNode, VizIdentityNode } from '@/types';

/**
 * Moteur de données unique pour la couche de visualisation (le « VibesCanvas »).
 * Lit le store Zustand et agrège l'objet VibesData attendu par UniverseMode / TribunalMode.
 * Aucune copie des données : on réutilise store, habits, accusers, moods tels quels.
 */
export function useVibesData(): VibesData {
    const desires = useAppStore((s) => s.desires);
    const identities = useAppStore((s) => s.identities);
    const habits = useAppStore((s) => s.habits);
    const accusers = useAppStore((s) => s.accusers);
    const dailyMoods = useAppStore((s) => s.dailyMoods);

    const desireNodes: VizDesireNode[] = desires.map((desire) => {
        const identityNodes: VizIdentityNode[] = (desire.linkedIdentityIds ?? [])
            .map((id) => identities.find((i) => i.id === id))
            .filter((i): i is Identity => Boolean(i))
            .map((identity) => {
                const linkedHabits = habits.filter((h) => h.linkedIdentities.includes(identity.id));
                return {
                    id: identity.id,
                    name: identity.name,
                    color: identity.color,
                    signalIds: linkedHabits.map((h) => h.id),
                    completedSignals: linkedHabits.filter((h) => h.progress.some((p) => p)).length,
                    totalSignals: linkedHabits.length,
                };
            });
        return {
            id: desire.id,
            title: desire.title,
            type: desire.type,
            identityNodes,
        };
    });

    return { desires: desireNodes, identities, habits, accusers, dailyMoods };
}
