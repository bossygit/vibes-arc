//
//  FocusHoldView.swift
//  Vibes Arc
//
//  Focus 17/68 — Pratique de concentration sur une pensée unique (Abraham-Hicks).
//  Palier 1: 17s | Palier 2: 34s | Palier 3: 51s | Palier 4: 68s
//  17s = activation, 68s = ancrage. Pas de chrono visible pendant la séance.
//

import SwiftUI

private let focusMilestones = [17, 34, 51, 68]

struct FocusSession: Codable, Identifiable {
    var id = UUID()
    let duration: Double
    let intention: String
    let tier: Int
    let date: Date
}

enum FocusPhase { case setup, countdown, holding, result }

struct FocusHoldView: View {
    @State private var phase: FocusPhase = .setup
    @State private var intention = ""
    @State private var countdown = 3
    @State private var elapsed: Double = 0
    @State private var startDate: Date? = nil
    @State private var timer: Timer? = nil
    @State private var lastDuration: Double = 0
    @State private var allTimeBest: Double? = nil
    @State private var history: [FocusSession] = []

    private let historyKey = "focusHoldHistory"

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // En-tête
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Image(systemName: "eye.fill")
                            .font(.title2)
                            .foregroundStyle(.indigo)
                        Text("Focus 17/68")
                            .font(.title2.bold())
                    }
                    Text("Concentration sur une pensée unique. 17 secondes pour activer, 68 pour ancrer. Pas de chrono visible — l'écran reste calme jusqu'à ce que tu appuies.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(
                    LinearGradient(colors: [.indigo.opacity(0.15), .purple.opacity(0.12)], startPoint: .topLeading, endPoint: .bottomTrailing)
                )
                .clipShape(RoundedRectangle(cornerRadius: 16))

                // Carte principale
                VStack(spacing: 16) {
                    switch phase {
                    case .setup:
                        setupView
                    case .countdown:
                        Text("\(countdown)")
                            .font(.system(size: 64, weight: .semibold, design: .monospaced))
                            .foregroundStyle(.indigo)
                            .frame(height: 220)
                            .contentTransition(.numericText())
                    case .holding:
                        holdingView
                    case .result:
                        resultView
                    }
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color(.separator), lineWidth: 0.5))
                .shadow(color: .black.opacity(0.04), radius: 8, y: 2)

                // Paliers
                if phase == .setup {
                    HStack(spacing: 8) {
                        ForEach(Array(focusMilestones.enumerated()), id: \.offset) { index, ms in
                            VStack(spacing: 2) {
                                Text("\(ms)s")
                                    .font(.headline.monospaced())
                                    .foregroundStyle(.indigo)
                                Text("Palier \(index + 1)")
                                    .font(.system(size: 9))
                                    .foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Focus 17/68")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: loadHistory)
        .onDisappear { timer?.invalidate() }
    }

    // MARK: - Phases

    private var setupView: some View {
        VStack(spacing: 16) {
            Text("Séance d'ancrage")
                .font(.headline)
            Text("Choisis une pensée ou un désir unique. Ferme les yeux.\nAppuie dès que ton attention part ailleurs.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            TextField("Sur quoi tu te concentres ? (optionnel)", text: $intention)
                .textFieldStyle(.roundedBorder)

            Button {
                start()
            } label: {
                Text("Commencer")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.indigo)

            if let allTimeBest {
                Text("Record absolu : \(allTimeBest, specifier: "%.1f")s")
                    .font(.caption.monospaced())
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var holdingView: some View {
        VStack(spacing: 28) {
            Circle()
                .fill(Color.indigo.opacity(0.5))
                .frame(width: 56, height: 56)
                .modifier(PulseModifier())
            Text("Appuie quand ton attention part ailleurs")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 20)
        }
        .frame(height: 220)
        .frame(maxWidth: .infinity)
        .contentShape(Rectangle())
        .onTapGesture { stop() }
    }

    private var resultView: some View {
        VStack(spacing: 14) {
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(lastDuration, format: .number.precision(.fractionLength(1)))
                    .font(.system(size: 44, weight: .semibold, design: .monospaced))
                Text("s")
                    .font(.title3)
                    .foregroundStyle(.secondary)
            }

            MilestoneRingView(tier: tierFor(lastDuration))

            Text(feedbackFor(lastDuration))
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            if !intention.isEmpty {
                Text("« \(intention) »")
                    .font(.caption.italic())
                    .foregroundStyle(.primary)
            }

            Button {
                start()
            } label: {
                Label("Refaire une séance", systemImage: "arrow.counterclockwise")
                    .fontWeight(.semibold)
            }
            .buttonStyle(.borderedProminent)
            .tint(.indigo)

            // Historique (durées)
            if history.count > 1 {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(history) { session in
                            Text("\(Int(session.duration))s")
                                .font(.caption.monospaced())
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(session.tier >= 1 ? Color.indigo.opacity(0.15) : Color(.secondarySystemBackground))
                                .foregroundStyle(session.tier >= 1 ? .indigo : .secondary)
                                .clipShape(RoundedRectangle(cornerRadius: 6))
                        }
                    }
                }
            }
        }
    }

    // MARK: - Logique

    private func start() {
        phase = .countdown
        countdown = 3
        timer?.invalidate()
        var n = 3
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { t in
            n -= 1
            if n <= 0 {
                t.invalidate()
                startDate = Date()
                withAnimation { phase = .holding }
            } else {
                countdown = n
            }
        }
    }

    private func stop() {
        guard phase == .holding, let startDate else { return }
        timer?.invalidate()
        let duration = Date().timeIntervalSince(startDate)
        lastDuration = duration

        let tier = tierFor(duration)
        let session = FocusSession(duration: duration, intention: intention, tier: tier, date: Date())
        history.insert(session, at: 0)
        if history.count > 20 { history.removeLast(history.count - 20) }
        saveHistory()

        if allTimeBest == nil || duration > allTimeBest! {
            allTimeBest = duration
        }

        withAnimation { phase = .result }
    }

    private func tierFor(_ duration: Double) -> Int {
        var tier = 0
        for (i, ms) in focusMilestones.enumerated() where duration >= Double(ms) {
            tier = i + 1
        }
        return tier
    }

    private func feedbackFor(_ duration: Double) -> String {
        let tier = tierFor(duration)
        if tier == 0 {
            let remaining = max(0, 17 - duration)
            return String(format: "%.1fs tenues. Encore %.0fs pour le premier palier (17s).", duration, remaining)
        }
        if tier == 4 {
            return String(format: "%.1fs — cycle complet des 4 paliers atteint (68s).", duration)
        }
        return String(format: "%.1fs — palier %d atteint (%ds).", duration, tier, focusMilestones[tier - 1])
    }

    private func loadHistory() {
        guard let data = UserDefaults.standard.data(forKey: historyKey),
              let sessions = try? JSONDecoder().decode([FocusSession].self, from: data) else { return }
        history = sessions
        allTimeBest = sessions.map(\.duration).max()
    }

    private func saveHistory() {
        if let data = try? JSONEncoder().encode(history) {
            UserDefaults.standard.set(data, forKey: historyKey)
        }
    }
}

// MARK: - Anneau des paliers (4 segments)

struct MilestoneRingView: View {
    let tier: Int

    var body: some View {
        ZStack {
            ForEach(0..<4, id: \.self) { i in
                Circle()
                    .trim(from: CGFloat(i) / 4 + 0.02, to: CGFloat(i + 1) / 4 - 0.02)
                    .stroke(i < tier ? Color.indigo : Color(.systemGray4), style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(-90))
            }
            Text("\(tier)/4")
                .font(.system(.headline, design: .monospaced))
                .foregroundStyle(.secondary)
        }
        .frame(width: 110, height: 110)
    }
}

// MARK: - Pulsation

struct PulseModifier: ViewModifier {
    @State private var scale: CGFloat = 1.0

    func body(content: Content) -> some View {
        content
            .scaleEffect(scale)
            .opacity(scale > 1.2 ? 0.5 : 0.9)
            .onAppear {
                withAnimation(.easeInOut(duration: 2.5).repeatForever(autoreverses: true)) {
                    scale = 1.3
                }
            }
    }
}
