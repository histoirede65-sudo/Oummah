package com.oummah.tahajjudalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

internal const val TAHAJJUD_PREFS = "oummah.tahajjud_widget"
internal const val TAHAJJUD_PAYLOAD = "payload"
private const val REFRESH = "com.oummah.app.tahajjud.REFRESH"

private data class Night(val key: String, val isha: Long, val lastThird: Long, val fajr: Long)

/**
 * Tahajjud widget (home screen, and lock screen where the launcher allows it). The app publishes the
 * nights already computed from OUMMAH's prayer times; the widget only picks the state for "now":
 *   evening      → countdown to the last third
 *   last third   → time left until Fajr
 *   validated    → « Nuit accomplie »
 *   daytime      → tonight's last third
 * and wakes itself up at the next boundary (‘Isha, last third, Fajr).
 */
class TahajjudWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) = refresh(context, ids)

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action in setOf(REFRESH, Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED)) {
      refresh(context)
    }
  }

  companion object {
    fun refresh(context: Context, ids: IntArray? = null) {
      val manager = AppWidgetManager.getInstance(context)
      val widgetIds = ids ?: manager.getAppWidgetIds(ComponentName(context, TahajjudWidgetProvider::class.java))
      if (widgetIds.isEmpty()) return
      val (nights, validated) = load(context)
      val now = System.currentTimeMillis()
      val current = nights.firstOrNull { now >= it.isha && now < it.fajr }
      val upcoming = nights.firstOrNull { it.isha > now }
      val clock = SimpleDateFormat("HH:mm", Locale.FRANCE)
      fun time(value: Long) = clock.format(Date(value))

      widgetIds.forEach { id ->
        val views = RemoteViews(context.packageName, R.layout.tahajjud_widget)
        var countdownTo: Long? = null
        when {
          current != null && validated.contains(current.key) -> {
            views.setTextViewText(R.id.tahajjud_widget_eyebrow, "TAHAJJUD")
            views.setTextViewText(R.id.tahajjud_widget_title, "Nuit accomplie")
            views.setTextViewText(R.id.tahajjud_widget_detail, "Qu’Allah l’accepte · Fajr à ${time(current.fajr)}")
          }
          current != null && now < current.lastThird -> {
            views.setTextViewText(R.id.tahajjud_widget_eyebrow, "TAHAJJUD DANS")
            views.setTextViewText(R.id.tahajjud_widget_title, "")
            views.setTextViewText(R.id.tahajjud_widget_detail, "Dernier tiers ${time(current.lastThird)} → ${time(current.fajr)}")
            countdownTo = current.lastThird
          }
          current != null -> {
            views.setTextViewText(R.id.tahajjud_widget_eyebrow, "DERNIER TIERS EN COURS")
            views.setTextViewText(R.id.tahajjud_widget_title, "")
            views.setTextViewText(R.id.tahajjud_widget_detail, "jusqu’à Fajr, ${time(current.fajr)}")
            countdownTo = current.fajr
          }
          upcoming != null -> {
            views.setTextViewText(R.id.tahajjud_widget_eyebrow, "CE SOIR")
            views.setTextViewText(R.id.tahajjud_widget_title, "Dernier tiers à ${time(upcoming.lastThird)}")
            views.setTextViewText(R.id.tahajjud_widget_detail, "jusqu’à Fajr, ${time(upcoming.fajr)}")
          }
          else -> {
            views.setTextViewText(R.id.tahajjud_widget_eyebrow, "TAHAJJUD")
            views.setTextViewText(R.id.tahajjud_widget_title, "Ouvrez OUMMAH")
            views.setTextViewText(R.id.tahajjud_widget_detail, "pour calculer le dernier tiers de la nuit")
          }
        }

        val showCountdown = countdownTo != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
        if (showCountdown) {
          views.setChronometer(R.id.tahajjud_widget_countdown, SystemClock.elapsedRealtime() + (countdownTo!! - now), null, true)
          views.setChronometerCountDown(R.id.tahajjud_widget_countdown, true)
          views.setViewVisibility(R.id.tahajjud_widget_countdown, View.VISIBLE)
          views.setViewVisibility(R.id.tahajjud_widget_title, View.GONE)
        } else {
          views.setViewVisibility(R.id.tahajjud_widget_countdown, View.GONE)
          views.setViewVisibility(R.id.tahajjud_widget_title, View.VISIBLE)
          if (countdownTo != null) views.setTextViewText(R.id.tahajjud_widget_title, time(countdownTo))
        }
        views.setOnClickPendingIntent(R.id.tahajjud_widget_root, openTahajjud(context))
        manager.updateAppWidget(id, views)
      }

      scheduleNext(context, nights, now)
    }

    private fun load(context: Context): Pair<List<Night>, Set<String>> = runCatching {
      val raw = context.getSharedPreferences(TAHAJJUD_PREFS, Context.MODE_PRIVATE).getString(TAHAJJUD_PAYLOAD, null)
        ?: return Pair(emptyList(), emptySet())
      val root = JSONObject(raw)
      val list = root.getJSONArray("nights")
      val nights = List(list.length()) {
        val night = list.getJSONObject(it)
        Night(night.getString("key"), night.getLong("isha"), night.getLong("lastThirdStart"), night.getLong("fajr"))
      }.sortedBy { it.isha }
      val validatedJson = root.optJSONArray("validated")
      val validated = if (validatedJson == null) emptySet() else List(validatedJson.length()) { validatedJson.getString(it) }.toSet()
      Pair(nights, validated)
    }.getOrDefault(Pair(emptyList(), emptySet()))

    /** Wakes the widget at the next ‘Isha / last third / Fajr so its state changes on time. */
    private fun scheduleNext(context: Context, nights: List<Night>, now: Long) {
      val next = nights.flatMap { listOf(it.isha, it.lastThird, it.fajr) }.filter { it > now + 1_000 }.minOrNull() ?: return
      val alarms = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
      val intent = Intent(context, TahajjudWidgetProvider::class.java).setAction(REFRESH)
      val pending = PendingIntent.getBroadcast(context, 7_301, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      val exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()
      runCatching {
        if (exact) alarms.setExactAndAllowWhileIdle(AlarmManager.RTC, next + 1_000, pending)
        else alarms.setAndAllowWhileIdle(AlarmManager.RTC, next + 1_000, pending)
      }
    }

    private fun openTahajjud(context: Context): PendingIntent {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("oummah:///tahajjud")).apply {
        setPackage(context.packageName)
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      }
      return PendingIntent.getActivity(context, 7_302, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }
  }
}
