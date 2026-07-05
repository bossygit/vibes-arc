import type {
    ControleAnxiety,
    ControleBaseline,
    ControleBelt,
    ControleFrequency,
    ControlePhase,
    ControleProfile,
    ControleProgress,
    ControleQuestion,
    ControleLog,
} from '@/types/controleEjaculation';

export const STORAGE_KEY = 'vibes-arc-voie-controle';

export const PHASES: ControlePhase[] = [
    {
        id: 'p1',
        name: 'Fondation',
        belt: 'Jaune → Orange',
        weeks: '1–3',
        objective:
            'Construire la force et la conscience du muscle PC (plancher pelvien) — la base commune aux trois traditions.',
        exercises: [
            {
                id: 'p1e1',
                title: 'Repérage du muscle PC',
                freq: 'Une fois, semaine 1',
                tier: 'clin',
                desc: "Pendant la miction, arrête le jet à mi-parcours. Le muscle qui se contracte est le muscle PC. N'utilise pas l'urine pour t'entraîner ensuite — c'était juste pour le repérer.",
            },
            {
                id: 'p1e2',
                title: 'Contractions lentes',
                freq: '2×/jour · 3 séries de 10',
                tier: 'clin',
                desc: 'Contracte le muscle PC 5 secondes, relâche 5 secondes. 10 répétitions par série.',
            },
            {
                id: 'p1e3',
                title: 'Contractions rapides',
                freq: '1×/jour · 3 séries de 15',
                tier: 'clin',
                desc: 'Contracte puis relâche rapidement, comme un battement. Construit le réflexe utilisé en Phase 3.',
            },
            {
                id: 'p1e4',
                title: "Cartographie de l'excitation",
                freq: '2×/semaine, en solo',
                tier: 'clin',
                desc: "Sans chercher l'orgasme, note mentalement ton excitation de 1 à 10 toutes les minutes. Arrête-toi dès 7/10.",
            },
        ],
    },
    {
        id: 'p2',
        name: 'Régulation',
        belt: 'Verte',
        weeks: '4–6',
        objective:
            "Apprendre à faire redescendre l'excitation à volonté grâce à l'arrêt-départ, la compression, et une respiration qui calme le système nerveux.",
        exercises: [
            {
                id: 'p2e1',
                title: 'Séances arrêt-départ',
                freq: '2–3×/semaine',
                tier: 'clin',
                desc: "Stimule-toi jusqu'à 8/10, arrête complètement, respire lentement jusqu'à 3–4/10, reprends. Vise 4 à 5 cycles.",
            },
            {
                id: 'p2e2',
                title: 'Technique de compression',
                freq: '2×/semaine',
                tier: 'clin',
                desc: 'À 8–9/10, applique une pression ferme 3–5 secondes à la base du gland ou sur le périnée, puis relâche.',
            },
            {
                id: 'p2e3',
                title: 'Respiration abdominale calmante',
                freq: 'Quotidien, 5 min',
                tier: 'clin',
                desc: 'Inspire 4 s par le nez en gonflant le ventre, expire 6–8 s. Entraîne ce réflexe hors contexte sexuel pour pouvoir le déclencher au bon moment.',
            },
        ],
    },
    {
        id: 'p3',
        name: 'Intégration énergétique',
        belt: 'Bleue',
        weeks: '7–9',
        objective:
            "Ajouter les outils taoïstes qui prolongent l'arrêt-départ : verrouillage musculaire, rétention du souffle et redirection de l'attention.",
        exercises: [
            {
                id: 'p3e1',
                title: 'Verrouillage de puissance',
                freq: 'À chaque séance',
                tier: 'trad',
                desc: "À l'approche du point de non-retour, contracte fermement le muscle PC et le périnée en même temps.",
            },
            {
                id: 'p3e2',
                title: 'Le Grand Tirage',
                freq: '2×/semaine',
                tier: 'trad',
                desc: 'Au moment critique : contracte le PC, rentre légèrement le menton, retiens le souffle 3–5 s, et dirige mentalement la sensation du bas du corps vers le haut.',
            },
            {
                id: 'p3e3',
                title: 'Orgasme « vallée » vs « pic »',
                freq: 'Exploration libre',
                tier: 'trad',
                desc: "Cherche à ressentir des vagues de plaisir successives plutôt qu'un pic unique suivi d'une chute. La présence avant la performance.",
            },
        ],
    },
    {
        id: 'p4',
        name: 'Maîtrise & intégration',
        belt: 'Marron → Noire',
        weeks: '10–12+',
        objective:
            'Transférer les acquis en contexte réel, suivre ta progression dans la durée, et alléger la pratique dédiée sans perdre les acquis.',
        exercises: [
            {
                id: 'p4e1',
                title: 'Application en contexte partenaire',
                freq: "Selon l'occasion",
                tier: 'clin',
                desc: "Utilise l'arrêt-départ, la respiration et le verrouillage pendant un rapport, en communiquant le rythme si besoin.",
            },
            {
                id: 'p4e2',
                title: 'Journal hebdomadaire',
                freq: '1×/semaine',
                tier: 'psy',
                desc: 'Note tes déclencheurs (stress, fatigue, nouveauté), ton anxiété et ton contrôle ressenti. Ce journal nourrit ton graphique de progression.',
            },
            {
                id: 'p4e3',
                title: "Plan d'entretien",
                freq: '2×/semaine à vie',
                tier: 'clin',
                desc: 'Une fois le contrôle acquis, garde seulement les contractions PC 2 fois par semaine pour maintenir les acquis.',
            },
        ],
    },
];

