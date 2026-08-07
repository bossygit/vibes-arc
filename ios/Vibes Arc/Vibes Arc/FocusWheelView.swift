//
//  FocusWheelView.swift
//  Vibes Arc
//
//  The Focus Wheel (Abraham Hicks) — le pont vibratoire vers tes désirs.
//  Pensée centrale → 12 pensées alignées → score avant/après.
//  Logique portée fidèlement depuis src/data/focusWheel.ts + FocusWheelGame.tsx.
//

import SwiftUI

// MARK: - Modèles

struct FocusWheelThought: Codable, Identifiable, Equatable {
    var id = UUID()
    var text: String
    var position: Int      // 1-12
    var isAligned: Bool
    var createdAt: Date
}

struct FocusWheel: Codable, Identifiable, Equatable {
    var id = UUID()
    var centralThought: String      // Le DÉSIR de ressenti au centre ("Je veux me sentir...")
    var currentFeeling: String      // Ce qui s'est passé / ce que je ne veux pas (contexte)
    var thoughts: [FocusWheelThought]
    var initialScore: Int  // 0-10
    var finalScore: Int    // 0-10
    var isCompleted: Bool
    var completedAt: Date?
    var createdAt: Date
    var setpoint: Int?     // Gate émotionnel du Process #17 (idéal 8-17)
}

enum FocusWheelPhase: String, Codable {
    case start, identify, wheel, integration, journal
}

struct FocusWheelState: Codable, Equatable {
    var currentWheel: FocusWheel?
    var completedWheels: [FocusWheel]
    var totalWheels: Int
    var phase: FocusWheelPhase
    var currentThoughtIndex: Int
}

struct FocusWheelStats {
    let totalWheels: Int
    let completedWheels: Int
    let averageImprovement: Double
    let totalThoughtsCreated: Int
    let mostUsedCategory: String?
    let streak: Int
}

struct Badge: Identifiable {
    let id: String
    let name: String
    let description: String
    let icon: String
    let earned: Bool
    let requirement: Int
    let current: Int
}

// MARK: - Données (portées depuis focusWheel.ts)

enum FocusWheelCategory: String, CaseIterable {
    case abundance, confidence, relationships, health, career, creativity, peace, selfLove

    var displayName: String {
        switch self {
        case .abundance: return "Abondance"
        case .confidence: return "Confiance"
        case .relationships: return "Relations"
        case .health: return "Santé"
        case .career: return "Carrière"
        case .creativity: return "Créativité"
        case .peace: return "Paix"
        case .selfLove: return "Amour de soi"
        }
    }
}

struct CategorySuggestion {
    let category: FocusWheelCategory
    let keywords: [String]
    let suggestions: [String]
}

enum FocusWheelData {
    static let maxThoughts = 12

