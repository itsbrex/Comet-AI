package com.comet_ai_com.comet_ai

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.net.Uri

class CometAISearchWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.search_widget)
            
            // PendingIntent to launch the app and trigger search
            val intent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = Uri.parse("comet-ai://search")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            val pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            // Mic PendingIntent
            val micIntent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = Uri.parse("comet-ai://voice")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            val micPendingIntent = PendingIntent.getActivity(context, 1, micIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            views.setOnClickPendingIntent(R.id.widget_mic, micPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}

class CometAIWeatherWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences("HomeWidgetPreferences", Context.MODE_PRIVATE)
        val location = prefs.getString("weather_location", "San Francisco") ?: "San Francisco"
        val unit = prefs.getString("weather_unit", "C") ?: "C"
        
        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.weather_widget)
            views.setTextViewText(R.id.weather_city, location)
            views.setTextViewText(R.id.weather_temp, "24°$unit")
            
            // PendingIntent to launch the app
            val intent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = Uri.parse("comet-ai://home")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            val pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            views.setOnClickPendingIntent(R.id.weather_icon, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}

class CometAIDesktopWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences("HomeWidgetPreferences", Context.MODE_PRIVATE)
        val isConnected = prefs.getBoolean("is_desktop_connected", false)
        val status = if (isConnected) "Connected" else "Not Connected"

        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.desktop_control_widget)
            views.setTextViewText(R.id.desktop_status, status)
            
            // Terminal PendingIntent
            val terminalIntent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = Uri.parse("comet-ai://terminal")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            val terminalPendingIntent = PendingIntent.getActivity(context, 10, terminalIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            views.setOnClickPendingIntent(R.id.btn_terminal, terminalPendingIntent)

            // Connect/Sync PendingIntent
            val syncIntent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = Uri.parse("comet-ai://connect")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            val syncPendingIntent = PendingIntent.getActivity(context, 11, syncIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            views.setOnClickPendingIntent(R.id.btn_sync, syncPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
