import Foundation
import UserNotifications

// Planificateur de notifications « coach » (app iOS uniquement) : quatre créneaux
// récurrents par jour (~7h, 13h, 19h, 22h30) — pas une notification « à chaque heure ».
// Les rappels / push du produit web (autre code) sont un flux séparé.
// (replanif à l’ouverture app, texte basé sur le dernier état connu v2).

enum NotificationScheduler {
    private static let legacyPrefix = "vibes-arc-reminder-"
    private static let enabledKey = "vibes_arc_local_notifs_enabled"

    private static var defaults: UserDefaults {
        UserDefaults(suiteName: WidgetSharedStorage.appGroupSuiteName) ?? .standard
    }

    static var isEnabled: Bool {
        get { defaults.bool(forKey: enabledKey) }
        set { defaults.set(newValue, forKey: enabledKey) }
    }

    /// Dernière explication d’écran (réglages Notifs) après `refreshSchedule()`.
    private(set) static var lastRescheduleStatus: String = ""

    static func requestAuthorization() async -> Bool {
        do {
            let center = UNUserNotificationCenter.current()
            return try await center.requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            return false
        }
    }

    static func authorizationStatus() async -> UNAuthorizationStatus {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        return settings.authorizationStatus
    }

    /// Rétrocompat : nombre d’habitudes restantes (pour l’UI).
    static func fetchTodayRemainingCount() async -> Int? {
        await WidgetV2NotificationLoader.todayRemainingCountOnly()
    }

    static func refreshSchedule() async {
        lastRescheduleStatus = ""

        guard isEnabled else {
            print("[Notifications] disabled -> cancel")
            lastRescheduleStatus = "Notifications coach désactivées."
            await cancelReminders()
            return
        }

        let status = await authorizationStatus()
        if status != .authorized && status != .provisional {
            print("[Notifications] not authorized -> cancel")
            lastRescheduleStatus = "Permission iOS : autorise les alertes pour cette app."
            await cancelReminders()
            return
        }

        let usedV2Fallback: Bool
        let input: NudgeContextInput
        if let loaded = await WidgetV2NotificationLoader.loadContext() {
            input = loaded
            usedV2Fallback = false
        } else {
            print("[Notifications] v2 load failed -> fallback context (4 créneaux quand même, messages génériques)")
            input = NudgeContextInput.fallbackWhenV2Unavailable()
            usedV2Fallback = true
        }

        if input.todayRemainingCount == 0, input.todayTotalHabits > 0 {
            print("[Notifications] day complete -> replan success-style lines; slots stay active for tomorrow")
        }

        let prevWeekly = CoachNudgeEscalation.lastSavedWeeklyRate()
        let computed = CoachNudgeEngine.fullComputed(input: input, lastWeeklyRate: prevWeekly)
        CoachNudgeEscalation.updateAfterContext(
            remaining: input.todayRemainingCount,
            totalHabits: max(input.todayTotalHabits, 1),
            weeklyRate: input.weeklyCompletionRate,
            userState: computed.userState
        )
        let intensity = CoachNudgeEscalation.resolvedIntensity(
            for: computed.userState,
            stateComputed: computed
        )

        print("[Notifications] coach slots (state=\(computed.userState.rawValue), I=\(intensity.rawValue))")
        await cancelReminders()
        await CoachNotificationPlanner.schedule(
            input: input,
            computed: computed,
            intensity: intensity
        )
        let after = await UNUserNotificationCenter.current().pendingNotificationRequests()
        let coachIds = after.filter { $0.identifier.hasPrefix(CoachNotificationPlanner.identifierPrefix) }
        print("[Notifications] replanif OK — coach pending: \(coachIds.count) [\(coachIds.map(\.identifier).sorted().joined(separator: ", "))]")

        if usedV2Fallback {
            lastRescheduleStatus = "Planification OK (hors-ligne) : l’API widgets n’a pas répondu — messages génériques. Ouvre l’app avec le réseau pour resynchroniser."
        } else {
            lastRescheduleStatus = "Planification OK, données du jour reçues (widgets v2)."
        }
        if coachIds.isEmpty {
            lastRescheduleStatus += " Aucun créneau en file : vérifie la console (erreur add) ou un bug iOS."
        }
    }

    static func cancelReminders() async {
        let center = UNUserNotificationCenter.current()
        let pending = await center.pendingNotificationRequests()
        let coachPrefix = CoachNotificationPlanner.identifierPrefix
        let ids = pending
            .map(\.identifier)
            .filter { $0.hasPrefix(legacyPrefix) || $0.hasPrefix(coachPrefix) }
        center.removePendingNotificationRequests(withIdentifiers: ids)
        if !ids.isEmpty {
            print("[Notifications] removed: \(ids.count) \(ids.joined(separator: ", "))")
        }
    }

    static func debugListPending() async -> [String] {
        let pending = await UNUserNotificationCenter.current().pendingNotificationRequests()
        return pending.map(\.identifier).sorted()
    }
}
