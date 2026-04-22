//
//  CoachNotificationMessageBank.swift
//  Vibes Arc
//
//  Banque FR : messages courts, identité, sans « n’oublie pas / rappel ».
//

import Foundation

enum CoachNotificationMessageBank {

    static func line(
        kind: NudgeMessageKind,
        intensity: CoachNudgeIntensity,
        rotationIndex: Int
    ) -> String {
        let list = lines(for: kind, intensity: intensity)
        guard !list.isEmpty else { return "Aujourd’hui, un geste. Tu choisis qui tu deviens." }
        let idx = abs(rotationIndex) % list.count
        return list[idx]
    }

    // MARK: - Par kind + intensité (soft / firm+ / hard+)

    private static func lines(for kind: NudgeMessageKind, intensity: CoachNudgeIntensity) -> [String] {
        let tier: Int = intensity == .soft ? 0 : (intensity == .firm ? 1 : 2)
        switch kind {
        case .morningIdentity: return morningIdentity(tier: tier)
        case .middayRefocus: return midday(tier: tier)
        case .eveningCritical: return evening(tier: tier)
        case .lowActivity: return lowActivity(tier: tier)
        case .antiPorn: return antiPorn(tier: tier)
        case .successIdentity: return successId(tier: tier)
        case .successStreak: return successStreak(tier: tier)
        }
    }

    // MARK: - Contenus

    private static func morningIdentity(tier: Int) -> [String] {
        let soft = [
            "Ce matin, tu ne gères pas des cases. Tu votes pour l’identité que tu bâtis.",
            "La journée n’est pas un remplissage. C’est un chantier. Première brique, maintenant.",
            "Tu t’appelles comment quand personne ne regarde ? Prouve-le en un geste, tout de suite.",
            "Hier est mort. Aujourd’hui, prouve qui tu entraînes, pas ce que tu espères.",
            "Pas de mélodrame. Exécution. Commence par la chose la plus petite, mais faite vraiment.",
        ]
        let firm = [
            "Si tu lances le jour en mode subtil, le soir t’enterra. Sers le premier coup maintenant.",
            "L’ancienne histoire s’éteint quand l’acte tranche. Un acte, pas un plan.",
            "Trois jours d’hésitation coûtent plus qu’une heure d’honnêteté brutale. Choisis l’honnêteté.",
            "L’identité, ce n’est pas une intention. C’est un comportement répété. Reprends la série, là.",
        ]
        let hard = [
            "Confort ce matin = facture le soir. Paye d’abord, avec une action, pas une intention.",
            "Tes doutes s’en vont quand le corps s’y met. Bouge, puis décide, pas l’inverse.",
        ]
        return tier == 0 ? soft : (tier == 1 ? (soft + firm) : (firm + hard))
    }

    private static func midday(tier: Int) -> [String] {
        let core = [
            "Ici, la plupart des jours s’échappent. Toi, tu resserres. Un bloc, une exécution, maintenant.",
            "Midi : tu es en ligne ou en dérive ? Corrige sans débat, sans story.",
            "L’après-midi négocie avec l’hier. Ne lui donne pas le vote. Ferme une boucle, tout de suite.",
            "C’est l’heure où les excuses s’emballent. Coupe court : une tâche, un oui, maintenant.",
        ]
        let extra = [
            "Si la tête s’encombre, rétrecis l’espace. Une habitude, pas cinq. Finis celle-là d’abord.",
            "L’apaisement ne se mendie pas. Il s’ouvre en faisant le pas que tu fuis.",
        ]
        return tier < 2 ? (core + extra) : (core + extra + [
            "Tu n’es pas en retard, tu hésites. Cesse d’hésiter. Cinq minutes, une action.",
        ])
    }

    private static func evening(tier: Int) -> [String] {
        let core = [
            "Ce soir, c’est un contrat avec qui tu deviens. Ne le vends pas à bas prix.",
            "La tension monte, et ta voix intérieure devient bavarde. Raccourcis : un geste, avant la négociation.",
            "Frustration bruyante : ne donne pas la manette. Corps d’abord, ensuite regard.",
            "L’entaille commence en « petit écart ». Appelle-les en face. Puis tranche d’un acte simple.",
        ]
        let up = [
            "Si tu t’inventes un « reprendre demain », tu savais déjà. Demain n’est pas l’heure, maintenant, oui.",
        ]
        return tier < 1 ? core : (core + up)
    }

    private static func lowActivity(tier: Int) -> [String] {
        let core = [
            "Tu glisses. On stoppe, maintenant. Cinq minutes suffisent pour rompre l’histoire.",
            "La chaîne n’est pas morale : c’est du calcul. Rentre dans l’équation avec un seul acte concret.",
            "Tout pèse ? Rétrecis. Une habitude, un oui, une fin, ce soir.",
            "L’abandon est aussi un entraînement. Rafraîchis l’entraînement, pas l’alibi.",
        ]
        let hard = [
            "Trois jours d’inaction : ton prochain oui a un goût d’acide. Prononce-le, avec les mains, pas le menton.",
        ]
        return tier == 2 ? (core + hard) : core
    }

    private static func antiPorn(tier: Int) -> [String] {
        let core = [
            "Stop. C’est l’heure où tu t’es déjà enlevé la volonté. Reste vissé à toi, pas à l’écran.",
            "Tu n’échanges pas un chapitre de vie pour quelques instants d’oubli. Redirige, physiquement.",
            "Dès que ça tire, mets le corps en vertical. Plancher, souffle, puis sentence.",
            "Le schéma, tu connais. Brise le rituel : dix pompes, dix mètres, dix secondes, puis re-regarde.",
        ]
        let hard = [
            "Ce n’est pas du plaisir, c’est du déplacement. Sors du carré : marche, eau, lumière, ordre. Maintenant.",
        ]
        return tier >= 1 ? (core + hard) : core
    }

    private static func successId(tier: Int) -> [String] {
        _ = tier
        return [
            "Ce n’est pas de la chance. C’est de la preuve, accumulée.",
            "L’identité se lit dans les reçus du jour, pas les slides du futur. Continue d’en ajouter un.",
        ]
    }

    private static func successStreak(tier: Int) -> [String] {
        _ = tier
        return [
            "Cohérent. C’est toi, version visible. Garde l’inscription.",
            "Tes reçus s’additionnent. Ne les gaspille pas en confort ce soir.",
        ]
    }
}
