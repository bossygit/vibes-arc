//
//  WidgetSummary.swift
//  VibesArcWidgets
//
//  Codable models for /api/widgets/summary response.
//

import Foundation

struct WidgetSummaryResponse: Codable {
    let today: String
    let streaks: Streaks
    let todayRemaining: TodayRemaining
    let monthlyScore: MonthlyScore?
    let weeklyStats: WeeklyStats?
    let insight: Insight?
    let psychology: Psychology?
    let chain: Chain?
    let futureSelf: FutureSelf?
    let reward: Reward?
    let trigger: Trigger?
}

struct Streaks: Codable {
    let longest: Int
    let current: Int
    let byHabit: [StreakByHabit]?
}

struct StreakByHabit: Codable {
    let habitId: Int
    let name: String
    let current: Int
    let longest: Int
}

struct TodayRemaining: Codable {
    let count: Int
    let habits: [RemainingHabit]?
}

struct RemainingHabit: Codable {
    let habitId: Int
    let name: String
    let type: String
}

struct MonthlyScore: Codable {
    let month: String
    let score: Int
    let completedDays: Int
    let totalDaysWithHabits: Int
}

struct WeeklyStats: Codable {
    let weekStart: String
    let completionRate: Double
    let days: [DayRate]?
}

struct DayRate: Codable {
    let date: String
    let rate: Double
}

struct Insight: Codable {
    let title: String
    let message: String
}

struct Psychology: Codable {
    let level: Level
    let insight: PsychologyInsight
    let streakPressure: Bool
}

struct Level: Codable {
    let number: Int
    let name: String
}

struct PsychologyInsight: Codable {
    let title: String
    let message: String
    let tone: String?
    let emoji: String?
}

struct Chain: Codable {
    let length: Int
    let status: String
    let pressure: Bool
    let calendar: [ChainDay]?
}

struct ChainDay: Codable {
    let date: String
    let completed: Bool
}

struct FutureSelf: Codable {
    let nextLevel: NextLevel?
    let projectedStreak: ProjectedStreak?
    let message: FutureSelfMessage?
}

struct NextLevel: Codable {
    let name: String
    let daysRemaining: Int
}

struct ProjectedStreak: Codable {
    let in7days: Int
    let in30days: Int
}

struct FutureSelfMessage: Codable {
    let title: String
    let message: String
    let emoji: String?
}

struct Reward: Codable {
    let rewardType: String
    let rewardLevel: String
    let title: String
    let message: String
    let emoji: String
}

struct Trigger: Codable {
    let title: String
    let message: String
    let emoji: String
    let strength: String
}

// MARK: - Default placeholder (when no summary or unlinked)

extension Trigger {
    static let placeholder = Trigger(
        title: "Bienvenue",
        message: "Crée une habitude pour commencer.",
        emoji: "🌱",
        strength: "light"
    )
}

extension Trigger {
    static let openApp = Trigger(
        title: "Ouvre l'app",
        message: "Ouvre Vibes Arc pour activer le widget.",
        emoji: "📱",
        strength: "light"
    )
}

// MARK: - Preview

extension WidgetSummaryResponse {
    static var preview: WidgetSummaryResponse {
        WidgetSummaryResponse(
            today: ISO8601DateFormatter().string(from: Date()),
            streaks: Streaks(longest: 7, current: 3, byHabit: nil),
            todayRemaining: TodayRemaining(count: 2, habits: nil),
            monthlyScore: nil,
            weeklyStats: nil,
            insight: nil,
            psychology: nil,
            chain: Chain(length: 8, status: "stable", pressure: true, calendar: nil),
            futureSelf: nil,
            reward: Reward(rewardType: "habit_completion", rewardLevel: "low", title: "Bien joué", message: "Un pas de plus.", emoji: "🔥"),
            trigger: Trigger(title: "Ne la casse pas", message: "Ta chaîne de 8 jours a besoin d'aujourd'hui.", emoji: "🔥", strength: "strong")
        )
    }
}
