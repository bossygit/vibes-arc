//
//  ShieldActionExtension.swift
//  ShieldAction
//
//  Action du bouton « Vérifier mon taux » du Pare-feu vibratoire.
//  Interroge l'API Vibes Arc (daily-progress) : si le taux d'habitudes du jour
//  est ≥ 40%, l'app est débloquée (.close). Sinon, elle reste bloquée (.none).
//

import ManagedSettings
import Foundation

class ShieldActionExtension: ShieldActionDelegate {

    override func handle(
        action: ShieldAction,
        for application: ApplicationToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        route(action, completionHandler: completionHandler)
    }

    override func handle(
        action: ShieldAction,
        for webDomain: WebDomainToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        route(action, completionHandler: completionHandler)
    }

    override func handle(
        action: ShieldAction,
        for category: ActivityCategoryToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        route(action, completionHandler: completionHandler)
    }

    private func route(
        _ action: ShieldAction,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        switch action {
        case .primaryButtonPressed:
            // Vérifie le taux du jour auprès de Vibes Arc
            Task {
                let rate = await VibesRateFetcher.currentRate()
                completionHandler(rate >= 40 ? .close : .none)
            }
        case .secondaryButtonPressed:
            completionHandler(.defer)
        @unknown default:
            completionHandler(.close)
        }
    }
}

/// Interroge /api/chat mode 'daily-progress' (même App Group que l'app).
enum VibesRateFetcher {
    static let threshold = 40

    static func currentRate() async -> Int {
        guard let defaults = UserDefaults(suiteName: "group.com.vibesarc.shared"),
              let deviceId = defaults.string(forKey: "widgetDeviceId"),
              let url = URL(string: "https://app-opal-mu.vercel.app/api/chat") else { return 0 }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 20
        request.httpBody = try? JSONSerialization.data(withJSONObject: [
            "mode": "daily-progress",
            "deviceId": deviceId,
        ])

        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            struct Response: Decodable {
                let rate: Int
            }
            return (try? JSONDecoder().decode(Response.self, from: data))?.rate ?? 0
        } catch {
            return 0
        }
    }
}