export const TIER_LABEL: Record<string, string> = {
    clin: 'Validé clinique',
    trad: 'Pratique traditionnelle',
    psy: 'Levier psychologique',
};

export const TIER_DOT: Record<string, string> = {
    clin: 'clin',
    trad: 'trad',
    psy: 'psy',
};

export const BELTS: ControleBelt[] = [
    { name: 'Blanche', min: 0, color: '#EDEFEA' },
    { name: 'Jaune', min: 80, color: '#E4C158' },
    { name: 'Orange', min: 220, color: '#D68A4C' },
    { name: 'Verte', min: 450, color: '#4FAE8E' },
    { name: 'Bleue', min: 800, color: '#5C8FD6' },
    { name: 'Marron', min: 1300, color: '#8A5A34' },
    { name: 'Noire', min: 1900, color: '#1A1F1D' },
];

export const QUESTIONS: ControleQuestion[] = [
    {
        id: 'baseline',
        title: "Aujourd'hui, combien de temps tiens-tu généralement avant l'éjaculation (seul ou en couple) ?",
        multi: false,
        options: [
            { v: '<1', l: "Moins d'1 minute" },
            { v: '1-3', l: '1 à 3 minutes' },
            { v: '3-7', l: '3 à 7 minutes' },
            { v: '7+', l: 'Plus de 7 minutes' },
            { v: 'unknown', l: 'Je ne sais pas vraiment' },
        ],
    },
    {
        id: 'experience',
        title: 'As-tu déjà pratiqué une de ces approches ?',
        multi: true,
        options: [
            { v: 'retention', l: 'Rétention séminale / NoFap' },
            { v: 'taoist', l: 'Respiration ou méditation taoïste' },
            { v: 'behavioral', l: 'Arrêt-départ ou compression' },
            { v: 'pelvic', l: 'Plancher pelvien / Kegel' },
            { v: 'none', l: 'Aucune de ces approches' },
        ],
    },
    {
        id: 'anxiety',
        title: "L'anxiété de performance joue-t-elle un rôle dans ta difficulté à durer ?",
        multi: false,
        options: [
            { v: 'faible', l: 'Peu ou pas' },
            { v: 'moderee', l: 'Un peu, par moments' },
            { v: 'elevee', l: 'Beaucoup, presque à chaque fois' },
        ],
    },
    {
        id: 'frequency',
        title: 'Combien de fois par semaine peux-tu réalistement pratiquer seul ?',
        multi: false,
        options: [
            { v: '1-2', l: '1 à 2 fois' },
            { v: '3-4', l: '3 à 4 fois' },
            { v: '5-7', l: '5 fois ou plus' },
        ],
    },
    {
        id: 'goal',
        title: 'Quel est ton objectif principal en ce moment ?',
        multi: false,
        options: [
            { v: 'duree', l: 'Prolonger la durée' },
            { v: 'plaisir', l: 'Explorer le plaisir sans but' },
            { v: 'anxiete', l: "Réduire l'anxiété de performance" },
            { v: 'discipline', l: 'Discipline et développement personnel' },
        ],
    },
];

