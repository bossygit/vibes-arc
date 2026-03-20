//
//  ContentView.swift
//  Vibes Arc
//
//  Created by smartvision on 11/03/2026.
//

import SwiftUI

private let vibesArcSiteURL = URL(string: "https://vibes-arc.vercel.app/")!

private let vibesArcSiteURL2 = URL(string: "https://vibes-arc.vercel.app/api/widgets/summary?deviceId=D2C969A4-5B96-4339-8620-38EF3DA4CA94")!



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
                    UIApplication.shared.open(vibesArcSiteURL2)
                } label: {
                    Label("Ouvrir le site Vibes Arc", systemImage: "safari")
                }
                .buttonStyle(.bordered)
            }
            .padding()
            .onAppear {
                // Debug: confirmer que le deviceId affiché est bien celui stocké dans le même App Group
                print(
                    """
                    [ContentView] AppGroup suiteName=\(WidgetSharedStorage.appGroupSuiteName)
                    [ContentView] deviceId (current)=\(deviceId)
                    [ContentView] deviceId (from UserDefaults)=\(WidgetSharedStorage.deviceId ?? "NIL")
                    """
                )
            }
        }
    }
}

#Preview {
    ContentView()
}
