import Foundation
import LocalAuthentication

func argumentValue(_ flag: String) -> String? {
    guard let index = CommandLine.arguments.firstIndex(of: flag),
          index + 1 < CommandLine.arguments.count else {
        return nil
    }
    return CommandLine.arguments[index + 1]
}

func emit(_ payload: [String: Any]) {
    if let data = try? JSONSerialization.data(withJSONObject: payload, options: []),
       let json = String(data: data, encoding: .utf8) {
        FileHandle.standardOutput.write(Data(json.utf8))
    } else {
        FileHandle.standardOutput.write(Data("{\"supported\":false,\"approved\":false,\"error\":\"serialization_failed\"}".utf8))
    }
}

let reason = argumentValue("--reason") ?? "Approve this action in Comet-AI."
let risk = argumentValue("--risk") ?? "medium"

let context = LAContext()
context.localizedCancelTitle = "Deny"
context.localizedFallbackTitle = "Use Password"

var authError: NSError?
guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &authError) else {
    emit([
        "supported": false,
        "approved": false,
        "mode": "macos-device-owner-auth",
        "error": authError?.localizedDescription ?? "Device owner authentication is unavailable."
    ])
    exit(0)
}

let semaphore = DispatchSemaphore(value: 0)
var payload: [String: Any] = [
    "supported": true,
    "approved": false,
    "mode": "macos-device-owner-auth",
]

let localizedReason = "\(reason) Confirm with Touch ID or your Mac password."
context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: localizedReason) { success, error in
    payload["approved"] = success
    payload["risk"] = risk
    if let error {
        payload["error"] = error.localizedDescription
    }
    semaphore.signal()
}

let timeoutResult = semaphore.wait(timeout: .now() + .seconds(90))
if timeoutResult == .timedOut {
    emit([
        "supported": true,
        "approved": false,
        "mode": "macos-device-owner-auth",
        "error": "Timed out waiting for device unlock verification."
    ])
    exit(0)
}

emit(payload)
