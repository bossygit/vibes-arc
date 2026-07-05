import React, { useState } from 'react';
import {
    BELTS,
    currentBelt,
    todayLoggedExerciseIds,
    weeksElapsed,
    PHASES,
    todayStr,
    updateStreak,
} from '@/data/controleEjaculationProgram';
import type { ControleProfile, ControleProgress, ControleLog } from '@/types/controleEjaculation';
import ControleTodayList from './ControleTodayList';
import ControleBreathCard from './ControleBreathCard';
import ControleProgressChart, { ControlePhasesList } from './ControleProgressChart';
import { syncNeoHabitOnPractice } from '@/utils/neoHabitSync';

interface ControleDashboardProps {
    profile: ControleProfile;
    progress: ControleProgress;
    logs: ControleLog[];
    onUpdate: (progress: ControleProgress, logs: ControleLog[]) => void;
    onReset: () => void;
}

const ControleDashboard: React.FC<ControleDashboardProps> = ({
    profile,
    progress,
    logs,
    onUpdate,
    onReset,
}) => {
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const [lastSessionLog, setLastSessionLog] = useState<{ seconds: number; anxiety: number } | null>(null);
    const [phaseAdvanceCoach, setPhaseAdvanceCoach] = useState<number | null>(null);

    const belt = currentBelt(progress.xp);
    const cap = BELTS[BELTS.length - 1].min;
    const pct = Math.min(100, Math.round((progress.xp / cap) * 100));
    const circumference = 314;
    const offset = circumference - (circumference * pct) / 100;
    const doneToday = todayLoggedExerciseIds(logs);
    const phase = PHASES[progress.phase];

    const toggleExercise = async (exId: string) => {
        const t = todayStr();
        const already = logs.find((l) => l.type === 'exercise' && l.date === t && l.exerciseId === exId);
        let newLogs: ControleLog[];
        let newProgress = { ...progress };

        if (already) {
            newLogs = logs.filter((l) => l !== already);
            newProgress.xp = Math.max(0, newProgress.xp - 10);
        } else {
            newLogs = [...logs, { type: 'exercise' as const, date: t, exerciseId: exId, xp: 10 }];
            newProgress.xp += 10;
            newProgress = updateStreak(newProgress, t);
            await syncNeoHabitOnPractice();
        }

        onUpdate(newProgress, newLogs);
    };

    const logSession = (seconds: number, anxiety: number) => {
        const t = todayStr();
        const newLogs: ControleLog[] = [
            ...logs,
            { type: 'session', date: t, seconds, anxiety, xp: 15 },
        ];
        const newProgress = { ...progress, xp: progress.xp + 15 };
        setLastSessionLog({ seconds, anxiety });
        onUpdate(newProgress, newLogs);
    };

    const advancePhase = (idx: number) => {
        const newProgress = {
            ...progress,
            phase: Math.min(PHASES.length - 1, idx + 1),
            xp: progress.xp + 150,
        };
        const newLogs: ControleLog[] = [
            ...logs,
            { type: 'phase', date: todayStr(), phaseId: PHASES[idx].id, xp: 150 },
        ];
        setPhaseAdvanceCoach(idx + 1);
        onUpdate(newProgress, newLogs);
    };

    const handleReset = () => {
        if (window.confirm('Effacer toute ta progression et recommencer le questionnaire ?')) {
            onReset();
        }
    };

    return (
        <div className="controle-screen">
            <div className="controle-dash-header">
                <div className="controle-belt-chip">
                    <span className="controle-belt-swatch" style={{ background: belt.color }} />
                    <span>Ceinture {belt.name}</span>
                </div>
                <div className="controle-stat-chip">
                    <span>{progress.xp} XP</span>
                    <span>🔥 {progress.streak}j</span>
                </div>
            </div>

            <section className="controle-block">
                <div className="controle-dial-wrap">
                    <svg className="controle-dial-svg" viewBox="0 0 120 120" width={112} height={112}>
                        <circle cx={60} cy={60} r={50} fill="none" stroke="#28443A" strokeWidth={10} />
                        <circle
                            cx={60}
                            cy={60}
                            r={50}
                            fill="none"
                            stroke="#4FAE8E"
                            strokeWidth={10}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            transform="rotate(-90 60 60)"
                        />
                        <text
                            x={60}
                            y={56}
                            textAnchor="middle"
                            fontFamily="JetBrains Mono"
                            fontSize={20}
                            fill="#EDEFEA"
                        >
                            {pct}%
                        </text>
                        <text
                            x={60}
                            y={72}
                            textAnchor="middle"
                            fontFamily="Space Grotesk"
                            fontSize={8}
                            fill="#9BB0A5"
                        >
                            maîtrise
                        </text>
                    </svg>
                    <div className="controle-dial-info">
                        <div className="k">Semaine</div>
                        <div className="v">{weeksElapsed(profile)}</div>
                        <div className="k">
                            Phase {progress.phase + 1} — {phase.name}
                        </div>
                    </div>
                </div>
            </section>

            <ControleTodayList
                profile={profile}
                progress={progress}
                doneToday={doneToday}
                selectedExerciseId={selectedExerciseId}
                onToggleExercise={toggleExercise}
                onSelectExercise={setSelectedExerciseId}
            />

            <ControleBreathCard profile={profile} progress={progress} />

            <ControlePhasesList
                profile={profile}
                progress={progress}
                onAdvancePhase={advancePhase}
                phaseAdvanceCoach={phaseAdvanceCoach}
            />

            <ControleProgressChart
                profile={profile}
                progress={progress}
                logs={logs}
                onLogSession={logSession}
                lastSessionLog={lastSessionLog}
            />

            <section className="controle-block">
                <div className="controle-block-title">
                    <h2>Ceintures</h2>
                </div>
                <div className="controle-belts-row">
                    {BELTS.map((b) => (
                        <div
                            key={b.name}
                            className={`controle-belt-item${progress.xp >= b.min ? ' unlocked' : ''}`}
                        >
                            <div className="controle-belt-dot" style={{ background: b.color }} />
                            <span>{b.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="controle-footer">
                <p>Vibes Arc · La Voie du Contrôle</p>
                <button type="button" className="controle-reset-link" onClick={handleReset}>
                    Recommencer
                </button>
            </footer>
        </div>
    );
};

export default ControleDashboard;
