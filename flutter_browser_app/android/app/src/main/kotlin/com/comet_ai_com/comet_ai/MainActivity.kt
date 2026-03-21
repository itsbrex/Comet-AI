package com.comet_ai_com.comet_ai

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import android.content.Intent
import android.content.Context
import android.content.ClipboardManager
import android.content.ClipData
import android.graphics.BitmapFactory
import android.provider.MediaStore
import android.net.Uri
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
        } else if (intent.action == Intent.ACTION_PROCESS_TEXT && intent.type == "text/plain") {
            intentData = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)?.toString()
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "getIntentData" -> {
                    result.success(intentData)
                    intentData = null
                }
                "getClipboardImage" -> {
                    val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    if (clipboard.hasPrimaryClip()) {
                        val clip = clipboard.primaryClip
                        if (clip != null && clip.itemCount > 0) {
                            val item = clip.getItemAt(0)
                            val uri = item.uri
                            if (uri != null) {
                                val mimeType = contentResolver.getType(uri)
                                if (mimeType != null && mimeType.startsWith("image/")) {
                                    try {
                                        val inputStream = contentResolver.openInputStream(uri)
                                        val bytes = inputStream?.readBytes()
                                        result.success(bytes)
                                        return@setMethodCallHandler
                                    } catch (e: Exception) {
                                        result.error("CLIPBOARD_ERROR", e.message, null)
                                        return@setMethodCallHandler
                                    }
                                }
                            }
                        }
                    }
                    result.success(null)
                }
                "setClipboardImage" -> {
                    val bytes = call.arguments as? ByteArray
                    if (bytes != null) {
                        try {
                            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                            val path = MediaStore.Images.Media.insertImage(contentResolver, bitmap, "Clipboard Image", null)
                            val uri = Uri.parse(path)
                            val clip = ClipData.newUri(contentResolver, "Image", uri)
                            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            clipboard.setPrimaryClip(clip)
                            result.success(true)
                        } catch (e: Exception) {
                            result.error("CLIPBOARD_SET_ERROR", e.message, null)
                        }
                    } else {
                        result.error("INVALID_ARGUMENT", "Bytes are null", null)
                    }
                }
                else -> result.notImplemented()
            }
        }
    }
}
