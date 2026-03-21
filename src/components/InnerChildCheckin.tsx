/**
 * Inner Child Check-in — 7ème moteur psychologique de Vibes Arc
 *
 * Ce composant crée un espace sécurisé pour reconnaître l'état émotionnel
 * de l'enfant intérieur avant de faire ses habitudes.
 * Basé sur : Joe Dispenza (reprogrammation), IFS (Internal Family Systems),
 * et la thérapie de l'enfant intérieur.
 */

import React, { useState, useEffect } from 'react';
import { Heart, ChevronRight, RotateCcw, BookOpen, TrendingUp, Sparkles } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type EmotionalState =
  | 'honte'
  | 'peur'
  | 'colere'
  | 'tristesse'
  | 'vide'
  | 'calme'
  | 'joie'
  | 'confiance';

interface CheckinEntry {
  id: string;
  date: string; // YYYY-MM-DD
  emotion: EmotionalState;
  intensity: number; // 1-5
  trigger: string;
  selfCompassionMessage: string;
  habitCompletionAfter?: number; // % d'habitudes faites après le check-in
  createdAt: string;
}

interface CheckinState {
  entries: CheckinEntry[];
  lastCheckinDate: string | null;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const EMOTIONS: { key: EmotionalState; label: string; emoji: string; color: string; bgColor: string }[] = [
  { key: 'honte', label: 'Honte / Indignité', emoji: '😶', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200 hover:border-purple-400' },
  { key: 'peur', label: 'Peur / Anxiété', emoji: '😰', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200 hover:border-blue-400' },
  { key: 'colere', label: 'Colère / Frustration', emoji: '😤', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200 hover:border-red-400' },
  { key: 'tristesse', label: 'Tristesse / Abandon', emoji: '😢', color: 'text-slate-700', bgColor: 'bg-slate-50 border-slate-200 hover:border-slate-400' },
  { key: 'vide', label: 'Vide / Déconnexion', emoji: '😑', color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200 hover:border-gray-400' },
  { key: 'calme', label: 'Calme / Neutre', emoji: '😌', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200 hover:border-green-400' },
  { key: 'joie', label: 'Joie / Légèreté', emoji: '😊', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200 hover:border-yellow-400' },
  { key: 'confiance', label: 'Confiance / Force', emoji: '💪', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400' },
];

const COMMON_TRIGGERS: Record<EmotionalState, string[]> = {
  honte: [
    "Je n'ai pas tenu mes habitudes hier",
    "Je me compare à quelqu'un",
    "J'ai fait une erreur professionnelle",
    "Je me sens 'pas assez bien'",
    "Autre…",
  ],
  peur: [
    "Un projet important m'attend",
    "Peur de décevoir un client",
    "Incertitude financière",
    "Peur de ne pas être à la hauteur",
    "Autre…",
  ],
  colere: [
    "Une situation injuste",
    "Frustration envers moi-même",
    "Quelqu'un m'a mal compris",
    "Un projet qui n'avance pas",
    "Autre…",
  ],
  tristesse: [
    "Je me sens seul",
    "Un effort non reconnu",
    "Nostalgie d'un temps plus simple",
    "Fatigue profonde",
    "Autre…",
  ],
  vide: [
    "Manque de sens dans ce que je fais",
    "Déconnexion de mes objectifs",
    "Trop de fatigue",
    "Après une longue période de stress",
    "Autre…",
  ],
  calme: ["Journée ordinaire", "Après une bonne nuit", "Routine bien tenue", "Autre…"],
  joie: ["Belle réussite", "Moment de gratitude", "Connexion avec quelqu'un", "Autre…"],
  confiance: ["Après une bonne performance", "Momentum fort", "Vision claire", "Autre…"],
};

// Messages de compassion personnalisés pour chaque émotion
const COMPASSION_MESSAGES: Record<EmotionalState, string[]> = {
  honte: [
    "Bienvenu, la honte que tu ressens n'est pas la vérité sur qui tu es. C'est un vieux programme — pas toi. Tu n'as rien de mauvais en toi.",
    "Le petit Bienvenu qui se faisait petit pour survivre n'avait pas tort de faire ça. Mais aujourd'hui, tu es en sécurité. Tu peux te relever.",
    "Tu n'es pas tes erreurs. Tu es l'homme qui choisit de se regarder avec honnêteté — et ça demande un courage immense.",
  ],
  peur: [
    "Ta peur est ancienne. Elle vient de l'enfant qui devait anticiper le danger seul. Mais aujourd'hui, tu as des ressources que cet enfant n'avait pas.",
    "Ce scénario que ton cerveau joue en boucle — 'ça va mal se passer' — c'est un vieux programme de protection, pas une prédiction. Tu peux souffler.",
    "Prends une grande inspiration. La peur dit : 'sois prudent'. Pas : 'n'avance pas'. Tu peux avancer avec elle.",
  ],
  colere: [
    "Ta colère est valide. Elle protège quelque chose d'important en toi. Qu'est-ce qu'elle essaie de défendre aujourd'hui ?",
    "Laisse la colère te montrer où sont tes vraies limites — c'est de l'information précieuse. Mais ne la laisse pas décider pour toi.",
    "Ton énergie est puissante. Même canalisée dans la friction, elle peut devenir du carburant.",
  ],
  tristesse: [
    "Tu as le droit d'être triste. Ce n'est pas de la faiblesse — c'est de l'humanité profonde. Je suis là.",
    "L'enfant en toi qui s'est senti seul mérite qu'on le regarde avec douceur. Tu n'es plus seul maintenant.",
    "La tristesse passe quand on la laisse exister sans la combattre. Reste avec elle quelques instants. Elle a quelque chose à dire.",
  ],
  vide: [
    "Le vide est parfois le signe que tu as besoin de repos — pas d'action. Ton système nerveux demande à récupérer.",
    "Quand tout semble fade, c'est souvent que tu es déconnecté de ton corps. Une respiration lente peut tout changer.",
    "Le vide n'est pas permanent. Il prépare souvent un espace pour quelque chose de nouveau.",
  ],
  calme: [
    "Ce calme est précieux. C'est depuis cet état que tu construis le mieux. Ancre-toi dedans avant de commencer.",
    "Tu es dans l'espace idéal pour avancer. Ton système nerveux est prêt. Lance-toi.",
    "Ce moment de paix est une victoire en soi. Beaucoup d'hommes courent sans jamais s'arrêter comme tu le fais.",
  ],
  joie: [
    "Cette légèreté que tu ressens — c'est ton état naturel. Souviens-toi de lui quand ça sera plus dur.",
    "La joie est ton énergie de référence. Elle te dit que tu es aligné. Savoure-la et avance depuis ici.",
    "Beau travail, Bienvenu. Cette énergie est réelle. Elle mérite d'être notée et rappelée.",
  ],
  confiance: [
    "Tu es dans ton élan. Cet espace de confiance — c'est qui tu deviens. Pas une exception. Une normalité qui s'installe.",
    "Sens cette force dans ton corps. Elle ne vient pas de l'extérieur — elle vient de toi. Elle a toujours été là.",
    "Depuis cet état, tout est possible. Qu'est-ce que la version confiante de toi ferait aujourd'hui ?",
  ],
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'vibes-arc-inner-child';

function loadState(): CheckinState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { entries: [], lastCheckinDate: null };
}

function saveState(state: CheckinState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getEmotionData(key: EmotionalState) {
  return EMOTIONS.find(e => e.key === key)!;
}

// ─── Composant principal ──────────────────────────────────────────────────────

type Phase = 'home' | 'emotion' | 'intensity' | 'trigger' | 'compassion' | 'history';

const InnerChildCheckin: React.FC = () => {
  const [state, setState] = useState<CheckinState>(loadState);
  const [phase, setPhase] = useState<Phase>('home');

  // Session en cours
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalState | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [selectedTrigger, setSelectedTrigger] = useState('');
  const [customTrigger, setCustomTrigger] = useState('');
  const [compassionMsg, setCompassionMsg] = useState('');

  const hasCheckinToday = state.lastCheckinDate === todayStr();
  const todayEntry = state.entries.find(e => e.date === todayStr());

  // Persist
  useEffect(() => {
    saveState(state);
  }, [state]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const startCheckin = () => {
    setSelectedEmotion(null);
    setIntensity(3);
    setSelectedTrigger('');
    setCustomTrigger('');
    setPhase('emotion');
  };

  const selectEmotion = (emotion: EmotionalState) => {
    setSelectedEmotion(emotion);
    setPhase('intensity');
  };

  const confirmIntensity = () => {
    setPhase('trigger');
  };

  const selectTrigger = (trigger: string) => {
    if (trigger === 'Autre…') {
      setSelectedTrigger('');
    } else {
      setSelectedTrigger(trigger);
    }
  };

  const confirmTrigger = () => {
    if (!selectedEmotion) return;
    const finalTrigger = selectedTrigger === '' ? customTrigger : selectedTrigger;
    if (!finalTrigger.trim()) return;

    const msg = getRandomItem(COMPASSION_MESSAGES[selectedEmotion]);
    setCompassionMsg(msg);

    // Sauvegarder l'entrée
    const newEntry: CheckinEntry = {
      id: `checkin-${Date.now()}`,
      date: todayStr(),
      emotion: selectedEmotion,
      intensity,
      trigger: finalTrigger,
      selfCompassionMessage: msg,
      createdAt: new Date().toISOString(),
    };

    setState(prev => ({
      entries: [...prev.entries.filter(e => e.date !== todayStr()), newEntry],
      lastCheckinDate: todayStr(),
    }));

    setPhase('compassion');
  };

  const reset = () => {
    setPhase('home');
    setSelectedEmotion(null);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  // Statistiques rapides
  const last7 = state.entries
    .slice(-7)
    .map(e => e.emotion);

  const emotionCounts = last7.reduce<Record<string, number>>((acc, e) => {
    acc[e] = (acc[e] || 0) + 1;
    return acc;
  }, {});

  const mostFrequent = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];

  // ── HOME ──
  if (phase === 'home') {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-400/25">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Inner Child Check-in</h2>
              <p className="text-sm text-slate-500">Reconnecte-toi à toi avant d'avancer</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 bg-rose-50 border border-rose-100 rounded-xl p-3 mt-3">
            Les habitudes ne tiennent pas parce qu'on manque de volonté —
            elles tombent quand l'enfant intérieur a peur, honte ou se sent seul.
            Ce check-in prend 2 minutes. Il change tout.
          </p>
        </div>

        {/* Statut du jour */}
        {hasCheckinToday && todayEntry ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{getEmotionData(todayEntry.emotion).emoji}</span>
              <div>
                <p className="font-semibold text-slate-800">Check-in du jour fait ✓</p>
                <p className="text-sm text-slate-500">{getEmotionData(todayEntry.emotion).label} — intensité {todayEntry.intensity}/5</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 italic border-l-2 border-rose-300 pl-3">
              "{todayEntry.selfCompassionMessage.slice(0, 100)}…"
            </p>
            <button
              onClick={startCheckin}
              className="mt-4 w-full py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              Refaire un check-in
            </button>
          </div>
        ) : (
          <button
            onClick={startCheckin}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-base shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 mb-4"
          >
            <Heart className="w-5 h-5" />
            Commencer le check-in du jour
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Stats 7 jours */}
        {state.entries.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-rose-400" />
                Tendance des 7 derniers jours
              </h3>
              <button
                onClick={() => setPhase('history')}
                className="text-xs text-rose-500 hover:text-rose-700"
              >
                Tout voir →
              </button>
            </div>

            {/* Mini timeline émotionnelle */}
            <div className="flex gap-1.5 mb-3">
              {state.entries.slice(-7).map((entry, i) => {
                const ed = getEmotionData(entry.emotion);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-base">{ed.emoji}</span>
                    <div
                      className="w-full rounded-sm bg-rose-100"
                      style={{ height: `${entry.intensity * 6}px` }}
                    />
                    <span className="text-[9px] text-slate-400">
                      {new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2)}
                    </span>
                  </div>
                );
              })}
            </div>

            {mostFrequent && (
              <p className="text-xs text-slate-500">
                Émotion la plus fréquente cette semaine :{' '}
                <span className="font-medium text-slate-700">
                  {getEmotionData(mostFrequent[0] as EmotionalState).label}
                </span>{' '}
                ({mostFrequent[1]}×)
              </p>
            )}
          </div>
        )}

        {/* Message ancrage */}
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-700 mb-1">💬 Rappel</p>
          <p className="italic">
            "Tu n'es pas un sorcier. Tu n'as rien de mauvais en toi.
            Tu es digne d'amour et de respect. Je suis là maintenant."
          </p>
        </div>
      </div>
    );
  }

  // ── EMOTION ──
  if (phase === 'emotion') {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={reset} className="p-2 rounded-xl hover:bg-slate-100 transition">
            <RotateCcw className="w-4 h-4 text-slate-400" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Comment te sens-tu là, maintenant ?</h2>
            <p className="text-sm text-slate-500">Pas ce que tu "devrais" ressentir — ce que tu ressens vraiment.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {EMOTIONS.map(emotion => (
            <button
              key={emotion.key}
              onClick={() => selectEmotion(emotion.key)}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${emotion.bgColor}`}
            >
              <span className="text-2xl">{emotion.emoji}</span>
              <div className="text-left">
                <p className={`font-medium text-sm ${emotion.color}`}>{emotion.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── INTENSITY ──
  if (phase === 'intensity' && selectedEmotion) {
    const ed = getEmotionData(selectedEmotion);
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setPhase('emotion')} className="p-2 rounded-xl hover:bg-slate-100 transition">
            <RotateCcw className="w-4 h-4 text-slate-400" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">À quel point ?</h2>
            <p className="text-sm text-slate-500">
              {ed.emoji} {ed.label}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
          <div className="flex justify-between text-sm text-slate-500 mb-3">
            <span>À peine présent</span>
            <span>Très intense</span>
          </div>

          <input
            type="range"
            min={1}
            max={5}
            value={intensity}
            onChange={e => setIntensity(parseInt(e.target.value))}
            className="w-full accent-rose-500"
          />

          <div className="flex justify-center mt-4">
            <div className="text-5xl font-bold text-rose-500">{intensity}</div>
            <div className="text-slate-400 text-sm self-end mb-1 ml-1">/5</div>
          </div>

          <div className="flex justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map(n => (
              <div
                key={n}
                className={`w-6 h-6 rounded-full transition-all ${n <= intensity ? 'bg-rose-400' : 'bg-slate-100'}`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={confirmIntensity}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
        >
          Continuer
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ── TRIGGER ──
  if (phase === 'trigger' && selectedEmotion) {
    const triggers = COMMON_TRIGGERS[selectedEmotion];
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setPhase('intensity')} className="p-2 rounded-xl hover:bg-slate-100 transition">
            <RotateCcw className="w-4 h-4 text-slate-400" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">D'où ça vient ?</h2>
            <p className="text-sm text-slate-500">Qu'est-ce qui a déclenché cette émotion ?</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {triggers.map(trigger => (
            <button
              key={trigger}
              onClick={() => selectTrigger(trigger)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                selectedTrigger === trigger
                  ? 'border-rose-400 bg-rose-50 text-rose-700 font-medium'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-rose-200'
              }`}
            >
              {trigger}
            </button>
          ))}
        </div>

        {(selectedTrigger === '' || selectedTrigger === 'Autre…') && (
          <textarea
            value={customTrigger}
            onChange={e => setCustomTrigger(e.target.value)}
            placeholder="Décris ce qui se passe en quelques mots…"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 resize-none mb-4"
          />
        )}

        <button
          onClick={confirmTrigger}
          disabled={!selectedTrigger && !customTrigger.trim()}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Recevoir mon message
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ── COMPASSION ──
  if (phase === 'compassion' && selectedEmotion) {
    const ed = getEmotionData(selectedEmotion);
    const isHeavy = ['honte', 'peur', 'tristesse'].includes(selectedEmotion);

    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-rose-400/20">
            <span className="text-3xl">{ed.emoji}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            {isHeavy ? 'Je t\'entends, Bienvenu.' : 'Tu es dans un bon espace.'}
          </h2>
          <p className="text-sm text-slate-500">{ed.label} — intensité {intensity}/5</p>
        </div>

        {/* Message de compassion */}
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-5 mb-5 shadow-sm">
          <div className="flex items-start gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium text-rose-700">Message pour toi</p>
          </div>
          <p className="text-slate-700 leading-relaxed text-sm">
            {compassionMsg}
          </p>
        </div>

        {/* Pratique proposée */}
        {isHeavy && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-sm">
            <p className="text-sm font-medium text-slate-700 mb-2">🌬️ Avant de continuer</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ferme les yeux 30 secondes. Imagine le petit Bienvenu devant toi.
              Pose une main sur ton cœur et dis-lui intérieurement :
              <span className="italic font-medium text-slate-700"> "Tu n'es pas seul. Je suis là. Tu es en sécurité."</span>
            </p>
          </div>
        )}

        {/* Déclencheur noté */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-5">
          <p className="text-xs text-slate-400 mb-1">Déclencheur noté</p>
          <p className="text-sm text-slate-600">
            {selectedTrigger || customTrigger}
          </p>
        </div>

        <button
          onClick={reset}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-600 transition-all flex items-center justify-center gap-2"
        >
          <Heart className="w-5 h-5" />
          Aller vers mes habitudes
        </button>
      </div>
    );
  }

  // ── HISTORY ──
  if (phase === 'history') {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setPhase('home')} className="p-2 rounded-xl hover:bg-slate-100 transition">
            <RotateCcw className="w-4 h-4 text-slate-400" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Historique émotionnel</h2>
            <p className="text-sm text-slate-500">{state.entries.length} check-ins enregistrés</p>
          </div>
        </div>

        {state.entries.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun check-in encore. Commence aujourd'hui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...state.entries].reverse().map(entry => {
              const ed = getEmotionData(entry.emotion);
              return (
                <div key={entry.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{ed.emoji}</span>
                      <div>
                        <p className="font-medium text-sm text-slate-700">{ed.label}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(entry.date).toLocaleDateString('fr-FR', {
                            weekday: 'long', day: 'numeric', month: 'long'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <div
                          key={n}
                          className={`w-2 h-2 rounded-full ${n <= entry.intensity ? 'bg-rose-400' : 'bg-slate-100'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 italic">
                    "{entry.selfCompassionMessage.slice(0, 90)}…"
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default InnerChildCheckin;
