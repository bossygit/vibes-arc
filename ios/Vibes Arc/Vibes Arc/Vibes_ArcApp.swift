//
//  Vibes_ArcApp.swift
//  Vibes Arc
//
//  Created by smartvision on 11/03/2026.
//

import SwiftUI

@main
struct Vibes_ArcApp: App {
    init() {
        _ = WidgetSharedStorage.ensureDeviceId()
        Task {
            // Replanifier tôt au lancement (skip si journée complète).
            await NotificationScheduler.refreshSchedule()
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
