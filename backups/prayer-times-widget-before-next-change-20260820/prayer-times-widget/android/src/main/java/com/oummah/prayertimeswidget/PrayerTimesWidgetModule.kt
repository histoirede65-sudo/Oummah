package com.oummah.prayertimeswidget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.*
import android.net.Uri
import android.os.Build
import android.widget.RemoteViews
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject

private const val PREFS = "oummah.prayer_times_widget"
private const val PAYLOAD = "payload"
private const val REFRESH = "com.oummah.app.widget.REFRESH"

private data class Prayer(val key: String, val label: String, val time: String, val timestamp: Long)
private data class Day(val start: Long, val french: String, val hijri: String, val prayers: List<Prayer>, val sunrise: Prayer)
private data class Snapshot(val today: Day, val tomorrow: Day)

class PrayerTimesWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PrayerTimesWidget")
    AsyncFunction("publish") { payload: String ->
      val context = appContext.reactContext?.applicationContext
        ?: throw IllegalStateException("React context unavailable")
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(PAYLOAD, payload).apply()
      PrayerTimesWidgetProvider.refresh(context)
    }
  }
}

class PrayerTimesWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) = refresh(context, ids)
  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action in setOf(REFRESH, Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_DATE_CHANGED, Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED)) refresh(context)
  }

  companion object {
    fun refresh(context: Context, ids: IntArray? = null) {
      val manager = AppWidgetManager.getInstance(context)
      val widgetIds = ids ?: manager.getAppWidgetIds(ComponentName(context, PrayerTimesWidgetProvider::class.java))
      val snapshot = load(context)
      widgetIds.forEach { id ->
        RemoteViews(context.packageName, R.layout.prayer_times_widget).also { views ->
          views.setImageViewBitmap(R.id.prayer_widget_art, WidgetArt.draw(snapshot))
          views.setOnClickPendingIntent(R.id.prayer_widget_art, openApp(context))
          manager.updateAppWidget(id, views)
        }
      }
      schedule(context, snapshot)
    }

    private fun load(context: Context): Snapshot? = runCatching {
      val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(PAYLOAD, null) ?: return null
      val root = JSONObject(raw)
      Snapshot(day(root.getJSONObject("today")), day(root.getJSONObject("tomorrow")))
    }.getOrNull()

    private fun day(json: JSONObject): Day {
      fun prayer(value: JSONObject) = Prayer(value.optString("key"), value.getString("label"), value.getString("time"), value.getLong("timestamp"))
      val prayers = json.getJSONArray("prayers").let { list -> List(list.length()) { prayer(list.getJSONObject(it)) } }
      return Day(json.getLong("startTimestamp"), json.getString("frenchDate"), json.getString("hijriDate"), prayers, prayer(json.getJSONObject("sunrise")))
    }

    private fun openApp(context: Context): PendingIntent {
      val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
        action = Intent.ACTION_VIEW
        data = Uri.parse("oummah:///")
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      } ?: Intent(Intent.ACTION_VIEW, Uri.parse("oummah:///"))
      return PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun schedule(context: Context, snapshot: Snapshot?) {
      val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val pending = PendingIntent.getBroadcast(context, 9151, Intent(context, PrayerTimesWidgetProvider::class.java).setAction(REFRESH), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      alarm.cancel(pending)
      val next = snapshot?.let { nextRefresh(it, System.currentTimeMillis()) } ?: return
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarm.canScheduleExactAlarms()) alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pending)
      else alarm.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pending)
    }

    private fun nextRefresh(snapshot: Snapshot, now: Long): Long? = buildList {
      listOf(snapshot.today, snapshot.tomorrow).forEach { day ->
        if (day.start > now) add(day.start)
        day.prayers.filter { it.timestamp > now }.forEach { add(it.timestamp) }
      }
    }.minOrNull()?.plus(100)
  }
}

