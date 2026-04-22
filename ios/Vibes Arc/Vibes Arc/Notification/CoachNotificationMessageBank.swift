//
//  CoachNotificationMessageBank.swift
//  Vibes Arc
//
//  Banque FR — cadrage douleur-d'abord (pain-avoidance).
//  Principe : rendre l'inaction plus coûteuse que l'action.
//  Pas de sugarcoating. Pas de "tu peux le faire". Uniquement le vrai prix.
//

import Foundation

enum CoachNotificationMessageBank {

    static func line(
        kind: NudgeMessageKind,
        intensity: CoachNudgeIntensity,
        rotationIndex: Int
    ) -> String {
        let list = lines(for: kind, intensity: intensity)
        guard !list.isEmpty else { return "Chaque jour sans agir, tu payes avec ta propre vie." }
        let idx = abs(rotationIndex) % list.count
        return list[idx]
    }

    // MARK: - Routing kind + intensité

    private static func lines(for kind: NudgeMessageKind, intensity: CoachNudgeIntensity) -> [String] {
        let tier: Int = intensity == .soft ? 0 : (intensity == .firm ? 1 : 2)
        switch kind {
        case .morningIdentity:  return morningIdentity(tier: tier)
        case .middayRefocus:    return midday(tier: tier)
        case .eveningCritical:  return evening(tier: tier)
        case .lowActivity:      return lowActivity(tier: tier)
        case .antiPorn:         return antiPorn(tier: tier)
        case .successIdentity:  return successId(tier: tier)
        case .successStreak:    return successStreak(tier: tier)
        }
    }

    // MARK: - Contenus
    //
    // tier 0 (soft) → coût futur, prise de conscience
    // tier 1 (firm) → coût concret + identité qui se dégrade
    // tier 2 (hard) → coût terminal, dégradation permanente de l'identité

    private static func morningIdentity(tier: Int) -> [String] {
        let soft = [
            "Si tu sautes ce matin, tu entraînes la version de toi qui abandonne. Elle apprend vite.",
            "Dans 3 ans, tu te souviendras de ce matin — comme un début, ou comme un de plus que tu as laissé filer.",
            "L'inaction a un coût : il s'accumule en silence, il se rembourse en regret.",
            "Ce que tu évites ce matin repousse le jour où ta vie ressemble à ce que tu veux.",
            "Chaque fois que tu repousses, tu confirmes à ton cerveau que tu ne tiens pas ta parole.",
        ]
        let firm = [
            "Tu n'es pas fatigué. Tu évites la friction. Ces deux choses ne sont pas pareilles.",
            "Dans 1 an, le vrai coût de ce matin sera visible. Paie maintenant ou paie plus cher plus tard.",
            "L'identité que tu fuis ne disparaît pas. Elle t'attend dans le miroir le soir.",
            "Si ce n'est pas maintenant, note l'heure exacte à laquelle tu te choisis contre toi-même.",
        ]
        let hard = [
            "Chaque matin sabordé te rapproche de l'homme que tu redoutes de devenir. Pas d'une fraction — d'un pas.",
            "L'abandon matinal ne reste pas le matin. Il colonise le reste. Tu sais que c'est vrai.",
            "La douleur de regretter coûte toujours plus que la douleur d'agir. Toujours.",
        ]
        return tier == 0 ? soft : (tier == 1 ? (soft + firm) : (firm + hard))
    }

    private static func midday(tier: Int) -> [String] {
        let core = [
            "L'après-midi perdu ne se rachète pas. Il s'efface du capital. Combien en as-tu encore à brûler ?",
            "Pendant que tu dérives, la version que tu veux être attend. Elle ne t'attend pas indéfiniment.",
            "Chaque heure de dérive te coûte plus qu'une heure d'effort. Fais le calcul honnêtement.",
            "La distraction est une anesthésie. Elle soulage maintenant, elle facture en retard et en regret.",
        ]
        let extra = [
            "Si tu n'agis pas maintenant, quelle version de demain t'attends-tu à voir ?",
            "Le confort de midi devient l'inconfort de minuit. Tu connais ce schéma.",
        ]
        let hard = [
            "Chaque moment où tu choisis le scroll contre toi-même, tu payes en potentiel gaspillé — sans reçu, sans remboursement.",
        ]
        return tier == 0 ? (core + extra) : (tier == 1 ? (core + extra) : (core + extra + hard))
    }

    private static func evening(tier: Int) -> [String] {
        let core = [
            "Ce soir, soit tu peux regarder la journée en face, soit tu l'enterres. Un seul de ces choix a un coût.",
            "L'écart entre qui tu es et qui tu veux être se creuse exactement ce soir, pas demain.",
            "Ne pas finir ce soir confirme le schéma que tu tentes de briser.",
            "La frustration de ne pas avoir accompli dure plus longtemps que l'effort requis. Tu sais ça.",
        ]
        let firm = [
            "Si tu remets à demain ce soir, demain te renverra vers après-demain. Brise le schéma ici.",
            "Le vrai risque n'est pas de rater une habitude. C'est de devenir quelqu'un pour qui rater est normal.",
        ]
        return tier < 1 ? core : (core + firm)
    }

    private static func lowActivity(tier: Int) -> [String] {
        let core = [
            "Plusieurs jours d'inaction ne sont pas un repos. Ce sont des intérêts composés sur le regret.",
            "L'élan que tu perds prend deux fois plus de temps à reconstruire. Chaque jour compte double maintenant.",
            "Le vrai problème n'est pas les habitudes manquées. C'est qui tu deviens quand tu confirmes que tu ne tiens pas.",
            "Tu te souviens pourquoi tu as commencé ? Ce que tu évites te coûte exactement ça.",
        ]
        let hard = [
            "Dans 6 mois, cet abandon aura un nom, une forme, un visage — le tien, mais plus vieux et plus résigné.",
            "L'inaction prolongée ne reste pas neutre. Elle restructure ton identité en quelqu'un qui cède.",
        ]
        return tier == 2 ? (core + hard) : core
    }

    private static func antiPorn(tier: Int) -> [String] {
        let core = [
            "Ce que tu vas faire te coûte en clarté, en énergie, en respect de toi-même. Pose le téléphone.",
            "Chaque rechute confirme le schéma que tu tentes de briser. Elle le rend plus fort, pas toi.",
            "L'instant de soulagement vaut-il le poids de demain matin ? Tu connais la réponse.",
            "Stop. Ce n'est pas du plaisir — c'est une fuite. Et tout ce que tu fuis t'attend de l'autre côté.",
        ]
        let hard = [
            "Chaque rechute est une dette contre ton identité. Elle n'est pas effacée le lendemain.",
            "Le schéma ne s'arrête pas seul. Il s'arrête ici, maintenant, avec toi — pas plus tard.",
        ]
        return tier >= 1 ? (core + hard) : core
    }

    private static func successId(tier: Int) -> [String] {
        _ = tier
        return [
            "Tu as évité le coût aujourd'hui. Demain, l'élan est plus facile à garder qu'à reconstruire.",
            "Ce que tu viens de faire, tu ne peux plus le perdre. Continue.",
        ]
    }

    private static func successStreak(tier: Int) -> [String] {
        _ = tier
        return [
            "La série brise le schéma. Ne donne pas ce soir à l'ancienne version de toi ce qu'elle attend.",
            "L'élan coûte moins à maintenir qu'à relancer. Ne brise pas ce que tu viens de construire.",
        ]
    }
}
