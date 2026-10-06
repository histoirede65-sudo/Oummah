package com.oummah.scanwidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject

/**
 * « Reprendre le Coran » widget: shows the Mushaf bookmark published by the app
 * and opens the Mushaf at that page. Without a bookmark it opens the Quran tab.
 */
class QuranWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    val bookmark = readBookmark(context)
    val views = RemoteViews(context.packageName, R.layout.quran_widget)
    if (bookmark != null) {
      views.setTextViewText(R.id.quran_widget_arabic, bookmark.arabicName)
      views.setViewVisibility(R.id.quran_widget_arabic, View.VISIBLE)
      views.setTextViewText(R.id.quran_widget_title, bookmark.name)
      views.setTextViewText(R.id.quran_widget_subtitle, context.getString(R.string.quran_widget_page, bookmark.page))
    } else {
      views.setViewVisibility(R.id.quran_widget_arabic, View.GONE)
      views.setTextViewText(R.id.quran_widget_title, context.getString(R.string.quran_widget_empty_title))
      views.setTextViewText(R.id.quran_widget_subtitle, context.getString(R.string.quran_widget_empty_subtitle))
    }
    val uri = if (bookmark != null) "oummah:///surah/${bookmark.surahId}?mushafPage=${bookmark.page}" else "oummah:///quran"
    views.setOnClickPendingIntent(R.id.quran_widget_root, open(context, uri))
    ids.forEach { manager.updateAppWidget(it, views) }
  }

  private fun open(context: Context, uri: String): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).apply {
      setPackage(context.packageName)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    return PendingIntent.getActivity(context, 7_404, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private data class Bookmark(val surahId: Int, val page: Int, val name: String, val arabicName: String)

  private fun readBookmark(context: Context): Bookmark? {
    val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null) ?: return null
    return try {
      val json = JSONObject(raw)
      Bookmark(json.getInt("surahId"), json.getInt("page"), json.getString("name"), json.optString("arabicName"))
    } catch (_: Exception) {
      null
    }
  }

  companion object {
    const val PREFS = "oummah_quran_widget"
    const val KEY = "bookmark"

    fun refresh(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, QuranWidgetProvider::class.java))
      if (ids.isNotEmpty()) QuranWidgetProvider().onUpdate(context, manager, ids)
    }
  }
}
