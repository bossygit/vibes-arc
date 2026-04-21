//
//  CoachService.swift
//  Vibes Arc
//
//  Client réseau de l'Edge Function Supabase `coach-chat` + insights.
//

import Foundation

enum CoachError: LocalizedError, Equatable {
    case notLinked
    case invalidResponse
    case server(Int, String)
    case providerFailure(String)
    case transport(String)
    case decoding(String)

    var errorDescription: String? {
        switch self {
        case .notLinked:
            return "Ton appareil n'est pas encore lié. Va dans l'onglet Liaison pour lier ta session."
        case .invalidResponse:
            return "Réponse invalide du coach."
        case .server(let code, let message):
            return "Erreur serveur (\(code)) : \(message)"
        case .providerFailure(let message):
            return "Le coach IA n'a pas répondu : \(message)"
        case .transport(let message):
            return "Erreur réseau : \(message)"
        case .decoding(let message):
            return "Erreur de lecture : \(message)"
        }
    }
}

actor CoachService {
    static let shared = CoachService()

    private let session: URLSession
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder
    private let isoFormatter: ISO8601DateFormatter

    init(session: URLSession = .shared) {
        self.session = session
        self.encoder = JSONEncoder()
        self.decoder = JSONDecoder()
        let fmt = ISO8601DateFormatter()
        fmt.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        self.isoFormatter = fmt
    }

    // MARK: - Helpers

    private var deviceId: String {
        WidgetSharedStorage.ensureDeviceId()
    }

    private func authorizedRequest(url: URL, method: String) -> URLRequest {
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(CoachConfig.apiKey, forHTTPHeaderField: "X-API-Key")
        req.setValue("Bearer \(CoachConfig.supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        req.setValue(CoachConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.timeoutInterval = 60
        return req
    }

    private func mapError(data: Data, status: Int) -> CoachError {
        let payload = try? decoder.decode(CoachErrorPayload.self, from: data)
        let message = payload?.error ?? payload?.detail ?? String(data: data, encoding: .utf8) ?? "Erreur inconnue"
        switch status {
        case 403:
            return .notLinked
        case 502:
            return .providerFailure(message)
        default:
            return .server(status, message)
        }
    }

    // MARK: - POST /coach-chat

    func sendMessage(
        history: [CoachMessage],
        newUserMessage: String,
        provider: AIProvider,
        reset: Bool = false
    ) async throws -> CoachMessage {
        let wire = history
            .filter { $0.role == .user || $0.role == .assistant }
            .map { CoachChatRequest.WireMessage(role: $0.role, content: $0.content) }
        + [CoachChatRequest.WireMessage(role: .user, content: newUserMessage)]

        let body = CoachChatRequest(
            device_id: deviceId,
            messages: Array(wire.suffix(20)),
            provider: provider,
            reset: reset ? true : nil
        )

        var request = authorizedRequest(url: CoachConfig.baseURL, method: "POST")
        do {
            request.httpBody = try encoder.encode(body)
        } catch {
            throw CoachError.decoding(error.localizedDescription)
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw CoachError.transport(error.localizedDescription)
        }

        guard let http = response as? HTTPURLResponse else {
            throw CoachError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            throw mapError(data: data, status: http.statusCode)
        }

        do {
            let payload = try decoder.decode(CoachChatResponse.self, from: data)
            return CoachMessage(
                role: .assistant,
                content: payload.reply,
                timestamp: Date(),
                provider: payload.provider ?? provider
            )
        } catch {
            throw CoachError.decoding(error.localizedDescription)
        }
    }

    // MARK: - GET /coach-chat/history

    func loadHistory(limit: Int = 50) async throws -> [CoachMessage] {
        var components = URLComponents(url: CoachConfig.baseURL.appendingPathComponent("history"),
                                       resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "device_id", value: deviceId),
            URLQueryItem(name: "limit", value: String(limit))
        ]
        guard let url = components.url else { throw CoachError.invalidResponse }

        let request = authorizedRequest(url: url, method: "GET")

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw CoachError.transport(error.localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else {
            throw CoachError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            throw mapError(data: data, status: http.statusCode)
        }

        do {
            let payload = try decoder.decode(CoachHistoryResponse.self, from: data)
            return payload.messages.map { row in
                CoachMessage(
                    role: row.role,
                    content: row.content,
                    timestamp: isoFormatter.date(from: row.created_at) ?? Date(),
                    provider: AIProvider(rawValue: row.provider ?? "")
                )
            }
        } catch {
            throw CoachError.decoding(error.localizedDescription)
        }
    }

    // MARK: - DELETE /coach-chat/history

    func clearHistory() async throws {
        var components = URLComponents(url: CoachConfig.baseURL.appendingPathComponent("history"),
                                       resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "device_id", value: deviceId)]
        guard let url = components.url else { throw CoachError.invalidResponse }

        let request = authorizedRequest(url: url, method: "DELETE")
        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw CoachError.transport(error.localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else {
            throw CoachError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            throw mapError(data: data, status: http.statusCode)
        }
    }

    // MARK: - POST /coach-chat/insights (parité web)

    /// Persiste un insight issu du chat (type "coaching_note" par défaut).
    /// L'Edge Function résout elle-même `device_id -> user_id`, donc aucun
    /// appel supplémentaire n'est nécessaire côté client.
    func saveInsight(content: String, insightType: String = "coaching_note") async throws {
        let url = CoachConfig.baseURL.appendingPathComponent("insights")
        var request = authorizedRequest(url: url, method: "POST")

        let body: [String: Any] = [
            "device_id": deviceId,
            "insight_type": insightType,
            "content": content
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw CoachError.transport(error.localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else { throw CoachError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            throw mapError(data: data, status: http.statusCode)
        }
    }
}
