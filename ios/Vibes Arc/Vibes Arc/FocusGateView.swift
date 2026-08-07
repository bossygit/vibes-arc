//
//  FocusGateView.swift
//  Vibes Arc
//
//  UI du Pare-feu vibratoire : autorisation Screen Time, sélection des apps
//  à bloquer (FamilyControlsPicker), activation du monitoring, taux du jour.
//

import SwiftUI
import FamilyControls

struct FocusGateView: View {
    @State private var model = ScreenTimeGateModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // En-tête
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Image(systemName: "shield.lefthalf.filled")
                            .font(.title2)
                            .foregroundStyle(.purple)
                        Text("Pare-feu vibratoire")
                            .font(.title2.bold())
                    }
                    Text("Les apps sélectionnées restent bloquées tant que tu n'as pas atteint 40% de tes habitudes du jour. Le déblocage se fait depuis l'écran de blocage — comme Duolingo.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.purple.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 14))

                // 1. Autorisation
                SectionCard(title: "1. Autorisation Temps d'écran", systemImage: "lock.shield") {
                    switch model.authorizationStatus {
                    case .approved:
                        Label("Autorisation accordée ✓", systemImage: "checkmark.seal.fill")
                            .font(.subheadline)
                            .foregroundStyle(.green)
                    case .denied:
                        VStack(alignment: .leading, spacing: 6) {
                            Label("Autorisation refusée", systemImage: "xmark.octagon.fill")
                                .font(.subheadline)
                                .foregroundStyle(.red)
                            Text("Va dans Réglages > Temps d'écran > Restrictions de communication et de confidentialité, ou désactive/réactive l'autorisation pour Vibes Arc.")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Button("Demander à nouveau") {
                                Task { await model.requestAuthorization() }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.purple)
                        }
                    case .notDetermined:
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Vibes Arc a besoin de l'autorisation Temps d'écran pour bloquer les apps.")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Button("Autoriser le contrôle") {
                                Task { await model.requestAuthorization() }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.purple)
                        }
                    @unknown default:
                        EmptyView()
                    }
                }

                // 2. Sélection des apps
                SectionCard(title: "2. Apps à bloquer", systemImage: "app.badge") {
                    if model.isAuthorized {
                        FamilyActivityPicker(selection: $model.selection)
                            .frame(height: 44)
                            .onChange(of: model.selection) { _, newValue in
                                model.saveSelection(newValue)
                            }

                        Text("Sélectionne tes apps de distraction (WhatsApp, WhatsApp Business, TikTok, YouTube, X, Instagram…) dans le sélecteur ci-dessus.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .padding(.top, 4)

                        // Rappel des apps suggérées
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Suggestions :")
                                .font(.caption.bold())
                            ForEach(SuggestedBlockedApp.all) { app in
                                Text("\(app.icon) \(app.name)")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 8))

                        Text("\(model.selection.applications.count) app(s) sélectionnée(s)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    } else {
                        Text("Autorise d'abord le contrôle Temps d'écran (étape 1).")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                // 3. Activation
                SectionCard(title: "3. Activer le pare-feu", systemImage: "shield.fill") {
                    Toggle("Bloquer tant que < \(model.threshold)%", isOn: Binding(
                        get: { model.isMonitoring },
                        set: { model.setMonitoringEnabled($0) }
                    ))
                    .tint(.purple)

                    Text("Le blocage s'applique toute la journée : ouvre une app bloquée → écran Vibes Arc → « Vérifier mon taux » → déblocage si ≥ 40%.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                // 4. Taux du jour
                SectionCard(title: "4. Taux du jour", systemImage: "chart.bar.fill") {
                    if let rate = model.dailyRate {
                        VStack(spacing: 8) {
                            // Jauge
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    Capsule()
                                        .fill(Color(.systemGray5))
                                    Capsule()
                                        .fill(rate >= model.threshold ? Color.green : Color.purple)
                                        .frame(width: max(8, geo.size.width * CGFloat(rate) / 100))
                                }
                            }
                            .frame(height: 10)

                            HStack {
                                Text("\(model.dailyCompleted)/\(model.dailyTotal) habitudes — \(rate)%")
                                    .font(.subheadline.bold())
                                Spacer()
                                Text(rate >= model.threshold ? "Débloqué ✓" : "Bloqué — encore \(model.threshold - rate)%")
                                    .font(.caption.bold())
                                    .foregroundStyle(rate >= model.threshold ? .green : .orange)
                            }
                        }
                    } else {
                        Text("Connecte-toi et lie ton appareil (onglet Liaison) pour voir ton taux du jour.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Button {
                        Task { await model.refreshDailyRate() }
                    } label: {
                        Label("Rafraîchir mon taux", systemImage: "arrow.clockwise")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .padding(.top, 4)
                }
            }
            .padding()
        }
        .navigationTitle("Pare-feu vibratoire")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            model.refreshAuthorization()
            await model.refreshDailyRate()
        }
    }
}

// MARK: - Carte de section

private struct SectionCard<Content: View>: View {
    let title: String
    let systemImage: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label(title, systemImage: systemImage)
                .font(.subheadline.bold())
            content
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(.separator), lineWidth: 0.5))
    }
}
