//
//  SegmentIntendingView.swift
//  Vibes Arc
//
//  Jeu Segment Intending (Process #11 — Esther Hicks, Ask and It Is Given pp. 217-224).
//  Définis le segment à venir → l'IA propose 3 intentions pré-pavées (gemma4 / Ollama Cloud)
//  → choisis → enregistre. L'historique affine les prochaines propositions.
//

import SwiftUI

struct SegmentIntendingView: View {
    private static let segments: [SegmentDefinition] = [
        SegmentDefinition(key: "wake", label: "Réveil au lit", emoji: "🛏️"),
        SegmentDefinition(key: "morning_prep", label: "Préparation matinale", emoji: "🚿"),
        SegmentDefinition(key: "breakfast", label: "Repas / Petit-déjeuner", emoji: "🥣"),
        SegmentDefinition(key: "phone_call", label: "Appel téléphonique", emoji: "📞"),
        SegmentDefinition(key: "commute", label: "Trajet / Déplacement", emoji: "🚗"),
        SegmentDefinition(key: "work_arrival", label: "Arrivée au travail", emoji: "🏢"),
        SegmentDefinition(key: "deep_work", label: "Travail profond", emoji: "🧠"),
        SegmentDefinition(key: "meeting", label: "Réunion / Rendez-vous", emoji: "🤝"),
        SegmentDefinition(key: "money", label: "Négociation / Argent", emoji: "💰"),
        SegmentDefinition(key: "return_home", label: "Retour à la maison", emoji: "🏠"),
        SegmentDefinition(key: "evening", label: "Soirée", emoji: "🌙"),
        SegmentDefinition(key: "sleep", label: "Coucher / Sommeil", emoji: "😴"),
    ]

    @State private var selectedSegment = segments[1]
    @State private var customLabel = ""
    @State private var context = ""
    @State private var setpoint: Int? = nil

    @State private var intentions: [String] = []
    @State private var selectedIntention: String? = nil
    @State private var isGenerating = false
    @State private var errorMessage: String? = nil
    @State private var savedMessage: String? = nil

    @State private var history: [SegmentIntendingEntry] = []
    @State private var isLoadingHistory = true

    private var gateOk: Bool { setpoint == nil || setpoint! <= 11 }

    private var segmentLabel: String {
        selectedSegment.key == "custom"
            ? (customLabel.trimmingCharacters(in: .whitespaces).isEmpty ? "Segment personnalisé" : customLabel.trimmingCharacters(in: .whitespaces))
            : selectedSegment.label
    }

    var body: some View {
        List {
            // ── Intro ──
            Section {
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("Segment Intending")
                            .font(.headline)
                        Spacer()
                        Text("Process #11")
                            .font(.caption2.bold())
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Color.purple.opacity(0.15))
                            .foregroundStyle(.purple)
                            .clipShape(Capsule())
                    }
                    Text("Pré-pave la vibration du segment que tu t'apprêtes à vivre, avant d'y entrer. Une intention au présent, avec attente : « Voilà ce que je veux pour ce moment. Je le veux et je l'attends. »")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
            }

            // ── 1. Gate émotionnel ──
            Section {
                Picker("Set-point émotionnel (1-22)", selection: $setpoint) {
                    Text("Non renseigné").tag(Int?.none)
                    ForEach(1...22, id: \.self) { n in
                        Text("\(n) — \(Self.setpointLabel(n))").tag(Int?.some(n))
                    }
                }
                if let setpoint, !gateOk {
                    Label("Résistance — pivote d'abord, puis reviens. Intentionner depuis un état bas pré-pave la même vibration.", systemImage: "exclamationmark.triangle.fill")
                        .font(.caption)
                        .foregroundStyle(.orange)
                }
            } header: {
                Text("1. Ton set-point émotionnel")
            } footer: {
                Text("Le processus est le plus puissant entre (4) Attente positive et (11) Accablement.")
            }

