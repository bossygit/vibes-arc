//
//  ScreenTimeGate.swift
//  Vibes Arc
//
//  Pare-feu vibratoire (pattern Duolingo via Family Controls) :
//  les apps sélectionnées sont bloquées tant que le taux d'habitudes du jour
//  est < 40%. Le shield système (extensions ShieldConfig/ShieldAction) affiche
//  l'écran Vibes Arc et vérifie le taux via l'API avant de débloquer.
//

import FamilyControls
import DeviceActivity
import Observation
import SwiftUI

// MARK: - Modèle

@Observable
@MainActor
final class ScreenTimeGateModel {
    var authorizationStatus: AuthorizationStatus = .notDetermined
    var selection = FamilyActivitySelection()
    var isMonitoring = false
    var dailyRate: Int? = nil
    var dailyCompleted = 0
    var dailyTotal = 0
    var threshold = 40

    private let center = DeviceActivityCenter()
    private let defaults = UserDefaults(suiteName: "group.com.vibesarc.shared")

    private static let selectionKey = "shieldSelection"
    private static let enabledKey = "shieldEnabled"
    private static let thresholdKey = "shieldThreshold"

    init() {
        loadState()
    }

    // MARK: - Autorisation Screen Time

    var isAuthorized: Bool {
        authorizationStatus == .approved
    }

    func refreshAuthorization() {
        authorizationStatus = AuthorizationCenter.shared.authorizationStatus
    }

    func requestAuthorization() async {
        do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        } catch {
            // L'utilisateur doit approuver dans Réglages > Temps d'écran
        }
        refreshAuthorization()
    }

    // MARK: - Sélection + monitoring

    private func loadState() {
        refreshAuthorization()
        if let data = defaults?.data(forKey: Self.selectionKey),
           let saved = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
            selection = saved
        }
        isMonitoring = defaults?.bool(forKey: Self.enabledKey) ?? false
        threshold = defaults?.integer(forKey: Self.thresholdKey) == 0
            ? 40
            : defaults!.integer(forKey: Self.thresholdKey)
    }

    func saveSelection(_ newSelection: FamilyActivitySelection) {
        selection = newSelection
        if let data = try? JSONEncoder().encode(newSelection) {
            defaults?.set(data, forKey: Self.selectionKey)
        }
        // Tokens pour l'extension monitor (iOS 26 : le shield se configure via ManagedSettingsStore)
        if let tokens = try? JSONEncoder().encode(Array(newSelection.applicationTokens)) {
            defaults?.set(tokens, forKey: "shieldApplicationTokens")
        }
        applyMonitoring()
    }

    func setMonitoringEnabled(_ enabled: Bool) {
        isMonitoring = enabled
        defaults?.set(enabled, forKey: Self.enabledKey)
        applyMonitoring()
    }

    func setThreshold(_ value: Int) {
        threshold = value
        defaults?.set(value, forKey: Self.thresholdKey)
    }

    private func applyMonitoring() {
        guard isMonitoring, !selection.applications.isEmpty else {
            center.stopMonitoring([.vibesGate])
            return
        }

        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: 0, minute: 0),
            intervalEnd: DateComponents(hour: 23, minute: 59),
            repeats: true
        )

        do {
            // iOS 26 : la sélection n'est plus passée ici — l'extension monitor
            // lit les tokens partagés et applique ManagedSettingsStore.shield.
            try center.startMonitoring(
                .vibesGate,
                during: schedule,
                events: [:]
            )
        } catch {
            // Monitoring déjà actif ou erreur système — silencieux
        }
    }

    // MARK: - Taux du jour (API)

    func refreshDailyRate() async {
        guard let deviceId = defaults?.string(forKey: "widgetDeviceId"),
              let url = URL(string: "https://app-opal-mu.vercel.app/api/chat") else {
            dailyRate = nil
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30
        request.httpBody = try? JSONSerialization.data(withJSONObject: [
            "mode": "daily-progress",
            "deviceId": deviceId,
        ])

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                dailyRate = nil
                return
            }
            struct Response: Decodable {
                let completed: Int
                let total: Int
                let rate: Int
                let threshold: Int
            }
            if let decoded = try? JSONDecoder().decode(Response.self, from: data) {
                dailyCompleted = decoded.completed
                dailyTotal = decoded.total
                dailyRate = decoded.rate
                threshold = decoded.threshold
                setThreshold(decoded.threshold)
            }
        } catch {
            dailyRate = nil
        }
    }
}

extension DeviceActivityName {
    static let vibesGate = Self("vibes-gate")
}

// MARK: - Apps suggérées (à sélectionner dans le picker système)

struct SuggestedBlockedApp: Identifiable {
    let id: String
    let name: String
    let icon: String

    static let all: [SuggestedBlockedApp] = [
        SuggestedBlockedApp(id: "whatsapp", name: "WhatsApp", icon: "💬"),
        SuggestedBlockedApp(id: "whatsapp-business", name: "WhatsApp Business", icon: "🏢"),
        SuggestedBlockedApp(id: "tiktok", name: "TikTok", icon: "🎵"),
        SuggestedBlockedApp(id: "youtube", name: "YouTube", icon: "▶️"),
        SuggestedBlockedApp(id: "x", name: "X (Twitter)", icon: "🐦"),
        SuggestedBlockedApp(id: "instagram", name: "Instagram", icon: "📸"),
    ]
}