export const BASELINE_SECONDS: Record<ControleBaseline, number> = {
    '<1': 45,
    '1-3': 120,
    '3-7': 300,
    '7+': 600,
    unknown: 90,
};

export const FREQ_FACTOR: Record<ControleFrequency, number> = {
    '1-2': 0.6,
    '3-4': 0.85,
    '5-7': 1.0,
};

export const ANX_FACTOR: Record<ControleAnxiety, number> = {
    elevee: 0.85,
    moderee: 1.0,
    faible: 1.15,
};

export function defaultProgress(): ControleProgress {
    return { phase: 0, xp: 0, streak: 0, lastPracticeDate: null };
}

export function defaultState(): import('@/types/controleEjaculation').ControleState {
    return { profile: null, progress: defaultProgress(), logs: [] };
}

export function todayStr(): string {
    return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
    return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function currentBelt(xp: number): ControleBelt {
    let b = BELTS[0];
    for (const belt of BELTS) {
        if (xp >= belt.min) b = belt;
    }
    return b;
}

export function nextBelt(xp: number): ControleBelt | null {
    for (const belt of BELTS) {
        if (xp < belt.min) return belt;
    }
    return null;
}

export function todayLoggedExerciseIds(logs: ControleLog[]): string[] {
    const t = todayStr();
    return logs
        .filter((l): l is import('@/types/controleEjaculation').ControleExerciseLog =>
            l.type === 'exercise' && l.date === t
        )
        .map((l) => l.exerciseId);
}

export function updateStreak(progress: ControleProgress, t: string): ControleProgress {
    const last = progress.lastPracticeDate;
    if (last === t) return progress;
    let streak = 1;
    if (last) {
        const gap = daysBetween(last, t);
        streak = gap === 1 ? progress.streak + 1 : 1;
    }
    return { ...progress, streak, lastPracticeDate: t };
}

function multiplierAtWeek(week: number, M: number, tau: number): number {
    return 1 + (M - 1) * (1 - Math.exp(-week / tau));
}

export function projectionSeries(profile: ControleProfile): { week: number; seconds: number }[] {
    const baseline = BASELINE_SECONDS[profile.baseline] || 90;
    const freqF = FREQ_FACTOR[profile.frequency] || 0.85;
    const anxF = ANX_FACTOR[profile.anxiety] || 1.0;
    const M = 1 + 2.5 * freqF * anxF;
    const tau = 5;
    const pts: { week: number; seconds: number }[] = [];
    for (let w = 0; w <= 16; w++) {
        pts.push({ week: w, seconds: baseline * multiplierAtWeek(w, M, tau) });
    }
    return pts;
}

export function computeWizardNote(profile: ControleProfile): string {
    let note = 'Ton programme démarre par la Phase 1 — Fondation, commune aux trois traditions.';
    if (profile.anxiety === 'elevee') {
        note +=
            " Comme l'anxiété de performance joue un rôle important pour toi, la respiration calmante sera introduite dès maintenant plutôt qu'en Phase 2.";
    }
    if (profile.goal === 'plaisir') {
        note += " Ton objectif d'exploration du plaisir te rapprochera vite du travail taoïste de la Phase 3.";
    }
    return note;
}

export function baselineLabel(baseline: ControleBaseline): string {
    const map: Record<ControleBaseline, string> = {
        '<1': "moins d'1 minute",
        '1-3': '1 à 3 minutes',
        '3-7': '3 à 7 minutes',
        '7+': 'plus de 7 minutes',
        unknown: 'indéterminé',
    };
    return map[baseline];
}

export function anxietyLabel(anxiety: ControleAnxiety): string {
    const map: Record<ControleAnxiety, string> = {
        faible: 'Faible',
        moderee: 'Modérée',
        elevee: 'Élevée',
    };
    return map[anxiety];
}

export function findExercise(exerciseId: string) {
    for (const phase of PHASES) {
        const ex = phase.exercises.find((e) => e.id === exerciseId);
        if (ex) return { phase, exercise: ex };
    }
    return null;
}

export function weeksElapsed(profile: ControleProfile): number {
    return Math.max(1, Math.floor(daysBetween(profile.startDate, todayStr()) / 7) + 1);
}