            // ── 2. Segment ──
            Section {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                    ForEach(Self.segments) { segment in
                        Button {
                            selectedSegment = segment
                            intentions = []
                            selectedIntention = nil
                        } label: {
                            Text("\(segment.emoji) \(segment.label)")
                                .font(.caption)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.vertical, 8)
                                .padding(.horizontal, 10)
                                .background(selectedSegment == segment ? Color.purple.opacity(0.18) : Color(.secondarySystemBackground))
                                .foregroundStyle(selectedSegment == segment ? .purple : .primary)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(selectedSegment == segment ? Color.purple : .clear, lineWidth: 1.5)
                                )
                        }
                        .buttonStyle(.plain)
                    }
                    Button {
                        selectedSegment = SegmentDefinition(key: "custom", label: "Segment personnalisé", emoji: "✨")
                        intentions = []
                        selectedIntention = nil
                    } label: {
                        Text("✨ Personnalisé")
                            .font(.caption)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 10)
                            .background(selectedSegment.key == "custom" ? Color.purple.opacity(0.18) : Color(.secondarySystemBackground))
                            .foregroundStyle(selectedSegment.key == "custom" ? .purple : .primary)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(selectedSegment.key == "custom" ? Color.purple : .clear, lineWidth: 1.5)
                            )
                    }
                    .buttonStyle(.plain)
                }

                if selectedSegment.key == "custom" {
                    TextField("Nomme ton segment…", text: $customLabel)
                        .textFieldStyle(.roundedBorder)
                }

                TextField("Que se passe-t-il ? Qu'est-ce qui pourrait dérailler ?", text: $context, axis: .vertical)
                    .lineLimit(2...4)
                    .textFieldStyle(.roundedBorder)
            } header: {
                Text("2. Quel est ton prochain segment ?")
            } footer: {
                Text("Un segment change dès que tes intentions changent : téléphone, véhicule, entrée dans une pièce, repas, coucher…")
            }

            // ── 3. Génération IA ──
            Section {
                Button {
                    Task { await generateIntentions() }
                } label: {
                    HStack {
                        if isGenerating {
                            ProgressView()
                        } else {
                            Image(systemName: "sparkles")
                        }
                        Text(isGenerating ? "Abraham réfléchit…" : "Générer mes intentions")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                }
                .disabled(isGenerating || (selectedSegment.key == "custom" && customLabel.trimmingCharacters(in: .whitespaces).isEmpty))

                if let errorMessage {
                    Label(errorMessage, systemImage: "exclamationmark.circle")
                        .font(.caption)
                        .foregroundStyle(.red)
                }

                if !intentions.isEmpty {
                    ForEach(Array(intentions.enumerated()), id: \.offset) { index, intention in
                        Button {
                            selectedIntention = intention
                        } label: {
                            HStack(alignment: .top, spacing: 8) {
                                Text("#\(index + 1)")
                                    .font(.caption.bold())
                                    .foregroundStyle(.purple)
                                Text(intention)
                                    .font(.subheadline)
                                    .multilineTextAlignment(.leading)
                                Spacer()
                                if selectedIntention == intention {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.pink)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                        .buttonStyle(.plain)
                    }

                    if let selectedIntention {
                        Button {
                            Task { await save(selectedIntention) }
                        } label: {
                            Label("Prendre cette intention", systemImage: "checkmark.seal.fill")
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.green)
                    }
                }

                if let savedMessage {
                    Label(savedMessage, systemImage: "checkmark.circle.fill")
                        .font(.caption)
                        .foregroundStyle(.green)
                }
            } header: {
                Text("3. Intentions pré-pavées")
            } footer: {
                Text("Choisis celle qui te fait le plus de bien en la lisant — le ressenti est le point d'attraction. Modèle : gemma4 · Ollama Cloud.")
            }

            // ── 4. Historique ──
            Section {
                if isLoadingHistory {
                    HStack {
                        Spacer()
                        ProgressView()
                        Spacer()
                    }
                } else if history.isEmpty {
                    Text("Aucune entrée pour l'instant. Pré-pave ton premier segment !")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(history) { entry in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text("\(Self.emoji(for: entry.segmentKey)) \(entry.segmentLabel)")
                                    .font(.subheadline.bold())
                                Spacer()
                                Text(entry.date)
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                            if let context = entry.context {
                                Text("« \(context) »")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            if let chosen = entry.chosenIntention {
                                Text("Intention : \(chosen)")
                                    .font(.caption)
                                    .foregroundStyle(.pink)
                            }
                            if let outcome = entry.outcome {
                                Label(outcome, systemImage: "checkmark.circle")
                                    .font(.caption)
                                    .foregroundStyle(.green)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
            } header: {
                Text("Historique des segments pré-pavés")
            } footer: {
                Text("Chaque entrée enregistrée affine les prochaines intentions du modèle.")
            }
        }
        .navigationTitle("Segment Intending")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await refreshHistory()
        }
    }

    // MARK: - Actions

    private func generateIntentions() async {
        errorMessage = nil
        savedMessage = nil
        selectedIntention = nil
        intentions = []
        isGenerating = true
        defer { isGenerating = false }
        do {
            intentions = try await SegmentIntendingService.shared.proposeIntentions(
                segmentKey: selectedSegment.key,
                segmentLabel: segmentLabel,
                context: context,
                emotionalSetpoint: setpoint
            )
        } catch let error as SegmentIntendingError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func save(_ intention: String) async {
        errorMessage = nil
        do {
            try await SegmentIntendingService.shared.saveEntry(
                segmentKey: selectedSegment.key,
                segmentLabel: segmentLabel,
                context: context,
                intentions: intentions,
                chosenIntention: intention,
                emotionalSetpoint: setpoint
            )
            savedMessage = "Intention enregistrée : « \(intention) » — le chemin est pré-pavé."
            intentions = []
            selectedIntention = nil
            context = ""
            setpoint = nil
            await refreshHistory()
            try? await Task.sleep(nanoseconds: 4_000_000_000)
            savedMessage = nil
        } catch let error as SegmentIntendingError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func refreshHistory() async {
        isLoadingHistory = true
        defer { isLoadingHistory = false }
        do {
            history = try await SegmentIntendingService.shared.loadHistory()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Helpers

    private static func setpointLabel(_ n: Int) -> String {
        switch n {
        case 1: return "Joie / Liberté / Amour"
        case 2: return "Passion"
        case 3: return "Enthousiasme / Bonheur"
        case 4: return "Attente positive / Croyance"
        case 5: return "Optimisme"
        case 6: return "Espoir"
        case 7: return "Contentement"
        case 8: return "Ennui"
        case 9: return "Pessimisme"
        case 10: return "Frustration / Impatience"
        case 11: return "Accablement"
        case 12: return "Déception"
        case 13: return "Doute"
        case 14: return "Inquiétude"
        case 15: return "Blâme"
        case 16: return "Découragement"
        case 17: return "Colère"
        case 18: return "Vengeance"
        case 19: return "Haine / Rage"
        case 20: return "Jalousie"
        case 21: return "Insécurité / Culpabilité"
        default: return "Peur / Chagrin / Dépression"
        }
    }

    private static func emoji(for key: String) -> String {
        segments.first(where: { $0.key == key })?.emoji ?? "✨"
    }
}
