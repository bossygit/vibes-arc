//
//  VibesArcWidgetsBundle.swift
//  VibesArcWidgets
//
//  Created by smartvision on 11/03/2026.
//

import WidgetKit
import SwiftUI

@main
struct VibesArcWidgetsBundle: WidgetBundle {
    var body: some Widget {
        VibesArcWidgets()
        VibesArcLockScreenWidget()
        VibesArcWidgetsControl()
        VibesArcWidgetsLiveActivity()
    }
}
