//
//  ContentView.swift
//  Vibes Arc
//

import SwiftUI
import WidgetKit
import UserNotifications

private let appBaseURL = "https://app-opal-mu.vercel.app"
private let linkDeviceEndpoint = "\(appBaseURL)/api/widgets/link-device"

struct ContentView: View {
    var body: some View {
        TabView {
            // ── Onglet Aujourd'hui ─────────────────────────────────────────
            NavigationStack {
                TodayView()
            }
            .tabItem {
                Label("Aujourd'hui", systemImage: "checkmark.circle")
            }

            // ── Onglet Rappels ─────────────────────────────────────────────
            NavigationStack {
                NotificationSettingsView()
            }
            .tabItem {
                Label("Rappels", systemImage: "bell")
            }

            // ── Onglet Coach ───────────────────────────────────────────────
            NavigationStack {
                CoachTabRoot()
            }
            .tabItem {
                Label("Coach", systemImage: "sparkles")
            }

            // ── Onglet Liaison ─────────────────────────────────────────────
            NavigationStack {
                LinkDeviceView()
            }
            .tabItem {
                Label("Liaison", systemImage: "link")
            }
        }
    }
}

// MARK: - CoachTabRoot

/// Wrapper de l'onglet Coach : affiche un placeholder uniquement si on détecte
/// via l'API que le device n'est pas encore lié. Sinon affiche le chat directement.
struct CoachTabRoot: View {
    enum LinkState: Equatable { case unknown, linked, notLinked }
    @State private var state: LinkState = .unknown

