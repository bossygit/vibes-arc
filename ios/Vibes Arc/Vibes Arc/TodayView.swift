//
//  TodayView.swift
//  Vibes Arc
//
//  Vue "Aujourd'hui" : liste les habitudes du jour avec cases à cocher.
//  Appelle /api/widgets/v2 pour charger les données et
//  /api/widgets/check pour cocher/décocher sans ouvrir le navigateur.
//

import SwiftUI
import WidgetKit
internal import Combine

private let appBaseURL = "https://app-opal-mu.vercel.app"

// MARK: - Local API models (indépendants du target Widget)
// Ces structs reflètent la réponse JSON de /api/widgets/v2
// sans dépendre de WidgetSummary.swift qui est dans le target VibesArcWidgets.

private struct SummaryResponse: Decodable {
    let streaks: SummaryStreaks
    let todayRemaining: SummaryTodayRemaining
    let chain: SummaryChain?
}

private struct SummaryStreaks: Decodable {
    let byHabit: [SummaryHabitStreak]?
}

private struct SummaryHabitStreak: Decodable {
    let habitId: Int
    let name: String
    let current: Int
    let longest: Int
}

private struct SummaryTodayRemaining: Decodable {
    let count: Int
    let habits: [SummaryRemainingHabit]?
}

private struct SummaryRemainingHabit: Decodable {
    let habitId: Int
    let name: String
    let type: String
}

private struct SummaryChain: Decodable {
    let length: Int
    let status: String
}

// MARK: - App Models

struct TodayHabit: Identifiable {
    let id: Int
    let name: String
    let type: String          // "start" | "stop"
    var completed: Bool
}

enum TodayLoadState {
    case idle
    case loading
    case loaded([TodayHabit], chainLength: Int, completionRate: Double)
    case error(String)
}

// MARK: - ViewModel

@MainActor
final class TodayViewModel: ObservableObject {
    @Published var state: TodayLoadState = .idle
    @Published var checking: Set<Int> = []   // habitIds en cours de requête

    private var deviceId: String { WidgetSharedStorage.ensureDeviceId() }

    // ── Chargement ────────────────────────────────────────────────────────────

    func load() async {
        state = .loading
        guard let url = URL(string: "\(appBaseURL)/api/widgets/v2?deviceId=\(deviceId)") else {
            state = .error("URL invalide")
            return
        }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let summary = try JSONDecoder().decode(SummaryResponse.self, from: data)

            var habits: [TodayHabit] = []

            // Restantes (non complétées)
            for h in summary.todayRemaining.habits ?? [] {
                habits.append(TodayHabit(id: h.habitId, name: h.name, type: h.type, completed: false))
            }

            // Complétées = byHabit - restantes
            let remainingIds: Set<Int> = Set(
                (summary.todayRemaining.habits ?? []).map { $0.habitId }
            )
            for h in summary.streaks.byHabit ?? [] {
                if !remainingIds.contains(h.habitId) {
                    habits.append(TodayHabit(id: h.habitId, name: h.name, type: "start", completed: true))
                }
            }

            // Trier : non faites en premier
            habits.sort { !$0.completed && $1.completed }

            let total = habits.count
            let done = habits.filter { $0.completed }.count
            let rate = total > 0 ? Double(done) / Double(total) : 0.0
            let chain = summary.chain?.length ?? 0

            state = .loaded(habits, chainLength: chain, completionRate: rate)
        } catch {
            state = .error("Impossible de charger : \(error.localizedDescription)")
        }
    }

    // ── Cochage ───────────────────────────────────────────────────────────────

    func toggle(habit: TodayHabit) async {
        guard !checking.contains(habit.id) else { return }
        checking.insert(habit.id)
        defer { checking.remove(habit.id) }

        let newValue = !habit.completed

        // Optimistic update
        if case .loaded(var habits, let chain, _) = state {
            if let idx = habits.firstIndex(where: { $0.id == habit.id }) {
                habits[idx].completed = newValue
                let total = habits.count
                let done = habits.filter(\.completed).count
                let rate = total > 0 ? Double(done) / Double(total) : 0.0
                // Réordonner : non faites d'abord
                habits.sort { !$0.completed && $1.completed }
                state = .loaded(habits, chainLength: chain, completionRate: rate)
            }
        }

        // Appel API
        guard let url = URL(string: "\(appBaseURL)/api/widgets/check") else {
            await load(); return
        }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: [
            "deviceId": deviceId,
            "habitId": habit.id,
            "completed": newValue
        ])

        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                let body = String(data: data, encoding: .utf8) ?? "?"
                print("[TodayView] check failed: \(body)")
                await load()   // rollback via rechargement
                return
            }
            // Succès — déclencher le refresh du widget
            WidgetCenter.shared.reloadAllTimelines()
            // Mettre à jour les notifications locales (skip si journée complète).
            await NotificationScheduler.refreshSchedule()
        } catch {
            print("[TodayView] check error: \(error)")
            await load()
        }
    }
}

// MARK: - View

struct TodayView: View {
    @StateObject private var vm = TodayViewModel()

