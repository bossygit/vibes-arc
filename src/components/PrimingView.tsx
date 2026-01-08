import React, { useEffect, useMemo, useState } from 'react';
import { Brain, Timer, Shield, Sparkles, ArrowLeft, Trash2, Target } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { primingTemplates } from '@/data/primingTemplates';
import { NervousSystemState, PrimingTemplate, PrimingSession } from '@/types';

const stateLabels: Record<NervousSystemState, string> = {
  calme: 'Calme',
  tension: 'Tension',
  agitation: 'Agitation',
  shutdown: 'Shutdown',
};

const stateColors: Record<NervousSystemState, string> = {
  calme: 'bg-green-100 text-green-700 border-green-200',
  tension: 'bg-amber-100 text-amber-700 border-amber-200',
  agitation: 'bg-red-100 text-red-700 border-red-200',
  shutdown: 'bg-slate-200 text-slate-700 border-slate-300',
};

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(n)));
}

const PrimingView: React.FC = () => {
  const { identities, setView, addPrimingSession, primingSessions, clearPrimingSessions } = useAppStore();

  const [focusBusinessMode, setFocusBusinessMode] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(primingTemplates[0]?.id ?? '');
  const selectedTemplate: PrimingTemplate | undefined = useMemo(
    () => primingTemplates.find((t) => t.id === selectedTemplateId),
    [selectedTemplateId]
  );

  const [goal, setGoal] = useState<string>('');
  const [identityId, setIdentityId] = useState<number | ''>('');

  const [preState, setPreState] = useState<NervousSystemState>('tension');
  const [preIntensity, setPreIntensity] = useState<number>(2);
  const [postState, setPostState] = useState<NervousSystemState>('calme');
  const [postIntensity, setPostIntensity] = useState<number>(1);
  const [nextAction, setNextAction] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [phase, setPhase] = useState<'setup' | 'running' | 'complete'>('setup');
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  const recommendedTemplateId = useMemo(() => {
    // Règle simple, data-driven plus tard:
    // - si état "tension/agitation/shutdown" => sécurité (downshift)
    // - sinon => focus (execution)
    const isAlarm = preState === 'tension' || preState === 'agitation' || preState === 'shutdown';
    const desiredIntent = isAlarm ? 'sécurité' : 'focus';
    const found = primingTemplates.find((t) => t.intent === desiredIntent);
    return found?.id ?? primingTemplates[0]?.id ?? '';
  }, [preState]);

  const displayedTemplates = useMemo(() => {
    if (!focusBusinessMode) return primingTemplates;
    // Focus business: on garde ce qui mène à exécution + stabilité (sans excitation)
    return primingTemplates.filter((t) => ['focus', 'discipline', 'sécurité', 'abondance'].includes(t.intent));
  }, [focusBusinessMode]);

  useEffect(() => {
    // En mode focus business, proposer une intention d'objectif par défaut si vide
    if (!focusBusinessMode) return;
    if (goal.trim().length > 0) return;
    setGoal('Focus business (prochain pas concret)');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusBusinessMode]);

  useEffect(() => {
    if (phase !== 'running') return;
    if (secondsLeft <= 0) return;
    const t = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [phase, secondsLeft]);

  useEffect(() => {
    if (phase === 'running' && secondsLeft <= 0) {
      setPhase('complete');
    }
  }, [phase, secondsLeft]);

  const start = () => {
    if (!selectedTemplate) return;
    setSecondsLeft(selectedTemplate.durationMin * 60);
    setPhase('running');
  };

  const save = () => {
    if (!selectedTemplate) return;
    const identity = identityId ? identities.find((i) => i.id === identityId) : undefined;

    const session: PrimingSession = {
      id: `priming_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      templateId: selectedTemplate.id,
      templateTitle: selectedTemplate.title,
      durationMin: selectedTemplate.durationMin,
      goal: goal.trim() || undefined,
      identityId: identity?.id,
      identityName: identity?.name,
      preState,
      preIntensity: clampInt(preIntensity, 0, 4),
      postState,
      postIntensity: clampInt(postIntensity, 0, 4),
      nextAction: nextAction.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    addPrimingSession(session);
    setPhase('setup');
    setSecondsLeft(0);
    setNotes('');
    setNextAction('');
  };

  const reset = () => {
    setPhase('setup');
    setSecondsLeft(0);
  };

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Brain className="w-8 h-8 text-indigo-600" />
            Priming My Brain
          </h2>
          <p className="text-slate-600 mt-1">
            Calmer le système nerveux <strong>avant</strong> l’action. Objectif: sécurité, clarté, naturalité.
          </p>
        </div>
        <button onClick={() => setView('dashboard')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
      </div>

      {/* Setup */}
      {phase === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-2">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Choisir un priming (3–10 min)
            </h3>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                onClick={() => setFocusBusinessMode((v) => !v)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                  focusBusinessMode ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <Target className="w-4 h-4 inline mr-2" />
                Mode Focus Business {focusBusinessMode ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setSelectedTemplateId(recommendedTemplateId)}
                className="px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100 transition"
                disabled={!recommendedTemplateId}
                title="Choisit automatiquement un rituel adapté à ton état (sécurité → focus)"
              >
                Recommandé (selon état)
              </button>
              <span className="text-xs text-slate-500">
                Règle: si tension/agitation → sécurité d’abord, sinon focus.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={`text-left p-4 rounded-xl border transition ${
                    selectedTemplateId === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-800">{t.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{t.intent} • {t.durationMin} min</div>
                    </div>
                    <div className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {t.durationMin}m
                    </div>
                  </div>
                  {t.safetyNote && (
                    <div className="mt-3 text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-2">
                      <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>{t.safetyNote}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3">Contexte (optionnel mais utile)</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Objectif</label>
                <input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="input-field"
                  placeholder="ex: 5 000 000 FCFA / lancer une offre / sobriété"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Identité liée</label>
                <select
                  value={identityId}
                  onChange={(e) => setIdentityId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Aucune</option>
                  {identities.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">État avant</label>
                  <select
                    value={preState}
                    onChange={(e) => setPreState(e.target.value as NervousSystemState)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {Object.keys(stateLabels).map((k) => (
                      <option key={k} value={k}>
                        {stateLabels[k as NervousSystemState]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Intensité (0–4)</label>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={preIntensity}
                    onChange={(e) => setPreIntensity(clampInt(parseInt(e.target.value) || 0, 0, 4))}
                    className="input-field"
                  />
                </div>
              </div>

              <button
                onClick={start}
                disabled={!selectedTemplate}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Timer className="w-4 h-4" />
                Démarrer ({selectedTemplate?.durationMin ?? 0} min)
              </button>

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                Règle UX: on cherche une baisse de charge (calme / neutralité), pas un pic d’excitation.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Running */}
      {phase === 'running' && selectedTemplate && (
        <div className="card">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{selectedTemplate.title}</h3>
              <div className="text-sm text-slate-600 mt-1">
                Intent: <span className="font-semibold">{selectedTemplate.intent}</span>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center gap-2">
              <Timer className="w-5 h-5" />
              {mm}:{String(ss).padStart(2, '0')}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ol className="space-y-3">
                {selectedTemplate.steps.map((s, idx) => (
                  <li key={idx} className="p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">Étape {idx + 1}</div>
                    <div className="text-slate-800">{s}</div>
                  </li>
                ))}
              </ol>
              {selectedTemplate.safetyNote && (
                <div className="mt-4 text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>{selectedTemplate.safetyNote}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className={`p-3 rounded-lg border ${stateColors[preState]}`}>
                <div className="text-xs font-semibold">Avant</div>
                <div className="text-sm">{stateLabels[preState]} • intensité {preIntensity}/4</div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-sm">
                Si tu sens une montée d’excitation/anxiété: ralentis, reviens au corps, raccourcis.
              </div>

              <button onClick={() => setSecondsLeft(0)} className="w-full btn-secondary">
                Terminer maintenant
              </button>
              <button onClick={reset} className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete */}
      {phase === 'complete' && selectedTemplate && (
        <div className="card">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Fin — mesure “après” (30 sec)</h3>
          <p className="text-sm text-slate-600 mb-4">
            On enregistre uniquement une donnée utile: le delta de sécurité (calme/tension) — pas de jugement.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border ${stateColors[preState]}`}>
                  <div className="text-xs font-semibold">Avant</div>
                  <div className="text-sm">{stateLabels[preState]} • {preIntensity}/4</div>
                </div>
                <div className={`p-3 rounded-lg border ${stateColors[postState]}`}>
                  <div className="text-xs font-semibold">Après</div>
                  <div className="text-sm">{stateLabels[postState]} • {postIntensity}/4</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">État après</label>
                  <select
                    value={postState}
                    onChange={(e) => setPostState(e.target.value as NervousSystemState)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {Object.keys(stateLabels).map((k) => (
                      <option key={k} value={k}>
                        {stateLabels[k as NervousSystemState]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Intensité (0–4)</label>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={postIntensity}
                    onChange={(e) => setPostIntensity(clampInt(parseInt(e.target.value) || 0, 0, 4))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Prochain pas business (2 minutes)</label>
                <input
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  className="input-field"
                  placeholder="ex: envoyer 1 message client / publier 1 post / écrire 3 lignes d’offre"
                />
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Note factuelle (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  rows={3}
                  placeholder="ex: tension dans poitrine ↓ / pensée plus lente / envie d’agir sans pression"
                />
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={save} className="w-full btn-primary">
                Enregistrer
              </button>
              <button onClick={reset} className="w-full btn-secondary">
                Refaire un priming
              </button>
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                Si “après” = tension/agitation: ce n’est pas un échec — c’est un signal (besoin de sécurité / sommeil / limites).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="card">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-slate-800">Historique (local)</h3>
          <button
            onClick={() => {
              if (window.confirm('Supprimer l’historique des sessions de priming ?')) clearPrimingSessions();
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            disabled={primingSessions.length === 0}
          >
            <Trash2 className="w-4 h-4" />
            Effacer
          </button>
        </div>

        {primingSessions.length === 0 ? (
          <div className="text-sm text-slate-600">Aucune session enregistrée pour le moment.</div>
        ) : (
          <div className="space-y-2">
            {primingSessions.slice(0, 10).map((s) => (
              <div key={s.id} className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-800">{s.templateTitle}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(s.createdAt).toLocaleString('fr-FR')} • {s.durationMin} min
                      {s.identityName ? ` • ${s.identityName}` : ''}
                      {s.goal ? ` • ${s.goal}` : ''}
                    </div>
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className={`inline-flex px-2 py-1 rounded-full border ${stateColors[s.preState]} mr-2`}>
                      Avant: {stateLabels[s.preState]} {s.preIntensity}/4
                    </span>
                    <span className={`inline-flex px-2 py-1 rounded-full border ${stateColors[s.postState]}`}>
                      Après: {stateLabels[s.postState]} {s.postIntensity}/4
                    </span>
                  </div>
                </div>
                {s.notes && <div className="mt-2 text-sm text-slate-700">{s.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrimingView;

