//
//  CoachNudgeState.swift
//  Vibes Arc
//
//  Moteur d’état : aligned / unstable / at_risk / dropping_off, risques, type de message.
//

import Foundation

// MARK: - États et risques (plan)

enum NudgeUserState: String, Sendable, Codable {
    case aligned
    case unstable
    case atRisk = "at_risk"
    case droppingOff = "dropping_off"
}

enum NudgeTimeBucket: String, Sendable, Codable {
    case morning
    case afternoon
    case evening
    case night
}

enum NudgeSpecialRisk: String, Sendable, Codable {
    case none
    case pornRisk = "porn_risk"
    case motivationDrop = "motivation_drop"
}

/// Type de contenu (banque de messages)
enum NudgeMessageKind: String, Sendable, Hashable, CaseIterable {
    case morningIdentity
    case middayRefocus
    case eveningCritical
    case lowActivity
    case antiPorn
    case successIdentity
    case successStreak
}

struct NudgeComputedContext: Sendable {
    var userState: NudgeUserState
    var specialRisks: NudgeSpecialRisk
    var motivationDropFlag: Bool
    var hasIncompleteStopHabit: Bool
    var pornKeywordRisk: Bool
}

enum CoachNudgeEngine {

    // Mots-clés (insensible à la casse) — habitude "critique" restée incomplète le soir
    private static let pornKeywords: [String] = ["porn", "fap", "porno", "masturb", "urolog"]

    // MARK: - Time bucket (fuseau local)

    static func timeBucket(from date: Date = Date(), calendar: Calendar = .current) -> NudgeTimeBucket {
        let h = calendar.component(.hour, from: date)
        switch h {
        case 5..<12: return .morning
        case 12..<17: return .afternoon
        case 17..<22: return .evening
        default: return .night
        }
    }

    // MARK: - userState (règles du plan)

    static func computeUserState(
        input: NudgeContextInput,
        lastWeeklyRate: Double?
    ) -> (state: NudgeUserState, motivationDrop: Bool) {
        let w = input.weeklyCompletionRate
        let chain = input.chainStatus
        let rem = input.todayRemainingCount
        let total = max(input.todayTotalHabits, 1)

        var motivationDrop = false
        if let last = lastWeeklyRate, (last - w) >= 0.20 { motivationDrop = true }
        if input.chainLength < 2 && w < 0.4 { motivationDrop = true }

        if rem == 0 { return (.aligned, motivationDrop) }

        if w < 0.35 || (chain == .broken && rem > 0) || hasSparseActivity(input.calendar14) {
            return (.droppingOff, motivationDrop)
        }

        if rem > 0, w < 0.50, chain == .fragile {
            return (.atRisk, motivationDrop)
        }
        if rem > 0, w < 0.50, chain == .broken {
            return (.atRisk, motivationDrop)
        }
        if rem > 0, w < 0.50 { return (.atRisk, motivationDrop) }

        if w >= 0.75, (chain == .stable || chain == .strong) {
            return (rem < total ? .unstable : .aligned, motivationDrop)
        }
        if rem < total, (chain == .fragile || chain == .stable), w >= 0.40 && w < 0.75 { return (.unstable, motivationDrop) }
        if rem == 1, rem < total { return (.unstable, motivationDrop) }
        if rem < total, w < 0.75 { return (.unstable, motivationDrop) }
        return (.unstable, motivationDrop)
    }

    private static func hasSparseActivity(_ cal: [V2ChainDay]?) -> Bool {
        guard let c = cal, c.count >= 3 else { return false }
        let tail = c.suffix(3)
        let done = tail.filter(\.completed).count
        return done == 0
    }

    // MARK: - risques

    static func pornStyleRisk(remaining: [V2RemainingHabit]) -> Bool {
        for h in remaining {
            let s = h.name.lowercased()
            if pornKeywords.contains(where: { s.contains($0) }) { return true }
            if h.type == "stop" { return true }
        }
        return false
    }

    static func fullComputed(
        input: NudgeContextInput,
        lastWeeklyRate: Double?
    ) -> NudgeComputedContext {
        let comp = computeUserState(input: input, lastWeeklyRate: lastWeeklyRate)
        let pornK = pornStyleRisk(remaining: input.remainingHabits)
        var risk: NudgeSpecialRisk = .none
        if pornK, input.todayRemainingCount > 0 { risk = .pornRisk }
        else if comp.motivationDrop { risk = .motivationDrop }
        return NudgeComputedContext(
            userState: comp.state,
            specialRisks: risk,
            motivationDropFlag: comp.motivationDrop,
            hasIncompleteStopHabit: input.remainingHabits.contains { $0.type == "stop" },
            pornKeywordRisk: pornK
        )
    }

    // MARK: - Choisit le "kind" de message pour un créneau planifié (slot), pas l’heure actuelle

    static func messageKind(
        for slot: NudgeScheduleSlot,
        input: NudgeContextInput,
        computed: NudgeComputedContext
    ) -> NudgeMessageKind {
        let rem = input.todayRemainingCount
        let st = computed.userState
        let eveningOrNight: Bool = { slot == .evening || slot == .night }()

        // Priorité 1 : zone critique soir / nuit + reste + risque porno / stop non fait
        if eveningOrNight, rem > 0, computed.pornKeywordRisk {
            return .antiPorn
        }

        switch slot {
        case .night:
            if rem == 0 { return .successIdentity }
            if st == .droppingOff || st == .atRisk { return .lowActivity }
            return .eveningCritical
        case .evening:
            if rem == 0, input.chainStatus == .strong {
                return .successStreak
            }
            if rem == 0 { return .successIdentity }
            if st == .droppingOff { return .lowActivity }
            if st == .atRisk || st == .unstable { return .eveningCritical }
            return .eveningCritical
        case .midday:
            if rem == 0 { return .successStreak }
            return .middayRefocus
        case .morning:
            if rem == 0, input.habitsStatus == .completed { return .successStreak }
            return .morningIdentity
        }
    }
}

// MARK: - Créneaux planifiés (heures figées côté planner)

enum NudgeScheduleSlot: String, Sendable, CaseIterable, Codable {
    case morning
    case midday
    case evening
    case night
}

