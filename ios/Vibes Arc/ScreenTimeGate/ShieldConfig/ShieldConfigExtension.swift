//
//  ShieldConfigExtension.swift
//  ShieldConfig
//
//  Écran de blocage du Pare-feu vibratoire (Family Controls).
//  S'affiche quand l'utilisateur ouvre une app sélectionnée avant d'avoir
//  atteint 40% de ses habitudes du jour dans Vibes Arc.
//

import ManagedSettings
import ManagedSettingsUI
import UIKit

class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        vibesShield()
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        vibesShield()
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        vibesShield()
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        vibesShield()
    }

    private func vibesShield() -> ShieldConfiguration {
        ShieldConfiguration(
            backgroundColor: UIColor(red: 0.12, green: 0.07, blue: 0.30, alpha: 1.0),
            title: ShieldConfiguration.Label(
                text: "Pare-feu vibratoire",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "Fais d'abord tes habitudes Vibes Arc (40% du jour requis). Appuie sur « Vérifier mon taux » après avoir émis tes signaux.",
                color: .white.withAlphaComponent(0.85)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Vérifier mon taux",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor.systemPurple
        )
    }
}
