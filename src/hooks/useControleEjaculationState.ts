import { useCallback, useEffect, useState } from 'react';
import { defaultState, STORAGE_KEY } from '@/data/controleEjaculationProgram';
import type { ControleState } from '@/types/controleEjaculation';

function loadState(): ControleState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as ControleState;
    } catch {
        /* ignore */
    }
    return defaultState();
}

export function useControleEjaculationState() {
    const [state, setState] = useState<ControleState>(loadState);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const resetAll = useCallback(() => {
        setState(defaultState());
    }, []);

    return { state, setState, resetAll };
}
