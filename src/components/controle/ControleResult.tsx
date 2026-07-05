import React from 'react';
import {
    baselineLabel,
    anxietyLabel,
    computeWizardNote,
} from '@/data/controleEjaculationProgram';
import type { ControleProfile } from '@/types/controleEjaculation';
import ControleCoachPanel from './ControleCoachPanel';

interface ControleResultProps {
    profile: ControleProfile;
    onContinue: () => void;
}

const ControleResult: React.FC<ControleResultProps> = ({ profile, onContinue }) => {
    const note = computeWizardNote(profile);

    return (
        <div className="controle-screen controle-wizard-wrap">
            <div className="controle-eyebrow">Point de départ</div>
            <h2 style={{ fontSize: '1.5rem', marginTop: 10 }}>Ton profil est prêt.</h2>

            <div className="controle-result-card">
                <span className="controle-eyebrow">Ceinture de départ</span>
                <div className="belt-name">Blanche</div>
                <div className="controle-result-row">
                    <span>Point de départ estimé</span>
                    <span>{baselineLabel(profile.baseline)}</span>
                </div>
                <div className="controle-result-row">
                    <span>Anxiété de performance</span>
                    <span>{anxietyLabel(profile.anxiety)}</span>
                </div>
                <div className="controle-result-row">
                    <span>Fréquence de pratique</span>
                    <span>{profile.frequency} × / semaine</span>
                </div>
                <div className="controle-result-row">
                    <span>Phase de départ</span>
                    <span>Fondation (semaine 1)</span>
                </div>
            </div>

            <p style={{ marginBottom: 22 }}>{note}</p>

            <ControleCoachPanel step="wizard_result" profile={profile} />

            <button
                type="button"
                className="controle-btn controle-btn-primary controle-btn-block"
                style={{ marginTop: 22 }}
                onClick={onContinue}
            >
                Voir mon tableau de bord
            </button>
        </div>
    );
};

export default ControleResult;
