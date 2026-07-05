import React, { useState } from 'react';
import { QUESTIONS } from '@/data/controleEjaculationProgram';
import type {
    ControleBaseline,
    ControleAnxiety,
    ControleFrequency,
    ControleGoal,
    ControleExperience,
    ControleProfile,
} from '@/types/controleEjaculation';
import { todayStr } from '@/data/controleEjaculationProgram';

interface WizardAnswers {
    baseline: ControleBaseline | null;
    experience: ControleExperience[];
    anxiety: ControleAnxiety | null;
    frequency: ControleFrequency | null;
    goal: ControleGoal | null;
}

interface ControleWizardProps {
    onComplete: (profile: ControleProfile) => void;
    onCancel: () => void;
}

const EMPTY: WizardAnswers = {
    baseline: null,
    experience: [],
    anxiety: null,
    frequency: null,
    goal: null,
};

const ControleWizard: React.FC<ControleWizardProps> = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<WizardAnswers>(EMPTY);

    const q = QUESTIONS[step];

    const isAnswered = () => {
        if (q.multi) return answers.experience.length > 0;
        return !!answers[q.id as keyof Omit<WizardAnswers, 'experience'>];
    };

    const selectOption = (val: string) => {
        if (q.multi) {
            if (val === 'none') {
                setAnswers((prev) => ({
                    ...prev,
                    experience: prev.experience.includes('none') ? [] : ['none'],
                }));
            } else {
                setAnswers((prev) => {
                    const withoutNone = prev.experience.filter((v) => v !== 'none');
                    const hasVal = withoutNone.some((v) => v === val);
                    const next = hasVal
                        ? withoutNone.filter((v) => v !== val)
                        : [...withoutNone, val as ControleExperience];
                    return { ...prev, experience: next };
                });
            }
        } else {
            setAnswers((prev) => ({ ...prev, [q.id]: val }));
        }
    };

    const isSelected = (val: string) => {
        if (q.multi) return answers.experience.includes(val as ControleExperience);
        return answers[q.id as keyof Omit<WizardAnswers, 'experience'>] === val;
    };

    const handleNext = () => {
        if (step < QUESTIONS.length - 1) {
            setStep((s) => s + 1);
        } else {
            onComplete({
                baseline: answers.baseline!,
                experience: answers.experience,
                anxiety: answers.anxiety!,
                frequency: answers.frequency!,
                goal: answers.goal!,
                startDate: todayStr(),
            });
        }
    };

    return (
        <div className="controle-screen controle-wizard-wrap">
            <div className="controle-progress-dots">
                {QUESTIONS.map((_, i) => (
                    <span key={i} className={i < step ? 'done' : i === step ? 'active' : ''}>
                        <i />
                    </span>
                ))}
            </div>

            <div className="controle-q-title">{q.title}</div>
            <div className="controle-option-grid">
                {q.options.map((o) => (
                    <button
                        key={o.v}
                        type="button"
                        className={`controle-option-btn${isSelected(o.v) ? ' selected' : ''}`}
                        onClick={() => selectOption(o.v)}
                    >
                        <span>{o.l}</span>
                        <span className="check" />
                    </button>
                ))}
            </div>

            <div className="controle-wizard-nav">
                {step > 0 ? (
                    <button type="button" className="controle-btn controle-btn-ghost" onClick={() => setStep((s) => s - 1)}>
                        ←
                    </button>
                ) : (
                    <button type="button" className="controle-btn controle-btn-ghost" onClick={onCancel}>
                        ←
                    </button>
                )}
                <button
                    type="button"
                    className="controle-btn controle-btn-primary"
                    disabled={!isAnswered()}
                    onClick={handleNext}
                >
                    {step === QUESTIONS.length - 1 ? 'Terminer' : 'Suivant'}
                </button>
            </div>
        </div>
    );
};

export default ControleWizard;
