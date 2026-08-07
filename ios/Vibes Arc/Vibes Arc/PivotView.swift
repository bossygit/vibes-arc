//
//  PivotView.swift
//  Vibes Arc
//
//  Pratique du Pivot (Esther Hicks) — quand une pensée te tire hors d'alignement,
//  saisis-la et pivote. Table des 22 réponses de l'échelle émotionnelle (1-22).
//

import SwiftUI

// MARK: - Modèles

enum PivotZone: String {
    case alignement
    case neutre
    case resistance

    var label: String {
        switch self {
        case .alignement: return "Alignement ✓"
        case .neutre: return "Neutre ⏸️"
        case .resistance: return "Résistance 🔴"
        }
    }

    var color: Color {
        switch self {
        case .alignement: return .green
        case .neutre: return .orange
        case .resistance: return .red
        }
    }

    var softColor: Color {
        color.opacity(0.12)
    }
}

struct PivotResponse {
    let detectedEmotion: String
    let emotionScore: Int
    let zone: PivotZone
    let pivotQuestion: String
    let suggestedThought: String
    let suggestedScore: Int
    let microExercise: String
    let coachLine: String
}

struct PivotEntry: Codable, Identifiable {
    var id = UUID()
    let timestamp: Date
    let originalThought: String
    let originalEmotionScore: Int
    let pivotThought: String
    let newEmotionScore: Int
    let notes: String?
}

enum PivotStep { case input, response, history }

// MARK: - Vue

struct PivotView: View {
    @State private var step: PivotStep = .input
    @State private var thought = ""
    @State private var emotionScore = 10
    @State private var pivotResult: PivotResponse? = nil
    @State private var notes = ""
    @State private var history: [PivotEntry] = []

