//
//  CoachNudgeAIGenerator.swift
//  Vibes Arc
//
//  Option : une ligne générée par l’Edge Function `coach-chat/notification-line`.
//

import Foundation

enum CoachNudgeAIGenerator {

    private static let base = URL(string: "https://knpvbwlfdriavrebvzdy.supabase.co/functions/v1/coach-chat/notification-line")!

    /// Retourne une ligne générée, ou `nil` (échec / désactivé / cache hit manquant).
    static func fetchLine(
        slot: NudgeScheduleSlot,
        state: NudgeUserState,
        timeBucket: NudgeTimeBucket,
        habitsStatus: NudgeHabitsStatus,
        risk: NudgeSpecialRisk,
        intensity: CoachNudgeIntensity
    ) async -> String? {
        let day = ISO8601DateFormatter().string(from: Date()).prefix(10)
        let cacheKey = "coach_ai_line_\(day)_\(slot.rawValue)"
        let def = UserDefaults(suiteName: WidgetSharedStorage.appGroupSuiteName) ?? .standard
        if let cached = def.string(forKey: cacheKey), !cached.isEmpty {
            return cached
        }

        let deviceId = WidgetSharedStorage.ensureDeviceId()
        var req = URLRequest(url: base)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(CoachConfig.apiKey, forHTTPHeaderField: "X-API-Key")
        req.setValue("Bearer \(CoachConfig.supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        req.setValue(CoachConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.timeoutInterval = 12

        let body: [String: String] = [
            "device_id": deviceId,
            "state": state.rawValue,
            "time_of_day": timeBucket.rawValue,
            "habits_status": habitsStatus.rawValue,
            "risk": risk.rawValue,
            "intensity": intensityLabel(intensity),
            "slot": slot.rawValue,
            "motivation_profile": "pain_avoidance",
            "no_sugarcoat": "true",
        ]
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                return nil
            }
            struct R: Decodable { let line: String? }
            let decoded = try JSONDecoder().decode(R.self, from: data)
            guard let line = decoded.line?.trimmingCharacters(in: .whitespacesAndNewlines), !line.isEmpty else {
                return nil
            }
            def.set(line, forKey: cacheKey)
            return line
        } catch {
            print("[CoachNotif AI] \(error)")
            return nil
        }
    }

    private static func intensityLabel(_ i: CoachNudgeIntensity) -> String {
        switch i {
        case .soft: return "douce"
        case .firm: return "ferme"
        case .hard: return "intervention"
        }
    }
}
