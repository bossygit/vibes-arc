import React, { useMemo, useState } from 'react';
import { Home, ShieldAlert, Plus, Save, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { EnvironmentMap, EnvironmentRiskLevel } from '@/types';
import { environmentTemplates } from '@/data/environmentTemplates';

const riskLabel: Record<EnvironmentRiskLevel, string> = {
  0: 'Neutre',
  1: 'Faible',
  2: 'Moyen',
  3: 'Élevé',
  4: 'Très élevé',
};

const riskColor: Record<EnvironmentRiskLevel, string> = {
  0: 'bg-slate-100 text-slate-700 border-slate-200',
  1: 'bg-green-100 text-green-700 border-green-200',
  2: 'bg-amber-100 text-amber-700 border-amber-200',
  3: 'bg-orange-100 text-orange-700 border-orange-200',
  4: 'bg-red-100 text-red-700 border-red-200',
};

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinLines(list: string[]): string {
  return (list || []).join('\n');
}

const EnvironmentDesignView: React.FC = () => {
  const { environments, addEnvironment, updateEnvironment, deleteEnvironment, setView } = useAppStore();

  const [showCreate, setShowCreate] = useState(false);
  const [applyTemplateIdx, setApplyTemplateIdx] = useState<number | ''>('');

  const [draft, setDraft] = useState({
    name: '',
    room: '',
    riskLevel: 2 as EnvironmentRiskLevel,
    desired: '',
    avoid: '',
    rituals: '',
    notes: '',
  });

  const resetDraft = () =>
    setDraft({
      name: '',
      room: '',
      riskLevel: 2,
      desired: '',
      avoid: '',
      rituals: '',
      notes: '',
    });

  const templatePreview = useMemo(() => {
    if (applyTemplateIdx === '') return null;
    const t = environmentTemplates[applyTemplateIdx];
    return t ?? null;
  }, [applyTemplateIdx]);

  const applyTemplate = () => {
    if (!templatePreview) return;
    setDraft({
      name: templatePreview.name,
      room: templatePreview.room ?? '',
      riskLevel: templatePreview.riskLevel,
      desired: joinLines(templatePreview.desiredBehaviors),
      avoid: joinLines(templatePreview.avoidBehaviors),
      rituals: joinLines(templatePreview.transitionRituals),
      notes: templatePreview.notes ?? '',
    });
    setShowCreate(true);
  };

  const create = () => {
    if (!draft.name.trim()) return;
    addEnvironment({
      name: draft.name.trim(),
      room: draft.room.trim() || undefined,
      riskLevel: draft.riskLevel,
      desiredBehaviors: splitLines(draft.desired),
      avoidBehaviors: splitLines(draft.avoid),
      transitionRituals: splitLines(draft.rituals),
      notes: draft.notes.trim() || undefined,
    });
    resetDraft();
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Home className="w-8 h-8 text-indigo-600" />
            Design de l’environnement
          </h2>
          <p className="text-slate-600 mt-1">
            Ici, on ne “compte pas sur la volonté”. On rend le bon comportement <strong>facile</strong> et le mauvais <strong>coûteux</strong>.
          </p>
        </div>
        <button onClick={() => setView('dashboard')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
      </div>

      {/* Templates quick start */}
      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Démarrage rapide (templates)
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={applyTemplateIdx}
              onChange={(e) => setApplyTemplateIdx(e.target.value === '' ? '' : Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Choisir un template</option>
              {environmentTemplates.map((t, idx) => (
                <option key={idx} value={idx}>
                  {t.name} {t.room ? `(${t.room})` : ''}
                </option>
              ))}
            </select>
            <button onClick={applyTemplate} className="btn-primary" disabled={applyTemplateIdx === ''}>
              Appliquer
            </button>
          </div>
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Objectif: réduire les frictions, neutraliser les déclencheurs, créer des rituels de transition.
        </div>
      </div>

      {/* Create */}
      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            Ajouter un espace
          </h3>
          <button onClick={() => setShowCreate((v) => !v)} className="btn-secondary">
            {showCreate ? 'Fermer' : 'Nouveau'}
          </button>
        </div>

        {showCreate && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input-field" placeholder="ex: Lit / Bureau / Téléphone" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pièce (optionnel)</label>
                <input value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} className="input-field" placeholder="ex: Chambre / Salon" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Niveau de risque</label>
                <select
                  value={draft.riskLevel}
                  onChange={(e) => setDraft({ ...draft, riskLevel: Number(e.target.value) as EnvironmentRiskLevel })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {[0, 1, 2, 3, 4].map((v) => (
                    <option key={v} value={v}>
                      {v} — {riskLabel[v as EnvironmentRiskLevel]}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={create} className="btn-primary flex items-center justify-center gap-2" disabled={!draft.name.trim()}>
                <Save className="w-4 h-4" />
                Enregistrer l’espace
              </button>
              <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span>
                  Principe: “Ce n’est pas moi qui manque de volonté, c’est mon environnement qui me trahit.”
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comportements souhaités (1 par ligne)</label>
              <textarea value={draft.desired} onChange={(e) => setDraft({ ...draft, desired: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" rows={8} placeholder="ex:\nRepos\nLecture\nProspection (timebox)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">À éviter + Rituels (1 par ligne)</label>
              <div className="grid grid-cols-1 gap-3">
                <textarea value={draft.avoid} onChange={(e) => setDraft({ ...draft, avoid: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" rows={3} placeholder="À éviter:\nTéléphone au lit\nScroll" />
                <textarea value={draft.rituals} onChange={(e) => setDraft({ ...draft, rituals: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" rows={3} placeholder="Rituels transition:\nTéléphone hors chambre\n3 physiological sigh" />
                <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" rows={2} placeholder="Notes (optionnel)" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {environments.length === 0 ? (
          <div className="card text-center py-10 md:col-span-2">
            <p className="text-slate-700 font-medium">Aucun espace défini.</p>
            <p className="text-sm text-slate-500 mt-1">
              Commence par <strong>Lit</strong>, <strong>Téléphone</strong> et <strong>Bureau</strong>.
            </p>
          </div>
        ) : (
          environments.map((env) => <EnvironmentCard key={env.id} env={env} onUpdate={updateEnvironment} onDelete={deleteEnvironment} />)
        )}
      </div>
    </div>
  );
};

const EnvironmentCard: React.FC<{
  env: EnvironmentMap;
  onUpdate: (id: string, updates: Partial<Omit<EnvironmentMap, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
}> = ({ env, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState({
    name: env.name,
    room: env.room ?? '',
    riskLevel: env.riskLevel,
    desired: joinLines(env.desiredBehaviors),
    avoid: joinLines(env.avoidBehaviors),
    rituals: joinLines(env.transitionRituals),
    notes: env.notes ?? '',
  });

  const save = () => {
    onUpdate(env.id, {
      name: local.name.trim() || env.name,
      room: local.room.trim() || undefined,
      riskLevel: local.riskLevel,
      desiredBehaviors: splitLines(local.desired),
      avoidBehaviors: splitLines(local.avoid),
      transitionRituals: splitLines(local.rituals),
      notes: local.notes.trim() || undefined,
    });
    setEditing(false);
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-800">
            {env.name} {env.room ? <span className="text-sm text-slate-500 font-medium">• {env.room}</span> : null}
          </div>
          <div className={`inline-flex mt-2 px-2 py-1 rounded-full border text-xs font-semibold ${riskColor[env.riskLevel]}`}>
            Risque {env.riskLevel}/4 — {riskLabel[env.riskLevel]}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing((v) => !v)} className="btn-secondary">
            {editing ? 'Annuler' : 'Éditer'}
          </button>
          <button
            onClick={() => {
              if (window.confirm('Supprimer cet espace ?')) onDelete(env.id);
            }}
            className="px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!editing ? (
        <div className="mt-4 space-y-3">
          <Block title="Souhaité" items={env.desiredBehaviors} />
          <Block title="À éviter" items={env.avoidBehaviors} tone="danger" />
          <Block title="Rituels de transition" items={env.transitionRituals} tone="ritual" />
          {env.notes && <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">{env.notes}</div>}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} />
            <input className="input-field" value={local.room} onChange={(e) => setLocal({ ...local, room: e.target.value })} placeholder="Pièce" />
          </div>
          <select
            value={local.riskLevel}
            onChange={(e) => setLocal({ ...local, riskLevel: Number(e.target.value) as EnvironmentRiskLevel })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            {[0, 1, 2, 3, 4].map((v) => (
              <option key={v} value={v}>
                {v} — {riskLabel[v as EnvironmentRiskLevel]}
              </option>
            ))}
          </select>
          <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" rows={4} value={local.desired} onChange={(e) => setLocal({ ...local, desired: e.target.value })} />
          <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" rows={3} value={local.avoid} onChange={(e) => setLocal({ ...local, avoid: e.target.value })} />
          <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" rows={3} value={local.rituals} onChange={(e) => setLocal({ ...local, rituals: e.target.value })} />
          <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" rows={2} value={local.notes} onChange={(e) => setLocal({ ...local, notes: e.target.value })} />
          <button onClick={save} className="btn-primary flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Sauvegarder
          </button>
        </div>
      )}
    </div>
  );
};

const Block: React.FC<{ title: string; items: string[]; tone?: 'danger' | 'ritual' }> = ({ title, items, tone }) => {
  const toneClasses =
    tone === 'danger'
      ? 'bg-red-50 border-red-200 text-red-800'
      : tone === 'ritual'
        ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
        : 'bg-emerald-50 border-emerald-200 text-emerald-800';
  if (!items || items.length === 0) return null;
  return (
    <div className={`rounded-lg border p-3 ${toneClasses}`}>
      <div className="text-xs font-semibold mb-2">{title}</div>
      <ul className="text-sm space-y-1 list-disc pl-5">
        {items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  );
};

export default EnvironmentDesignView;

