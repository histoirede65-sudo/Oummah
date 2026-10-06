package com.oummah.scanwidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews

/** « Halal autour de moi » widget: one tap opens the halal places near the user. */
class HalalWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    val views = RemoteViews(context.packageName, R.layout.halal_widget)
    views.setOnClickPendingIntent(R.id.halal_widget_root, openHalal(context))
    ids.forEach { manager.updateAppWidget(it, views) }
  }

  private fun openHalal(context: Context): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("oummah:///halal")).apply {
      setPackage(context.packageName)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    return PendingIntent.getActivity(context, 7_402, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }
}
