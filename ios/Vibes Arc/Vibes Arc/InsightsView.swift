//
//  InsightsView.swift
//  Vibes Arc
//
//  Vibes AI — analyse intelligente des données (habitudes, émotions, désirs,
//  accusateurs). Les données sont agrégées côté serveur (/api/chat mode
//  'insights') puis analysées par gemma4 (Ollama Cloud) qui renvoie un JSON
//  structuré d'insights. Le device doit être lié (onglet Liaison).
//

import SwiftUI

// MARK: - Modèles

struct VibesInsight: Codable, Identifiable, Equatable {
    let title: String
    let description: String
    let category: String
    let severity: String
    let emoji: String

    var id: String { title + description }

    var severityColor: Color {
        switch severity {
        case "critical": return .red
        case "alert": return .orange
        case "win": return .green
        default: return .blue
        }
    }

    var categoryLabel: String {
        switch category {
        case "mood": return "Émotions"
        case "habits": return "Habitudes"
        case "accusers": return "Accusateurs"
        case "momentum": return "Momentum"
        case "desires": return "Désirs"
        case "experiments": return "Expériences"
        default: return "Général"
        }
    }
}

enum InsightsError: LocalizedError {
    case notLinked
    case server(Int, String)
    case transport(String)
    case decoding(String)

    var errorDescription: String? {
        switch self {
        case .notLinked:
            return "Ton appareil n'est pas encore lié. Va dans l'onglet Liaison pour lier ta session."
        case .server(let code, let message):
            return "Erreur serveur (\(code)) : \(message)"
        case .transport(let message):
            return "Erreur réseau : \(message)"
        case .decoding(let message):
            return "Erreur de lecture : \(message)"
        }
    }
}

// MARK: - Vue

struct InsightsView: View {
    @State private var insights: [VibesInsight] = []
    @State private var isLoading = true
    @State private var errorMessage: String? = nil
    @State private var categoryFilter: String? = nil

