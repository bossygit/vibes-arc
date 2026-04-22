//
//  CoachNudgeEscalation.swift
//  Vibes Arc
//
//  Intensité 0…2, suivi du taux hebdo, jours sans complétion, anti-répétition.
//

import Foundation

enum CoachNudgeIntensity: Int, Sendable, Codable, CaseIterable {
    case soft = 0
    case firm = 1
    case hard = 2
}

enum NudgeIntensityMode: String, Sendable, Codable, CaseIterable, Hashable {
    case soft
    case auto
    case firm
}

enum CoachNudgeEscalation {
    private static var defaults: UserDefaults {
        UserDefaults(suiteName: WidgetSharedStorage.appGroupSuiteName) ?? .standard
    }

    private enum K {
        static let intensity = "coach_notif_intensity"
        static let lastWeeklyRate = "coach_notif_last_weekly_rate"
        static let consecutiveIncomplete = "coach_notif_consecutive_incomplete"
        static let lastCheckDay = "coach_notif_last_check_day"
        static let goodStreak = "coach_notif_good_streak"
        static let lastMessageHash = "coach_notif_last_msg_hash"
    }

    // MARK: - Préférences

    static var userMode: NudgeIntensityMode {
        get {
            let s = defaults.string(forKey: "coach_notif_intensity_mode") ?? "auto"
            return NudgeIntensityMode(rawValue: s) ?? .auto
        }
        set { defaults.set(newValue.rawValue, forKey: "coach_notif_intensity_mode") }
    }

    static var antiRelapseEveningEnabled: Bool {
        get {
            if defaults.object(forKey: "coach_notif_anti_relapse") == nil { return true }
            return defaults.bool(forKey: "coach_notif_anti_relapse")
        }
        set { defaults.set(newValue, forKey: "coach_notif_anti_relapse") }
    }

    static var useAINotificationLine: Bool {
        get { defaults.bool(forKey: "coach_notif_use_ai_line") }
        set { defaults.set(newValue, forKey: "coach_notif_use_ai_line") }
    }

    // MARK: - Mise à jour (appel à chaque replanif)

    static func updateAfterContext(
        remaining: Int,
        totalHabits: Int,
        weeklyRate: Double,
        userState: NudgeUserState
    ) {
        let cal = Calendar.current
        let dayStart = cal.startOfDay(for: Date())
        let ymd = String(format: "%04d-%02d-%02d",
            cal.component(.year, from: dayStart),
            cal.component(.month, from: dayStart),
            cal.component(.day, from: dayStart))

        if let last = defaults.object(forKey: K.lastWeeklyRate) as? Double {
            if (last - weeklyRate) >= 0.20 { bumpIntensity() }
        }
        defaults.set(weeklyRate, forKey: K.lastWeeklyRate)

        guard totalHabits > 0 else { return }

        if remaining == 0 {
            var g = defaults.integer(forKey: K.goodStreak) + 1
            g = min(g, 10_000)
            defaults.set(g, forKey: K.goodStreak)
            defaults.set(0, forKey: K.consecutiveIncomplete)
            defaults.set(ymd, forKey: K.lastCheckDay)
            if g >= 3, userState == .aligned { lowerIntensity() }
        } else {
            defaults.set(0, forKey: K.goodStreak)
            if defaults.string(forKey: K.lastCheckDay) != ymd {
                let c = defaults.integer(forKey: K.consecutiveIncomplete) + 1
                defaults.set(c, forKey: K.consecutiveIncomplete)
                defaults.set(ymd, forKey: K.lastCheckDay)
            }
            if userState == .droppingOff || defaults.integer(forKey: K.consecutiveIncomplete) >= 2 {
                bumpIntensity()
            }
        }
    }

    static func effectiveCap() -> CoachNudgeIntensity? {
        switch userMode {
        case .soft: return .soft
        case .firm: return .hard
        case .auto: return nil
        }
    }

    static func resolvedIntensity(
        for state: NudgeUserState,
        stateComputed: NudgeComputedContext
    ) -> CoachNudgeIntensity {
        let level = max(0, min(2, defaults.integer(forKey: K.intensity)))
        var raw = CoachNudgeIntensity(rawValue: level) ?? .soft
        if state == .droppingOff { raw = .hard }
        if state == .atRisk, raw.rawValue < CoachNudgeIntensity.firm.rawValue { raw = .firm }
        if stateComputed.specialRisks == .pornRisk, raw.rawValue < CoachNudgeIntensity.firm.rawValue { raw = .firm }
        if let cap = effectiveCap() {
            raw = CoachNudgeIntensity(rawValue: min(raw.rawValue, cap.rawValue)) ?? cap
        }
        return raw
    }

    static func rotationIndex(daySalt: Int, kind: NudgeMessageKind) -> Int {
        let h = defaults.integer(forKey: K.lastMessageHash)
        return abs((daySalt &* 13) &+ kind.hashValue &+ h) % 10_007
    }

    static func markMessageUsed(_ kind: NudgeMessageKind, index: Int) {
        let h = kind.hashValue ^ (index * 31)
        defaults.set(h, forKey: K.lastMessageHash)
    }

    private static func bumpIntensity() {
        let v = min(2, max(0, defaults.integer(forKey: K.intensity)) + 1)
        defaults.set(v, forKey: K.intensity)
    }

    private static func lowerIntensity() {
        let v = max(0, (defaults.object(forKey: K.intensity) as? Int ?? 0) - 1)
        defaults.set(v, forKey: K.intensity)
    }

    /// Taux hebdo précédent (avant la dernière écriture dans `updateAfterContext`).
    static func lastSavedWeeklyRate() -> Double? {
        defaults.object(forKey: K.lastWeeklyRate) as? Double
    }
}
