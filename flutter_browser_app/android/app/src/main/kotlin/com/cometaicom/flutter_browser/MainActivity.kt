package com.cometaicom.flutter_browser

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import android.content.Intent
import android.os.Bundle

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.comet_ai_com.comet_ai.intent_data"
    private var intentData: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
        // Also notify the active channel if needed
        MethodChannel(flutterEngine?.dartExecutor?.binaryMessenger ?: return, CHANNEL)
            .invokeMethod("onIntentReceived", intentData)
    }

    private fun handleIntent(intent: Intent) {
        if (intent.action == Intent.ACTION_VIEW) {
            intentData = intent.dataString
        } else if (intent.action == Intent.ACTION_SEND && intent.type == "text/plain") {
            intentData = intent.getStringExtra(Intent.EXTRA_TEXT)
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "getIntentData") {
                result.success(intentData)
                // Clear after reading if it's a one-shot
                intentData = null
            } else {
                result.notImplemented()
            }
        }
    }
}