    private let historyKey = "vibes-arc-pivot-history"

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // En-tête
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Pratique du Pivot")
                            .font(.title2.bold())
                        Text("Quand une pensée te tire hors d'alignement, saisis-la et pivote.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button {
                        withAnimation { step = .history }
                    } label: {
                        Label("\(history.count) pivots", systemImage: "lightbulb")
                            .font(.caption)
                    }
                    .buttonStyle(.bordered)
                }

                switch step {
                case .input:
                    inputView
                case .response:
                    if let pivotResult {
                        responseView(pivotResult)
                    }
                case .history:
                    historyView
                }
            }
            .padding()
        }
        .navigationTitle("Pivot")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: loadHistory)
    }

    // MARK: - Input

    private var inputView: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Quelle pensée te sort de ton alignement en ce moment ?")
                    .font(.subheadline.bold())
                TextEditor(text: $thought)
                    .frame(minHeight: 100)
                    .padding(8)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(.separator), lineWidth: 0.5))
                Text("Ex: « je n'y arriverai jamais », « je ne vois pas l'intérêt »...")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Où es-tu sur l'échelle vibratoire ?")
                    .font(.subheadline.bold())

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 74))], spacing: 6) {
                    ForEach(PivotScale.items, id: \.score) { item in
                        Button {
                            emotionScore = item.score
                        } label: {
                            Text("\(item.score) : \(item.shortLabel)")
                                .font(.system(size: 11, weight: emotionScore == item.score ? .bold : .regular))
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 6)
                                .frame(maxWidth: .infinity)
                                .background(emotionScore == item.score ? item.color.opacity(0.35) : item.color.opacity(0.12))
                                .foregroundStyle(.primary)
                                .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                }

                let zone = PivotZone(score: emotionScore)
                Text("\(zone.label) — \(PivotScale.label(for: emotionScore))")
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(zone.softColor)
                    .foregroundStyle(zone.color)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }

            Button {
                guard !thought.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
                withAnimation { pivotResult = PivotResponses.forScore(emotionScore) }
                step = .response
            } label: {
                Label("Pivoter", systemImage: "arrow.up.right")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.purple)
            .disabled(thought.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
    }

    // MARK: - Response

    private func responseView(_ result: PivotResponse) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Label(result.zone.label, systemImage: "exclamationmark.triangle.fill")
                    .font(.caption.bold())
                    .foregroundStyle(result.zone.color)
                Text(result.detectedEmotion)
                    .font(.title3.bold())
                Text("Niveau \(result.emotionScore) sur l'échelle")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(result.zone.softColor)
            .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 4) {
                Label("Ton Coach Vibes", systemImage: "sparkles")
                    .font(.caption.bold())
                    .foregroundStyle(.purple)
                Text(result.coachLine)
                    .font(.subheadline)
                    .foregroundStyle(.purple)
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.purple.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 10) {
                Text("Question du Coach")
                    .font(.caption.bold())
                    .foregroundStyle(.secondary)
                Text(result.pivotQuestion)
                    .font(.subheadline.bold())

                Text("La pensée pivot suggérée")
                    .font(.caption.bold())
                    .foregroundStyle(.secondary)
                Text(result.suggestedThought)
                    .font(.subheadline)

                HStack(spacing: 6) {
                    Text("Nouveau niveau :")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("\(PivotScale.shortLabel(for: result.suggestedScore)) (\(result.suggestedScore))")
                        .font(.caption.bold())
                        .foregroundStyle(result.suggestedScore <= 7 ? .green : result.suggestedScore <= 14 ? .orange : .red)
                    Text("(+\(result.suggestedScore - result.emotionScore))")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 6) {
                Label("Micro-exercice", systemImage: "heart.fill")
                    .font(.caption.bold())
                    .foregroundStyle(.green)
                Text(result.microExercise)
                    .font(.subheadline)
                    .foregroundStyle(.green.opacity(0.9))
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.green.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 12))

            TextField("Comment tu te sens après ce pivot ? (optionnel)", text: $notes, axis: .vertical)
                .lineLimit(2...3)
                .textFieldStyle(.roundedBorder)

            HStack(spacing: 12) {
                Button {
                    acceptPivot(result)
                } label: {
                    Text("J'accepte ce pivot ✓")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.purple)

                Button {
                    withAnimation { reset() }
                } label: {
                    Image(systemName: "xmark")
                        .frame(width: 24, height: 24)
                }
                .buttonStyle(.bordered)
            }
        }
    }

    // MARK: - History

    private var historyView: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Historique des pivots")
                    .font(.headline)
                Spacer()
                Button("← Retour") {
                    withAnimation { step = .input }
                }
                .font(.caption)
            }

            if history.isEmpty {
                Text("Aucun pivot enregistré pour le moment.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
            } else {
                ForEach(history.reversed()) { entry in
                    VStack(alignment: .leading, spacing: 6) {
                        Text("« \(entry.originalThought) »")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        HStack(spacing: 6) {
                            scoreBadge(entry.originalEmotionScore)
                            Image(systemName: "chevron.right")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            scoreBadge(entry.newEmotionScore)
                        }
                        if let notes = entry.notes, !notes.isEmpty {
                            Text("« \(notes) »")
                                .font(.caption2.italic())
                                .foregroundStyle(.secondary)
                        }
                        Text(entry.timestamp.formatted(date: .abbreviated, time: .omitted))
                            .font(.system(size: 9))
                            .foregroundStyle(.tertiary)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
    }

    private func scoreBadge(_ score: Int) -> some View {
        Text("\(PivotScale.shortLabel(for: score)) (\(score))")
            .font(.caption2)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(score <= 7 ? Color.green.opacity(0.15) : score <= 14 ? Color.orange.opacity(0.15) : Color.red.opacity(0.15))
            .foregroundStyle(score <= 7 ? .green : score <= 14 ? .orange : .red)
            .clipShape(Capsule())
    }

    // MARK: - Actions

    private func acceptPivot(_ result: PivotResponse) {
        let entry = PivotEntry(
            timestamp: Date(),
            originalThought: thought,
            originalEmotionScore: emotionScore,
            pivotThought: result.suggestedThought,
            newEmotionScore: result.suggestedScore,
            notes: notes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : notes
        )
        history.append(entry)
        saveHistory()
        reset()
        withAnimation { step = .input }
    }

    private func reset() {
        thought = ""
        notes = ""
        pivotResult = nil
    }

    private func loadHistory() {
        guard let data = UserDefaults.standard.data(forKey: historyKey),
              let entries = try? JSONDecoder().decode([PivotEntry].self, from: data) else { return }
        history = entries
    }

    private func saveHistory() {
        if let data = try? JSONEncoder().encode(history) {
            UserDefaults.standard.set(data, forKey: historyKey)
        }
    }
}

// MARK: - Échelle émotionnelle (1-22)

enum PivotScale {
    struct Item {
        let score: Int
        let shortLabel: String
        let color: Color
    }

    static let items: [Item] = [
        Item(score: 1, shortLabel: "Joie / Liberté", color: .green),
        Item(score: 2, shortLabel: "Passion", color: .green),
        Item(score: 3, shortLabel: "Enthousiasme", color: .green),
        Item(score: 4, shortLabel: "Attente positive", color: .green),
        Item(score: 5, shortLabel: "Optimisme", color: .green),
        Item(score: 6, shortLabel: "Espoir", color: .green),
        Item(score: 7, shortLabel: "Contentement", color: .blue),
        Item(score: 8, shortLabel: "Ennui", color: .gray),
        Item(score: 9, shortLabel: "Pessimisme", color: .orange),
        Item(score: 10, shortLabel: "Frustration", color: .orange),
        Item(score: 11, shortLabel: "Accablement", color: .orange),
        Item(score: 12, shortLabel: "Déception", color: .orange),
        Item(score: 13, shortLabel: "Doute", color: .orange),
        Item(score: 14, shortLabel: "Inquiétude", color: .orange),
        Item(score: 15, shortLabel: "Blâme", color: .red),
        Item(score: 16, shortLabel: "Découragement", color: .red),
        Item(score: 17, shortLabel: "Colère", color: .red),
        Item(score: 18, shortLabel: "Vengeance", color: .red),
        Item(score: 19, shortLabel: "Haine / Rage", color: .red),
        Item(score: 20, shortLabel: "Jalousie", color: .red),
        Item(score: 21, shortLabel: "Insécurité", color: .red),
        Item(score: 22, shortLabel: "Peur / Chagrin", color: .red),
    ]

    static func label(for score: Int) -> String {
        fullLabels[score] ?? "Inconnu"
    }

    static func shortLabel(for score: Int) -> String {
        items.first(where: { $0.score == score })?.shortLabel ?? "Inconnu"
    }

    private static let fullLabels: [Int: String] = [
        1: "Joie / Connaissance / Liberté / Amour",
        2: "Passion",
        3: "Enthousiasme / Ardeur / Bonheur",
        4: "Attente positive / Croyance",
        5: "Optimisme",
        6: "Espoir",
        7: "Contentement",
        8: "Ennui",
        9: "Pessimisme",
        10: "Frustration / Irritation",
        11: "Accablement",
        12: "Déception",
        13: "Doute",
        14: "Inquiétude",
        15: "Blâme",
        16: "Découragement",
        17: "Colère",
        18: "Vengeance",
        19: "Haine / Rage",
        20: "Jalousie",
        21: "Insécurité / Culpabilité",
        22: "Peur / Dépression / Impuissance",
    ]
}

extension PivotZone {
    init(score: Int) {
        switch score {
        case 1...7: self = .alignement
        case 8...14: self = .neutre
        default: self = .resistance
        }
    }
}

// MARK: - Réponses du Coach (22 entrées — fidèle à PivotCoach web)

enum PivotResponses {
    static func forScore(_ score: Int) -> PivotResponse {
        table[score] ?? table[15]!
    }

    static let table: [Int: PivotResponse] = [
        1: PivotResponse(detectedEmotion: "Joie / Connaissance / Liberté / Amour", emotionScore: 1, zone: .alignement, pivotQuestion: "Qu'est-ce qui te maintient dans cette fluidité ?", suggestedThought: "Continue à nourrir ce que tu ressens — c'est ta Source qui te parle directement.", suggestedScore: 1, microExercise: "Écris 3 choses que cette énergie te permet de voir que tu n'avais pas remarqué avant.", coachLine: "Tu es dans le vortex. Ne force pas — laisse couler."),
        2: PivotResponse(detectedEmotion: "Passion", emotionScore: 2, zone: .alignement, pivotQuestion: "Qu'est-ce que cette passion t'incite à créer ?", suggestedThought: "Laisse cette énergie créatrice te guider vers une action inspirée.", suggestedScore: 2, microExercise: "Identifie une petite action que tu peux poser aujourd'hui dans l'élan de cette passion.", coachLine: "La passion est le moteur — canalise-la dans une action concrète, même minuscule."),
        3: PivotResponse(detectedEmotion: "Enthousiasme / Ardeur / Bonheur", emotionScore: 3, zone: .alignement, pivotQuestion: "Qu'est-ce qui te rend si vivant en ce moment ?", suggestedThought: "Cette joie est une preuve que ton point d'attraction fonctionne.", suggestedScore: 3, microExercise: "Partage cette énergie avec quelqu'un ou écris-la dans ton Book of Positive Aspects.", coachLine: "Tu es littéralement dans le flow — profites-en pour inscrire cette vibration."),
        4: PivotResponse(detectedEmotion: "Attente positive / Croyance", emotionScore: 4, zone: .alignement, pivotQuestion: "Qu'est-ce en lequel tu as confiance en ce moment ?", suggestedThought: "Ta croyance est un aimant — continue de la nourrir avec des pensées de certitude.", suggestedScore: 4, microExercise: "Formule une phrase : « Je sais que ___ parce que ___ » et ressens la certitude.", coachLine: "La croyance est la fondation — les résultats suivent toujours."),
        5: PivotResponse(detectedEmotion: "Optimisme", emotionScore: 5, zone: .alignement, pivotQuestion: "De quoi est-ce que tu te réjouis ?", suggestedThought: "Ton optimisme est un signal que l'Univers se range du côté de ce que tu veux.", suggestedScore: 5, microExercise: "Nomme 2 choses qui te semblaient difficiles il y a une semaine mais qui se sont adoucies.", coachLine: "L'optimisme est le signe que ta vibration a commencé à se décaler vers le wanted."),
        6: PivotResponse(detectedEmotion: "Espoir", emotionScore: 6, zone: .alignement, pivotQuestion: "Qu'est-ce qui te donne l'impression qu'un mieux est possible ?", suggestedThought: "Même infime, ce signal d'espoir est une preuve que tu te diriges vers la joie.", suggestedScore: 6, microExercise: "Décris la sensation physique de cet espoir dans ton corps — où se situe-t-elle ?", coachLine: "L'espoir est l'élan. Ne le réprime pas — laisse-le amplifier."),
        7: PivotResponse(detectedEmotion: "Contentement", emotionScore: 7, zone: .alignement, pivotQuestion: "Qu'est-ce qui a permis ce calme ?", suggestedThought: "Le contentement est ta vibration naturelle quand tu cesses d'agiter le mental.", suggestedScore: 7, microExercise: "Sors-toi du mental pendant 60 secondes : ressens le poids de ton corps sur ta chaise.", coachLine: "Le contentement n'est pas le résultat — c'est la preuve que tu es revenu à qui tu es vraiment."),
        8: PivotResponse(detectedEmotion: "Ennui", emotionScore: 8, zone: .neutre, pivotQuestion: "Qu'est-ce qui te manque vraiment en ce moment ?", suggestedThought: "L'ennui est un signal que tu as besoin de stimulation alignée — pas de plus de distraction.", suggestedScore: 8, microExercise: "Demande-toi : « Qu'est-ce que j'aimerais apprendre ou explorer aujourd'hui ? » même une petite chose.", coachLine: "L'ennui n'est pas vide — il est en attente d'être rempli par quelque chose d'aligné."),
        9: PivotResponse(detectedEmotion: "Pessimisme", emotionScore: 9, zone: .neutre, pivotQuestion: "Qu'est-ce qui te fait douter du résultat ?", suggestedThought: "Le pessimisme est une protection. Cherche un seul élément qui ne correspond pas à la pensée pessimiste.", suggestedScore: 8, microExercise: "Trouve un petit fait du passé récent qui prouve le contraire de ton pessimisme.", coachLine: "Le pessimisme se nourrit de l'attention. Donne-lui un élément qui le contredit — même petit."),
        10: PivotResponse(detectedEmotion: "Frustration / Irritation", emotionScore: 10, zone: .neutre, pivotQuestion: "Qu'est-ce que tu n'as pas obtenu que tu voulais ?", suggestedThought: "La frustration signale un décalage entre ce que tu veux et ce qui est présent. Reviens à ce que tu veux.", suggestedScore: 8, microExercise: "Complète cette phrase : « Je veux ___ » puis immédiatement : « Pourquoi ___ est-ce important pour moi ? »", coachLine: "La frustration est un signal d'alignement — elle te dit que tu sais exactement ce que tu veux."),
        11: PivotResponse(detectedEmotion: "Accablement", emotionScore: 11, zone: .neutre, pivotQuestion: "Quelle est la partie la plus lourde de ce que tu ressens ?", suggestedThought: "L'accablement vient de la surcharge. Réduis le sujet à un seul pas faisable.", suggestedScore: 9, microExercise: "Identifie la plus petite action possible sur le sujet — même 2 minutes.", coachLine: "Quand tout semble trop lourd, un seul pas minuscule suffit à sortir de l'immobilité."),
        12: PivotResponse(detectedEmotion: "Déception", emotionScore: 12, zone: .neutre, pivotQuestion: "Quelle attente n'a pas été satisfaite ?", suggestedThought: "La déception est la preuve que tu sais mieux que ce que tu as. Redirige ta vers une version améliorée.", suggestedScore: 8, microExercise: "Imagine le même scénario dans 90 jours — qu'est-ce qui aurait pu se passer de mieux ?", coachLine: "La déception est une boussole — elle montre où est ta limite, pas ta destination finale."),
        13: PivotResponse(detectedEmotion: "Doute", emotionScore: 13, zone: .neutre, pivotQuestion: "En quoi est-ce que tu doutes exactement ?", suggestedThought: "Le doute n'est pas l'échec — c'est l'incertitude avant la clarté. Choisis une direction, n'importe laquelle, qui te soulage.", suggestedScore: 9, microExercise: "Écris ta pensée la plus douteuse, puis immédiatement à côté : « Ou bien... » et finis la phrase.", coachLine: "Le doute se dissout dans l'action — même une micro-action choisit une direction."),
        14: PivotResponse(detectedEmotion: "Inquiétude", emotionScore: 14, zone: .neutre, pivotQuestion: "Quelle est la pire éventualité qui te hante ?", suggestedThought: "L'inquiétude est un mécanisme de protection. Rappelle-toi : tu es plus capable que ce que tu crois.", suggestedScore: 10, microExercise: "Complète : « Et si je faisais ___ pour être tranquille ? » Même une action symbolique.", coachLine: "L'inquiétude cherche toujours un plan — donne-lui un micro-plan et tu reprends le contrôle."),
        15: PivotResponse(detectedEmotion: "Blâme", emotionScore: 15, zone: .resistance, pivotQuestion: "À qui ou à quoi tu attribues ce qui ne va pas ?", suggestedThought: "Le blâme est un bouclier contre la responsabilité. Et si c'était du pouvoir ?", suggestedScore: 14, microExercise: "Trouve un élément de contrôle — même minuscule — dans la situation que tu blâmes.", coachLine: "Le blâme te met en position de victime. Cherche le levier que tu possèdes — même un tout petit."),
        16: PivotResponse(detectedEmotion: "Découragement", emotionScore: 16, zone: .resistance, pivotQuestion: "Qu'est-ce qui t'a découragé ?", suggestedThought: "Le découragement est la somme de trop petites déceptions. Choisis une seule chose à alléger.", suggestedScore: 14, microExercise: "Fais une liste de 3 choses qui n'ont pas marché — puis à côté de chacune, écris ce que tu en tires.", coachLine: "Le découragement est du découragement accumulé. Une seule prise de recul le commence à dissiper."),
        17: PivotResponse(detectedEmotion: "Colère", emotionScore: 17, zone: .resistance, pivotQuestion: "Qu'est-ce qui t'a mis en colère exactement ?", suggestedThought: "La colère est de la frustration concentrée — elle vient du désir d'un résultat que tu n'as pas pu avoir.", suggestedScore: 15, microExercise: "Écris la phrase « Je suis en colère parce que je veux ___ » sans filtrer. Puis : « Et ce que je veux vraiment, c'est ___ »", coachLine: "La colère est du carburant. Redirige-la vers ce que tu veux — elle devient de la passion."),
        18: PivotResponse(detectedEmotion: "Vengeance", emotionScore: 18, zone: .resistance, pivotQuestion: "Quelle blessure sous-tend cette envie de représailles ?", suggestedThought: "La vengeance est un appel à être traité avec justice — c'est une émotion protectrice, destructible si tu restes dessus.", suggestedScore: 15, microExercise: "Écris : « Je veux me sentir ___ » — déplace le focus de l'autre vers toi.", coachLine: "La vengeance te maintient lié à ce qui t'a blessé. La meilleure revanche est de ne plus être affecté."),
        19: PivotResponse(detectedEmotion: "Haine / Rage", emotionScore: 19, zone: .resistance, pivotQuestion: "Quelle est la partie qui te fait le plus souffrir dans cette haine ?", suggestedThought: "La haine est un cri pour être entendu. Derrière la haine, il y a toujours une émotion plus douce qui appelle.", suggestedScore: 16, microExercise: "Dis à voix haute : « Je suis en colère parce que j'ai besoin de ___ » — laisse sortir la vulnérabilité.", coachLine: "La haine est le dernier rempart avant la douleur. Traverse-la et tu trouveras la blessure que tu veux guérir."),
        20: PivotResponse(detectedEmotion: "Jalousie", emotionScore: 20, zone: .resistance, pivotQuestion: "Qu'est-ce que l'autre a que tu veux ?", suggestedThought: "La jalousie te montre exactement ce que tu désires — elle est une boussole vers ce que tu veux créer pour toi.", suggestedScore: 17, microExercise: "Écris : « Je veux ___ comme ___ » puis transforme en : « Je vais créer ___ de ma propre façon ».", coachLine: "La jalousie n'est pas une compétition — c'est un miroir qui te montre ton prochain désir."),
        21: PivotResponse(detectedEmotion: "Insécurité / Culpabilité / Indignité", emotionScore: 21, zone: .resistance, pivotQuestion: "Qu'est-ce que tu te reproches ?", suggestedThought: "L'insécurité est une défense. Au fond, tu sais que tu mérites — ta peur te le rappelle.", suggestedScore: 17, microExercise: "Complète : « Je mérite ___ parce que je suis ___ » — deux complétions, pas de filtres.", coachLine: "L'insécurité est l'illusion que tu n'es pas assez. Tu es exactement la personne qui peut faire le prochain pas."),
        22: PivotResponse(detectedEmotion: "Peur / Chagrin / Dépression / Impuissance", emotionScore: 22, zone: .resistance, pivotQuestion: "Si tu pouvais nommer UNE chose qui t'effraie en ce moment, ce serait quoi ?", suggestedThought: "La peur est le signal que tu t'éloignes de ce que tu veux. Reviens à ta sensation : je veux me sentir ___.", suggestedScore: 18, microExercise: "Nomme une seule petite chose dans ton environnement qui est douce ou belle — un son, une texture, une couleur. Ressens-la pendant 30 secondes.", coachLine: "Quand tout semble écrasant, retourne au corps. Rends-toi à un seul détail — c'est le premier pas de retour."),
    ]
}
