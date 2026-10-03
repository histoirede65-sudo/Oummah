package com.oummah.scanwidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews

/** « Scanner » widget: one tap opens the product scanner of OUMMAH. */
class ScanWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    val views = RemoteViews(context.packageName, R.layout.scan_widget)
    views.setOnClickPendingIntent(R.id.scan_widget_root, openScanner(context))
    ids.forEach { manager.updateAppWidget(it, views) }
  }

  private fun openScanner(context: Context): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("oummah:///boycott/scanner")).apply {
      setPackage(context.packageName)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    return PendingIntent.getActivity(context, 7_401, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }
}
