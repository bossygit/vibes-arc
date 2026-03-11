import React, { useState } from 'react';
import NotificationSettings from './NotificationSettings';
import WeeklyEmailSettings from './WeeklyEmailSettings';
import SupabaseDatabaseClient from '@/database/supabase-client';

const AccountSettingsView: React.FC = () => {
    const [deviceIdInput, setDeviceIdInput] = useState('');
    const [linkStatus, setLinkStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [linkMessage, setLinkMessage] = useState('');

    const handleLinkDevice = async () => {
        const id = deviceIdInput.trim();
        if (!id) return;
        setLinkStatus('loading');
        setLinkMessage('');
        try {
            const supabase = SupabaseDatabaseClient.getInstance();
            const token = await supabase.getAccessToken();
            if (!token) {
                setLinkStatus('error');
                setLinkMessage('Connecte-toi pour lier un appareil.');
                return;
            }
            const res = await fetch('/api/widgets/link-device', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ deviceId: id }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setLinkStatus('error');
                setLinkMessage(data?.error || 'Échec de la liaison. Vérifie que tu es connecté.');
                return;
            }
            setLinkStatus('success');
            setLinkMessage('Appareil lié. Le widget se mettra à jour.');
        } catch {
            setLinkStatus('error');
            setLinkMessage('Échec de la liaison. Vérifie que tu es connecté.');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Paramètres</h2>
            <p className="text-slate-600">Rappels et résumé hebdomadaire par email.</p>

            {/* Widget iPhone */}
            <div className="card border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-2">Widget iPhone</h3>
                <p className="text-sm text-slate-600 mb-3">
                    Colle l'identifiant affiché dans l'app Vibes Arc sur ton iPhone, puis clique sur Lier. Le widget pourra alors afficher tes habitudes.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        placeholder="Identifiant appareil (coller ici)"
                        value={deviceIdInput}
                        onChange={(e) => { setDeviceIdInput(e.target.value); setLinkStatus('idle'); }}
                        className="input-field flex-1 font-mono text-sm"
                    />
                    <button
                        type="button"
                        onClick={handleLinkDevice}
                        disabled={linkStatus === 'loading' || !deviceIdInput.trim()}
                        className="btn-primary whitespace-nowrap"
                    >
                        {linkStatus === 'loading' ? 'Envoi…' : 'Lier l\'appareil'}
                    </button>
                </div>
                {linkMessage && (
                    <p className={`mt-2 text-sm ${linkStatus === 'success' ? 'text-green-600' : linkStatus === 'error' ? 'text-red-600' : 'text-slate-600'}`}>
                        {linkMessage}
                    </p>
                )}
            </div>

            <NotificationSettings />
            <WeeklyEmailSettings />
        </div>
    );
};

export default AccountSettingsView;
