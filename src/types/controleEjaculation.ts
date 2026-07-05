export type ControleTier = 'clin' | 'trad' | 'psy';

export type ControleBaseline = '<1' | '1-3' | '3-7' | '7+' | 'unknown';
export type ControleAnxiety = 'faible' | 'moderee' | 'elevee';
export type ControleFrequency = '1-2' | '3-4' | '5-7';
export type ControleGoal = 'duree' | 'plaisir' | 'anxiete' | 'discipline';
export type ControleExperience =
    | 'retention'
    | 'taoist'
    | 'behavioral'
    | 'pelvic'
    | 'none';

export interface ControleProfile {
    baseline: ControleBaseline;
    experience: ControleExperience[];
    anxiety: ControleAnxiety;
    frequency: ControleFrequency;
    goal: ControleGoal;
    startDate: string;
}

export interface ControleProgress {
    phase: number;
    xp: number;
    streak: number;
    lastPracticeDate: string | null;
}

export interface ControleExerciseLog {
    type: 'exercise';
    date: string;
    exerciseId: string;
    xp: number;
}

export interface ControlePhaseLog {
    type: 'phase';
    date: string;
    phaseId: string;
    xp: number;
}

export interface ControleSessionLog {
    type: 'session';
    date: string;
    seconds: number;
    anxiety: number;
    xp: number;
}

export type ControleLog = ControleExerciseLog | ControlePhaseLog | ControleSessionLog;

export interface ControleState {
    profile: ControleProfile | null;
    progress: ControleProgress;
    logs: ControleLog[];
}

export type ControleScreen = 'welcome' | 'wizard' | 'result' | 'dashboard';

export type ControleCoachStep =
    | 'welcome'
    | 'wizard_result'
    | 'daily'
    | 'exercise'
    | 'breath'
    | 'session_log'
    | 'phase_advance';

export interface ControleExercise {
    id: string;
    title: string;
    freq: string;
    tier: ControleTier;
    desc: string;
}

export interface ControlePhase {
    id: string;
    name: string;
    belt: string;
    weeks: string;
    objective: string;
    exercises: ControleExercise[];
}

export interface ControleBelt {
    name: string;
    min: number;
    color: string;
}

export interface ControleQuestionOption {
    v: string;
    l: string;
}

export interface ControleQuestion {
    id: keyof Pick<ControleProfile, 'baseline' | 'experience' | 'anxiety' | 'frequency' | 'goal'>;
    title: string;
    multi: boolean;
    options: ControleQuestionOption[];
}

export interface ControleCoachContext {
    step: ControleCoachStep;
    profile?: ControleProfile | null;
    progress?: ControleProgress;
    exerciseId?: string;
    sessionLog?: { seconds: number; anxiety: number };
    phaseIndex?: number;
}
