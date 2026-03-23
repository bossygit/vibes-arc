//
//  VibesArcWidgets.swift
//  VibesArcWidgets
//

import WidgetKit
import SwiftUI
import OSLog

private let log = Logger(subsystem: "com.vibesarc.Vibes-Arc.VibesArcWidgets", category: "timeline")

private let apiBaseURL = "https://app-opal-mu.vercel.app"
private let widgetSummaryPath = "/api/widgets/v2"

// MARK: - Provider

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> VibesEntry {
        VibesEntry(date: Date(), summary: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (VibesEntry) -> Void) {
        completion(VibesEntry(date: Date(), summary: .preview))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<VibesEntry>) -> Void) {
        let deviceId = WidgetSharedStorage.deviceId
        log.info("getTimeline deviceId=\(deviceId ?? "NIL", privacy: .public)")

        guard let id = deviceId, !id.isEmpty,
              let url = URL(string: "\(apiBaseURL)\(widgetSummaryPath)?deviceId=\(id.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? id)")
        else {
            completion(Timeline(entries: [VibesEntry(date: Date(), summary: nil)],
                                policy: .after(Date().addingTimeInterval(15 * 60))))
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"

        URLSession.shared.dataTask(with: request) { data, response, _ in
            let entry: VibesEntry
            if let data = data,
               let decoded = try? JSONDecoder().decode(WidgetSummaryResponse.self, from: data) {
                entry = VibesEntry(date: Date(), summary: decoded)
                log.info("API ok status=\((response as? HTTPURLResponse)?.statusCode ?? 0)")
            } else {
                entry = VibesEntry(date: Date(), summary: nil)
                log.error("API decode failed status=\((response as? HTTPURLResponse)?.statusCode ?? 0)")
            }
            completion(Timeline(entries: [entry],
                                policy: .after(Date().addingTimeInterval(15 * 60))))
        }.resume()
    }
}

// MARK: - Entry

struct VibesEntry: TimelineEntry {
    let date: Date
    let summary: WidgetSummaryResponse?
}

// MARK: - Helpers

/// Calcule le ratio done/total pour la journée. Retourne nil si pas de données.
private func progressRatio(summary: WidgetSummaryResponse?) -> (done: Int, total: Int, ratio: Double)? {
    guard let s = summary else { return nil }
    // todayRemaining.count = habitudes NON faites. On a aussi besoin du total.
    // L'API retourne todayRemaining.count (restantes) et streaks.byHabit (toutes).
    let total = s.streaks.byHabit?.count ?? 0
    guard total > 0 else { return nil }
    let remaining = s.todayRemaining.count
    let done = max(0, total - remaining)
    return (done, total, Double(done) / Double(total))
}

/// Couleur de la barre selon le ratio.
private func barColor(_ ratio: Double) -> Color {
    switch ratio {
    case 1.0:        return Color(red: 0.12, green: 0.62, blue: 0.46) // vert plein
    case 0.6...:     return Color(red: 0.23, green: 0.51, blue: 0.87) // bleu
    case 0.3...:     return Color(red: 0.93, green: 0.62, blue: 0.15) // ambre
    default:         return Color(red: 0.89, green: 0.30, blue: 0.30) // rouge
    }
}

// MARK: - Home Screen Views (small + medium)

struct HomeScreenWidgetView: View {
    var entry: VibesEntry
    @Environment(\.widgetFamily) var family

