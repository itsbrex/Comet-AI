import Cocoa
import FlutterMacOS
import window_manager_plus

class MainFlutterWindow: NSWindow {
    override func awakeFromNib() {
        let flutterViewController = FlutterViewController()
        let windowFrame = self.frame
        self.contentViewController = flutterViewController
        self.setFrame(windowFrame, display: true)
        
        RegisterGeneratedPlugins(registry: flutterViewController)
        
        let intentChannel = FlutterMethodChannel(
            name: "com.comet_ai_com.comet_ai.intent_data",
            binaryMessenger: flutterViewController.engine.binaryMessenger
        )
        
        intentChannel.setMethodCallHandler { (call: FlutterMethodCall, result: @escaping FlutterResult) in
            if call.method == "getIntentData" {
                // On macOS, we can return nil or an empty string if no specific intent/launch arg is found
                result("") 
            } else {
                result(FlutterMethodNotImplemented)
            }
        }
        
        WindowManagerPlusPlugin.RegisterGeneratedPlugins = RegisterGeneratedPlugins
        
        super.awakeFromNib()
    }
    
    override public func order(_ place: NSWindow.OrderingMode, relativeTo otherWin: Int) {
        super.order(place, relativeTo: otherWin)
        hiddenWindowAtLaunch()
    }
}
