import React, { useState } from 'react';
import { Trophy, Gift, Bell, Target, Star, Filter } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { detoxChallenges, getChallengesByCategory, getChallengesByDifficulty } from '@/data/detoxChallenges';

const RewardsChallenges: React.FC = () => {
    const { gamification, addPoints, createReward, claimReward, userPrefs, setNotifHour } = useAppStore() as any;
    const [title, setTitle] = useState('');
    const [cost, setCost] = useState(100);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

    const categories = [
        { id: 'all', name: 'Tous', icon: Filter },
        { id: 'screens', name: 'Écrans', icon: Target },
        { id: 'substances', name: 'Substances', icon: Target },
        { id: 'movement', name: 'Mouvement', icon: Target },
        { id: 'connection', name: 'Connexion', icon: Target },
        { id: 'routine', name: 'Routine', icon: Target },
        { id: 'mixed', name: 'Mixtes', icon: Star },
    ];

    const difficulties = [
        { id: 'all', name: 'Toutes', color: 'bg-gray-100' },
        { id: 'easy', name: 'Facile', color: 'bg-green-100 text-green-700' },
        { id: 'medium', name: 'Moyen', color: 'bg-yellow-100 text-yellow-700' },
        { id: 'hard', name: 'Difficile', color: 'bg-red-100 text-red-700' },
    ];

    const filteredChallenges = detoxChallenges.filter(challenge => {
        const categoryMatch = selectedCategory === 'all' || challenge.category === selectedCategory;
        const difficultyMatch = selectedDifficulty === 'all' || challenge.difficulty === selectedDifficulty;
        return categoryMatch && difficultyMatch;
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Récompenses & Challenges</h2>

            {/* Points et Stats */}
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

            {/* Défis Detox Dopamine */}
            <div className="card">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6 text-purple-600" />
                    Défis Detox Dopamine
                </h3>

                {/* Filtres */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Catégorie</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                                        selectedCategory === category.id
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                                >
                                    <category.icon className="w-4 h-4" />
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Difficulté</label>
                        <div className="flex flex-wrap gap-2">
                            {difficulties.map(difficulty => (
                                <button
                                    key={difficulty.id}
                                    onClick={() => setSelectedDifficulty(difficulty.id)}
                                    className={`px-3 py-2 rounded-lg border transition ${
                                        selectedDifficulty === difficulty.id
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                    } ${difficulty.color}`}
                                >
                                    {difficulty.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Liste des défis */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredChallenges.map(challenge => (
                        <div key={challenge.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{challenge.icon}</span>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">{challenge.title}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            challenge.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                            challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {challenge.difficulty === 'easy' ? 'Facile' :
                                             challenge.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-purple-600">{challenge.rewards.points} pts</div>
                                    <div className="text-xs text-slate-500">{challenge.targetDays} jours</div>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 mb-3">{challenge.description}</p>

                            <div className="space-y-2">
                                <div className="text-xs text-slate-500">Conseils:</div>
                                <div className="space-y-1">
                                    {challenge.tips.slice(0, 2).map((tip, index) => (
                                        <div key={index} className="text-xs text-slate-600 flex items-start gap-2">
                                            <span className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0"></span>
                                            <span>{tip}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">
                                        Récompense: {challenge.rewards.badge} {challenge.rewards.points} pts
                                    </span>
                                    <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200 transition">
                                        Commencer
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredChallenges.length === 0 && (
                    <div className="text-center py-8">
                        <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">Aucun défi trouvé avec ces filtres</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RewardsChallenges;


