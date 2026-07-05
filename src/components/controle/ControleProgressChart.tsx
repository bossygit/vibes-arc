import React, { useState } from 'react';
import {
    projectionSeries,
    daysBetween,
    TIER_DOT,
    TIER_LABEL,
    PHASES,
} from '@/data/controleEjaculationProgram';
import type { ControleProfile, ControleProgress, ControleLog } from '@/types/controleEjaculation';
import ControleCoachPanel from './ControleCoachPanel';

interface ControleProgressChartProps {
    profile: ControleProfile;
    progress: ControleProgress;
    logs: ControleLog[];
    onLogSession: (seconds: number, anxiety: number) => void;
    lastSessionLog?: { seconds: number; anxiety: number } | null;
}

const ControleProgressChart: React.FC<ControleProgressChartProps> = ({
    profile,
    progress,
    logs,
    onLogSession,
    lastSessionLog,
}) => {
    const [seconds, setSeconds] = useState('');
    const [anxiety, setAnxiety] = useState(5);

    const series = projectionSeries(profile);
    const sessionLogs = logs.filter((l) => l.type === 'session');
    const maxY =
        Math.max(
            ...series.map((p) => p.seconds),
            ...sessionLogs.map((l) => l.seconds || 0),
            1
        ) * 1.15;

    const W = 320;
    const H = 180;
    const padL = 34;
    const padB = 20;
    const padT = 10;
    const padR = 10;
    const xScale = (w: number) => padL + (w / 16) * (W - padL - padR);
    const yScale = (s: number) => H - padB - (s / maxY) * (H - padB - padT);

    const path = series
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.week).toFixed(1)},${yScale(p.seconds).toFixed(1)}`)
        .join(' ');

    const handleSubmit = () => {
        const sec = parseInt(seconds, 10);
        if (!sec || sec < 0) return;
        onLogSession(sec, anxiety);
        setSeconds('');
    };

    return (
        <section className="controle-block">
            <div className="controle-block-title">
                <h2>Progression</h2>
            </div>

            {lastSessionLog && (
                <ControleCoachPanel
                    step="session_log"
                    profile={profile}
                    progress={progress}
                    sessionLog={lastSessionLog}
                />
            )}

            <div className="controle-chart-card">
                <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={180}>
                    {Array.from({ length: 5 }).map((_, i) => {
                        const y = padT + (i * (H - padB - padT)) / 4;
                        return (
                            <line
                                key={i}
                                x1={padL}
                                y1={y}
                                x2={W - padR}
                                y2={y}
                                stroke="rgba(237,239,234,0.06)"
                                strokeWidth={1}
                            />
                        );
                    })}
                    {[0, 4, 8, 12, 16].map((w) => (
                        <text
                            key={w}
                            x={xScale(w)}
                            y={H - 4}
                            fontFamily="JetBrains Mono"
                            fontSize={7}
                            fill="#5C7368"
                            textAnchor="middle"
                        >
                            S{w}
                        </text>
                    ))}
                    <text x={2} y={padT + 6} fontFamily="JetBrains Mono" fontSize={7} fill="#5C7368">
                        {Math.round(maxY)}s
                    </text>
                    <text x={2} y={H - padB} fontFamily="JetBrains Mono" fontSize={7} fill="#5C7368">
                        0s
                    </text>
                    <path d={path} fill="none" stroke="#D68A4C" strokeWidth={2} strokeDasharray="5,4" />
                    {sessionLogs.map((l, i) => {
                        const w = Math.max(
                            0,
                            Math.min(16, Math.floor(daysBetween(profile.startDate, l.date) / 7))
                        );
                        return (
                            <circle
                                key={i}
                                cx={xScale(w)}
                                cy={yScale(l.seconds)}
                                r={3.5}
                                fill="#4FAE8E"
                                stroke="#0B1210"
                                strokeWidth={1}
                            />
                        );
                    })}
                </svg>
                <div className="controle-legend">
                    <span>
                        <i className="controle-legend-line" /> Projection estimée
                    </span>
                    <span>
                        <span className="controle-legend-dot" /> Tes observations
                    </span>
                </div>
                <div className="controle-log-form">
                    <div>
                        <label htmlFor="log-seconds">
                            Temps tenu lors de ta dernière session (secondes)
                        </label>
                        <input
                            id="log-seconds"
                            type="number"
                            min={0}
                            placeholder="ex : 90"
                            value={seconds}
                            onChange={(e) => setSeconds(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="log-anxiety">
                            Anxiété ressentie : <span className="controle-range-val">{anxiety}</span>/10
                        </label>
                        <input
                            id="log-anxiety"
                            type="range"
                            min={1}
                            max={10}
                            value={anxiety}
                            onChange={(e) => setAnxiety(parseInt(e.target.value, 10))}
                        />
                    </div>
                    <button type="button" className="controle-btn controle-btn-primary controle-btn-sm" onClick={handleSubmit}>
                        Enregistrer l'observation
                    </button>
                </div>
            </div>
        </section>
    );
};

export { ControleProgressChart };

interface ControlePhasesListProps {
    profile: ControleProfile;
    progress: ControleProgress;
    onAdvancePhase: (idx: number) => void;
    phaseAdvanceCoach?: number | null;
}

export const ControlePhasesList: React.FC<ControlePhasesListProps> = ({
    progress,
    onAdvancePhase,
    phaseAdvanceCoach,
    profile,
}) => {
    const [openPhases, setOpenPhases] = useState<Set<number>>(() => new Set([progress.phase]));

    const togglePhase = (idx: number) => {
        setOpenPhases((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    return (
        <section className="controle-block">
            <div className="controle-block-title">
                <h2>Le programme</h2>
            </div>
            {phaseAdvanceCoach !== null && phaseAdvanceCoach !== undefined && (
                <ControleCoachPanel
                    step="phase_advance"
                    profile={profile}
                    progress={progress}
                    phaseIndex={phaseAdvanceCoach}
                />
            )}
            <div>
                {PHASES.map((ph, idx) => {
                    const isCurrent = idx === progress.phase;
                    const isOpen = openPhases.has(idx);
                    return (
                        <div
                            key={ph.id}
                            className={`controle-phase-card${isCurrent ? ' current' : ''}${isOpen ? ' open' : ''}`}
                        >
                            <div className="controle-phase-head" onClick={() => togglePhase(idx)}>
                                <div className="controle-phase-head-left">
                                    <span className="controle-phase-num">0{idx + 1}</span>
                                    <div>
                                        <h3>{ph.name}</h3>
                                        <span className="controle-phase-weeks">
                                            Semaines {ph.weeks} · Ceinture {ph.belt}
                                        </span>
                                    </div>
                                </div>
                                <span className="controle-chevron">⌄</span>
                            </div>
                            <div className="controle-phase-body">
                                <div className="controle-phase-body-inner">
                                    <p className="controle-phase-obj">{ph.objective}</p>
                                    {ph.exercises.map((ex) => (
                                        <div key={ex.id} style={{ marginBottom: 14 }}>
                                            <h4 style={{ fontSize: '0.88rem', margin: '0 0 3px' }}>{ex.title}</h4>
                                            <p style={{ fontSize: '0.82rem' }}>{ex.desc}</p>
                                            <span className="controle-ex-freq">{ex.freq}</span>
                                            <span className="controle-tier-badge">
                                                <span className={`controle-dot ${TIER_DOT[ex.tier]}`} />
                                                {TIER_LABEL[ex.tier]}
                                            </span>
                                        </div>
                                    ))}
                                    {isCurrent && idx < PHASES.length - 1 && (
                                        <button
                                            type="button"
                                            className="controle-btn controle-btn-primary controle-btn-sm"
                                            style={{ marginTop: 14 }}
                                            onClick={() => onAdvancePhase(idx)}
                                        >
                                            Marquer cette phase comme acquise →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default ControleProgressChart;
