package com.oummah.prayertimeswidget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Rect
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
          WidgetArt.draw(context, snapshot, now, progress, Build.VERSION.SDK_INT < Build.VERSION_CODES.N, horizontal),
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
  private const val H_REGULAR = 720
  private const val H_HORIZONTAL = 360

  // Same palette as the validated iOS Home Screen widget.
  private val surface = Color.rgb(23, 16, 38)
  private val gold = Color.rgb(227, 181, 90)
  private val ivory = Color.rgb(248, 244, 235)
  private val secondary = Color.rgb(199, 190, 209)
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  private var backgroundBitmap: Bitmap? = null

  fun draw(
    context: Context,
    snapshot: Snapshot?,
    now: Long,
    progress: ProgressState?,
    showStaticCountdown: Boolean,
    horizontal: Boolean = false,
  ): Bitmap {
    val height = if (horizontal) H_HORIZONTAL else H_REGULAR
    val bitmap = Bitmap.createBitmap(W, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)

    drawBackground(context, canvas, height)
    drawGeometryMotif(canvas, height, horizontal)

    if (snapshot == null || progress == null) {
      drawEmptyState(canvas, height, horizontal)
      return bitmap
    }

    val day = if (now >= snapshot.tomorrow.start) snapshot.tomorrow else snapshot.today
    val activeKey = activePrayerKey(day, now)

    if (horizontal) {
      drawCompactMedium(canvas, day, activeKey, progress, now, showStaticCountdown)
    } else {
      drawMedium(canvas, day, activeKey, progress, now, showStaticCountdown)
    }
    return bitmap
  }

  private fun drawBackground(context: Context, canvas: Canvas, height: Int) {
    paint.shader = null
    paint.style = Paint.Style.FILL

    val source = backgroundBitmap ?: BitmapFactory.decodeResource(
      context.resources,
      R.drawable.home_mosque_sunset,
    )?.also { backgroundBitmap = it }

    if (source != null && source.width > 0 && source.height > 0) {
      val targetRatio = W.toFloat() / height.toFloat()
      val sourceRatio = source.width.toFloat() / source.height.toFloat()
      val sourceRect = if (sourceRatio > targetRatio) {
        val cropWidth = (source.height * targetRatio).toInt().coerceAtLeast(1)
        val left = ((source.width - cropWidth) / 2).coerceAtLeast(0)
        Rect(left, 0, (left + cropWidth).coerceAtMost(source.width), source.height)
      } else {
        val cropHeight = (source.width / targetRatio).toInt().coerceAtLeast(1)
        val top = ((source.height - cropHeight) / 2).coerceAtLeast(0)
        Rect(0, top, source.width, (top + cropHeight).coerceAtMost(source.height))
      }
      canvas.drawBitmap(source, sourceRect, RectF(0f, 0f, W.toFloat(), height.toFloat()), paint)
    } else {
      paint.color = surface
      canvas.drawRect(0f, 0f, W.toFloat(), height.toFloat(), paint)
    }

    // iOS: image + black 0.68 + OUMMAH surface 0.82.
    paint.color = Color.argb(173, 0, 0, 0)
    canvas.drawRect(0f, 0f, W.toFloat(), height.toFloat(), paint)
    paint.color = Color.argb(209, Color.red(surface), Color.green(surface), Color.blue(surface))
    canvas.drawRect(0f, 0f, W.toFloat(), height.toFloat(), paint)
  }

  private fun drawGeometryMotif(canvas: Canvas, height: Int, horizontal: Boolean) {
    val motifColor = Color.argb(
      if (horizontal) 38 else 44,
      Color.red(gold),
      Color.green(gold),
      Color.blue(gold),
    )
    text(
      canvas,
      "لا إله إلا الله",
      W / 2f,
      if (horizontal) height * 0.63f else height * 0.58f,
      if (horizontal) 112f else 164f,
      motifColor,
      serif = true,
    )
  }

  private fun drawEmptyState(canvas: Canvas, height: Int, horizontal: Boolean) {
    text(canvas, "☾", W / 2f, height * 0.39f, if (horizontal) 48f else 58f, gold, serif = true)
    text(
      canvas,
      "Ouvrez OUMMAH pour synchroniser les horaires",
      W / 2f,
      height * 0.56f,
      if (horizontal) 31f else 38f,
      ivory,
      serif = true,
      bold = true,
    )
  }

  /** Android 5x2 layout, visually aligned with the validated iOS systemMedium widget. */
  private fun drawMedium(
    canvas: Canvas,
    day: Day,
    activeKey: String?,
    progress: ProgressState,
    now: Long,
    showStaticCountdown: Boolean,
  ) {
    // Header
    text(canvas, "☾", 48f, 52f, 43f, gold, serif = true, align = Paint.Align.LEFT)
    text(canvas, day.hijri, 102f, 50f, 36f, secondary, serif = true, align = Paint.Align.LEFT)
    text(canvas, "OUMMAH", W - 42f, 50f, 36f, gold, serif = true, align = Paint.Align.RIGHT, bold = true)

    // Next prayer block
    text(canvas, "Prochaine prière", W / 2f, 96f, 36f, secondary, bold = true)
    text(
      canvas,
      "${label(progress.next).uppercase()}  ·  ${progress.next?.time ?: "—"}",
      W / 2f,
      157f,
      68f,
      gold,
      serif = true,
      bold = true,
    )
    text(canvas, "dans", W / 2f, 198f, 36f, secondary, bold = true)
    if (showStaticCountdown) {
      text(canvas, countdown(progress.next?.timestamp, now), W / 2f, 284f, 84f, ivory, bold = true)
    }

    // Prayer-to-prayer progress
    drawProgress(
      canvas = canvas,
      progress = progress,
      y = 338f,
      barLeft = 420f,
      barRight = W - 420f,
      labelSize = 38f,
      barHeight = 12f,
      markerRadius = 16f,
    )

    // Fine separator just like iOS.
    paint.shader = null
    paint.style = Paint.Style.FILL
    paint.color = Color.argb(46, Color.red(gold), Color.green(gold), Color.blue(gold))
    canvas.drawRect(34f, 382f, W - 34f, 386f, paint)

    text(canvas, "Prière actuelle", W / 2f, 428f, 38f, secondary, serif = true, bold = true)
    drawPrayerRow(
      canvas = canvas,
      day = day,
      activeKey = activeKey,
      iconY = 505f,
      labelY = 560f,
      timeY = 626f,
      compact = false,
    )
  }

  /** Android 5x1 layout: same iOS visual language, compressed for the shorter Android family. */
  private fun drawCompactMedium(
    canvas: Canvas,
    day: Day,
    activeKey: String?,
    progress: ProgressState,
    now: Long,
    showStaticCountdown: Boolean,
  ) {
    text(canvas, "☾", 35f, 35f, 29f, gold, serif = true, align = Paint.Align.LEFT)
    text(canvas, day.hijri, 73f, 34f, 24f, secondary, serif = true, align = Paint.Align.LEFT)
    text(canvas, "OUMMAH", W - 34f, 34f, 25f, gold, serif = true, align = Paint.Align.RIGHT, bold = true)

    text(canvas, "Prochaine prière", W / 2f, 68f, 23f, secondary, bold = true)
    text(
      canvas,
      "${label(progress.next).uppercase()}  ·  ${progress.next?.time ?: "—"}",
      W / 2f,
      108f,
      43f,
      gold,
      serif = true,
      bold = true,
    )
    text(canvas, "dans", W / 2f, 136f, 22f, secondary, bold = true)
    if (showStaticCountdown) {
      text(canvas, countdown(progress.next?.timestamp, now), W / 2f, 185f, 45f, ivory, bold = true)
    }

    drawProgress(
      canvas = canvas,
      progress = progress,
      y = 209f,
      barLeft = 390f,
      barRight = W - 390f,
      labelSize = 24f,
      barHeight = 8f,
      markerRadius = 11f,
    )

    paint.shader = null
    paint.style = Paint.Style.FILL
    paint.color = Color.argb(46, Color.red(gold), Color.green(gold), Color.blue(gold))
    canvas.drawRect(28f, 232f, W - 28f, 234f, paint)

    text(canvas, "Prière actuelle", W / 2f, 260f, 24f, secondary, serif = true, bold = true)
    drawPrayerRow(
      canvas = canvas,
      day = day,
      activeKey = activeKey,
      iconY = 294f,
      labelY = 322f,
      timeY = 351f,
      compact = true,
    )
  }

  private fun drawProgress(
    canvas: Canvas,
    progress: ProgressState,
    y: Float,
    barLeft: Float,
    barRight: Float,
    labelSize: Float,
    barHeight: Float,
    markerRadius: Float,
  ) {
    text(
      canvas,
      "${label(progress.previous).uppercase()}  ${progress.previous?.time ?: "—"}",
      38f,
      y + 6f,
      labelSize,
      secondary,
      align = Paint.Align.LEFT,
      bold = true,
      widthScale = 1.12f,
    )
    text(
      canvas,
      "${label(progress.next).uppercase()}  ${progress.next?.time ?: "—"}",
      W - 38f,
      y + 6f,
      labelSize,
      secondary,
      align = Paint.Align.RIGHT,
      bold = true,
      widthScale = 1.12f,
    )

    val top = y - barHeight / 2f
    val bottom = y + barHeight / 2f
    paint.shader = null
    paint.style = Paint.Style.FILL
    paint.color = Color.argb(56, Color.red(gold), Color.green(gold), Color.blue(gold))
    canvas.drawRoundRect(RectF(barLeft, top, barRight, bottom), barHeight / 2f, barHeight / 2f, paint)

    val marker = barLeft + (barRight - barLeft) * progress.progress.coerceIn(0f, 1f)
    paint.color = gold
    canvas.drawRoundRect(RectF(barLeft, top, marker.coerceAtLeast(barLeft + 3f), bottom), barHeight / 2f, barHeight / 2f, paint)
    canvas.drawCircle(marker, y, markerRadius, paint)
  }

  private fun drawPrayerRow(
    canvas: Canvas,
    day: Day,
    activeKey: String?,
    iconY: Float,
    labelY: Float,
    timeY: Float,
    compact: Boolean,
  ) {
    val byKey = day.prayers.associateBy { it.key }
    val items = listOf(
      Triple(byKey["Fajr"], "☁", "Fajr"),
      Triple(byKey["Dhuhr"], "☀", "Dhohr"),
      Triple(byKey["Asr"], "☀", "Asr"),
      Triple(byKey["Maghrib"], "☁", "Maghrib"),
      Triple(byKey["Isha"], "☾", "Isha"),
    )
    val step = W / items.size.toFloat()

    items.forEachIndexed { index, (prayer, icon, displayLabel) ->
      prayer ?: return@forEachIndexed
      val x = step * (index + 0.5f)
      val active = prayer.key == activeKey
      val color = if (active) gold else ivory
      val iconSize = if (compact) {
        if (active) 33f else 29f
      } else {
        if (active) 80f else 71f
      }
      val labelSize = if (compact) {
        if (active) 23f else 21f
      } else {
        if (active) 48f else 44f
      }
      val timeSize = if (compact) {
        if (active) 29f else 27f
      } else {
        if (active) 68f else 64f
      }

      text(canvas, icon, x, iconY, iconSize, color, serif = true, bold = active)
      text(canvas, displayLabel.uppercase(), x, labelY, labelSize, color, bold = true, widthScale = 1.18f)
      text(canvas, prayer.time, x, timeY, timeSize, color, bold = true, widthScale = 1.18f)
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

  private fun text(
    canvas: Canvas,
    value: String,
    x: Float,
    y: Float,
    size: Float,
    color: Int,
    serif: Boolean = false,
    align: Paint.Align = Paint.Align.CENTER,
    bold: Boolean = false,
    widthScale: Float = 1f,
  ) {
    paint.shader = null
    paint.typeface = Typeface.create(
      if (serif) "serif" else "sans-serif",
      if (bold) Typeface.BOLD else Typeface.NORMAL,
    )
    paint.textAlign = align
    paint.textSize = size
    paint.textScaleX = widthScale
    paint.color = color
    paint.style = Paint.Style.FILL
    canvas.drawText(value, x, y, paint)
  }
}
