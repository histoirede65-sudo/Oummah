package com.oummah.scanwidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews

/** « Qibla » widget: one tap opens the compass. */
class QiblaWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    val views = RemoteViews(context.packageName, R.layout.qibla_widget)
    views.setOnClickPendingIntent(R.id.qibla_widget_root, openQibla(context))
    ids.forEach { manager.updateAppWidget(it, views) }
  }

  private fun openQibla(context: Context): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("oummah:///qibla")).apply {
      setPackage(context.packageName)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    return PendingIntent.getActivity(context, 7_403, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }
}
