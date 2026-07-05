import React, { useState } from 'react';
import { useControleEjaculationState } from '@/hooks/useControleEjaculationState';
import type { ControleProfile, ControleProgress, ControleLog, ControleScreen } from '@/types/controleEjaculation';
import ControleWelcome from './controle/ControleWelcome';
import ControleWizard from './controle/ControleWizard';
import ControleResult from './controle/ControleResult';
import ControleDashboard from './controle/ControleDashboard';
import './controle/controle.css';

const ControleEjaculationView: React.FC = () => {
    const { state, setState, resetAll } = useControleEjaculationState();
    const [screen, setScreen] = useState<ControleScreen>(() =>
        state.profile ? 'dashboard' : 'welcome'
    );

    const handleWizardComplete = (profile: ControleProfile) => {
        setState((prev) => ({ ...prev, profile }));
        setScreen('result');
    };

    const handleContinueToDashboard = () => {
        setScreen('dashboard');
    };

    const handleUpdate = (progress: ControleProgress, logs: ControleLog[]) => {
        setState((prev) => ({ ...prev, progress, logs }));
    };

    const handleReset = () => {
        resetAll();
        setScreen('welcome');
    };

    return (
        <div className="controle-app">
            {screen === 'welcome' && (
                <ControleWelcome onStart={() => setScreen('wizard')} />
            )}
            {screen === 'wizard' && (
                <ControleWizard
                    onComplete={handleWizardComplete}
                    onCancel={() => setScreen(state.profile ? 'dashboard' : 'welcome')}
                />
            )}
            {screen === 'result' && state.profile && (
                <ControleResult profile={state.profile} onContinue={handleContinueToDashboard} />
            )}
            {screen === 'dashboard' && state.profile && (
                <ControleDashboard
                    profile={state.profile}
                    progress={state.progress}
                    logs={state.logs}
                    onUpdate={handleUpdate}
                    onReset={handleReset}
                />
            )}
        </div>
    );
};

export default ControleEjaculationView;
