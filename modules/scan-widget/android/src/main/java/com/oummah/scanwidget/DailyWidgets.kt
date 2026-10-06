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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * « Verset du jour » and « Hadith du jour » home-screen widgets. The app
 * publishes the coming week (same texts as its home cards); each widget shows
 * the entry dated today, or the latest earlier one if the app has not been
 * opened for a while. The widgets refresh every few hours to change at midnight.
 */
object DailyWidgets {
  const val PREFS = "oummah_daily_widgets"
  const val KEY = "payload"

  data class Day(val verse: JSONObject?, val hadith: JSONObject?, val labels: JSONObject?)

  fun today(context: Context): Day? {
    val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null) ?: return null
    return try {
      val json = JSONObject(raw)
      val days = json.getJSONArray("days")
      val todayKey = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
      var chosen: JSONObject? = null
      for (i in 0 until days.length()) {
        val day = days.getJSONObject(i)
        if (day.getString("date") <= todayKey) chosen = day
      }
      chosen = chosen ?: days.optJSONObject(0) ?: return null
      Day(chosen.optJSONObject("verse"), chosen.optJSONObject("hadith"), json.optJSONObject("labels"))
    } catch (_: Exception) {
      null
    }
  }

  fun open(context: Context, uri: String, requestCode: Int): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).apply {
      setPackage(context.packageName)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    return PendingIntent.getActivity(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  fun refreshAll(context: Context) {
    val manager = AppWidgetManager.getInstance(context)
    listOf(DailyVerseWidgetProvider::class.java, DailyHadithWidgetProvider::class.java).forEach { type ->
      val ids = manager.getAppWidgetIds(ComponentName(context, type))
      if (ids.isNotEmpty()) {
        val provider = type.getDeclaredConstructor().newInstance() as AppWidgetProvider
        provider.onUpdate(context, manager, ids)
      }
    }
  }
}

class DailyVerseWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    val day = DailyWidgets.today(context)
    val verse = day?.verse
    val views = RemoteViews(context.packageName, R.layout.daily_verse_widget)
    views.setTextViewText(R.id.daily_verse_label, day?.labels?.optString("verse")?.takeIf { it.isNotEmpty() } ?: context.getString(R.string.daily_verse_label))
    if (verse != null) {
      val arabic = verse.optString("arabic")
      views.setTextViewText(R.id.daily_verse_arabic, arabic)
      views.setViewVisibility(R.id.daily_verse_arabic, if (arabic.isEmpty()) View.GONE else View.VISIBLE)
      views.setTextViewText(R.id.daily_verse_text, verse.optString("text"))
      views.setTextViewText(R.id.daily_verse_reference, verse.optString("reference"))
      val uri = "oummah:///surah/${verse.optInt("surahId")}?verse=${verse.optInt("verse")}&direct=1"
      views.setOnClickPendingIntent(R.id.daily_verse_root, DailyWidgets.open(context, uri, 7_405))
    } else {
      views.setViewVisibility(R.id.daily_verse_arabic, View.GONE)
      views.setTextViewText(R.id.daily_verse_text, context.getString(R.string.daily_widget_empty))
      views.setTextViewText(R.id.daily_verse_reference, "")
      views.setOnClickPendingIntent(R.id.daily_verse_root, DailyWidgets.open(context, "oummah:///", 7_405))
    }
    ids.forEach { manager.updateAppWidget(it, views) }
  }
}

class DailyHadithWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    val day = DailyWidgets.today(context)
    val hadith = day?.hadith
    val views = RemoteViews(context.packageName, R.layout.daily_hadith_widget)
    views.setTextViewText(R.id.daily_hadith_label, day?.labels?.optString("hadith")?.takeIf { it.isNotEmpty() } ?: context.getString(R.string.daily_hadith_label))
    if (hadith != null) {
      views.setTextViewText(R.id.daily_hadith_text, "« ${hadith.optString("text")} »")
      views.setTextViewText(R.id.daily_hadith_reference, hadith.optString("reference"))
      views.setOnClickPendingIntent(R.id.daily_hadith_root, DailyWidgets.open(context, "oummah:///hadith/${hadith.optString("id")}", 7_406))
    } else {
      views.setTextViewText(R.id.daily_hadith_text, context.getString(R.string.daily_widget_empty))
      views.setTextViewText(R.id.daily_hadith_reference, "")
      views.setOnClickPendingIntent(R.id.daily_hadith_root, DailyWidgets.open(context, "oummah:///", 7_406))
    }
    ids.forEach { manager.updateAppWidget(it, views) }
  }
}
