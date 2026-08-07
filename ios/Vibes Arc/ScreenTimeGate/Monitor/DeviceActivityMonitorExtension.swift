//
//  DeviceActivityMonitorExtension.swift
//  Monitor
//
//  Applique le shield du Pare-feu vibratoire (iOS 26 : la sélection n'est plus
//  passée à startMonitoring — le shield se configure depuis l'extension monitor
//  via ManagedSettingsStore). Les tokens des apps sélectionnées sont partagés
//  par l'app principale via l'App Group.
//

import DeviceActivity
import ManagedSettings
import Foundation

class DeviceActivityMonitorExtension: DeviceActivityMonitor {

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        applyShield()
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        clearShield()
    }

    // MARK: - Application du shield

    private func applyShield() {
        guard let defaults = UserDefaults(suiteName: "group.com.vibesarc.shared"),
              let data = defaults.data(forKey: "shieldApplicationTokens"),
              let tokens = try? JSONDecoder().decode([ApplicationToken].self, from: data),
              !tokens.isEmpty else { return }

        let store = ManagedSettingsStore()
        store.shield.applications = Set(tokens)
    }

    private func clearShield() {
        let store = ManagedSettingsStore()
        store.shield.applications = []
    }
}
