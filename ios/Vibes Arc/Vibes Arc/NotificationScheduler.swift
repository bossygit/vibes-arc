import Foundation
import UserNotifications

// Planificateur de notifications « coach » : créneaux + messages adaptatifs
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
        guard isEnabled else {
            print("[Notifications] disabled -> cancel")
            await cancelReminders()
            return
        }

        let status = await authorizationStatus()
        if status != .authorized && status != .provisional {
            print("[Notifications] not authorized -> cancel")
            await cancelReminders()
            return
        }

        guard let input = await WidgetV2NotificationLoader.loadContext() else {
            print("[Notifications] v2 load failed -> cancel")
            await cancelReminders()
            return
        }

        if input.todayRemainingCount == 0, input.todayTotalHabits > 0 {
            print("[Notifications] day complete -> cancel")
            await cancelReminders()
            return
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
