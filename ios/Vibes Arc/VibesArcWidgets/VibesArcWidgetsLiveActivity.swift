//
//  VibesArcWidgetsLiveActivity.swift
//  VibesArcWidgets
//
//  Created by smartvision on 11/03/2026.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct VibesArcWidgetsAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct VibesArcWidgetsLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: VibesArcWidgetsAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension VibesArcWidgetsAttributes {
    fileprivate static var preview: VibesArcWidgetsAttributes {
        VibesArcWidgetsAttributes(name: "World")
    }
}

extension VibesArcWidgetsAttributes.ContentState {
    fileprivate static var smiley: VibesArcWidgetsAttributes.ContentState {
        VibesArcWidgetsAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: VibesArcWidgetsAttributes.ContentState {
         VibesArcWidgetsAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: VibesArcWidgetsAttributes.preview) {
   VibesArcWidgetsLiveActivity()
} contentStates: {
    VibesArcWidgetsAttributes.ContentState.smiley
    VibesArcWidgetsAttributes.ContentState.starEyes
}