    static let categories: [CategorySuggestion] = [
        CategorySuggestion(category: .abundance, keywords: ["argent", "abondance", "richesse", "financier", "prospérité"], suggestions: [
            "J'ai déjà reçu de l'argent dans ma vie",
            "Je suis capable de créer de la valeur",
            "L'abondance existe partout autour de moi",
            "Je peux apprécier ce que j'ai maintenant",
            "Chaque jour apporte de nouvelles opportunités",
            "Je suis ouvert à recevoir",
            "L'argent circule naturellement",
            "J'ai toujours eu ce dont j'avais besoin",
            "Je mérite de vivre confortablement",
            "Des solutions existent que je ne vois pas encore",
            "Je peux me sentir bien même maintenant",
            "L'univers est généreux et abondant",
        ]),
        CategorySuggestion(category: .confidence, keywords: ["confiance", "confiant", "capable", "compétent", "sûr"], suggestions: [
            "J'ai déjà surmonté des défis dans le passé",
            "Je n'ai pas besoin d'être parfait pour commencer",
            "Chaque expert a été un débutant",
            "Je peux apprendre ce dont j'ai besoin",
            "Mes erreurs m'aident à grandir",
            "Je suis plus capable que je ne le crois",
            "J'ai des qualités uniques à offrir",
            "Je peux faire un petit pas aujourd'hui",
            "Ma valeur ne dépend pas de mes performances",
            "Je m'améliore chaque jour",
            "Je peux me faire confiance",
            "J'ai le droit d'être fier de mes progrès",
        ]),
        CategorySuggestion(category: .relationships, keywords: ["relation", "amour", "famille", "ami", "couple", "connexion"], suggestions: [
            "Je mérite d'être aimé tel que je suis",
            "Des gens bienveillants existent",
            "Je peux commencer par m'aimer moi-même",
            "Chaque relation m'apprend quelque chose",
            "Je suis capable de créer des liens authentiques",
            "L'amour est disponible pour moi",
            "Je peux être vulnérable et en sécurité",
            "Les bonnes personnes viendront à moi",
            "Je suis digne de respect",
            "Je peux pardonner et avancer",
            "L'amour commence par moi",
            "Je peux attirer des relations saines",
        ]),
        CategorySuggestion(category: .health, keywords: ["santé", "corps", "énergie", "vitalité", "bien-être", "guérison"], suggestions: [
            "Mon corps fait de son mieux pour moi",
            "Je peux prendre soin de moi progressivement",
            "Chaque petit geste compte",
            "Mon corps a une capacité naturelle à guérir",
            "Je peux écouter les besoins de mon corps",
            "Je mérite de me sentir bien",
            "L'énergie revient naturellement",
            "Je peux me reposer quand j'en ai besoin",
            "Mon corps me parle avec sagesse",
            "Je suis plus que mon corps",
            "La santé est un voyage, pas une destination",
            "Je peux célébrer chaque amélioration",
        ]),
        CategorySuggestion(category: .career, keywords: ["travail", "carrière", "projet", "professionnel", "business", "réussite"], suggestions: [
            "J'ai des compétences précieuses",
            "Des opportunités existent que je ne vois pas encore",
            "Je peux créer mon propre chemin",
            "Chaque expérience enrichit mon parcours",
            "Je suis au bon endroit pour apprendre",
            "Ma contribution a de la valeur",
            "Je peux demander de l'aide quand j'en ai besoin",
            "Le succès se construit progressivement",
            "Je suis capable de m'adapter",
            "Mes idées ont de l'importance",
            "Je peux réussir à ma manière",
            "L'univers soutient mes ambitions alignées",
        ]),
        CategorySuggestion(category: .creativity, keywords: ["créativité", "créatif", "art", "inspiration", "expression", "imagination"], suggestions: [
            "La créativité coule naturellement en moi",
            "Je n'ai pas besoin d'être parfait pour créer",
            "Chaque création est une exploration",
            "Mon expression unique a de la valeur",
            "L'inspiration vient quand je me détends",
            "Je peux jouer et expérimenter",
            "Il n'y a pas de mauvaise création",
            "Je suis un canal pour l'inspiration",
            "Mon authenticité est ma force créative",
            "Je peux créer pour le plaisir",
            "L'univers me guide vers mes meilleures idées",
            "Ma créativité est illimitée",
        ]),
        CategorySuggestion(category: .peace, keywords: ["paix", "calme", "sérénité", "tranquillité", "zen", "repos"], suggestions: [
            "Ce moment présent est tout ce qui existe vraiment",
            "Je peux respirer et me détendre maintenant",
            "Tout se déroule au bon moment",
            "Je n'ai pas besoin de tout contrôler",
            "La paix est disponible en moi",
            "Je peux lâcher prise progressivement",
            "Chaque respiration m'apaise",
            "Je suis en sécurité maintenant",
            "Le silence nourrit mon âme",
            "Je peux choisir la paix",
            "L'univers prend soin de tout",
            "Je mérite de me reposer",
        ]),
        CategorySuggestion(category: .selfLove, keywords: ["amour de soi", "estime", "acceptation", "bienveillance", "compassion"], suggestions: [
            "Je suis digne d'amour et de respect",
            "Je peux être mon meilleur ami",
            "Mes imperfections font partie de mon humanité",
            "Je mérite de la douceur",
            "Je peux me pardonner",
            "Je fais de mon mieux avec ce que je sais",
            "Mon bien-être est une priorité",
            "Je peux m'accepter tel que je suis",
            "Je suis en évolution constante",
            "Ma valeur est innée",
            "Je peux célébrer mes victoires",
            "Je suis assez, tel que je suis maintenant",
        ]),
    ]

