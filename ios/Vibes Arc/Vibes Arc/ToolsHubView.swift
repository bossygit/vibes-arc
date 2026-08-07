//
//  ToolsHubView.swift
//  Vibes Arc
//
//  Hub des outils de pratique vibratoire (Abraham Hicks) :
//  Focus 17/68, Pivot, Focus Wheel.
//

import SwiftUI

struct ToolsHubView: View {
    var body: some View {
        List {
            Section {
                NavigationLink {
                    InsightsView()
                } label: {
                    toolRow(
                        icon: "brain.head.profile",
                        tint: .indigo,
                        title: "Vibes AI — Insights",
                        subtitle: "Analyse intelligente de tes données : patterns, corrélations et recommandations."
                    )
                }
            } header: {
                Text("Analyse")
            }

            Section {
                NavigationLink {
                    FocusHoldView()
                } label: {
                    toolRow(
                        icon: "eye.fill",
                        tint: .indigo,
                        title: "Focus 17/68",
                        subtitle: "Concentration sur une pensée unique. 17s pour activer, 68s pour ancrer."
                    )
                }

                NavigationLink {
                    PivotView()
                } label: {
                    toolRow(
                        icon: "arrow.triangle.2.circlepath",
                        tint: .purple,
                        title: "Pivot",
                        subtitle: "Quand une pensée te tire hors d'alignement, saisis-la et pivote."
                    )
                }

                NavigationLink {
                    FocusWheelView()
                } label: {
                    toolRow(
                        icon: "target",
                        tint: .pink,
                        title: "Focus Wheel",
                        subtitle: "Le pont vibratoire vers tes désirs — 12 pensées alignées autour d'une pensée centrale."
                    )
                }
            } header: {
                Text("Pratiques vibratoires")
            }

            Section {
                NavigationLink {
                    FocusGateView()
                } label: {
                    toolRow(
                        icon: "shield.lefthalf.filled",
                        tint: .purple,
                        title: "Pare-feu vibratoire",
                        subtitle: "Bloque tes apps de distraction tant que tu n'as pas atteint 40% de tes habitudes du jour (comme Duolingo)."
                    )
                }
            } header: {
                Text("Protection")
            } footer: {
                Text("Les données des pratiques restent sur cet appareil. Les Insights utilisent tes données synchronisées (appareil lié).")
            }
        }
        .navigationTitle("Outils")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func toolRow(icon: String, tint: Color, title: String, subtitle: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(tint)
                .frame(width: 40, height: 40)
                .background(tint.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}