    var body: some View {
        Group {
            switch vm.state {
            case .idle:
                Color.clear.onAppear { Task { await vm.load() } }

            case .loading:
                VStack(spacing: 16) {
                    ProgressView()
                    Text("Chargement…")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            case .error(let msg):
                VStack(spacing: 12) {
                    Image(systemName: "wifi.slash")
                        .font(.largeTitle)
                        .foregroundStyle(.secondary)
                    Text(msg)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    Button("Réessayer") { Task { await vm.load() } }
                        .buttonStyle(.bordered)
                }
                .padding()
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            case .loaded(let habits, let chain, let rate):
                LoadedView(habits: habits, chain: chain, rate: rate, vm: vm)
            }
        }
        .navigationTitle("Aujourd'hui")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    Task { await vm.load() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
            }
        }
    }
}

// MARK: - LoadedView

private struct LoadedView: View {
    let habits: [TodayHabit]
    let chain: Int
    let rate: Double
    @ObservedObject var vm: TodayViewModel

    private var done: Int { habits.filter { $0.completed }.count }
    private var total: Int { habits.count }

    var body: some View {
        List {
            // ── En-tête stats ──────────────────────────────────────────────
            Section {
                VStack(spacing: 12) {
                    // Barre de progression
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text("\(done)/\(total) habitudes")
                                .font(.subheadline.bold())
                            Spacer()
                            Text("\(Int(rate * 100))%")
                                .font(.subheadline.bold())
                                .foregroundStyle(rateColor)
                        }
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(Color(.systemGray5))
                                    .frame(height: 10)
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(rateColor)
                                    .frame(width: geo.size.width * rate, height: 10)
                                    .animation(.spring(response: 0.4), value: rate)
                            }
                        }
                        .frame(height: 10)
                    }

                    // Chaîne
                    if chain > 0 {
                        HStack(spacing: 6) {
                            Text("🔥")
                            Text("Chaîne en cours : \(chain) jour\(chain > 1 ? "s" : "")")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Spacer()
                            if rate == 1.0 {
                                Label("Complété", systemImage: "checkmark.seal.fill")
                                    .font(.caption.bold())
                                    .foregroundStyle(.green)
                            }
                        }
                    }
                }
                .padding(.vertical, 4)
            }

            // ── Liste des habitudes ────────────────────────────────────────
            if habits.isEmpty {
                Section {
                    HStack {
                        Spacer()
                        VStack(spacing: 8) {
                            Text("🌱")
                                .font(.largeTitle)
                            Text("Aucune habitude active")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                    .padding(.vertical, 24)
                }
            } else {
                let pending = habits.filter { !$0.completed }
                let done_habits = habits.filter { $0.completed }

                if !pending.isEmpty {
                    Section("À faire") {
                        ForEach(pending) { habit in
                            HabitRow(habit: habit, vm: vm)
                        }
                    }
                }

                if !done_habits.isEmpty {
                    Section("Complétées") {
                        ForEach(done_habits) { habit in
                            HabitRow(habit: habit, vm: vm)
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .refreshable {
            await vm.load()
        }
    }

    private var rateColor: Color {
        switch rate {
        case 1.0:        return .green
        case 0.6...:     return Color(red: 0.23, green: 0.51, blue: 0.87)
        case 0.3...:     return Color(red: 0.93, green: 0.62, blue: 0.15)
        default:         return Color(red: 0.89, green: 0.30, blue: 0.30)
        }
    }
}

// MARK: - HabitRow

private struct HabitRow: View {
    let habit: TodayHabit
    @ObservedObject var vm: TodayViewModel

    private var isChecking: Bool { vm.checking.contains(habit.id) }

    var body: some View {
        Button {
            Task { await vm.toggle(habit: habit) }
        } label: {
            HStack(spacing: 14) {
                // Icône cochage
                ZStack {
                    if isChecking {
                        ProgressView()
                            .frame(width: 28, height: 28)
                    } else {
                        Image(systemName: habit.completed
                              ? "checkmark.circle.fill"
                              : "circle")
                            .font(.title2)
                            .foregroundStyle(habit.completed ? .green : .secondary)
                            .animation(.spring(response: 0.3), value: habit.completed)
                    }
                }
                .frame(width: 28, height: 28)

                // Nom + badge type
                VStack(alignment: .leading, spacing: 2) {
                    Text(habit.name)
                        .font(.body)
                        .foregroundStyle(habit.completed ? .secondary : .primary)
                        .strikethrough(habit.completed, color: .secondary)

                    if habit.type == "stop" {
                        Text("À arrêter")
                            .font(.caption2)
                            .foregroundStyle(.orange)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.orange.opacity(0.12))
                            .clipShape(Capsule())
                    }
                }

                Spacer()

                // Indicateur état
                if habit.completed {
                    Image(systemName: "checkmark")
                        .font(.caption.bold())
                        .foregroundStyle(.green)
                }
            }
            .padding(.vertical, 4)
            .opacity(isChecking ? 0.6 : 1.0)
        }
        .buttonStyle(.plain)
        .disabled(isChecking)
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        TodayView()
    }
}