    private static let categories = ["mood", "habits", "accusers", "momentum", "desires", "general"]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // En-tête
                HStack {
                    Text("✨")
                        .font(.title2)
                    Text("Vibes AI")
                        .font(.title2.bold())
                }
                Text("Analyse intelligente de tes données. Patterns, corrélations et recommandations que tu ne vois pas.")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if isLoading {
                    VStack(spacing: 12) {
                        ProgressView()
                        Text("Analyse de tes données…")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 60)
                } else if let errorMessage {
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundStyle(.orange)
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                        Button("Réessayer") {
                            Task { await loadInsights() }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
                } else if insights.isEmpty {
                    VStack(spacing: 12) {
                        Text("🧠")
                            .font(.system(size: 48))
                        Text("Pas encore assez de données")
                            .font(.headline)
                        Text("Continue à tracker tes habitudes, moods et désirs. Plus tu accumules de données, plus les insights seront précis et nombreux.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
                } else {
                    // Barre de statut par sévérité
                    HStack(spacing: 8) {
                        Text("\(insights.count) insights")
                            .font(.caption.bold())
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(Capsule())
                        severityChip("critical", icon: "🚨", label: "critiques")
                        severityChip("alert", icon: "⚠️", label: "alertes")
                        severityChip("win", icon: "🏆", label: "victoires")
                        severityChip("info", icon: "💡", label: "infos")
                    }

                    // Filtre par catégorie
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            categoryChip(nil, label: "Tous (\(insights.count))")
                            ForEach(Self.categories, id: \.self) { cat in
                                let count = insights.filter { $0.category == cat }.count
                                if count > 0 {
                                    categoryChip(cat, label: "\(categoryEmoji(cat)) \(categoryLabel(cat)) (\(count))")
                                }
                            }
                        }
                    }

                    // Liste des insights
                    ForEach(filteredInsights) { insight in
                        insightCard(insight)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Insights")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await loadInsights()
        }
        .task {
            await loadInsights()
        }
    }

    private var filteredInsights: [VibesInsight] {
        guard let categoryFilter else { return insights }
        return insights.filter { $0.category == categoryFilter }
    }

    // MARK: - Composants

    private func severityChip(_ severity: String, icon: String, label: String) -> some View {
        let count = insights.filter { $0.severity == severity }.count
        guard count > 0 else { return AnyView(EmptyView()) }
        return AnyView(
            HStack(spacing: 3) {
                Text(icon)
                Text("\(count)")
            }
            .font(.caption.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(severityColor(severity).opacity(0.12))
            .foregroundStyle(severityColor(severity))
            .clipShape(Capsule())
        )
    }

    private func categoryChip(_ category: String?, label: String) -> some View {
        Button {
            categoryFilter = category
        } label: {
            Text(label)
                .font(.caption)
                .fontWeight(categoryFilter == category ? .bold : .regular)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(categoryFilter == category ? Color.indigo : Color(.secondarySystemBackground))
                .foregroundStyle(categoryFilter == category ? .white : .primary)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    private func insightCard(_ insight: VibesInsight) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(insight.emoji)
                .font(.title3)
            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .top) {
                    Text(insight.title)
                        .font(.subheadline.bold())
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text("\(categoryEmoji(insight.category)) \(insight.categoryLabel)")
                        .font(.system(size: 9))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Color(.systemBackground).opacity(0.7))
                        .clipShape(Capsule())
                }
                Text(insight.description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(insight.severityColor.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(insight.severityColor.opacity(0.3), lineWidth: 1))
    }

    // MARK: - Helpers

    private func severityColor(_ severity: String) -> Color {
        switch severity {
        case "critical": return .red
        case "alert": return .orange
        case "win": return .green
        default: return .blue
        }
    }

    private func categoryLabel(_ category: String) -> String {
        switch category {
        case "mood": return "Émotions"
        case "habits": return "Habitudes"
        case "accusers": return "Accusateurs"
        case "momentum": return "Momentum"
        case "desires": return "Désirs"
        case "experiments": return "Expériences"
        default: return "Général"
        }
    }

    private func categoryEmoji(_ category: String) -> String {
        switch category {
        case "mood": return "😊"
        case "habits": return "🎯"
        case "accusers": return "⚖️"
        case "momentum": return "🌊"
        case "desires": return "✨"
        case "experiments": return "🔬"
        default: return "💡"
        }
    }

    // MARK: - Réseau

    private func loadInsights() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            insights = try await InsightsService.shared.fetchInsights()
        } catch let error as InsightsError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Service

actor InsightsService {
    static let shared = InsightsService()

    private let baseURL = URL(string: "https://app-opal-mu.vercel.app/api/chat")!
    private let session: URLSession
    private let decoder: JSONDecoder

    private struct InsightsRequest: Encodable {
        let mode: String
        let deviceId: String
    }

    private struct InsightsResponse: Decodable {
        let insights: [VibesInsight]
    }

    init(session: URLSession = .shared) {
        self.session = session
        self.decoder = JSONDecoder()
    }

    func fetchInsights() async throws -> [VibesInsight] {
        var req = URLRequest(url: baseURL)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.timeoutInterval = 90

        let body = InsightsRequest(mode: "insights", deviceId: WidgetSharedStorage.ensureDeviceId())
        req.httpBody = try JSONEncoder().encode(body)

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: req)
        } catch {
            throw InsightsError.transport(error.localizedDescription)
        }

        guard let http = response as? HTTPURLResponse else { throw InsightsError.decoding("Réponse invalide") }

        if http.statusCode == 403 {
            throw InsightsError.notLinked
        }
        guard (200..<300).contains(http.statusCode) else {
            let payload = try? decoder.decode([String: String].self, from: data)
            let message = payload?["error"] ?? payload?["details"] ?? "HTTP \(http.statusCode)"
            throw InsightsError.server(http.statusCode, message)
        }

        do {
            return try decoder.decode(InsightsResponse.self, from: data).insights
        } catch {
            throw InsightsError.decoding(error.localizedDescription)
        }
    }
}
