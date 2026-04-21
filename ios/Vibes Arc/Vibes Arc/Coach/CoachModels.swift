//
//  CoachModels.swift
//  Vibes Arc
//
//  Modèles partagés pour l'onglet Coach (chat IA branché sur l'Edge Function
//  Supabase `coach-chat`).
//

import Foundation

// MARK: - Rôles & providers

enum CoachRole: String, Codable {
    case user
    case assistant
}

enum AIProvider: String, Codable, CaseIterable, Identifiable {
    case gemini
    case groq

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .gemini: return "Gemini"
        case .groq: return "Groq"
        }
    }
}

// MARK: - Modèle UI

struct CoachMessage: Identifiable, Codable, Equatable {
    let id: UUID
    let role: CoachRole
    var content: String
    let timestamp: Date
    var provider: AIProvider?

    init(id: UUID = UUID(),
         role: CoachRole,
         content: String,
         timestamp: Date = Date(),
         provider: AIProvider? = nil) {
        self.id = id
        self.role = role
        self.content = content
        self.timestamp = timestamp
        self.provider = provider
    }
}

// MARK: - DTOs réseau

struct CoachChatRequest: Encodable {
    let device_id: String
    let messages: [WireMessage]
    let provider: AIProvider
    let reset: Bool?

    struct WireMessage: Encodable {
        let role: CoachRole
        let content: String
    }
}

struct CoachChatResponse: Decodable {
    let reply: String
    let provider: AIProvider?
    let message_id: Int?
}

struct CoachHistoryResponse: Decodable {
    struct Row: Decodable {
        let id: Int
        let role: CoachRole
        let content: String
        let provider: String?
        let created_at: String
    }
    let messages: [Row]
}

struct CoachErrorPayload: Decodable {
    let error: String?
    let detail: String?
}

// MARK: - Prompts suggérés (iso web)

struct CoachSuggestion: Identifiable {
    let id = UUID()
    let emoji: String
    let text: String
}

enum CoachSuggestions {
    static let all: [CoachSuggestion] = [
        CoachSuggestion(emoji: "🫀", text: "Je me sens anxieux aujourd'hui, aide-moi"),
        CoachSuggestion(emoji: "🔥", text: "Comment rester motivé aujourd'hui ?"),
        CoachSuggestion(emoji: "🚗", text: "Aide-moi à manifester mon KIA Sportage !"),
        CoachSuggestion(emoji: "🎯", text: "Analyse mes habitudes et donne-moi des conseils"),
        CoachSuggestion(emoji: "✨", text: "Aide-moi à entrer dans le Vortex"),
        CoachSuggestion(emoji: "💪", text: "J'ai du mal à tenir mes habitudes, aide-moi"),
        CoachSuggestion(emoji: "🧒", text: "Je me sens en mode auto-sabotage"),
        CoachSuggestion(emoji: "📊", text: "Donne-moi un bilan complet de ma progression")
    ]
}
