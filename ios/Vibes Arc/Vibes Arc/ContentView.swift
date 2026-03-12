//
//  ContentView.swift
//  Vibes Arc
//
//  Created by smartvision on 11/03/2026.
//

import SwiftUI

private let vibesArcSiteURL = URL(string: "https://app-opal-mu.vercel.app")!

struct ContentView: View {
    private var deviceId: String {
        WidgetSharedStorage.ensureDeviceId()
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Widget Vibes Arc")
                    .font(.title2.bold())

                Text("Copie cet identifiant et lie ton appareil sur le site Vibes Arc pour que le widget affiche tes habitudes.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                Text(deviceId)
                    .font(.system(.caption, design: .monospaced))
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                Button {
                    UIPasteboard.general.string = deviceId
                } label: {
                    Label("Copier", systemImage: "doc.on.doc")
                }
                .buttonStyle(.borderedProminent)

                Button {
                    UIApplication.shared.open(vibesArcSiteURL)
                } label: {
                    Label("Ouvrir le site Vibes Arc", systemImage: "safari")
                }
                .buttonStyle(.bordered)
            }
            .padding()
        }
    }
}

#Preview {
    ContentView()
}