    static let universalSuggestions: [String] = [
        "Je peux me sentir un peu mieux maintenant",
        "Tout se déroule au moment parfait",
        "Je n'ai pas besoin de tout comprendre aujourd'hui",
        "Je peux faire un petit pas",
        "L'univers me soutient",
        "Je suis guidé vers ce qui est bon pour moi",
        "Chaque jour est une nouvelle opportunité",
        "Je peux choisir mes pensées",
        "Mon ressenti s'améliore progressivement",
        "Je suis plus fort que je ne le crois",
        "La solution viendra au bon moment",
        "Je peux avoir confiance en la vie",
    ]

    static func detectCategory(_ text: String) -> FocusWheelCategory? {
        let lower = text.lowercased()
        for suggestion in categories {
            for keyword in suggestion.keywords where lower.contains(keyword) {
                return suggestion.category
            }
        }
        return nil
    }

    /// Suggestions personnalisées : catégorie détectée si possible, sinon universelles.
    /// Exclut les pensées déjà présentes dans la roue.
    static func personalizedSuggestions(for text: String, excluding existing: [String]) -> [String] {
        let base = detectCategory(text).flatMap { cat in
            categories.first { $0.category == cat }?.suggestions
        } ?? universalSuggestions

        let used = Set(existing.map { $0.lowercased() })
        return base.filter { !used.contains($0.lowercased()) }
    }

    static func newWheel(centralThought: String, currentFeeling: String, initialScore: Int, setpoint: Int? = nil) -> FocusWheel {
        FocusWheel(
            id: UUID(),
            centralThought: centralThought,
            currentFeeling: currentFeeling,
            thoughts: [],
            initialScore: initialScore,
            finalScore: initialScore,
            isCompleted: false,
            completedAt: nil,
            createdAt: Date(),
            setpoint: setpoint
        )
    }

    /// Positions d'horloge du Process #17 : 1ère pensée à 12h, puis 1h, 2h... 11h.
    static func clockLabel(position: Int) -> String {
        position == 1 ? "12h" : "\(position - 1)h"
    }

    static func stats(for wheels: [FocusWheel]) -> FocusWheelStats {
        let completed = wheels.filter(\.isCompleted)
        let totalImprovement = completed.reduce(0) { $0 + ($1.finalScore - $1.initialScore) }
        let avg = completed.isEmpty ? 0 : Double(totalImprovement) / Double(completed.count)
        let thoughtsCreated = wheels.reduce(0) { $0 + $1.thoughts.count }

        var categoryCounts: [FocusWheelCategory: Int] = [:]
        for wheel in wheels {
            let combined = wheel.centralThought + " " + wheel.currentFeeling
            if let cat = detectCategory(combined) {
                categoryCounts[cat, default: 0] += 1
            }
        }
        let mostUsed = categoryCounts.max { $0.value < $1.value }?.key

        return FocusWheelStats(
            totalWheels: wheels.count,
            completedWheels: completed.count,
            averageImprovement: avg,
            totalThoughtsCreated: thoughtsCreated,
            mostUsedCategory: mostUsed?.displayName,
            streak: streak(for: completed)
        )
    }

