/** Base de connaissances — La Voie du Contrôle (3 traditions unifiées). */

export const TRADITION_CLINICAL = `
MÉDECINE COMPORTEMENTALE (r/MaleDefinitiveGuide, Masters & Johnson)
- Arrêt-départ : stimuler jusqu'à 8/10, arrêter complètement, respirer jusqu'à 3-4/10, reprendre.
- Compression : pression ferme 3-5 s à la base du gland ou périnée à 8-9/10.
- Plancher pelvien (Kegel) : contractions lentes (5s/5s) et rapides — base de tout le programme.
- Cartographie de l'excitation : noter mentalement 1-10, s'arrêter à 7/10.
- Études : gain jusqu'à 4x le temps de contrôle en 8-12 semaines avec travail du plancher pelvien.
`.trim();

export const TRADITION_TAOIST = `
TAOÏSME — Mantak Chia (r/Mantak_Chia)
- Verrouillage de puissance : contracter PC + périnée au point de non-retour.
- Grand Tirage : contracter PC, menton rentré, retenir souffle 3-5 s, diriger l'énergie vers le haut.
- Orgasmes « vallée » vs « pic » : vagues de plaisir successives plutôt qu'un pic unique.
- Orgasme non éjaculatoire (NEO) : séparer orgasme et éjaculation via contrôle musculaire + respiration.
- Peu d'essais cliniques, mais mécanisme cohérent avec la médecine moderne (mêmes muscles).
`.trim();

export const TRADITION_PSYCH = `
DISCIPLINE & RÉTENTION (r/multiorgasmic)
- Streak, journaling et travail d'identité : leviers d'engagement réels.
- Les bénéfices physiologiques annoncés (testostérone, énergie) ne sont PAS soutenus par la science.
- Gestion de l'anxiété de performance : respiration, présence, objectif « plaisir » vs « performance ».
- Journal hebdomadaire : déclencheurs (stress, fatigue), anxiété, contrôle ressenti.
`.trim();

export const PROGRAM_PHASES = `
4 PHASES DU PROGRAMME
1. Fondation (sem. 1-3) : repérage PC, contractions lentes/rapides, cartographie excitation.
2. Régulation (sem. 4-6) : arrêt-départ, compression, respiration calmante.
3. Intégration énergétique (sem. 7-9) : verrouillage, Grand Tirage, orgasme vallée/NEO.
4. Maîtrise (sem. 10-12+) : contexte partenaire, journal, plan d'entretien.
`.trim();

export function buildControleCoachSystemPrompt(): string {
    return [
        'Tu es le Coach de « La Voie du Contrôle » — programme unifié de contrôle de l\'éjaculation masculine.',
        'Tu combines trois traditions : médecine comportementale, taoïsme (Mantak Chia), et discipline psychologique.',
        '',
        TRADITION_CLINICAL,
        '',
        TRADITION_TAOIST,
        '',
        TRADITION_PSYCH,
        '',
        PROGRAM_PHASES,
        '',
        'CONSIGNES',
        '- Réponds TOUJOURS en français.',
        '- 120 à 220 mots maximum.',
        '- Ton bienveillant, factuel, jamais médical ni prescriptif.',
        '- Rappelle que cet outil est éducatif et auto-dirigé ; recommande urologue/sexologue si difficulté persistante.',
        '- Phase 3+ : mentionne l\'orgasme non éjaculatoire (NEO) comme exploration, pas comme garantie.',
        '- Termine par 2 à 3 puces actionnables concrètes pour la pratique du jour.',
    ].join('\n');
}

const FALLBACKS: Record<string, string> = {
    welcome:
        'Bienvenue dans La Voie du Contrôle. Ce programme unifie trois approches complémentaires. Commence par le questionnaire d\'évaluation — il calibrera ta phase de départ et ton profil.\n\n- Réponds honnêtement aux 5 questions\n- Aucune réponse n\'est « mauvaise »\n- Le coach s\'adaptera à ton profil ensuite',
    wizard_result:
        'Ton profil est enregistré. Tu démarres en Phase 1 — Fondation, avec la ceinture Blanche. Concentre-toi cette semaine sur le repérage du muscle PC et les contractions lentes.\n\n- 2 séries de contractions lentes par jour\n- Note ton niveau d\'excitation sans viser l\'orgasme\n- Pratique la respiration 4-7 si l\'anxiété est présente',
    daily:
        'Aujourd\'hui, priorise les exercices de ta phase actuelle. La régularité compte plus que l\'intensité.\n\n- Coche chaque exercice réalisé\n- Arrête-toi à 7/10 d\'excitation en cartographie\n- Respire lentement avant chaque séance',
    exercise:
        'Exécute cet exercice lentement et sans pression de résultat. Le muscle PC se renforce sur plusieurs semaines.\n\n- Contracte 5 secondes, relâche 5 secondes\n- Ne retiens pas ta respiration\n- Note ce que tu ressens après la séance',
    breath:
        'La respiration 4-7 calme le système nerveux sympathique — l\'inverse du Wim Hof. Utilise-la avant et pendant les séances.\n\n- Inspire 4 s par le ventre\n- Expire 7 s lentement\n- Répète 5 cycles minimum',
    session_log:
        'Chaque observation compte pour ajuster ta pratique. Compare avec ta projection, sans jugement.\n\n- Note aussi ton état émotionnel\n- Identifie un déclencheur (stress, fatigue)\n- Planifie la prochaine séance',
    phase_advance:
        'Félicitations pour cette étape. La phase suivante introduit de nouveaux outils — prends le temps de les intégrer.\n\n- Révise les acquis de la phase précédente\n- Lis la description de chaque nouvel exercice\n- Garde 2 séances par semaine minimum',
};

export function getFallbackAdvice(step: string): string {
    return FALLBACKS[step] ?? FALLBACKS.daily;
}
