package com.oummah.tahajjudalarm

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.AlarmClock
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private fun openSettings(context: Context, intent: Intent): Boolean {
  if (context !is android.app.Activity) intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
  return try {
    context.startActivity(intent)
    true
  } catch (_: Exception) {
    false
  }
}

/**
 * Adds an alarm to the phone's Clock app (a real alarm: rings in silent mode, until dismissed).
 * React Native's Linking.sendIntent sends numbers as doubles, which the Clock app ignores: hour and
 * minutes must be Int extras.
 */
class TahajjudAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TahajjudAlarm")

    AsyncFunction("setSystemAlarm") { hour: Int, minute: Int, message: String ->
      val context = appContext.currentActivity ?: appContext.reactContext ?: return@AsyncFunction false
      val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
        putExtra(AlarmClock.EXTRA_HOUR, hour)
        putExtra(AlarmClock.EXTRA_MINUTES, minute)
        putExtra(AlarmClock.EXTRA_MESSAGE, message)
        putExtra(AlarmClock.EXTRA_SKIP_UI, false)
        if (appContext.currentActivity == null) addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      if (intent.resolveActivity(context.packageManager) == null) return@AsyncFunction false
      context.startActivity(intent)
      true
    }

    /**
     * Android 12+: without « Alarmes et rappels », scheduled notifications (adhan, Qiyam…) become
     * inexact and can arrive several minutes late while the phone sleeps.
     */
    Function("canScheduleExactAlarms") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return@Function true
      val context = appContext.reactContext ?: return@Function true
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      alarmManager.canScheduleExactAlarms()
    }

    AsyncFunction("openExactAlarmSettings") {
      val context = appContext.currentActivity ?: appContext.reactContext ?: return@AsyncFunction false
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}"))
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))
      }
      openSettings(context, intent)
    }

    /** Battery optimisation lets some phones (Xiaomi, Samsung, Huawei…) drop or delay alerts. */
    Function("isIgnoringBatteryOptimizations") {
      val context = appContext.reactContext ?: return@Function true
      val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      powerManager.isIgnoringBatteryOptimizations(context.packageName)
    }

    AsyncFunction("openBatteryOptimizationSettings") {
      val context = appContext.currentActivity ?: appContext.reactContext ?: return@AsyncFunction false
      openSettings(context, Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)) ||
        openSettings(context, Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}")))
    }

    /** Stores the nights computed by the app and refreshes the Tahajjud widget. */
    AsyncFunction("publishWidget") { payload: String ->
      val context = appContext.reactContext?.applicationContext ?: return@AsyncFunction
      context.getSharedPreferences(TAHAJJUD_PREFS, android.content.Context.MODE_PRIVATE)
        .edit()
        .putString(TAHAJJUD_PAYLOAD, payload)
        .apply()
      TahajjudWidgetProvider.refresh(context)
    }
  }
}