    /// Jours consécutifs (depuis le dernier jour pratiqué ou aujourd'hui).
    private static func streak(for wheels: [FocusWheel]) -> Int {
        let calendar = Calendar.current
        let days = Set(wheels.compactMap { $0.completedAt.map { calendar.startOfDay(for: $0) } })
        guard !days.isEmpty else { return 0 }

        var cursor = calendar.startOfDay(for: Date())
        if !days.contains(cursor) {
            guard let yesterday = calendar.date(byAdding: .day, value: -1, to: cursor),
                  days.contains(yesterday) else { return 0 }
            cursor = yesterday
        }
        var count = 0
        while days.contains(cursor) {
            count += 1
            guard let prev = calendar.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = prev
        }
        return count
    }

    static func badges(for wheels: [FocusWheel]) -> [Badge] {
        let stats = stats(for: wheels)
        return [
            Badge(id: "first-wheel", name: "Premier Alignement", description: "Complétez votre premier Focus Wheel", icon: "🌟", earned: stats.completedWheels >= 1, requirement: 1, current: stats.completedWheels),
            Badge(id: "five-wheels", name: "Stabilité Vibratoire", description: "Complétez 5 Focus Wheels", icon: "🎖️", earned: stats.completedWheels >= 5, requirement: 5, current: stats.completedWheels),
            Badge(id: "twenty-one-wheels", name: "Maître de l'Alignement", description: "Complétez 21 Focus Wheels (habitude formée)", icon: "👑", earned: stats.completedWheels >= 21, requirement: 21, current: stats.completedWheels),
            Badge(id: "seven-day-streak", name: "Momentum Vibratoire", description: "Pratiquez 7 jours consécutifs", icon: "🔥", earned: stats.streak >= 7, requirement: 7, current: stats.streak),
            Badge(id: "hundred-thoughts", name: "Architecte de Pensées", description: "Créez 100 pensées transitionnelles", icon: "💭", earned: stats.totalThoughtsCreated >= 100, requirement: 100, current: stats.totalThoughtsCreated),
        ]
    }
}

// MARK: - Vue principale

struct FocusWheelView: View {
    @State private var state: FocusWheelState
    @State private var newThoughtText = ""
    @State private var initialScore = 0
    @State private var currentFeeling = ""
    @State private var setpoint: Int? = nil
    // Test du soulagement (Process #17)
    @State private var pendingThought = ""
    @State private var showValidation = false
    @State private var inBushes = false
    @State private var isHolding17 = false
    @State private var holdSeconds = 17
    @State private var holdTimer: Timer? = nil

    private let storageKey = "focusWheelGame"

    init() {
        let saved = UserDefaults.standard.data(forKey: "focusWheelGame")
        if let saved, let decoded = try? JSONDecoder().decode(FocusWheelState.self, from: saved) {
            _state = State(initialValue: decoded)
        } else {
            _state = State(initialValue: FocusWheelState(currentWheel: nil, completedWheels: [], totalWheels: 0, phase: .start, currentThoughtIndex: 0))
        }
    }

