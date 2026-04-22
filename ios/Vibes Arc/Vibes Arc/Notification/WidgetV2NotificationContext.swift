//
//  WidgetV2NotificationContext.swift
//  Vibes Arc
//
//  Décodage complet (partie utile) de GET /api/widgets/v2 pour le moteur de notifications.
//

import Foundation

// MARK: - Enums (partagés moteur + banque)

enum NudgeHabitsStatus: String, Sendable, Codable {
    case completed
    case partiallyDone = "partially_done"
    case notStarted = "not_started"
}

enum NudgeChainStatus: String, Sendable, Codable {
    case broken
    case fragile
    case stable
    case strong
}

// MARK: - Réponse v2 (champs requis + optionnels pour compatibilité)

struct WidgetV2NotificationResponse: Decodable {
    let today: String?
    let streaks: V2StreaksBlock?
    let todayRemaining: V2TodayRemainingBlock
    let monthlyScore: V2MonthlyScore?
    let weeklyStats: V2WeeklyStatsBlock?
    let chain: V2ChainBlock?
}

struct V2StreaksBlock: Decodable {
    let longest: Int?
    let current: Int?
    let byHabit: [V2HabitStreak]?
}

struct V2HabitStreak: Decodable {
    let habitId: Int
    let name: String
    let current: Int
    let longest: Int
}

struct V2TodayRemainingBlock: Decodable {
    let count: Int
    let habits: [V2RemainingHabit]?
}

struct V2RemainingHabit: Decodable {
    let habitId: Int
    let name: String
    let type: String
}

struct V2MonthlyScore: Decodable {
    let score: Int
}

struct V2WeeklyStatsBlock: Decodable {
    let completionRate: Double
}

struct V2ChainBlock: Decodable {
    let length: Int
    let status: String
    let calendar: [V2ChainDay]?
}

struct V2ChainDay: Decodable {
    let date: String
    let completed: Bool
}

// MARK: - Contexte d’entrée du moteur nudge (après normalisation)

struct NudgeContextInput: Sendable {
    let todayISODate: String?
    let todayRemainingCount: Int
    let todayTotalHabits: Int
    let remainingHabits: [V2RemainingHabit]
    let weeklyCompletionRate: Double
    let chainStatus: NudgeChainStatus
    let chainLength: Int
    let calendar14: [V2ChainDay]?

    var habitsStatus: NudgeHabitsStatus {
        if todayRemainingCount == 0, todayTotalHabits > 0 { return .completed }
        if todayTotalHabits == 0, todayRemainingCount == 0 { return .completed }
        if todayRemainingCount < todayTotalHabits, todayTotalHabits > 0 { return .partiallyDone }
        return .notStarted
    }

    /// Quand GET `/api/widgets/v2` est indisponible : permet quand même de poser les 4 créneaux (messages banque / coach génériques).
    static func fallbackWhenV2Unavailable() -> NudgeContextInput {
        NudgeContextInput(
            todayISODate: nil,
            todayRemainingCount: 1,
            todayTotalHabits: 1,
            remainingHabits: [],
            weeklyCompletionRate: 0.5,
            chainStatus: .fragile,
            chainLength: 0,
            calendar14: nil
        )
    }

    static func from(response: WidgetV2NotificationResponse) -> NudgeContextInput {
        let rem = response.todayRemaining
        let byH = response.streaks?.byHabit ?? []
        let total: Int
        if !byH.isEmpty {
            total = byH.count
        } else {
            total = rem.habits?.count ?? 0
        }
        let finalTotal = total
        let rate = response.weeklyStats?.completionRate ?? 0.5
        let cStatus = NudgeChainStatus(rawValue: response.chain?.status ?? "fragile") ?? .fragile
        return NudgeContextInput(
            todayISODate: response.today,
            todayRemainingCount: rem.count,
            todayTotalHabits: finalTotal,
            remainingHabits: rem.habits ?? [],
            weeklyCompletionRate: rate,
            chainStatus: cStatus,
            chainLength: response.chain?.length ?? 0,
            calendar14: response.chain?.calendar
        )
    }
}

/// Charge la réponse v2 et construit le contexte nudge, ou `nil` en cas d’échec / résumé vide.
enum WidgetV2NotificationLoader {
    private static let base = "https://app-opal-mu.vercel.app/api/widgets/v2"

    static func loadContext() async -> NudgeContextInput? {
        let deviceId = WidgetSharedStorage.ensureDeviceId()
        guard let url = URL(string: "\(base)?deviceId=\(deviceId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? deviceId)") else {
            return nil
        }
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
                let snippet = String(data: data, encoding: .utf8).map { String($0.prefix(120)) } ?? ""
                print("[Nudge] v2 HTTP \(http.statusCode) \(snippet)")
                return nil
            }
            let decoded = try JSONDecoder().decode(WidgetV2NotificationResponse.self, from: data)
            return NudgeContextInput.from(response: decoded)
        } catch {
            print("[Nudge] v2 request/decode failed: \(error)")
            return nil
        }
    }

    static func todayRemainingCountOnly() async -> Int? {
        guard let ctx = await loadContext() else { return nil }
        return ctx.todayRemainingCount
    }
}
