//
//  VibesArcWidgets.swift
//  VibesArcWidgets
//
//  Created by smartvision on 11/03/2026.
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
        let entry = VibesEntry(date: Date(), summary: nil)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<VibesEntry>) -> Void) {
        let deviceId = WidgetSharedStorage.deviceId
        let deviceIdLabel = deviceId ?? "NIL"
        log.info("getTimeline suite=\(WidgetSharedStorage.appGroupSuiteName, privacy: .public) deviceId=\(deviceIdLabel, privacy: .public)")

        if deviceId == nil || deviceId?.isEmpty == true {
            let entry = VibesEntry(date: Date(), summary: nil)
            log.warning("getTimeline deviceId missing -> no API call")
            completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(15 * 60))))
            return
        }

        guard let id = deviceId,
              let url = URL(string: "\(apiBaseURL)\(widgetSummaryPath)?deviceId=\(id.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? id)") else {
            let entry = VibesEntry(date: Date(), summary: nil)
            log.error("getTimeline failed to build URL")
            completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(15 * 60))))
            return
        }

        log.info("getTimeline calling \(url.absoluteString, privacy: .public)")
        var request = URLRequest(url: url)
        request.httpMethod = "GET"

        URLSession.shared.dataTask(with: request) { data, response, _ in
            let entry: VibesEntry
            if let data = data,
               let decoded = try? JSONDecoder().decode(WidgetSummaryResponse.self, from: data) {
                entry = VibesEntry(date: Date(), summary: decoded)

                if let http = response as? HTTPURLResponse {
                    let bodyPrefix = String(data: data, encoding: .utf8)?.prefix(500) ?? ""
                    log.info("API ok status=\(http.statusCode) bodyPrefix=\(String(bodyPrefix), privacy: .public)")
                } else {
                    log.info("API ok decoded (non-HTTPURLResponse)")
                }
            } else {
                entry = VibesEntry(date: Date(), summary: nil)

                if let http = response as? HTTPURLResponse {
                    let bodyPrefix = String(data: data ?? Data(), encoding: .utf8)?.prefix(500) ?? ""
                    log.error("API decode failed status=\(http.statusCode) bodyPrefix=\(String(bodyPrefix), privacy: .public)")
                } else {
                    log.error("API decode failed (non-HTTPURLResponse)")
                }
            }
            let nextRefresh = Date().addingTimeInterval(15 * 60)
            completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
        }.resume()
    }
}

// MARK: - Entry

struct VibesEntry: TimelineEntry {
    let date: Date
    let summary: WidgetSummaryResponse?
}

// MARK: - Views

struct VibesArcWidgetsEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    private var trigger: Trigger {
        entry.summary?.trigger ?? .openApp
    }

    private var chainLine: String? {
        guard let chain = entry.summary?.chain, chain.length > 0 else { return nil }
        return "Chaîne \(chain.length) jours"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            if let chain = chainLine {
                Text(chain)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            HStack(spacing: 4) {
                Text(trigger.emoji)
                    .font(.title2)
                Text(trigger.title)
                    .font(.subheadline.bold())
                    .lineLimit(1)
            }
            Text(trigger.message)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)

            if family == .systemMedium, let summary = entry.summary {
                if summary.todayRemaining.count > 0 {
                    Text("\(summary.todayRemaining.count) habitude(s) restante(s) aujourd'hui")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
                if let reward = summary.reward {
                    HStack(spacing: 4) {
                        Text(reward.emoji)
                        Text(reward.title)
                            .font(.caption2)
                    }
                    .foregroundStyle(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(.fill.tertiary, for: .widget)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityLabel)
    }

    private var accessibilityLabel: String {
        let chainPart = chainLine.map { "\($0). " } ?? ""
        return "\(chainPart)\(trigger.title). \(trigger.message)"
    }
}

// MARK: - Widget

struct VibesArcWidgets: Widget {
    let kind: String = "VibesArcWidgets"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            VibesArcWidgetsEntryView(entry: entry)
        }
        .configurationDisplayName("Vibes Arc")
        .description("Ton rappel d'habitudes et ta chaîne.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Previews

#Preview(as: .systemSmall) {
    VibesArcWidgets()
} timeline: {
    VibesEntry(date: .now, summary: nil)
    VibesEntry(date: .now, summary: .preview)
}
