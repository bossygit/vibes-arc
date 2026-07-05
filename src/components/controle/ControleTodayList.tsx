import React from 'react';
import { PHASES } from '@/data/controleEjaculationProgram';
import type { ControleProfile, ControleProgress } from '@/types/controleEjaculation';
import ControleCoachPanel from './ControleCoachPanel';

interface ControleTodayListProps {
    profile: ControleProfile;
    progress: ControleProgress;
    doneToday: string[];
    selectedExerciseId: string | null;
    onToggleExercise: (exerciseId: string) => void;
    onSelectExercise: (exerciseId: string | null) => void;
}

const ControleTodayList: React.FC<ControleTodayListProps> = ({
    profile,
    progress,
    doneToday,
    selectedExerciseId,
    onToggleExercise,
    onSelectExercise,
}) => {
    const phase = PHASES[progress.phase];
    const todayDate = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    return (
        <section className="controle-block">
            <div className="controle-block-title">
                <div>
                    <h2>Pratique du jour</h2>
                    <div className="controle-block-sub">{todayDate}</div>
                </div>
            </div>

            <ControleCoachPanel step="daily" profile={profile} progress={progress} />

            <div className="controle-today-card">
                {phase.exercises.map((ex) => {
                    const on = doneToday.includes(ex.id);
                    const selected = selectedExerciseId === ex.id;
                    return (
                        <div key={ex.id} className="controle-ex-item">
                            <div
                                className={`controle-ex-check${on ? ' on' : ''}`}
                                onClick={() => onToggleExercise(ex.id)}
                                role="checkbox"
                                aria-checked={on}
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && onToggleExercise(ex.id)}
                            />
                            <div
                                className="controle-ex-body"
                                style={{ cursor: 'pointer' }}
                                onClick={() => onSelectExercise(selected ? null : ex.id)}
                            >
                                <h4>{ex.title}</h4>
                                <p>{ex.desc}</p>
                                <span className="controle-ex-freq">{ex.freq}</span>
                                {selected && (
                                    <div style={{ marginTop: 12 }}>
                                        <ControleCoachPanel
                                            step="exercise"
                                            profile={profile}
                                            progress={progress}
                                            exerciseId={ex.id}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default ControleTodayList;