private object WidgetArt {
  private const val W = 1400
  private const val H = 720
  private val gold = Color.rgb(238, 183, 64)
  private val ivory = Color.rgb(255, 248, 236)
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)

  fun draw(snapshot: Snapshot?): Bitmap {
    val bitmap = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    paint.shader = LinearGradient(0f, 0f, W.toFloat(), H.toFloat(), Color.rgb(8, 18, 36), Color.rgb(47, 25, 12), Shader.TileMode.CLAMP)
    canvas.drawRect(0f, 0f, W.toFloat(), H.toFloat(), paint); paint.shader = null
    drawMosqueBackdrop(canvas)
    paint.color = Color.argb(180, 0, 0, 0); canvas.drawRoundRect(RectF(25f, 22f, W - 25f, H - 22f), 60f, 60f, paint)
    paint.style = Paint.Style.STROKE; paint.strokeWidth = 3f; paint.color = Color.argb(150, 255, 242, 211); canvas.drawRoundRect(RectF(25f, 22f, W - 25f, H - 22f), 60f, 60f, paint)
    paint.strokeWidth = 19f; paint.color = Color.argb(100, 108, 70, 20); canvas.drawOval(RectF(112f, 190f, W - 112f, 548f), paint)
    paint.strokeWidth = 8f; paint.color = gold; canvas.drawOval(RectF(112f, 190f, W - 112f, 548f), paint); paint.style = Paint.Style.FILL
    if (snapshot == null) { text(canvas, "Ouvrez OUMMAH pour synchroniser les horaires", W / 2f, H / 2f, 42f, ivory); return bitmap }
    val now = System.currentTimeMillis(); val day = if (now >= snapshot.tomorrow.start) snapshot.tomorrow else snapshot.today
    val next = next(snapshot, day, now)?.key
    text(canvas, day.french, W / 2f, 360f, 46f, gold, true); text(canvas, day.hijri, W / 2f, 414f, 39f, ivory, true); text(canvas, "OUMMAH", W / 2f, 652f, 34f, gold, true)
    val byKey = day.prayers.associateBy { it.key }
    listOf(day.sunrise to Triple(265f, 196f, 0), byKey["Dhuhr"] to Triple(700f, 92f, 0), byKey["Asr"] to Triple(1100f, 196f, 0), byKey["Fajr"] to Triple(170f, 475f, 1), byKey["Maghrib"] to Triple(1230f, 475f, 1), byKey["Isha"] to Triple(700f, 570f, 2)).forEach { (prayer, place) ->
      prayer ?: return@forEach; val (x, y, icon) = place; val active = prayer.key == next
      if (active) { paint.color = Color.argb(70, 255, 193, 49); canvas.drawCircle(x, y, 84f, paint); paint.color = Color.argb(130, 255, 191, 47); canvas.drawCircle(x, y, 66f, paint) }
      paint.color = if (active) Color.rgb(255, 192, 44) else Color.rgb(12, 12, 19); canvas.drawCircle(x, y, 48f, paint)
      paint.style = Paint.Style.STROKE; paint.strokeWidth = if (active) 5f else 3f; paint.color = gold; canvas.drawCircle(x, y, 48f, paint); paint.style = Paint.Style.FILL
      drawIcon(canvas, x, y, icon); text(canvas, prayer.label, x, y - 67f, 33f, if (active) gold else ivory, true); text(canvas, prayer.time, x, y + 91f, 34f, if (active) gold else ivory)
    }
    return bitmap
  }

  private fun next(snapshot: Snapshot, day: Day, now: Long): Prayer? = (day.prayers + if (day === snapshot.today) snapshot.tomorrow.prayers else emptyList()).filter { it.timestamp > now }.minByOrNull { it.timestamp }
  private fun drawMosqueBackdrop(canvas: Canvas) {
    paint.color = Color.argb(105, 0, 0, 0)
    canvas.drawRect(0f, 410f, W.toFloat(), H.toFloat(), paint)
    paint.color = Color.argb(115, 20, 12, 8)
    canvas.drawRect(60f, 320f, W - 60f, 505f, paint)
    canvas.drawCircle(W / 2f, 320f, 150f, paint)
    canvas.drawCircle(W / 2f - 205f, 370f, 85f, paint)
    canvas.drawCircle(W / 2f + 205f, 370f, 85f, paint)
    listOf(145f, 315f, 1085f, 1255f).forEachIndexed { index, x ->
      val top = if (index % 2 == 0) 135f else 205f
      canvas.drawRect(x - 18f, top, x + 18f, 495f, paint)
      canvas.drawCircle(x, top, 35f, paint)
      canvas.drawRect(x - 4f, top - 54f, x + 4f, top - 15f, paint)
    }
    paint.color = Color.argb(55, 238, 183, 64)
    canvas.drawRect(0f, 506f, W.toFloat(), 510f, paint)
  }
  private fun drawIcon(canvas: Canvas, x: Float, y: Float, icon: Int) {
    paint.color = ivory; paint.style = Paint.Style.STROKE; paint.strokeWidth = 3f
    when (icon) {
      0 -> {
        canvas.drawCircle(x, y, 13f, paint)
        repeat(8) { index ->
          val angle = Math.PI * index / 4
          val dx = kotlin.math.cos(angle).toFloat(); val dy = kotlin.math.sin(angle).toFloat()
          canvas.drawLine(x + dx * 20f, y + dy * 20f, x + dx * 28f, y + dy * 28f, paint)
        }
      }
      1 -> {
        canvas.drawCircle(x - 9f, y + 4f, 9f, paint); canvas.drawCircle(x + 4f, y - 2f, 12f, paint)
        canvas.drawArc(RectF(x - 25f, y - 2f, x + 25f, y + 23f), 200f, 140f, false, paint)
      }
      else -> {
        canvas.drawCircle(x - 4f, y, 17f, paint)
        paint.color = Color.rgb(12, 12, 19); paint.style = Paint.Style.FILL
        canvas.drawCircle(x + 5f, y - 7f, 17f, paint)
      }
    }
    paint.style = Paint.Style.FILL
  }
  private fun text(canvas: Canvas, value: String, x: Float, y: Float, size: Float, color: Int, serif: Boolean = false) { paint.typeface = Typeface.create(if (serif) "serif" else "sans-serif", Typeface.NORMAL); paint.textAlign = Paint.Align.CENTER; paint.textSize = size; paint.color = color; paint.style = Paint.Style.FILL; canvas.drawText(value, x, y, paint) }
}
