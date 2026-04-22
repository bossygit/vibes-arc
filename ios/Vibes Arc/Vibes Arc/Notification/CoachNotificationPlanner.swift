//
//  CoachNotificationPlanner.swift
//  Vibes Arc
//
//  Créneaux récurrents matin / midi / soir / nuit + contenu (banque ou IA).
//

import Foundation
import UserNotifications

enum CoachNotificationPlanner {
    private static let prefix = "vibes-arc-coach-"
    private static let title = "Vibes"

    private struct SlotDef {
        let slot: NudgeScheduleSlot
        let hour: Int
        let minute: Int
    }

    private static let defs: [SlotDef] = [
        .init(slot: .morning, hour: 7, minute: 0),
        .init(slot: .midday, hour: 13, minute: 0),
        .init(slot: .evening, hour: 19, minute: 0),
        .init(slot: .night, hour: 22, minute: 30),
    ]

    static var identifierPrefix: String { prefix }

    /// Replanifie les notifications coach (`vibes-arc-coach-*`).
    static func schedule(
        input: NudgeContextInput,
        computed: NudgeComputedContext,
        intensity: CoachNudgeIntensity
    ) async {
        let daySalt = Calendar.current.ordinality(of: .day, in: .year, for: Date()) ?? 1
        var defsToUse = defs
        if !CoachNudgeEscalation.antiRelapseEveningEnabled {
            defsToUse = defs.filter { $0.slot != .night }
        }

        let center = UNUserNotificationCenter.current()
        for d in defsToUse {
            var kind = CoachNudgeEngine.messageKind(for: d.slot, input: input, computed: computed)
            if d.slot == .night, !CoachNudgeEscalation.antiRelapseEveningEnabled {
                kind = .eveningCritical
            }
            var body = messageBody(kind: kind, intensity: intensity, daySalt: daySalt)
            if CoachNudgeEscalation.useAINotificationLine,
               let line = await CoachNudgeAIGenerator.fetchLine(
                slot: d.slot,
                state: computed.userState,
                timeBucket: bucket(for: d.slot),
                habitsStatus: input.habitsStatus,
                risk: computed.specialRisks,
                intensity: intensity
               ) {
                body = line
            }
            let id = "\(prefix)\(d.slot.rawValue)"
            var comp = DateComponents()
            comp.hour = d.hour
            comp.minute = d.minute
            let content = UNMutableNotificationContent()
            content.title = title
            content.body = body
            content.sound = .default
            let trigger = UNCalendarNotificationTrigger(dateMatching: comp, repeats: true)
            let req = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
            do {
                try await center.add(req)
            } catch {
                print("[CoachNotif] add \(id): \(error)")
            }
        }
    }

    private static func bucket(for slot: NudgeScheduleSlot) -> NudgeTimeBucket {
        switch slot {
        case .morning: return .morning
        case .midday: return .afternoon
        case .evening: return .evening
        case .night: return .night
        }
    }

    private static func messageBody(
        kind: NudgeMessageKind,
        intensity: CoachNudgeIntensity,
        daySalt: Int
    ) -> String {
        let rot = CoachNudgeEscalation.rotationIndex(daySalt: daySalt, kind: kind)
        return CoachNotificationMessageBank.line(
            kind: kind,
            intensity: intensity,
            rotationIndex: rot
        )
    }
}
