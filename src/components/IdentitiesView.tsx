import React, { useMemo, useState } from 'react';
import { Plus, Sparkles, Target } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { evaluateMilestones, getMilestonesForIdentity } from '@/utils/milestoneUtils';
import { IDENTITY_COLORS, getIdentityColorStyle } from '@/utils/identityColors';
import EditIdentityModal from './EditIdentityModal';
import IdentityBoardCard from './IdentityBoardCard';
import HabitDragChip from './HabitDragChip';
import { Identity } from '@/types';

const IdentitiesView: React.FC = () => {
    const {
        identities,
        habits,
        addIdentity,
        updateIdentity,
        deleteIdentity,
        linkHabitToIdentity,
        unlinkHabitFromIdentity,
        milestoneAchievements,
        setView,
    } = useAppStore();

    const [newIdentity, setNewIdentity] = useState({ name: '', description: '', color: 'indigo' });
    const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null);
    const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const milestoneProgress = useMemo(
        () => evaluateMilestones(habits, identities, milestoneAchievements),
        [habits, identities, milestoneAchievements]
    );

    const unassignedHabits = useMemo(
        () => habits.filter((h) => h.linkedIdentities.length === 0),
        [habits]
    );

    const handleAddIdentity = async () => {
        if (!newIdentity.name.trim()) {
            setError('Donne un nom à l\'identité que tu veux incarner');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            await addIdentity(newIdentity);
            setNewIdentity({ name: '', description: '', color: 'indigo' });
            setShowAddForm(false);
        } catch (err) {
            console.error('Erreur lors de l\'ajout:', err);
            setError(`Erreur lors de l'ajout: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateIdentity = (id: number, name: string, description?: string) => {
        updateIdentity(id, name, description);
        setEditingIdentity(null);
    };

    const toggleHabitSelection = (habitId: number) => {
        setSelectedHabitId((current) => (current === habitId ? null : habitId));
    };

    return (
        <div className="space-y-8">
            <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white p-6 md:p-8">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/15 rounded-xl flex-shrink-0">
                        <Target className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">Qui je deviens</h2>
                        <p className="text-indigo-100 leading-relaxed max-w-2xl">
                            Une identité, c&apos;est la personne que tu choisis de devenir — pas un objectif
                            ponctuel, mais une version de toi que tes habitudes renforcent chaque jour.
                            Glisse tes signaux sur les identités qu&apos;ils nourrissent. Un même signal peut
                            soutenir plusieurs identités.
                        </p>
                    </div>
                </div>
            </section>

            <section className="card">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            Bibliothèque de signaux
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                            Glisse un signal sur une identité, ou sélectionne-le puis clique « Ajouter la sélection ».
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setView('addHabit')}
                        className="btn-primary whitespace-nowrap flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nouveau signal
                    </button>
                </div>

                {habits.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                        <p className="text-slate-600 mb-3">Aucun signal pour l&apos;instant.</p>
                        <button type="button" onClick={() => setView('addHabit')} className="btn-primary">
                            Créer mon premier signal
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {habits.map((habit) => (
                                <HabitDragChip
                                    key={habit.id}
                                    habit={habit}
                                    selected={selectedHabitId === habit.id}
                                    onSelect={() => toggleHabitSelection(habit.id)}
                                />
                            ))}
                        </div>
                        {unassignedHabits.length > 0 && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                                {unassignedHabits.length} signal{unassignedHabits.length > 1 ? 's' : ''} sans
                                identité — assigne-les pour mesurer ton intégration.
                            </p>
                        )}
                    </>
                )}
            </section>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-800">Mes identités cibles</h3>
                    <button
                        type="button"
                        onClick={() => setShowAddForm((v) => !v)}
                        className="px-4 py-2 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        {showAddForm ? 'Fermer' : 'Nouvelle identité'}
                    </button>
                </div>

                {showAddForm && (
                    <div className="card mb-4">
                        <h4 className="font-semibold text-slate-800 mb-4">Définir une identité à incarner</h4>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Ex : un homme discipliné, un créateur constant…"
                                value={newIdentity.name}
                                onChange={(e) => setNewIdentity({ ...newIdentity, name: e.target.value })}
                                className="input-field"
                            />
                            <textarea
                                placeholder="Pourquoi cette identité compte pour toi (optionnel)"
                                value={newIdentity.description}
                                onChange={(e) => setNewIdentity({ ...newIdentity, description: e.target.value })}
                                className="input-field"
                                rows={3}
                            />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Couleur</label>
                                <div className="flex flex-wrap gap-2">
                                    {IDENTITY_COLORS.map((color) => {
                                        const style = getIdentityColorStyle(color);
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewIdentity({ ...newIdentity, color })}
                                                className={`w-8 h-8 rounded-full border-2 ${style.dot} ${
                                                    newIdentity.color === color
                                                        ? 'border-slate-800 ring-2 ring-offset-1 ring-slate-400'
                                                        : 'border-white'
                                                }`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                            <button
                                onClick={handleAddIdentity}
                                disabled={isLoading}
                                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? 'Ajout en cours…' : 'Ajouter cette identité'}
                            </button>
                        </div>
                    </div>
                )}

                {identities.length === 0 ? (
                    <div className="card p-10 text-center border-dashed">
                        <p className="text-slate-600 mb-4">
                            Commence par définir l&apos;identité que tu veux devenir, puis associe-y tes signaux.
                        </p>
                        <button type="button" onClick={() => setShowAddForm(true)} className="btn-primary">
                            Créer ma première identité
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {identities.map((identity) => (
                            <IdentityBoardCard
                                key={identity.id}
                                identity={identity}
                                habits={habits}
                                milestoneItems={getMilestonesForIdentity(milestoneProgress, identity)}
                                selectedHabitId={selectedHabitId}
                                onEdit={() => setEditingIdentity(identity)}
                                onDelete={() => deleteIdentity(identity.id)}
                                onLinkHabit={(habitId) => linkHabitToIdentity(habitId, identity.id)}
                                onUnlinkHabit={(habitId) => unlinkHabitFromIdentity(habitId, identity.id)}
                                onAddSelectedHabit={() => {
                                    if (selectedHabitId !== null) {
                                        linkHabitToIdentity(selectedHabitId, identity.id);
                                    }
                                }}
                            />
                        ))}
                    </div>
                )}
            </section>

            {editingIdentity && (
                <EditIdentityModal
                    identity={editingIdentity}
                    isOpen={!!editingIdentity}
                    onClose={() => setEditingIdentity(null)}
                    onSave={handleUpdateIdentity}
                />
            )}
        </div>
    );
};

export default IdentitiesView;
