package com.oummah.scanwidget

import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Native side of the shortcut widgets. Scan, Halal and Qibla only open a screen;
 * « Reprendre le Coran » receives the Mushaf bookmark (JSON, or null when removed).
 */
class ScanWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ScanWidget")

    AsyncFunction("publishQuranBookmark") { payload: String? ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      context.getSharedPreferences(QuranWidgetProvider.PREFS, Context.MODE_PRIVATE)
        .edit()
        .apply { if (payload == null) remove(QuranWidgetProvider.KEY) else putString(QuranWidgetProvider.KEY, payload) }
        .apply()
      QuranWidgetProvider.refresh(context)
    }
  }
}
