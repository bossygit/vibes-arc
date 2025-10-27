import React, { useState } from 'react';
import { Trophy, Gift, Bell } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const RewardsChallenges: React.FC = () => {
    const { gamification, addPoints, createReward, claimReward, userPrefs, setNotifHour } = useAppStore() as any;
    const [title, setTitle] = useState('');
    const [cost, setCost] = useState(100);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Récompenses & Challenges</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-600" /> Points</h3>
                    <div className="text-3xl font-bold text-amber-600">{gamification.points}</div>
                    <button onClick={() => addPoints(50)} className="mt-3 px-3 py-1 rounded bg-amber-100 text-amber-700">+50 test</button>
                </div>

                <div className="card">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><Gift className="w-5 h-5 text-indigo-600" /> Récompenses</h3>
                    <div className="flex items-center gap-2 mb-3">
                        <input className="input-field" placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
                        <input className="input-field w-28" type="number" value={cost} onChange={(e) => setCost(parseInt(e.target.value) || 1)} />
                        <button onClick={() => { if (title.trim()) { createReward(title.trim(), Math.max(1, cost)); setTitle(''); } }} className="btn-primary">Ajouter</button>
                    </div>
                    <div className="space-y-2">
                        {gamification.rewards.length === 0 ? (
                            <p className="text-sm text-slate-500">Aucune récompense</p>
                        ) : (
                            gamification.rewards.map((r: any) => (
                                <div key={r.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                                    <span className="font-medium">{r.title}</span>
                                    <span className="text-xs text-slate-500">{r.cost} pts</span>
                                    <button
                                        onClick={() => claimReward(r.id)}
                                        className="ml-auto px-2 py-1 rounded bg-indigo-600 text-white text-xs disabled:opacity-50"
                                        disabled={!!r.claimedAt || gamification.points < r.cost}
                                    >{r.claimedAt ? 'Réclamée' : `Réclamer`}</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><Bell className="w-5 h-5 text-green-600" /> Rappels</h3>
                    <div className="text-sm text-slate-600 mb-2">Heure de rappel: {userPrefs.notifHour}h</div>
                    <input type="range" min={0} max={23} value={userPrefs.notifHour} onChange={(e) => setNotifHour(parseInt(e.target.value))} className="w-full" />
                </div>
            </div>
        </div>
    );
};

export default RewardsChallenges;


