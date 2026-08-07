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
            } footer: {
                Text("Les données restent sur cet appareil. Les habitudes du Dashboard web ne sont pas synchronisées depuis ces outils iOS.")
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
