package com.oummah.prayertimeswidget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.view.View
import android.widget.RemoteViews
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

private const val PREFS = "oummah.prayer_times_widget"
private const val PAYLOAD = "payload"
private const val REFRESH = "com.oummah.app.widget.REFRESH"

private data class Prayer(val key: String, val label: String, val time: String, val timestamp: Long)
private data class Day(val start: Long, val hijri: String, val prayers: List<Prayer>, val sunrise: Prayer)
private data class Snapshot(val today: Day, val tomorrow: Day)
private data class ProgressState(val previous: Prayer?, val next: Prayer?, val progress: Float)

class PrayerTimesWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PrayerTimesWidget")
    AsyncFunction("publish") { payload: String ->
      val context = appContext.reactContext?.applicationContext
        ?: throw IllegalStateException("React context unavailable")
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        .edit()
        .putString(PAYLOAD, payload)
        .apply()
      PrayerTimesWidgetProvider.refresh(context)
      HorizontalPrayerTimesWidgetProvider.refresh(context)
    }
  }
}

class PrayerTimesWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) = refresh(context, ids)

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action in setOf(
        REFRESH,
        Intent.ACTION_BOOT_COMPLETED,
        Intent.ACTION_DATE_CHANGED,
        Intent.ACTION_TIME_CHANGED,
        Intent.ACTION_TIMEZONE_CHANGED,
      )
    ) {
      refresh(context)
      HorizontalPrayerTimesWidgetProvider.refresh(context)
    }
  }

  companion object {
    fun refresh(
      context: Context,
      ids: IntArray? = null,
      layoutId: Int = R.layout.prayer_times_widget,
      horizontal: Boolean = false,
      providerClass: Class<out AppWidgetProvider> = PrayerTimesWidgetProvider::class.java,
    ) {
      val manager = AppWidgetManager.getInstance(context)
      val widgetIds = ids ?: manager.getAppWidgetIds(
        ComponentName(context, providerClass),
      )
      val snapshot = load(context)
      val now = System.currentTimeMillis()
      val progress = snapshot?.let { progressState(it, now) }
      val next = progress?.next

      widgetIds.forEach { id ->
        val views = RemoteViews(context.packageName, layoutId)
        views.setImageViewBitmap(
          if (horizontal) R.id.prayer_widget_art_horizontal else R.id.prayer_widget_art,
          WidgetArt.draw(snapshot, now, progress, Build.VERSION.SDK_INT < Build.VERSION_CODES.N, horizontal),
        )
        views.setOnClickPendingIntent(
          if (horizontal) R.id.prayer_widget_art_horizontal else R.id.prayer_widget_art,
          openApp(context),
        )

        if (next != null && next.timestamp > now && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          views.setChronometer(
            if (horizontal) R.id.prayer_widget_countdown_horizontal else R.id.prayer_widget_countdown,
            SystemClock.elapsedRealtime() + (next.timestamp - now),
            "%s",
            true,
          )
          views.setChronometerCountDown(if (horizontal) R.id.prayer_widget_countdown_horizontal else R.id.prayer_widget_countdown, true)
          views.setViewVisibility(if (horizontal) R.id.prayer_widget_countdown_horizontal else R.id.prayer_widget_countdown, View.VISIBLE)
        } else {
          views.setViewVisibility(if (horizontal) R.id.prayer_widget_countdown_horizontal else R.id.prayer_widget_countdown, View.GONE)
        }
        manager.updateAppWidget(id, views)
      }
      schedule(context, snapshot)
    }

    private fun load(context: Context): Snapshot? = runCatching {
      val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        .getString(PAYLOAD, null) ?: return null
      val root = JSONObject(raw)
      Snapshot(day(root.getJSONObject("today")), day(root.getJSONObject("tomorrow")))
    }.getOrNull()

    private fun day(json: JSONObject): Day {
      fun prayer(value: JSONObject) = Prayer(
        value.optString("key"), value.getString("label"), value.getString("time"), value.getLong("timestamp"),
      )
      val prayers = json.getJSONArray("prayers").let { list ->
        List(list.length()) { prayer(list.getJSONObject(it)) }
      }
      return Day(json.getLong("startTimestamp"), json.getString("hijriDate"), prayers, prayer(json.getJSONObject("sunrise")))
    }

    private fun openApp(context: Context): PendingIntent {
      val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
        action = Intent.ACTION_VIEW
        data = Uri.parse("oummah:///")
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      } ?: Intent(Intent.ACTION_VIEW, Uri.parse("oummah:///"))
      return PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun activePrayerKey(day: Day, now: Long): String? {
      val byKey = day.prayers.associateBy { it.key }
      val fajr = byKey["Fajr"] ?: return null
      return when {
        now >= (byKey["Isha"]?.timestamp ?: Long.MAX_VALUE) -> "Isha"
        now >= (byKey["Maghrib"]?.timestamp ?: Long.MAX_VALUE) -> "Maghrib"
        now >= (byKey["Asr"]?.timestamp ?: Long.MAX_VALUE) -> "Asr"
        now >= (byKey["Dhuhr"]?.timestamp ?: Long.MAX_VALUE) -> "Dhuhr"
        now >= fajr.timestamp && now < day.sunrise.timestamp -> "Fajr"
        else -> null
      }
    }

    private fun progressState(snapshot: Snapshot, now: Long): ProgressState {
      val events = buildList {
        add(snapshot.today.sunrise)
        addAll(snapshot.today.prayers)
        add(snapshot.tomorrow.sunrise)
        addAll(snapshot.tomorrow.prayers)
      }.sortedBy { it.timestamp }
      val nextIndex = events.indexOfFirst { it.timestamp > now }
      if (nextIndex < 0) return ProgressState(events.lastOrNull(), null, 1f)
      val next = events[nextIndex]
      val previous = events.getOrNull(nextIndex - 1)
      val duration = (next.timestamp - (previous?.timestamp ?: now)).coerceAtLeast(1L)
      val elapsed = (now - (previous?.timestamp ?: now)).coerceIn(0L, duration)
      return ProgressState(previous, next, elapsed.toFloat() / duration.toFloat())
    }

    private fun schedule(context: Context, snapshot: Snapshot?) {
      val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val pending = PendingIntent.getBroadcast(
        context, 9151,
        Intent(context, PrayerTimesWidgetProvider::class.java).setAction(REFRESH),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
      alarm.cancel(pending)
      val next = snapshot?.let { nextRefresh(it, System.currentTimeMillis()) } ?: return
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarm.canScheduleExactAlarms()) {
        alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pending)
      } else alarm.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pending)
    }

    private fun nextRefresh(snapshot: Snapshot, now: Long): Long? = buildList {
      listOf(snapshot.today, snapshot.tomorrow).forEach { day ->
        if (day.start > now) add(day.start)
        add(day.sunrise.timestamp)
        day.prayers.filter { it.timestamp > now }.forEach { add(it.timestamp) }
      }
    }.filter { it > now }.minOrNull()?.plus(100)
  }
}

class HorizontalPrayerTimesWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) = refresh(context, ids)

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action in setOf(
        REFRESH,
        Intent.ACTION_BOOT_COMPLETED,
        Intent.ACTION_DATE_CHANGED,
        Intent.ACTION_TIME_CHANGED,
        Intent.ACTION_TIMEZONE_CHANGED,
      )
    ) refresh(context)
  }

  companion object {
    fun refresh(context: Context, ids: IntArray? = null) {
      PrayerTimesWidgetProvider.refresh(context, ids, R.layout.prayer_times_widget_horizontal, true, HorizontalPrayerTimesWidgetProvider::class.java)
    }
  }
}

private object WidgetArt {
  private const val W = 1400
  private const val H = 720
  private val gold = Color.rgb(227, 181, 90)
  private val ivory = Color.rgb(248, 244, 235)
  private val secondary = Color.rgb(199, 190, 208)
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)

  fun draw(snapshot: Snapshot?, now: Long, progress: ProgressState?, showStaticCountdown: Boolean, horizontal: Boolean = false): Bitmap {
    val bitmap = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    paint.shader = LinearGradient(0f, 0f, W.toFloat(), H.toFloat(), Color.rgb(8, 7, 24), Color.rgb(25, 18, 43), Shader.TileMode.CLAMP)
    canvas.drawRect(0f, 0f, W.toFloat(), H.toFloat(), paint)
    paint.shader = null
    text(canvas, "لا إله إلا الله", W / 2f, 410f, 72f, Color.argb(28, Color.red(gold), Color.green(gold), Color.blue(gold)), true)
    paint.color = Color.argb(188, 8, 7, 24)
    canvas.drawRoundRect(RectF(18f, 16f, W - 18f, H - 16f), 54f, 54f, paint)
    if (snapshot == null || progress == null) {
      text(canvas, "Ouvrez OUMMAH pour synchroniser les horaires", W / 2f, H / 2f, 38f, ivory)
      return bitmap
    }

    if (horizontal) {
      drawHorizontal(canvas, snapshot, now, progress, showStaticCountdown)
      return bitmap
    }

    val day = if (now >= snapshot.tomorrow.start) snapshot.tomorrow else snapshot.today
    val activeKey = activePrayerKey(day, now)
    text(canvas, "☾", 74f, 72f, 48f, gold)
    text(canvas, day.hijri, 145f, 70f, 27f, secondary, true, Paint.Align.LEFT)
    text(canvas, "OUMMAH", W - 74f, 70f, 30f, gold, true, Paint.Align.RIGHT)
    text(canvas, "Prochaine prière", W / 2f, 130f, 30f, secondary, true)
    text(canvas, "${label(progress.next).uppercase()}  ·  ${progress.next?.time ?: "—"}", W / 2f, 190f, 55f, gold, true)
    text(canvas, "dans", W / 2f, 235f, 29f, secondary, true)
    if (showStaticCountdown) {
      text(canvas, countdown(progress.next?.timestamp, now), W / 2f, 365f, 50f, ivory)
    }
    drawProgress(canvas, progress)
    text(canvas, "Prière actuelle", W / 2f, 445f, 30f, secondary, true)
    drawPrayerRow(canvas, day, activeKey)
    return bitmap
  }

  private fun drawHorizontal(canvas: Canvas, snapshot: Snapshot, now: Long, progress: ProgressState, showStaticCountdown: Boolean) {
    val day = if (now >= snapshot.tomorrow.start) snapshot.tomorrow else snapshot.today
    val activeKey = activePrayerKey(day, now)
    text(canvas, "☾", 64f, 62f, 38f, gold)
    text(canvas, day.hijri, 112f, 60f, 25f, secondary, true, Paint.Align.LEFT)
    text(canvas, "OUMMAH", W - 64f, 60f, 28f, gold, true, Paint.Align.RIGHT)
    text(canvas, "Prochaine prière", W / 2f, 118f, 28f, secondary, true)
    text(canvas, "${label(progress.next).uppercase()}  ·  ${progress.next?.time ?: "—"}", W / 2f, 171f, 50f, gold, true)
    text(canvas, "dans", W / 2f, 207f, 27f, secondary, true)
    if (showStaticCountdown) text(canvas, countdown(progress.next?.timestamp, now), W / 2f, 260f, 42f, ivory)
    drawProgressHorizontal(canvas, progress)
    text(canvas, "Prière actuelle", W / 2f, 365f, 27f, secondary, true)
    drawPrayerRowHorizontal(canvas, day, activeKey)
  }

  private fun drawProgressHorizontal(canvas: Canvas, progress: ProgressState) {
    val left = 135f
    val right = W - 135f
    val barLeft = 275f
    val barRight = W - 275f
    text(canvas, "${label(progress.previous).uppercase()}  ${progress.previous?.time ?: "—"}", left, 247f, 23f, secondary, true, Paint.Align.LEFT)
    text(canvas, "${label(progress.next).uppercase()}  ${progress.next?.time ?: "—"}", right, 247f, 23f, secondary, true, Paint.Align.RIGHT)
    paint.color = Color.argb(75, 227, 181, 90)
    canvas.drawRoundRect(RectF(barLeft, 241f, barRight, 249f), 4f, 4f, paint)
    paint.color = gold
    val marker = barLeft + (barRight - barLeft) * progress.progress
    canvas.drawRoundRect(RectF(barLeft, 241f, marker, 249f), 4f, 4f, paint)
    canvas.drawCircle(marker, 245f, 12f, paint)
  }

  private fun drawPrayerRowHorizontal(canvas: Canvas, day: Day, activeKey: String?) {
    val byKey = day.prayers.associateBy { it.key }
    val items = listOf(byKey["Fajr"] to "☼", byKey["Dhuhr"] to "☀", byKey["Asr"] to "☀", byKey["Maghrib"] to "☁", byKey["Isha"] to "☾")
    val start = 140f
    val step = 280f
    items.forEachIndexed { index, (prayer, icon) ->
      prayer ?: return@forEachIndexed
      val x = start + index * step
      val active = prayer.key == activeKey
      text(canvas, icon, x, 445f, if (active) 38f else 34f, if (active) gold else ivory, true)
      text(canvas, prayer.label.uppercase(), x, 495f, if (active) 25f else 23f, if (active) gold else ivory, true)
      text(canvas, prayer.time, x, 540f, if (active) 34f else 32f, if (active) gold else ivory)
    }
  }

  private fun drawProgress(canvas: Canvas, progress: ProgressState) {
    val left = 210f
    val right = W - 210f
    val barLeft = 350f
    val barRight = W - 350f
    text(canvas, "${label(progress.previous).uppercase()}  ${progress.previous?.time ?: "—"}", left, 300f, 25f, secondary, true, Paint.Align.LEFT)
    text(canvas, "${label(progress.next).uppercase()}  ${progress.next?.time ?: "—"}", right, 300f, 25f, secondary, true, Paint.Align.RIGHT)
    paint.color = Color.argb(75, 227, 181, 90)
    canvas.drawRoundRect(RectF(barLeft, 293f, barRight, 301f), 4f, 4f, paint)
    paint.color = gold
    val marker = barLeft + (barRight - barLeft) * progress.progress
    canvas.drawRoundRect(RectF(barLeft, 293f, marker, 301f), 4f, 4f, paint)
    canvas.drawCircle(marker, 297f, 13f, paint)
  }

  private fun drawPrayerRow(canvas: Canvas, day: Day, activeKey: String?) {
    val byKey = day.prayers.associateBy { it.key }
    val items = listOf(
      byKey["Fajr"] to "☼", byKey["Dhuhr"] to "☀", byKey["Asr"] to "☀",
      byKey["Maghrib"] to "☁", byKey["Isha"] to "☾",
    )
    val start = 140f
    val step = 280f
    items.forEachIndexed { index, (prayer, icon) ->
      prayer ?: return@forEachIndexed
      val x = start + index * step
      val active = prayer.key == activeKey
      text(canvas, icon, x, 535f, if (active) 45f else 40f, if (active) gold else ivory, true)
      text(canvas, prayer.label.uppercase(), x, 595f, if (active) 28f else 25f, if (active) gold else ivory, true)
      text(canvas, prayer.time, x, 648f, if (active) 39f else 36f, if (active) gold else ivory)
    }
  }

  private fun activePrayerKey(day: Day, now: Long): String? {
    val byKey = day.prayers.associateBy { it.key }
    return when {
      now >= (byKey["Isha"]?.timestamp ?: Long.MAX_VALUE) -> "Isha"
      now >= (byKey["Maghrib"]?.timestamp ?: Long.MAX_VALUE) -> "Maghrib"
      now >= (byKey["Asr"]?.timestamp ?: Long.MAX_VALUE) -> "Asr"
      now >= (byKey["Dhuhr"]?.timestamp ?: Long.MAX_VALUE) -> "Dhuhr"
      now >= (byKey["Fajr"]?.timestamp ?: Long.MAX_VALUE) && now < day.sunrise.timestamp -> "Fajr"
      else -> null
    }
  }

  private fun label(prayer: Prayer?): String = when (prayer?.key) {
    "Sunrise" -> "Chourouk"
    null -> "—"
    else -> prayer.label
  }

  private fun countdown(timestamp: Long?, now: Long): String {
    val remaining = ((timestamp ?: now) - now).coerceAtLeast(0L) / 1_000L
    val hours = remaining / 3_600L
    val minutes = (remaining % 3_600L) / 60L
    val seconds = remaining % 60L
    return "%d:%02d:%02d".format(hours, minutes, seconds)
  }

  private fun text(canvas: Canvas, value: String, x: Float, y: Float, size: Float, color: Int, serif: Boolean = false, align: Paint.Align = Paint.Align.CENTER) {
    paint.typeface = Typeface.create(if (serif) "serif" else "sans-serif", Typeface.NORMAL)
    paint.textAlign = align
    paint.textSize = size
    paint.color = color
    paint.style = Paint.Style.FILL
    canvas.drawText(value, x, y, paint)
  }
}
