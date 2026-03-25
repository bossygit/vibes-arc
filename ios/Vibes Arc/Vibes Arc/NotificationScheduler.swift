import Foundation
import UserNotifications

// Scheduler de notifications locales (offline).
// Rappels horaires 06:00–22:00 avec identifiants stables.

enum NotificationScheduler {
    private static let prefix = "vibes-arc-reminder-"
    private static let enabledKey = "vibes_arc_local_notifs_enabled"

    // Réutiliser l’App Group si dispo pour partager les réglages avec le widget au besoin.
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
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            return granted
        } catch {
            return false
        }
    }

    static func authorizationStatus() async -> UNAuthorizationStatus {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        return settings.authorizationStatus
    }

    /// Charge /api/widgets/v2 et retourne le nombre d'habitudes restantes aujourd'hui.
    /// Si l’appareil n’est pas lié ou pas d’habitudes, ça renvoie 0 via emptySummary.
    static func fetchTodayRemainingCount() async -> Int? {
        let deviceId = WidgetSharedStorage.ensureDeviceId()
        guard let url = URL(string: "https://app-opal-mu.vercel.app/api/widgets/v2?deviceId=\(deviceId)") else {
            return nil
        }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let decoded = try JSONDecoder().decode(V2SummaryLite.self, from: data)
            return decoded.todayRemaining.count
        } catch {
            return nil
        }
    }

    /// Planifie les rappels si activés et si la journée n’est pas complète.
    static func refreshSchedule() async {
        guard isEnabled else {
            print("[Notifications] disabled -> cancel")
            await cancelReminders()
            return
        }

        let status = await authorizationStatus()
        if status != .authorized && status != .provisional {
            print("[Notifications] not authorized (\(status.rawValue)) -> cancel")
            await cancelReminders()
            return
        }

        // Skip si journée complète (0 restant).
        if let remaining = await fetchTodayRemainingCount(), remaining == 0 {
            print("[Notifications] day complete (remaining=0) -> cancel")
            await cancelReminders()
            return
        }

        print("[Notifications] scheduling hourly reminders 06–22")
        await scheduleHourlyReminders()
    }

    static func scheduleHourlyReminders() async {
        let center = UNUserNotificationCenter.current()

        // Nettoyer nos notifs existantes avant de replanifier.
        await cancelReminders()

        for hour in 6...22 {
            let id = identifier(forHour: hour)

            var date = DateComponents()
            date.hour = hour
            date.minute = 0

            let content = UNMutableNotificationContent()
            content.title = "Vibes Arc"
            content.body = "Petit rappel : coche tes habitudes du jour."
            content.sound = .default

            // Récurrent quotidien à la même heure.
            let trigger = UNCalendarNotificationTrigger(dateMatching: date, repeats: true)
            let req = UNNotificationRequest(identifier: id, content: content, trigger: trigger)

            do {
                try await center.add(req)
            } catch {
                // On ignore individuellement pour ne pas bloquer l’ensemble.
                print("[Notifications] failed to add \(id): \(error)")
            }
        }
    }

    static func cancelReminders() async {
        let center = UNUserNotificationCenter.current()
        let pending = await center.pendingNotificationRequests()
        let ids = pending
            .map(\.identifier)
            .filter { $0.hasPrefix(prefix) }
        center.removePendingNotificationRequests(withIdentifiers: ids)
        if !ids.isEmpty {
            print("[Notifications] removed pending: \(ids.count)")
        }
    }

    static func debugListPending() async -> [String] {
        let pending = await UNUserNotificationCenter.current().pendingNotificationRequests()
        return pending.map(\.identifier).sorted()
    }

    private static func identifier(forHour hour: Int) -> String {
        String(format: "%@h%02d", prefix, hour)
    }
}

// MARK: - Minimal v2 models (lite)

private struct V2SummaryLite: Decodable {
    let todayRemaining: V2TodayRemaining
}

private struct V2TodayRemaining: Decodable {
    let count: Int
}

