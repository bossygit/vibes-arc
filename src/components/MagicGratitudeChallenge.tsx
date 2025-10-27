import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  CheckCircle2, 
  Star, 
  BookOpen, 
  Calendar,
  Trophy,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Target
} from 'lucide-react';
import { magicGratitudeChallenge, getMagicGratitudeDay, getCompletedDays, getProgressPercentage, isChallengeCompleted } from '@/data/magicGratitudeChallenge';

const MagicGratitudeChallenge: React.FC = () => {
  const [currentDay, setCurrentDay] = useState(1);
  const [isStarted, setIsStarted] = useState(false);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    // Charger l'état depuis le localStorage
    const savedState = localStorage.getItem('magicGratitudeChallenge');
    if (savedState) {
      const { currentDay: savedDay, isStarted: savedStarted, completedDays: savedCompleted, notes: savedNotes } = JSON.parse(savedState);
      setCurrentDay(savedDay);
      setIsStarted(savedStarted);
      setCompletedDays(new Set(savedCompleted));
      setNotes(savedNotes || {});
    }
  }, []);

  useEffect(() => {
    // Sauvegarder l'état dans le localStorage
    const state = {
      currentDay,
      isStarted,
      completedDays: Array.from(completedDays),
      notes
    };
    localStorage.setItem('magicGratitudeChallenge', JSON.stringify(state));
  }, [currentDay, isStarted, completedDays, notes]);

  const startChallenge = () => {
    setIsStarted(true);
    setCurrentDay(1);
  };

  const completeDay = (day: number) => {
    setCompletedDays(prev => new Set([...prev, day]));
  };

  const uncompleteDay = (day: number) => {
    setCompletedDays(prev => {
      const newSet = new Set(prev);
      newSet.delete(day);
      return newSet;
    });
  };

  const updateNotes = (day: number, note: string) => {
    setNotes(prev => ({ ...prev, [day]: note }));
  };

  const goToNextDay = () => {
    if (currentDay < 28) {
      setCurrentDay(prev => prev + 1);
    }
  };

  const goToPreviousDay = () => {
    if (currentDay > 1) {
      setCurrentDay(prev => prev - 1);
    }
  };

  const goToDay = (day: number) => {
    setCurrentDay(day);
  };

  const currentDayData = getMagicGratitudeDay(currentDay);
  const progress = getProgressPercentage();
  const isCompleted = isChallengeCompleted();

  if (!isStarted) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">The Magic - Défi de Gratitude</h2>
          <p className="text-slate-600 mb-6">28 jours pour transformer votre vie grâce à la gratitude</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-purple-900 mb-4">Basé sur "The Magic" de Rhonda Byrne</h3>
            <p className="text-slate-700 mb-6">
              Ce défi de 28 jours vous guidera à travers des exercices de gratitude spécifiques 
              pour transformer votre perspective et attirer plus d'abondance dans votre vie.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-semibold text-purple-900">28 Jours</h4>
                <p className="text-sm text-slate-600">Un exercice par jour</p>
              </div>
              <div className="text-center">
                <Heart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-semibold text-purple-900">Gratitude</h4>
                <p className="text-sm text-slate-600">Pratiques spécifiques</p>
              </div>
              <div className="text-center">
                <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-semibold text-purple-900">Transformation</h4>
                <p className="text-sm text-slate-600">Changement positif</p>
              </div>
            </div>

            <button
              onClick={startChallenge}
              className="btn-primary text-lg px-8 py-3 flex items-center gap-2 mx-auto"
            >
              <Sparkles className="w-5 h-5" />
              Commencer le Défi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec progression */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">The Magic - Défi de Gratitude</h2>
            <p className="text-slate-600">Jour {currentDay} sur 28</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">{progress}%</div>
            <div className="text-sm text-slate-500">Complété</div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Navigation des jours */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            disabled={currentDay === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Précédent
          </button>

          <div className="flex gap-2">
            {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                onClick={() => goToDay(day)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition ${
                  day === currentDay
                    ? 'bg-purple-600 text-white'
                    : completedDays.has(day)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <button
            onClick={goToNextDay}
            disabled={currentDay === 28}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Suivant
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenu du jour actuel */}
      {currentDayData && (
        <div className="card">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                Jour {currentDayData.day} : {currentDayData.title}
              </h3>
              <p className="text-lg text-purple-600 font-medium">{currentDayData.exercise}</p>
            </div>
            <div className="flex items-center gap-2">
              {completedDays.has(currentDay) ? (
                <button
                  onClick={() => uncompleteDay(currentDay)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complété
                </button>
              ) : (
                <button
                  onClick={() => completeDay(currentDay)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  <Target className="w-4 h-4" />
                  Marquer comme fait
                </button>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Instructions
            </h4>
            <ol className="space-y-2">
              {currentDayData.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-slate-700">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Question de réflexion */}
          <div className="mb-6">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-600" />
              Réflexion
            </h4>
            <p className="text-slate-700 mb-3">{currentDayData.reflection}</p>
            <textarea
              value={notes[currentDay] || ''}
              onChange={(e) => updateNotes(currentDay, e.target.value)}
              placeholder="Écrivez vos réflexions ici..."
              className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Affirmation */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Affirmation du jour
            </h4>
            <p className="text-slate-700 italic">"{currentDayData.affirmation}"</p>
          </div>
        </div>
      )}

      {/* Message de félicitations si terminé */}
      {isCompleted && (
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-900 mb-2">Félicitations !</h3>
            <p className="text-green-700 mb-4">
              Vous avez terminé le défi de gratitude de 28 jours ! 
              Continuez à pratiquer la gratitude quotidiennement pour maintenir cette transformation positive.
            </p>
            <button
              onClick={() => {
                setCompletedDays(new Set());
                setNotes({});
                setCurrentDay(1);
              }}
              className="btn-primary"
            >
              Recommencer le défi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MagicGratitudeChallenge;