    var body: some View {
        Group {
            switch state.phase {
            case .start: startView
            case .identify: identifyView
            case .wheel: wheelView
            case .integration: integrationView
            case .journal: journalView
            }
        }
        .navigationTitle("Focus Wheel")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: state) { _, newState in
            persist(newState)
        }
        .sheet(isPresented: $showValidation) {
            validationSheet
                .presentationDetents([.medium])
        }
    }

    // MARK: - Test du soulagement (Process #17)

    private var validationSheet: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text(inBushes ? "🌿 Dans les buissons…" : "Le test du soulagement")
                    .font(.headline)
                Text("« \(pendingThought) »")
                    .font(.subheadline.italic())
                    .foregroundStyle(.secondary)

                if inBushes {
                    Text("Cette déclaration ne colle pas : elle est trop spécifique ou trop loin de ce que tu crois vraiment. C'est comme essayer de monter sur un manège qui tourne trop vite.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("Cherche une déclaration plus générale que tu crois déjà — même un tout petit peu mieux suffit. Tu n'es pas là pour résoudre, juste pour trouver une pensée qui te soulage.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Button {
                        dismissValidation()
                        newThoughtText = ""
                    } label: {
                        Label("Réessayer avec une autre pensée", systemImage: "lightbulb")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.purple)
                } else if isHolding17 {
                    Text("\(holdSeconds)")
                        .font(.system(size: 56, weight: .bold, design: .monospaced))
                        .foregroundStyle(.purple)
                        .frame(maxWidth: .infinity)
                        .contentTransition(.numericText())
                    Text("Tiens cette pensée… si tu peux rester 17 secondes, une autre pensée va la rejoindre. C'est la combustion qui donne de la puissance à ta nouvelle croyance.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                } else {
                    Text("Abraham : une déclaration **colle** si elle te **soulage** — elle te fait sentir un tout petit peu mieux. Si elle t'agace ou te rappelle ton manque, elle te jette dans les buissons.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Button {
                        confirmAdd()
                    } label: {
                        Label("Ça colle — je me sens soulagé", systemImage: "checkmark.circle.fill")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.purple)
                    Button {
                        startHold17()
                    } label: {
                        Label("Ça colle — tenir 17 secondes d'abord", systemImage: "clock")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    Button(role: .destructive) {
                        inBushes = true
                    } label: {
                        Label("Dans les buissons — ça m'agace", systemImage: "xmark.circle")
                            .frame(maxWidth: .infinity)
                    }
                }
                Spacer()
            }
            .padding()
            .navigationTitle(inBushes ? "Essaie encore" : "Validation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fermer") { dismissValidation() }
                }
            }
        }
    }

    private func promptForThought(_ text: String? = nil) {
        let trimmed = (text ?? newThoughtText).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        pendingThought = trimmed
        inBushes = false
        isHolding17 = false
        holdSeconds = 17
        showValidation = true
    }

    private func confirmAdd() {
        holdTimer?.invalidate()
        let trimmed = pendingThought.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, var wheel = state.currentWheel,
              wheel.thoughts.count < FocusWheelData.maxThoughts else { return }
        let thought = FocusWheelThought(
            id: UUID(),
            text: trimmed,
            position: wheel.thoughts.count + 1,
            isAligned: true,
            createdAt: Date()
        )
        wheel.thoughts.append(thought)
        state.currentWheel = wheel
        newThoughtText = ""
        pendingThought = ""
        isHolding17 = false
        holdSeconds = 17
        showValidation = false
    }

    private func startHold17() {
        isHolding17 = true
        holdSeconds = 17
        holdTimer?.invalidate()
        holdTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { t in
            holdSeconds -= 1
            if holdSeconds <= 0 {
                t.invalidate()
                confirmAdd()
            }
        }
    }

    private func dismissValidation() {
        holdTimer?.invalidate()
        showValidation = false
        isHolding17 = false
        inBushes = false
        pendingThought = ""
    }

    private func persist(_ newState: FocusWheelState) {
        if let data = try? JSONEncoder().encode(newState) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    // MARK: - Start

    private var startView: some View {
        ScrollView {
            VStack(spacing: 16) {
                Text("🎯")
                    .font(.system(size: 56))
                Text("The Focus Wheel")
                    .font(.largeTitle.bold())
                Text("Le pont vibratoire vers tes désirs — Méthode Abraham Hicks")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                let stats = FocusWheelData.stats(for: state.completedWheels)

                VStack(alignment: .leading, spacing: 8) {
                    statRow("Roues complétées", "\(stats.completedWheels)")
                    statRow("Amélioration moyenne", String(format: "+%.1f", stats.averageImprovement))
                    statRow("Pensées transitionnelles", "\(stats.totalThoughtsCreated)")
                    statRow("Série (jours)", "\(stats.streak) 🔥")
                    if let cat = stats.mostUsedCategory {
                        statRow("Catégorie favorite", cat)
                    }
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))

                // Badges
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                    ForEach(FocusWheelData.badges(for: state.completedWheels)) { badge in
                        VStack(spacing: 2) {
                            Text(badge.icon)
                                .font(.title3)
                            Text(badge.name)
                                .font(.system(size: 11, weight: .semibold))
                                .multilineTextAlignment(.center)
                            Text("\(badge.current)/\(badge.requirement)")
                                .font(.system(size: 10, weight: badge.earned ? .bold : .regular))
                                .foregroundStyle(badge.earned ? .green : .secondary)
                        }
                        .padding(.vertical, 10)
                        .frame(maxWidth: .infinity)
                        .background(badge.earned ? Color.green.opacity(0.12) : Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }

                HStack(spacing: 12) {
                    Button {
                        state.phase = .identify
                        state.currentWheel = nil
                    } label: {
                        Label("Nouvelle roue", systemImage: "plus.circle.fill")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.purple)

                    Button {
                        state.phase = .journal
                    } label: {
                        Label("Journal", systemImage: "book")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
            }
            .padding()
        }
    }

    private func statRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.caption.bold())
        }
    }

    // MARK: - Identify

    private var identifyView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Ton désir de ressenti")
                    .font(.headline)
                Text("« Je me sens pauvre, et je veux me sentir prospère. » — le centre de la roue est ce que tu VEUX ressentir.")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                // ── Gate émotionnel (Process #17 : valeur maximale 8-17) ──
                VStack(alignment: .leading, spacing: 6) {
                    Text("Où es-tu sur l'échelle émotionnelle (1-22) ?")
                        .font(.subheadline.bold())
                    Picker("Set-point émotionnel", selection: $setpoint) {
                        Text("Non renseigné").tag(Int?.none)
                        ForEach(1...22, id: \.self) { n in
                            Text("\(n) — \(Self.setpointLabel(n))").tag(Int?.some(n))
                        }
                    }
                    .pickerStyle(.menu)
                    if let setpoint, setpoint < 8 || setpoint > 17 {
                        Label(setpoint < 8
                              ? "Tu es déjà bien aligné : ce processus te servira moins. Fais-le pour ancrer."
                              : "Résistance très forte : la roue risque de ne pas « coller ». Fais un Pivot d'abord, puis reviens.",
                              systemImage: "exclamationmark.triangle.fill")
                            .font(.caption)
                            .foregroundStyle(.orange)
                    }
                    Text("Le Focus Wheel est le plus puissant entre (8) Ennui et (17) Colère.")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))

                TextField("Comment veux-tu te SENTIR ? (le centre de la roue)", text: $newThoughtText, axis: .vertical)
                    .lineLimit(2...4)
                    .textFieldStyle(.roundedBorder)
                Text("Formule-le en termes de ressenti : « je me sens gros → je veux me sentir svelte », « je me sens pauvre → je veux me sentir prospère ».")
                    .font(.caption2)
                    .foregroundStyle(.secondary)

                TextField("Qu'est-ce qui s'est passé ? Qu'est-ce que tu ne veux pas ?", text: $currentFeeling, axis: .vertical)
                    .lineLimit(2...3)
                    .textFieldStyle(.roundedBorder)

                VStack(alignment: .leading, spacing: 6) {
                    Text("À quel point es-tu aligné avec ce ressenti maintenant : \(initialScore)/10")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Slider(value: Binding(
                        get: { Double(initialScore) },
                        set: { initialScore = Int($0) }
                    ), in: 0...10, step: 1)
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))

                Button {
                    let trimmed = newThoughtText.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !trimmed.isEmpty else { return }
                    state.currentWheel = FocusWheelData.newWheel(
                        centralThought: trimmed,
                        currentFeeling: currentFeeling,
                        initialScore: initialScore,
                        setpoint: setpoint
                    )
                    newThoughtText = ""
                    currentFeeling = ""
                    state.phase = .wheel
                } label: {
                    Text("Construire la roue")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.purple)
                .disabled(newThoughtText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding()
        }
    }

    private static func setpointLabel(_ n: Int) -> String {
        switch n {
        case 1: return "Joie / Liberté"
        case 2: return "Passion"
        case 3: return "Enthousiasme"
        case 4: return "Attente positive"
        case 5: return "Optimisme"
        case 6: return "Espoir"
        case 7: return "Contentement"
        case 8: return "Ennui"
        case 9: return "Pessimisme"
        case 10: return "Frustration"
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
        case 21: return "Insécurité"
        default: return "Peur / Chagrin"
        }
    }

    // MARK: - Wheel

    private var wheelView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if let wheel = state.currentWheel {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Pensée centrale")
                            .font(.caption.bold())
                            .foregroundStyle(.secondary)
                        Text(wheel.centralThought)
                            .font(.headline)
                        if !wheel.currentFeeling.isEmpty {
                            Text("Ressenti : \(wheel.currentFeeling)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.purple.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                    // Pensées qui collent (positions d'horloge 12h → 11h)
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Pensées qui collent (\(wheel.thoughts.count)/\(FocusWheelData.maxThoughts))")
                            .font(.subheadline.bold())
                        Text("Des déclarations générales que tu crois déjà — le test : est-ce que ça te soulage ?")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        ForEach(wheel.thoughts) { thought in
                            HStack(alignment: .top, spacing: 8) {
                                Text(FocusWheelData.clockLabel(position: thought.position))
                                    .font(.caption.monospaced().bold())
                                    .foregroundStyle(.purple)
                                    .frame(width: 30, alignment: .leading)
                                Text(thought.text)
                                    .font(.subheadline)
                                Spacer()
                                Button {
                                    removeThought(thought.id)
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .padding(10)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }

                        if wheel.thoughts.count < FocusWheelData.maxThoughts {
                            Text("Prochaine position : \(FocusWheelData.clockLabel(position: wheel.thoughts.count + 1)) — écris-la à 12h, puis 1h, 2h… comme sur une horloge.")
                                .font(.caption2)
                                .foregroundStyle(.secondary)

                            TextField("Ajouter une déclaration qui te soulage…", text: $newThoughtText)
                                .textFieldStyle(.roundedBorder)
                                .onSubmit { promptForThought() }

                            let suggestions = FocusWheelData.personalizedSuggestions(
                                for: wheel.centralThought + " " + wheel.currentFeeling,
                                excluding: wheel.thoughts.map(\.text)
                            )
                            if !suggestions.isEmpty {
                                Text("Suggestions")
                                    .font(.caption.bold())
                                    .foregroundStyle(.secondary)
                                    .padding(.top, 4)
                                ForEach(Array(suggestions.prefix(6)), id: \.self) { suggestion in
                                    Button {
                                        promptForThought(suggestion)
                                    } label: {
                                        Text("💡 \(suggestion)")
                                            .font(.caption)
                                            .multilineTextAlignment(.leading)
                                            .padding(8)
                                            .frame(maxWidth: .infinity, alignment: .leading)
                                            .background(Color.purple.opacity(0.06))
                                            .clipShape(RoundedRectangle(cornerRadius: 8))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }

                    // Score final
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Alignement final avec ta pensée centrale : \(wheel.finalScore)/10")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Slider(value: Binding(
                            get: { Double(wheel.finalScore) },
                            set: { state.currentWheel?.finalScore = Int($0) }
                        ), in: 0...10, step: 1)
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 10))

                    Button {
                        completeWheel()
                    } label: {
                        Label("Compléter la roue", systemImage: "checkmark.seal.fill")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.green)
                    .disabled(wheel.thoughts.isEmpty)
                }
            }
            .padding()
        }
    }

    private func removeThought(_ id: UUID) {
        guard var wheel = state.currentWheel else { return }
        wheel.thoughts.removeAll { $0.id == id }
        for (index, _) in wheel.thoughts.enumerated() {
            wheel.thoughts[index].position = index + 1
        }
        state.currentWheel = wheel
    }

    private func completeWheel() {
        guard var wheel = state.currentWheel else { return }
        wheel.isCompleted = true
        wheel.completedAt = Date()
        state.completedWheels.insert(wheel, at: 0)
        state.totalWheels += 1
        state.currentWheel = nil
        state.phase = .integration
    }

    // MARK: - Integration

    private var integrationView: some View {
        ScrollView {
            VStack(spacing: 16) {
                Text("🌉")
                    .font(.system(size: 56))
                if let wheel = state.completedWheels.first {
                    let improvement = wheel.finalScore - wheel.initialScore
                    Text("Pont vibratoire construit !")
                        .font(.title2.bold())
                    Text("« \(wheel.centralThought) »")
                        .font(.subheadline.italic())
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)

                    HStack(spacing: 16) {
                        VStack(spacing: 2) {
                            Text("\(wheel.initialScore)/10")
                                .font(.title2.bold())
                            Text("Avant")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        Image(systemName: "arrow.right")
                            .foregroundStyle(.purple)
                        VStack(spacing: 2) {
                            Text("\(wheel.finalScore)/10")
                                .font(.title2.bold())
                                .foregroundStyle(.green)
                            Text("Après")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                    Text(improvement > 0
                         ? "Amélioration de +\(improvement) points. Le pont est posé — ta vibration s'est décalée vers le wanted."
                         : "Le pont est posé. Continue à nourrir ces pensées alignées, même sans changement de score immédiat.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Abraham — « Plus ça fait du bien, plus ça devient bon »")
                            .font(.caption.bold())
                            .foregroundStyle(.indigo)
                        Text("« Nous n'avons rien résolu : tu as toujours tes impôts à faire. Mais tu te tiens dans un endroit différent. La clarté te viendra plus facilement qu'avant. Ton Point d'Attraction a changé. »")
                            .font(.caption.italic())
                            .foregroundStyle(.indigo)
                        Text("Encercle maintenant ta pensée centrale : ressens à quel point tu en es plus proche qu'il y a quelques minutes.")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.indigo.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                    HStack(spacing: 12) {
                        Button {
                            state.phase = .start
                        } label: {
                            Text("Retour")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)

                        Button {
                            state.phase = .identify
                            state.currentWheel = nil
                        } label: {
                            Label("Nouvelle roue", systemImage: "plus.circle.fill")
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.purple)
                    }
                }
            }
            .padding()
        }
    }

    // MARK: - Journal

    private var journalView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("Journal des roues")
                        .font(.headline)
                    Spacer()
                    Button("← Retour") { state.phase = .start }
                        .font(.caption)
                }

                if state.completedWheels.isEmpty {
                    Text("Aucune roue complétée pour le moment.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                } else {
                    ForEach(state.completedWheels) { wheel in
                        VStack(alignment: .leading, spacing: 6) {
                            Text("« \(wheel.centralThought) »")
                                .font(.subheadline.bold())
                            HStack(spacing: 6) {
                                Text("\(wheel.initialScore) → \(wheel.finalScore)")
                                    .font(.caption.monospaced().bold())
                                    .foregroundStyle(wheel.finalScore - wheel.initialScore > 0 ? .green : .secondary)
                                Text("\(wheel.thoughts.count) pensées")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                Spacer()
                                if let date = wheel.completedAt {
                                    Text(date.formatted(date: .abbreviated, time: .omitted))
                                        .font(.system(size: 9))
                                        .foregroundStyle(.tertiary)
                                }
                            }
                            ForEach(wheel.thoughts) { thought in
                                Text("• \(thought.text)")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
            .padding()
        }
    }
}
