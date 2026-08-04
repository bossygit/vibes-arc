//
//  SegmentIntendingService.swift
//  Vibes Arc
//
//  Client de l'API /api/chat (Vercel) — jeu Segment Intending
//  (Process #11, Esther Hicks). Le device doit être lié (onglet Liaison).
//  NB : tout passe par /api/chat (limite Vercel Hobby : 12 fonctions max).
//

import Foundation

enum SegmentIntendingError: LocalizedError {
    case notLinked
    case invalidResponse
    case server(Int, String)
    case transport(String)
    case decoding(String)

    var errorDescription: String? {
        switch self {
        case .notLinked:
            return "Ton appareil n'est pas encore lié. Va dans l'onglet Liaison pour lier ta session."
        case .invalidResponse:
            return "Réponse invalide du Guide Segment Intending."
        case .server(let code, let message):
            return "Erreur serveur (\(code)) : \(message)"
        case .transport(let message):
            return "Erreur réseau : \(message)"
        case .decoding(let message):
            return "Erreur de lecture : \(message)"
        }
    }
}

// MARK: - Modèles

struct SegmentDefinition: Identifiable, Hashable {
    let key: String
    let label: String
    let emoji: String
    var id: String { key }
}

struct SegmentIntendingEntry: Identifiable, Codable {
    let id: Int
    let date: String
    let segmentKey: String
    let segmentLabel: String
    let context: String?
    let intentions: [String]
    let chosenIntention: String?
    let outcome: String?
    let emotionalSetpoint: Int?
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, date, context, intentions, outcome
        case segmentKey = "segmentKey"
        case segmentLabel = "segmentLabel"
        case chosenIntention = "chosenIntention"
        case emotionalSetpoint = "emotionalSetpoint"
        case createdAt = "createdAt"
    }
}

struct IntentionsRequest: Encodable {
    struct Segment: Encodable {
        let segmentKey: String
        let segmentLabel: String
        let context: String?
        let emotionalSetpoint: Int?
    }
    let mode: String
    let action: String
    let deviceId: String
    let segment: Segment
}

struct SaveSegmentEntryRequest: Encodable {
    struct Entry: Encodable {
        let segmentKey: String
        let segmentLabel: String
        let context: String?
        let intentions: [String]
        let chosenIntention: String?
        let emotionalSetpoint: Int?
    }
    let mode: String
    let action: String
    let deviceId: String
    let entry: Entry
}

// MARK: - Service

actor SegmentIntendingService {
    static let shared = SegmentIntendingService()

    private let baseURL = URL(string: "https://app-opal-mu.vercel.app/api/chat")!
    private let session: URLSession
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    init(session: URLSession = .shared) {
        self.session = session
        self.encoder = JSONEncoder()
        self.decoder = JSONDecoder()
    }

    private var deviceId: String {
        WidgetSharedStorage.ensureDeviceId()
    }

    private func makeRequest(method: String) -> URLRequest {
        var req = URLRequest(url: baseURL)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.timeoutInterval = 60
        return req
    }

    private func mapError(data: Data, status: Int) -> SegmentIntendingError {
        let payload = try? decoder.decode([String: String].self, from: data)
        let message = payload?["error"] ?? payload?["details"] ?? String(data: data, encoding: .utf8) ?? "Erreur inconnue"
        if status == 403 { return .notLinked }
        return .server(status, message)
    }

    // MARK: GET / — historique

    func loadHistory() async throws -> [SegmentIntendingEntry] {
        var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "deviceId", value: deviceId)]
        var req = URLRequest(url: components.url!)
        req.httpMethod = "GET"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.timeoutInterval = 60

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: req)
        } catch {
            throw SegmentIntendingError.transport(error.localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else { throw SegmentIntendingError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else { throw mapError(data: data, status: http.statusCode) }

        struct HistoryResponse: Decodable { let entries: [SegmentIntendingEntry] }
        do {
            return try decoder.decode(HistoryResponse.self, from: data).entries
        } catch {
            throw SegmentIntendingError.decoding(error.localizedDescription)
        }
    }

    // MARK: POST /intentions

    func proposeIntentions(
        segmentKey: String,
        segmentLabel: String,
        context: String?,
        emotionalSetpoint: Int?
    ) async throws -> [String] {
        var req = makeRequest(method: "POST")
        let body = IntentionsRequest(
            mode: "segment-intending",
            action: "intentions",
            deviceId: deviceId,
            segment: .init(
                segmentKey: segmentKey,
                segmentLabel: segmentLabel,
                context: context?.isEmpty == true ? nil : context,
                emotionalSetpoint: emotionalSetpoint
            )
        )
        do {
            req.httpBody = try encoder.encode(body)
        } catch {
            throw SegmentIntendingError.decoding(error.localizedDescription)
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: req)
        } catch {
            throw SegmentIntendingError.transport(error.localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else { throw SegmentIntendingError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else { throw mapError(data: data, status: http.statusCode) }

        struct IntentionsResponse: Decodable { let intentions: [String] }
        do {
            return try decoder.decode(IntentionsResponse.self, from: data).intentions
        } catch {
            throw SegmentIntendingError.decoding(error.localizedDescription)
        }
    }

    // MARK: POST / — enregistrer

    func saveEntry(
        segmentKey: String,
        segmentLabel: String,
        context: String?,
        intentions: [String],
        chosenIntention: String?,
        emotionalSetpoint: Int?
    ) async throws {
        var req = makeRequest(method: "POST")
        let body = SaveSegmentEntryRequest(
            mode: "segment-intending",
            action: "save",
            deviceId: deviceId,
            entry: .init(
                segmentKey: segmentKey,
                segmentLabel: segmentLabel,
                context: context?.isEmpty == true ? nil : context,
                intentions: intentions,
                chosenIntention: chosenIntention,
                emotionalSetpoint: emotionalSetpoint
            )
        )
        do {
            req.httpBody = try encoder.encode(body)
        } catch {
            throw SegmentIntendingError.decoding(error.localizedDescription)
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: req)
        } catch {
            throw SegmentIntendingError.transport(error.localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else { throw SegmentIntendingError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else { throw mapError(data: data, status: http.statusCode) }
    }
}
