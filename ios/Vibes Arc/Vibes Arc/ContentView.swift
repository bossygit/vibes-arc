//
//  ContentView.swift
//  Vibes Arc
//

import SwiftUI
import WidgetKit

private let appBaseURL = "https://app-opal-mu.vercel.app"
private let linkDeviceEndpoint = "\(appBaseURL)/api/widgets/link-device"

struct ContentView: View {
    @State private var linkStatus: LinkStatus = .idle
    @State private var supabaseToken: String = ""
    @State private var showTokenInput: Bool = false

    private var deviceId: String {
        WidgetSharedStorage.ensureDeviceId()
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {

                // ── En-tête ──────────────────────────────────────────
                VStack(alignment: .leading, spacing: 4) {
                    Text("Widget Vibes Arc")
                        .font(.title2.bold())
                    Text("Lie ton appareil pour afficher tes habitudes dans le widget.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                // ── Device ID ────────────────────────────────────────
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

                // ── Méthode 1 : Token JWT ─────────────────────────────
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

                    // Statut
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

                // ── Méthode 2 : Forcer le refresh ──────────────────────
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

                // ── Méthode 3 : Ouvrir l'app web ──────────────────────
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
        .onAppear {
            // Vérifier si déjà lié
            checkLinkStatus()
        }
    }

    // ── Actions ───────────────────────────────────────────────────────

    private func linkDevice() async {
        let token = supabaseToken.trimmingCharacters(in: .whitespaces)
        guard !token.isEmpty else { return }

        linkStatus = .loading

        guard let url = URL(string: linkDeviceEndpoint) else {
            linkStatus = .error("URL invalide")
            return
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
                // Recharger le widget immédiatement
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
        // Si déjà lié, afficher succès
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
