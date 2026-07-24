import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Identity, VibesData, VizDesireNode, VizIdentityNode } from '@/types';

/**
 * Single aggregation layer for Vibes World.
 * Visualization components consume derived data here instead of reimplementing
 * domain calculations themselves.
 */
export function useVibesData(): VibesData {
    const desires = useAppStore((s) => s.desires);
    const identities = useAppStore((s) => s.identities);
    const habits = useAppStore((s) => s.habits);
    const accusers = useAppStore((s) => s.accusers);
    const dailyMoods = useAppStore((s) => s.dailyMoods);

    return useMemo(() => {
        const desireNodes: VizDesireNode[] = (desires ?? []).map((desire) => {
            const identityNodes: VizIdentityNode[] = (desire.linkedIdentityIds ?? [])
                .map((id) => identities?.find((identity) => identity.id === id))
                .filter((identity): identity is Identity => Boolean(identity))
                .map((identity) => {
                    const linkedHabits = (habits ?? []).filter((habit) =>
                        (habit.linkedIdentities ?? []).includes(identity.id)
                    );

                    const evidenceCount = linkedHabits.reduce(
                        (total, habit) => total + (habit.progress?.filter(Boolean).length ?? 0),
                        0
                    );
                    const completedSignals = linkedHabits.filter((habit) =>
                        habit.progress?.some(Boolean)
                    ).length;
                    const consistency = linkedHabits.length
                        ? Math.round((completedSignals / linkedHabits.length) * 100)
                        : 0;

                    return {
                        id: identity.id,
                        name: identity.name,
                        color: identity.color,
                        signalIds: linkedHabits.map((habit) => habit.id),
                        completedSignals,
                        totalSignals: linkedHabits.length,
                        evidenceCount,
                        consistency,
                    };
                });

            const evidenceCount = identityNodes.reduce(
                (total, identity) => total + identity.evidenceCount,
                0
            );

            return {
                id: desire.id,
                title: desire.title,
                type: desire.type,
                identityNodes,
                evidenceCount,
            };
        });

        return {
            desires: desireNodes,
            identities: identities ?? [],
            habits: habits ?? [],
            accusers: accusers ?? [],
            dailyMoods: dailyMoods ?? [],
        };
    }, [desires, identities, habits, accusers, dailyMoods]);
}
