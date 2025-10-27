import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { detoxTemplates } from '@/data/detoxTemplates';
import { HabitTemplate } from '@/types';
import { 
  Smartphone, 
  Coffee, 
  Activity, 
  Heart, 
  Clock, 
  Filter,
  Plus,
  Info
} from 'lucide-react';

const TemplatesView: React.FC = () => {
    const { addHabit, setView } = useAppStore();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
    const [selectedTemplate, setSelectedTemplate] = useState<HabitTemplate | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<number>(30);

    const categories = [
        { id: 'all', name: 'Toutes', icon: Filter },
        { id: 'screens', name: 'Écrans', icon: Smartphone },
        { id: 'substances', name: 'Substances', icon: Coffee },
        { id: 'movement', name: 'Mouvement', icon: Activity },
        { id: 'connection', name: 'Connexion', icon: Heart },
        { id: 'routine', name: 'Routine', icon: Clock },
    ];

    const difficulties = [
        { id: 'all', name: 'Toutes', color: 'bg-gray-100' },
        { id: 'easy', name: 'Facile', color: 'bg-green-100 text-green-700' },
        { id: 'medium', name: 'Moyen', color: 'bg-yellow-100 text-yellow-700' },
        { id: 'hard', name: 'Difficile', color: 'bg-red-100 text-red-700' },
    ];

    const filteredTemplates = detoxTemplates.filter(template => {
        const categoryMatch = selectedCategory === 'all' || template.category === selectedCategory;
        const difficultyMatch = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
        return categoryMatch && difficultyMatch;
    });

    const handleCreateHabit = () => {
        if (!selectedTemplate) return;

        addHabit({
            name: selectedTemplate.name,
            type: selectedTemplate.type,
            totalDays: selectedDuration,
            linkedIdentities: []
        });

        setView('dashboard');
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">🧠 Detox Dopamine</h2>
                <p className="text-slate-600">Rééquilibre tes circuits de récompense avec des habitudes saines</p>
            </div>

            {/* Filtres */}
            <div className="card">
                <h3 className="font-semibold text-slate-800 mb-4">Filtrer les habitudes</h3>

                <div className="space-y-4">
                    {/* Catégories */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Catégorie</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${selectedCategory === category.id
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    <category.icon className="w-4 h-4" />
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulté */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Difficulté</label>
                        <div className="flex flex-wrap gap-2">
                            {difficulties.map(difficulty => (
                                <button
                                    key={difficulty.id}
                                    onClick={() => setSelectedDifficulty(difficulty.id)}
                                    className={`px-3 py-2 rounded-lg border transition ${selectedDifficulty === difficulty.id
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                        } ${difficulty.color}`}
                                >
                                    {difficulty.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                    <div
                        key={template.id}
                        className={`card cursor-pointer transition-all hover:shadow-lg ${selectedTemplate?.id === template.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                            }`}
                        onClick={() => setSelectedTemplate(template)}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{template.icon}</span>
                                <div>
                                    <h3 className="font-semibold text-slate-800">{template.name}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${template.type === 'start'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {template.type === 'start' ? '▲ Commencer' : '▼ Arrêter'}
                                    </span>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${template.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                    template.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                }`}>
                                {template.difficulty === 'easy' ? 'Facile' :
                                    template.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                            </span>
                        </div>

                        <p className="text-sm text-slate-600 mb-3">{template.description}</p>

                        <div className="space-y-2">
                            <div className="text-xs text-slate-500">Durées suggérées:</div>
                            <div className="flex flex-wrap gap-1">
                                {template.suggestedDuration.map(duration => (
                                    <span
                                        key={duration}
                                        className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                                    >
                                        {duration}j
                                    </span>
                                ))}
                            </div>
                        </div>

                        {selectedTemplate?.id === template.id && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Durée (jours)
                                        </label>
                                        <select
                                            value={selectedDuration}
                                            onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        >
                                            {template.suggestedDuration.map(duration => (
                                                <option key={duration} value={duration}>
                                                    {duration} jours
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Conseils
                                        </label>
                                        <div className="space-y-1">
                                            {template.advice.slice(0, 2).map((tip, index) => (
                                                <div key={index} className="flex items-start gap-2 text-xs text-slate-600">
                                                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                    <span>{tip}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCreateHabit}
                                        className="w-full btn-primary flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Créer cette habitude
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="card text-center py-12">
                    <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Aucune habitude trouvée avec ces filtres</p>
                </div>
            )}
        </div>
    );
};

export default TemplatesView;