    var body: some View {
        Group {
            switch state {
            case .unknown:
                ProgressView("…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .navigationTitle("Coach")
                    .navigationBarTitleDisplayMode(.inline)
                    .task { await probe() }
            case .notLinked:
                notLinkedPlaceholder
            case .linked:
                CoachChatView()
            }
        }
    }

    private func probe() async {
        do {
            _ = try await CoachService.shared.loadHistory(limit: 1)
            state = .linked
        } catch let err as CoachError {
            if case .notLinked = err {
                state = .notLinked
            } else {
                state = .linked
            }
        } catch {
            state = .linked
        }
    }

    private var notLinkedPlaceholder: some View {
        VStack(spacing: 16) {
            Image(systemName: "sparkles")
                .font(.system(size: 48))
                .foregroundStyle(.purple)
            Text("Coach Vibes")
                .font(.title2.bold())
            Text("Lie ton appareil depuis l'onglet **Liaison** pour ouvrir la conversation avec ton coach personnel.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Button("Réessayer") {
                Task {
                    state = .unknown
                    await probe()
                }
            }
            .padding(.top, 12)
        }
        .padding()
        .navigationTitle("Coach")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - NotificationSettingsView

struct NotificationSettingsView: View {
    @State private var enabled: Bool = NotificationScheduler.isEnabled
    @State private var authStatus: UNAuthorizationStatus? = nil
    @State private var pendingCount: Int? = nil
    @State private var isWorking: Bool = false

    var body: some View {
        List {
            Section {
                Toggle("Activer les rappels", isOn: $enabled)
                    .onChange(of: enabled) { _, newValue in
                        NotificationScheduler.isEnabled = newValue
                        Task { await refreshAndReschedule() }
                    }
            } footer: {
                Text("Rappels locaux toutes les heures de 06:00 à 22:00. Pas de notification si ta journée est déjà complétée.")
            }

            Section("Permissions") {
                HStack {
                    Text("Statut")
                    Spacer()
                    Text(statusLabel)
                        .foregroundStyle(.secondary)
                }

                Button {
                    Task { await requestPermission() }
                } label: {
                    HStack {
                        if isWorking { ProgressView() }
                        Text("Autoriser les notifications")
                    }
                }
            }

            Section("Diagnostic") {
                HStack {
                    Text("Notifs planifiées")
                    Spacer()
                    Text(pendingCount.map(String.init) ?? "—")
                        .foregroundStyle(.secondary)
                }

                Button("Rafraîchir maintenant") {
                    Task { await refreshAndReschedule() }
                }

                Button(role: .destructive) {
                    Task {
                        isWorking = true
                        await NotificationScheduler.cancelReminders()
                        await refreshCounts()
                        isWorking = false
                    }
                } label: {
                    Text("Annuler les rappels")
                }
            }
        }
        .navigationTitle("Rappels")
        .onAppear {
            enabled = NotificationScheduler.isEnabled
            Task { await refreshCounts() }
        }
    }

    private var statusLabel: String {
        guard let authStatus else { return "—" }
        switch authStatus {
        case .notDetermined: return "À demander"
        case .denied: return "Refusé"
        case .authorized: return "Autorisé"
        case .provisional: return "Provisoire"
        case .ephemeral: return "Éphémère"
        @unknown default: return "Inconnu"
        }
    }

    private func requestPermission() async {
        isWorking = true
        _ = await NotificationScheduler.requestAuthorization()
        await refreshAndReschedule()
        isWorking = false
    }

    private func refreshAndReschedule() async {
        isWorking = true
        await NotificationScheduler.refreshSchedule()
        await refreshCounts()
        isWorking = false
    }

    private func refreshCounts() async {
        authStatus = await NotificationScheduler.authorizationStatus()
        let pending = await NotificationScheduler.debugListPending()
        pendingCount = pending.filter { $0.hasPrefix("vibes-arc-reminder-") }.count
    }
}

// MARK: - LinkDeviceView (ancienne ContentView déplacée ici)

struct LinkDeviceView: View {
    @State private var linkStatus: LinkStatus = .idle
    @State private var supabaseToken: String = ""
    @State private var showTokenInput: Bool = false

    private var deviceId: String {
        WidgetSharedStorage.ensureDeviceId()
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {

                VStack(alignment: .leading, spacing: 4) {
                    Text("Widget Vibes Arc")
                        .font(.title2.bold())
                    Text("Lie ton appareil pour afficher tes habitudes dans le widget.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Ton identifiant appareil")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .textCase(.uppercase)

                    HStack {
                        Text(deviceId)
                            .font(.system(.caption, design: .monospaced))
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        Button {
                            UIPasteboard.general.string = deviceId
                        } label: {
                            Image(systemName: "doc.on.doc")
                                .padding(12)
                                .background(Color(.systemGray5))
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }

                Divider()

                VStack(alignment: .leading, spacing: 12) {
                    Label("Liaison automatique (recommandée)", systemImage: "link")
                        .font(.headline)

                    Text("Récupère ton token de session sur app-opal-mu.vercel.app → ouvre les DevTools → Application → Local Storage → sb-knpvbwlfdriavrebvzdy-auth-token → access_token")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if showTokenInput {
                        TextEditor(text: $supabaseToken)
                            .font(.system(.caption, design: .monospaced))
                            .frame(height: 80)
                            .padding(8)
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)

                        Button {
                            Task { await linkDevice() }
                        } label: {
                            HStack {
                                if linkStatus == .loading {
                                    ProgressView().tint(.white)
                                } else {
                                    Image(systemName: "checkmark.circle.fill")
                                }
                                Text(linkStatus == .loading ? "Liaison en cours..." : "Lier maintenant")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.indigo)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .disabled(supabaseToken.trimmingCharacters(in: .whitespaces).isEmpty || linkStatus == .loading)
                    } else {
                        Button {
                            showTokenInput = true
                        } label: {
                            Label("Entrer mon token de session", systemImage: "key")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.indigo)
                                .foregroundStyle(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }

                    switch linkStatus {
                    case .success:
                        Label("Appareil lié avec succès ! Le widget se met à jour dans quelques minutes.", systemImage: "checkmark.circle.fill")
                            .font(.callout)
                            .foregroundStyle(.green)
                    case .error(let msg):
                        Label(msg, systemImage: "xmark.circle.fill")
                            .font(.callout)
                            .foregroundStyle(.red)
                    default:
                        EmptyView()
                    }
                }

                Divider()

                VStack(alignment: .leading, spacing: 8) {
                    Label("Rafraîchir le widget", systemImage: "arrow.clockwise")
                        .font(.headline)

                    Button {
                        WidgetCenter.shared.reloadAllTimelines()
                    } label: {
                        Label("Forcer la mise à jour", systemImage: "arrow.clockwise")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(.systemGray5))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    Text("Appuie ici après avoir lié ton appareil pour forcer le widget à se recharger immédiatement.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Divider()

                VStack(alignment: .leading, spacing: 8) {
                    Label("Ouvrir Vibes Arc", systemImage: "safari")
                        .font(.headline)

                    if let url = URL(string: appBaseURL) {
                        Link(destination: url) {
                            Label("Ouvrir dans Safari", systemImage: "safari")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color(.systemGray5))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Liaison")
        .onAppear {
            checkLinkStatus()
        }
    }

    private func linkDevice() async {
        let token = supabaseToken.trimmingCharacters(in: .whitespaces)
        guard !token.isEmpty else { return }
        linkStatus = .loading
        guard let url = URL(string: linkDeviceEndpoint) else {
            linkStatus = .error("URL invalide"); return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try? JSONEncoder().encode(["deviceId": deviceId])
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            let http = response as? HTTPURLResponse
            if http?.statusCode == 200 {
                linkStatus = .success
                UserDefaults.standard.set(true, forKey: "vibesarc_linked_\(deviceId)")
                WidgetCenter.shared.reloadAllTimelines()
            } else {
                let body = String(data: data, encoding: .utf8) ?? "Erreur inconnue"
                linkStatus = .error("Erreur \(http?.statusCode ?? 0): \(body)")
            }
        } catch {
            linkStatus = .error(error.localizedDescription)
        }
    }

    private func checkLinkStatus() {
        let key = "vibesarc_linked_\(deviceId)"
        if UserDefaults.standard.bool(forKey: key) {
            linkStatus = .success
        }
    }
}

enum LinkStatus: Equatable {
    case idle
    case loading
    case success
    case error(String)
}

#Preview {
    ContentView()
}

