import { useCallback, useEffect, useState } from 'react';
import type { FreeSeedAction, KarmicGardenState, MorningDraft } from '@/types/karmicGarden';
import {
    completeMorningSession,
    getMorningSessionForDate,
    getTodayDateString,
    loadKarmicGardenState,
    plantFreeSeed,
    saveKarmicGardenState,
} from '@/utils/karmicGardenUtils';

export function useKarmicGardenState() {
    const [state, setState] = useState<KarmicGardenState>(() => loadKarmicGardenState());

    useEffect(() => {
        saveKarmicGardenState(state);
    }, [state]);

    const today = getTodayDateString();
    const todayMorning = getMorningSessionForDate(state, today);

    const completeMorning = useCallback(
        (draft: MorningDraft, meditationCompleted: boolean) => {
            setState((prev) => completeMorningSession(prev, draft, meditationCompleted));
        },
        []
    );

    const plantSeed = useCallback(
        (action: FreeSeedAction, partnerName?: string, note?: string, customLabel?: string) => {
            let earned = 0;
            setState((prev) => {
                const result = plantFreeSeed(prev, action, partnerName, note, customLabel);
                earned = result.karmaEarned;
                return result.state;
            });
            return earned;
        },
        []
    );

    return { state, setState, today, todayMorning, completeMorning, plantSeed };
}
