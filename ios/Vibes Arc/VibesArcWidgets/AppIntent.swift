//
//  AppIntent.swift
//  VibesArcWidgets
//
//  Created by smartvision on 11/03/2026.
//

import AppIntents
import WidgetKit

/// Minimal configuration intent (content is driven by API summary).
struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Vibes Arc" }
    static var description: IntentDescription { "Affiche ton rappel d'habitudes." }
}
