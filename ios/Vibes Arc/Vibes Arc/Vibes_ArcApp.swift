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
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