    private var trigger: Trigger { entry.summary?.trigger ?? .openApp }
    private var progress: (done: Int, total: Int, ratio: Double)? { progressRatio(summary: entry.summary) }
    private var chainLength: Int { entry.summary?.chain?.length ?? 0 }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {

            // ── Chaîne + Trigger ─────────────────────────────────────────
            HStack(alignment: .top, spacing: 6) {
                Text(trigger.emoji)
                    .font(family == .systemSmall ? .title2 : .title3)

                VStack(alignment: .leading, spacing: 2) {
                    Text(trigger.title)
                        .font(.subheadline.bold())
                        .lineLimit(1)
                    if chainLength > 0 {
                        Text("Chaîne · \(chainLength) j")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
            }

            Spacer(minLength: 6)

            // ── Barre de progression ─────────────────────────────────────
            if let p = progress {
                VStack(alignment: .leading, spacing: 4) {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.primary.opacity(0.08))
                                .frame(height: 8)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(barColor(p.ratio))
                                .frame(width: geo.size.width * p.ratio, height: 8)
                        }
                    }
                    .frame(height: 8)

                    HStack {
                        Text("\(p.done)/\(p.total) faites")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Spacer()
                        if p.ratio == 1.0 {
                            Text("✓ Complété")
                                .font(.caption2.bold())
                                .foregroundStyle(barColor(1.0))
                        } else {
                            Text("\(p.total - p.done) restante\(p.total - p.done > 1 ? "s" : "")")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            } else {
                Text(trigger.message)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            // ── Habitudes restantes (medium seulement) ────────────────────
            if family == .systemMedium, let habits = entry.summary?.todayRemaining.habits, !habits.isEmpty {
                Spacer(minLength: 8)
                Divider().opacity(0.4)
                Spacer(minLength: 6)
                VStack(alignment: .leading, spacing: 3) {
                    ForEach(habits.prefix(3), id: \.habitId) { habit in
                        HStack(spacing: 5) {
                            Circle()
                                .fill(Color.primary.opacity(0.25))
                                .frame(width: 5, height: 5)
                            Text(habit.name)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                    }
                    if habits.count > 3 {
                        Text("+\(habits.count - 3) autres")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

// MARK: - Lock Screen Views

/// accessoryCircular — cercle avec ratio + flamme
struct LockScreenCircularView: View {
    var entry: VibesEntry

    private var progress: Double {
        progressRatio(summary: entry.summary)?.ratio ?? 0
    }
    private var chainLength: Int { entry.summary?.chain?.length ?? 0 }

    var body: some View {
        ZStack {
            // Anneau de progression
            Circle()
                .stroke(Color.primary.opacity(0.15), lineWidth: 4)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(progress == 1.0 ? Color.green : Color.primary,
                        style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))

            // Contenu central
            VStack(spacing: 0) {
                if chainLength > 0 {
                    Text("🔥")
                        .font(.system(size: 14))
                    Text("\(chainLength)")
                        .font(.system(size: 11, weight: .bold))
                        .minimumScaleFactor(0.7)
                } else {
                    Text(entry.summary?.trigger?.emoji ?? "📱")
                        .font(.system(size: 18))
                }
            }
        }
        .containerBackground(.clear, for: .widget)
    }
}

/// accessoryRectangular — barre + message court
struct LockScreenRectangularView: View {
    var entry: VibesEntry

    private var progress: (done: Int, total: Int, ratio: Double)? {
        progressRatio(summary: entry.summary)
    }
    private var trigger: Trigger { entry.summary?.trigger ?? .openApp }
    private var chainLength: Int { entry.summary?.chain?.length ?? 0 }

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            // Ligne du haut : emoji + titre
            HStack(spacing: 4) {
                Text(trigger.emoji).font(.caption)
                Text(trigger.title)
                    .font(.caption.bold())
                    .lineLimit(1)
                Spacer()
                if chainLength > 0 {
                    Text("🔥 \(chainLength)j")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            // Barre de progression
            if let p = progress {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.primary.opacity(0.12))
                            .frame(height: 6)
                        RoundedRectangle(cornerRadius: 3)
                            .fill(p.ratio == 1.0 ? Color.green : Color.primary.opacity(0.8))
                            .frame(width: geo.size.width * p.ratio, height: 6)
                    }
                }
                .frame(height: 6)

                Text(p.ratio == 1.0
                     ? "Toutes les habitudes faites ✓"
                     : "\(p.done)/\(p.total) · \(p.total - p.done) restante\(p.total - p.done > 1 ? "s" : "")")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            } else {
                Text(trigger.message)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
        .containerBackground(.clear, for: .widget)
    }
}

/// accessoryInline — une ligne dans la barre de statut / Dynamic Island compact
struct LockScreenInlineView: View {
    var entry: VibesEntry

    private var progress: (done: Int, total: Int, ratio: Double)? {
        progressRatio(summary: entry.summary)
    }
    private var chainLength: Int { entry.summary?.chain?.length ?? 0 }

    var body: some View {
        if let p = progress {
            if p.ratio == 1.0 {
                Label("Complet ✓", systemImage: "checkmark.circle")
            } else if chainLength > 0 {
                Label("\(p.done)/\(p.total) · 🔥\(chainLength)j", systemImage: "flame")
            } else {
                Label("\(p.done)/\(p.total) faites", systemImage: "chart.bar")
            }
        } else {
            Label("Vibes Arc", systemImage: "sparkles")
        }
    }
}

// MARK: - Widget declarations

/// Widget écran d'accueil (small + medium) — conserve le kind existant
struct VibesArcWidgets: Widget {
    let kind: String = "VibesArcWidgets"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            HomeScreenWidgetView(entry: entry)
        }
        .configurationDisplayName("Vibes Arc")
        .description("Progression du jour et chaîne d'habitudes.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

/// Vue unifiée pour les 3 formats lock screen
struct LockScreenWidgetView: View {
    var entry: VibesEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .accessoryCircular:
            LockScreenCircularView(entry: entry)
        case .accessoryInline:
            LockScreenInlineView(entry: entry)
        default:
            LockScreenRectangularView(entry: entry)
        }
    }
}

/// Widget écran verrouillé (iOS 16+)
struct VibesArcLockScreenWidget: Widget {
    let kind: String = "VibesArcLockScreen"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            LockScreenWidgetView(entry: entry)
        }
        .configurationDisplayName("Vibes Arc · Verrouillage")
        .description("Progression visible sur l'écran verrouillé.")
        .supportedFamilies([
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline
        ])
    }
}

// MARK: - Previews

#Preview("Small", as: .systemSmall) {
    VibesArcWidgets()
} timeline: {
    VibesEntry(date: .now, summary: nil)
    VibesEntry(date: .now, summary: .preview)
}

#Preview("Medium", as: .systemMedium) {
    VibesArcWidgets()
} timeline: {
    VibesEntry(date: .now, summary: .preview)
}

#Preview("Lock Circular", as: .accessoryCircular) {
    VibesArcLockScreenWidget()
} timeline: {
    VibesEntry(date: .now, summary: .preview)
}

#Preview("Lock Rectangular", as: .accessoryRectangular) {
    VibesArcLockScreenWidget()
} timeline: {
    VibesEntry(date: .now, summary: .preview)
}

#Preview("Lock Inline", as: .accessoryInline) {
    VibesArcLockScreenWidget()
} timeline: {
    VibesEntry(date: .now, summary: .preview)
}
