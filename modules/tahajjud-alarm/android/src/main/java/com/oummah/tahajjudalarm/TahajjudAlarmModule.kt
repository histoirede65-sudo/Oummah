package com.oummah.tahajjudalarm

import android.content.Intent
import android.provider.AlarmClock
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

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
