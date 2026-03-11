//
//  WidgetSharedStorage.swift
//  Vibes Arc
//
//  Shared UserDefaults (App Group) for widget deviceId.
//

import Foundation

enum WidgetSharedStorage {
    static let appGroupSuiteName = "group.com.vibesarc.shared"
    static let deviceIdKey = "widgetDeviceId"

    static var defaults: UserDefaults? {
        UserDefaults(suiteName: appGroupSuiteName)
    }

    /// Returns current deviceId; creates and stores a new UUID if absent.
    static func ensureDeviceId() -> String {
        guard let def = defaults else { return UUID().uuidString }
        if let existing = def.string(forKey: deviceIdKey) { return existing }
        let id = UUID().uuidString
        def.set(id, forKey: deviceIdKey)
        return id
    }

    /// Returns stored deviceId (nil if not yet set).
    static var deviceId: String? {
        defaults?.string(forKey: deviceIdKey)
    }
}
