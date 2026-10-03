package com.oummah.scanwidget

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Native side of the scan widget: nothing to call from JS, the widget only opens the scanner. */
class ScanWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ScanWidget")
  }
}
