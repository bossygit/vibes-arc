import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { detoxTemplates } from '@/data/detoxTemplates';
import { personalDevelopmentTemplates } from '@/data/personalDevelopmentTemplates';
import { identityTemplates } from '@/data/identityTemplates';
import { HabitTemplate, IdentityTemplate } from '@/types';
import { 
  Smartphone, 
  Coffee, 
  Activity, 
  Heart, 
  Clock, 
  Filter,
  Plus,
  Info,
  User,
  Book,
  Star,
  Target
} from 'lucide-react';

const TemplatesView: React.FC = () => {
    const { addHabit, addIdentity, setView } = useAppStore();
    const [activeTab, setActiveTab] = useState<'habits' | 'identities'>('habits');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
    const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
    const [selectedTemplate, setSelectedTemplate] = useState<HabitTemplate | null>(null);
    const [selectedIdentityTemplate, setSelectedIdentityTemplate] = useState<IdentityTemplate | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<number>(30);

    const categories = [
        { id: 'all', name: 'Toutes', icon: Filter },
        { id: 'screens', name: 'Écrans', icon: Smartphone },
        { id: 'substances', name: 'Substances', icon: Coffee },
        { id: 'movement', name: 'Mouvement', icon: Activity },
        { id: 'connection', name: 'Connexion', icon: Heart },
        { id: 'routine', name: 'Routine', icon: Clock },
    ];

    const authors = [
        { id: 'all', name: 'Tous les auteurs' },
        { id: 'Abraham Hicks', name: 'Abraham Hicks' },
        { id: 'James Clear', name: 'James Clear' },
        { id: 'Zig Ziglar', name: 'Zig Ziglar' },
        { id: 'Brian Tracy', name: 'Brian Tracy' },
        { id: 'Tony Robbins', name: 'Tony Robbins' },
        { id: 'Robin Sharma', name: 'Robin Sharma' },
        { id: 'Cal Newport', name: 'Cal Newport' },
        { id: 'Dale Carnegie', name: 'Dale Carnegie' },
        { id: 'Eckhart Tolle', name: 'Eckhart Tolle' },
        { id: 'Catherine Ponder', name: 'Catherine Ponder' },
        { id: 'Rhonda Byrne', name: 'Rhonda Byrne' },
    ];

    const difficulties = [
        { id: 'all', name: 'Toutes', color: 'bg-gray-100' },
        { id: 'easy', name: 'Facile', color: 'bg-green-100 text-green-700' },
        { id: 'medium', name: 'Moyen', color: 'bg-yellow-100 text-yellow-700' },
        { id: 'hard', name: 'Difficile', color: 'bg-red-100 text-red-700' },
    ];

    const allHabitTemplates = [...detoxTemplates, ...personalDevelopmentTemplates];

    const filteredHabitTemplates = allHabitTemplates.filter(template => {
        const categoryMatch = selectedCategory === 'all' || template.category === selectedCategory;
        const difficultyMatch = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
        const authorMatch = selectedAuthor === 'all' || (template as any).author === selectedAuthor;
        return categoryMatch && difficultyMatch && authorMatch;
    });

    const filteredIdentityTemplates = identityTemplates.filter(template => {
        const difficultyMatch = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
        const authorMatch = selectedAuthor === 'all' || template.author === selectedAuthor;
        return difficultyMatch && authorMatch;
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

    const handleCreateIdentity = () => {
        if (!selectedIdentityTemplate) return;
        
        addIdentity({
            name: selectedIdentityTemplate.name,
            description: selectedIdentityTemplate.description,
            color: selectedIdentityTemplate.color
        });
        
        setView('dashboard');
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">📚 Bibliothèque de Développement Personnel</h2>
                <p className="text-slate-600">Templates d'habitudes et d'identités basés sur les plus grands auteurs du développement personnel</p>
            </div>

            {/* Onglets */}
            <div className="flex justify-center">
                <div className="bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('habits')}
                        className={`px-6 py-2 rounded-md transition ${
                            activeTab === 'habits'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                        }`}
                    >
                        <Target className="w-4 h-4 inline mr-2" />
                        Habitudes
                    </button>
                    <button
                        onClick={() => setActiveTab('identities')}
                        className={`px-6 py-2 rounded-md transition ${
                            activeTab === 'identities'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                        }`}
                    >
                        <User className="w-4 h-4 inline mr-2" />
                        Identités
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="card">
                <h3 className="font-semibold text-slate-800 mb-4">
                    {activeTab === 'habits' ? 'Filtrer les habitudes' : 'Filtrer les identités'}
                </h3>

                <div className="space-y-4">
                    {/* Auteurs */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Auteur</label>
                        <div className="flex flex-wrap gap-2">
                            {authors.map(author => (
                                <button
                                    key={author.id}
                                    onClick={() => setSelectedAuthor(author.id)}
                                    className={`px-3 py-2 rounded-lg border transition ${
                                        selectedAuthor === author.id
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                                >
                                    {author.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Catégories (seulement pour les habitudes) */}
                    {activeTab === 'habits' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Catégorie</label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                                            selectedCategory === category.id
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
                    )}

                    {/* Difficulté */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Difficulté</label>
                        <div className="flex flex-wrap gap-2">
                            {difficulties.map(difficulty => (
                                <button
                                    key={difficulty.id}
                                    onClick={() => setSelectedDifficulty(difficulty.id)}
                                    className={`px-3 py-2 rounded-lg border transition ${
                                        selectedDifficulty === difficulty.id
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

            {/* Templates d'Habitudes */}
            {activeTab === 'habits' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredHabitTemplates.map(template => (
                        <div
                            key={template.id}
                            className={`card cursor-pointer transition-all hover:shadow-lg ${
                                selectedTemplate?.id === template.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                            }`}
                            onClick={() => setSelectedTemplate(template)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{template.icon}</span>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{template.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                template.type === 'start' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {template.type === 'start' ? '▲ Commencer' : '▼ Arrêter'}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                template.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                                template.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {template.difficulty === 'easy' ? 'Facile' :
                                                 template.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 mb-3">{template.description}</p>

                            {/* Auteur et concept */}
                            {(template as any).author && (
                                <div className="mb-3">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Book className="w-3 h-3" />
                                        <span className="font-medium">{(template as any).author}</span>
                                        {(template as any).concept && (
                                            <span>• {(template as any).concept}</span>
                                        )}
                                    </div>
                                </div>
                            )}

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
            )}

            {/* Templates d'Identités */}
            {activeTab === 'identities' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredIdentityTemplates.map(template => (
                        <div
                            key={template.id}
                            className={`card cursor-pointer transition-all hover:shadow-lg ${
                                selectedIdentityTemplate?.id === template.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                            }`}
                            onClick={() => setSelectedIdentityTemplate(template)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{template.icon}</span>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{template.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                template.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                                                template.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {template.difficulty === 'beginner' ? 'Débutant' :
                                                 template.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 mb-3">{template.description}</p>

                            {/* Auteur et livre */}
                            <div className="mb-3">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Book className="w-3 h-3" />
                                    <span className="font-medium">{template.author}</span>
                                    {template.book && (
                                        <span>• {template.book}</span>
                                    )}
                                </div>
                            </div>

                            {/* Croyances fondamentales */}
                            <div className="space-y-2">
                                <div className="text-xs text-slate-500">Croyances fondamentales:</div>
                                <div className="space-y-1">
                                    {template.coreBeliefs.slice(0, 2).map((belief, index) => (
                                        <div key={index} className="text-xs text-slate-600 flex items-start gap-2">
                                            <span className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0"></span>
                                            <span>{belief}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedIdentityTemplate?.id === template.id && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Pratiques quotidiennes
                                            </label>
                                            <div className="space-y-1">
                                                {template.dailyPractices.slice(0, 3).map((practice, index) => (
                                                    <div key={index} className="flex items-start gap-2 text-xs text-slate-600">
                                                        <Star className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                        <span>{practice}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Citation inspirante
                                            </label>
                                            <div className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded">
                                                "{template.quotes[0]}"
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCreateIdentity}
                                            className="w-full btn-primary flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Créer cette identité
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Message si aucun résultat */}
            {((activeTab === 'habits' && filteredHabitTemplates.length === 0) || 
              (activeTab === 'identities' && filteredIdentityTemplates.length === 0)) && (
                <div className="card text-center py-12">
                    <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Aucun template trouvé avec ces filtres</p>
                </div>
            )}
        </div>
    );
};

export default TemplatesView;