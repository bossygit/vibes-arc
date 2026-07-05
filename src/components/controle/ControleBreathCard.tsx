import React, { useEffect, useRef, useState } from 'react';
import ControleCoachPanel from './ControleCoachPanel';
import type { ControleProfile, ControleProgress } from '@/types/controleEjaculation';

interface ControleBreathCardProps {
    profile: ControleProfile;
    progress: ControleProgress;
}

const ControleBreathCard: React.FC<ControleBreathCardProps> = ({ profile, progress }) => {
    const [breathing, setBreathing] = useState(false);
    const [label, setLabel] = useState('Prêt');
    const [scale, setScale] = useState(1);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const stopBreath = () => {
        setBreathing(false);
        setLabel('Prêt');
        setScale(1);
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const breathCycle = () => {
        setScale(1.35);
        setLabel('Inspire…');
        timerRef.current = setTimeout(() => {
            setScale(1);
            setLabel('Expire…');
            timerRef.current = setTimeout(breathCycle, 7000);
        }, 4000);
    };

    useEffect(() => {
        if (breathing) {
            breathCycle();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [breathing]);

    const toggle = () => {
        if (breathing) stopBreath();
        else setBreathing(true);
    };

    return (
        <section className="controle-block">
            <div className="controle-block-title">
                <h2>Respiration d'ancrage</h2>
            </div>
            <ControleCoachPanel step="breath" profile={profile} progress={progress} />
            <div className="controle-breath-card">
                <p style={{ fontSize: '0.85rem' }}>
                    4 secondes d'inspiration par le ventre, 7 secondes d'expiration. L'inverse d'une
                    respiration stimulante type Wim Hof — ici on calme le système nerveux.
                </p>
                <div
                    className="controle-breath-circle"
                    style={{
                        transform: `scale(${scale})`,
                        transition: breathing
                            ? scale > 1
                                ? 'transform 4s ease-in-out'
                                : 'transform 7s ease-in-out'
                            : 'transform 0.3s ease',
                    }}
                >
                    <span>{label}</span>
                </div>
                <button type="button" className="controle-btn controle-btn-ghost controle-btn-sm" onClick={toggle}>
                    {breathing ? 'Arrêter' : 'Démarrer'}
                </button>
            </div>
        </section>
    );
};

export default ControleBreathCard;
