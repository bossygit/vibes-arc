/** Données programme — server-only pour le coach contrôle. */

export interface ControleExerciseData {
    id: string;
    title: string;
    freq: string;
    tier: string;
    desc: string;
}

export interface ControlePhaseData {
    id: string;
    name: string;
    belt: string;
    weeks: string;
    objective: string;
    exercises: ControleExerciseData[];
}

export const PHASES: ControlePhaseData[] = [
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
