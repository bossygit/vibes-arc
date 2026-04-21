//
//  CoachChatViewModel.swift
//  Vibes Arc
//
//  État du chat Coach Vibes : messages, provider, envoi, reset, cache local.
//

import Foundation
internal import Combine

@MainActor
final class CoachChatViewModel: ObservableObject {

    // MARK: - État publié

    @Published private(set) var messages: [CoachMessage] = []
    @Published private(set) var isLoading: Bool = false
    @Published var provider: AIProvider {
        didSet { persistProvider() }
    }
    @Published var error: CoachError?
    @Published var infoMessage: String?
    @Published private(set) var isInitialLoading: Bool = false

    // MARK: - Dépendances

    private let service: CoachService
    private let defaults: UserDefaults

    // MARK: - Clés de persistance

    private static let providerKey = "coach.provider"
    private static let messagesKey = "coach.messages"
    private static let appGroupSuite = "group.com.vibesarc.shared"

    // MARK: - Init

    init(service: CoachService = .shared) {
        self.service = service
        self.defaults = UserDefaults(suiteName: Self.appGroupSuite) ?? .standard
        if let raw = defaults.string(forKey: Self.providerKey),
           let stored = AIProvider(rawValue: raw) {
            self.provider = stored
        } else {
            self.provider = .gemini
        }
        self.messages = Self.loadCachedMessages(defaults: defaults)
    }

    // MARK: - Actions publiques

    /// Récupère l'historique côté serveur (appelé à l'ouverture de l'onglet).
    func loadHistory() async {
        isInitialLoading = messages.isEmpty
        defer { isInitialLoading = false }
        do {
            let remote = try await service.loadHistory()
            self.messages = remote
            self.cacheMessages()
        } catch let err as CoachError {
            if case .notLinked = err {
                self.error = err
            } else {
                // Erreur non bloquante : on garde le cache local.
                print("coach history load failed: \(err)")
            }
        } catch {
            print("coach history load failed: \(error)")
        }
    }

    /// Envoie un message utilisateur et récupère la réponse du coach.
    func send(_ rawText: String) async {
        let text = rawText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !isLoading else { return }

        self.error = nil
        self.infoMessage = nil

        let userMessage = CoachMessage(role: .user, content: text, provider: provider)
        let history = messages
        messages.append(userMessage)
        cacheMessages()

        isLoading = true
        defer { isLoading = false }

        do {
            let reply = try await service.sendMessage(
                history: history,
                newUserMessage: text,
                provider: provider
            )
            messages.append(reply)
            cacheMessages()
        } catch let err as CoachError {
            self.error = err
        } catch {
            self.error = .transport(error.localizedDescription)
        }
    }

    /// Réessaie la dernière question utilisateur (utilisé par le bouton d'erreur).
    func retryLast() async {
        guard let lastUser = messages.reversed().first(where: { $0.role == .user }) else { return }
        if messages.last?.role == .user {
            messages.removeLast()
        }
        await send(lastUser.content)
    }

    /// Vide la conversation (DB + cache local).
    func reset() async {
        do {
            try await service.clearHistory()
            messages.removeAll()
            cacheMessages()
            infoMessage = "Conversation effacée."
        } catch let err as CoachError {
            self.error = err
        } catch {
            self.error = .transport(error.localizedDescription)
        }
    }

    /// Enregistre un message assistant comme insight `coaching_note`.
    func saveInsight(from message: CoachMessage) async {
        guard message.role == .assistant else { return }
        do {
            try await service.saveInsight(content: message.content)
            infoMessage = "Insight sauvegardé."
        } catch let err as CoachError {
            self.error = err
        } catch {
            self.error = .transport(error.localizedDescription)
        }
    }

    // MARK: - Persistance locale

    private func persistProvider() {
        defaults.set(provider.rawValue, forKey: Self.providerKey)
    }

    private func cacheMessages() {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(messages)
            defaults.set(data, forKey: Self.messagesKey)
        } catch {
            print("coach cache messages failed: \(error)")
        }
    }

    private static func loadCachedMessages(defaults: UserDefaults) -> [CoachMessage] {
        guard let data = defaults.data(forKey: messagesKey) else { return [] }
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode([CoachMessage].self, from: data)
        } catch {
            return []
        }
    }
}
