import SwiftUI
import Foundation
import LocalAuthentication

@MainActor
final class NativePanelViewModel: ObservableObject {
    @Published var promptText = ""
    @Published var state: NativePanelState
    @Published var isConnected = false
    @Published var isSending = false
    @Published var statusText = "Connecting"
    @Published var compactSidebar = false

    let configuration: LaunchConfiguration
    private let decoder = JSONDecoder()
    private var pollTask: Task<Void, Never>?
    private var lastInteractionAt = Date()
    private var lastSeenUpdatedAt: Double = 0

    init(configuration: LaunchConfiguration) {
        self.configuration = configuration
        self.state = .empty(mode: configuration.mode)
        startPolling()
    }

    deinit {
        pollTask?.cancel()
    }

    func sendPrompt() {
        let trimmed = promptText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        recordInteraction()
        let optimisticMessage = NativePanelState.Message(
            id: "swift-user-\(UUID().uuidString)",
            role: "user",
            content: trimmed,
            timestamp: Date().timeIntervalSince1970 * 1000,
            thinkText: nil,
            isOcr: false,
            ocrLabel: nil,
            ocrText: nil,
            actionLogs: nil,
            mediaItems: nil
        )
        updateLocalState(
            messages: state.messages + [optimisticMessage],
            inputDraft: "",
            isLoading: true
        )
        statusText = "Sending to Comet"
        promptText = ""
        Task {
            isSending = true
            defer { isSending = false }
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/prompt", body: [
                    "prompt": trimmed,
                    "source": "swiftui-sidebar"
                ])
                statusText = "Sent to Comet"
                await refreshState()
            } catch {
                statusText = "Send failed"
                updateLocalState(isLoading: false)
            }
        }
    }

    func openPanel(_ mode: PanelMode) {
        recordInteraction()
        Task {
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/panels/open", body: [
                    "mode": mode.rawValue,
                    "relaunchIfRunning": true
                ])
            } catch {
                statusText = "Unable to open panel"
            }
        }
    }
    
    func openSettings(target: String) {
        recordInteraction()
        Task {
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/settings/open", body: ["target": target])
            } catch {
                statusText = "Unable to open settings"
            }
        }
    }
    
    func focusBrowser() {
        recordInteraction()
        Task {
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/focus-electron", body: [:])
            } catch {
                statusText = "Unable to focus browser"
            }
        }
    }

    func openExternalURL(_ urlString: String) {
        recordInteraction()
        guard let url = URL(string: urlString) else { return }
        NSWorkspace.shared.open(url)
    }

    func copyClipboardItem(_ text: String) {
        recordInteraction()
        Task {
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/clipboard/copy", body: ["text": text])
                statusText = "Copied"
            } catch {
                statusText = "Copy failed"
            }
        }
    }

    func clearClipboardHistory() {
        recordInteraction()
        Task {
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/clipboard/clear", body: [:])
                statusText = "Clipboard cleared"
                await refreshState()
            } catch {
                statusText = "Clear failed"
            }
        }
    }

    func openDownload(path: String?) {
        guard let path, !path.isEmpty else { return }
        recordInteraction()
        Task {
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/downloads/open", body: ["path": path])
            } catch {
                statusText = "Unable to open file"
            }
        }
    }

    func revealDownload(path: String?) {
        guard let path, !path.isEmpty else { return }
        recordInteraction()
        Task {
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/downloads/reveal", body: ["path": path])
            } catch {
                statusText = "Unable to reveal file"
            }
        }
    }

    func setPreference(key: String, value: String) {
        recordInteraction()
        Task {
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/preferences", body: [key: value])
                await refreshState()
            } catch {
                statusText = "Preference update failed"
            }
        }
    }

    func setPreference(key: String, value: Bool) {
        recordInteraction()
        Task {
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/preferences", body: [key: value])
                await refreshState()
            } catch {
                statusText = "Preference update failed"
            }
        }
    }

    func conversationAction(_ action: String, id: String? = nil) {
        recordInteraction()
        Task {
            do {
                var payload: [String: Any] = ["action": action]
                if let id {
                    payload["id"] = id
                }
                _ = try await sendJSONRequest(path: "/native-mac-ui/conversations/action", body: payload)
                statusText = action == "new" ? "New chat ready" : "Conversation updated"
            } catch {
                statusText = "Conversation action failed"
            }
        }
    }

    func exportSession(_ format: String) {
        recordInteraction()
        Task {
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/export", body: ["format": format])
                statusText = format == "pdf" ? "Exporting PDF" : "Exporting text"
            } catch {
                statusText = "Export failed"
            }
        }
    }

    func respondToApproval(_ requestId: String, allowed: Bool, deviceUnlockValidated: Bool = false) {
        recordInteraction()
        Task {
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/approval/respond", body: [
                    "requestId": requestId,
                    "allowed": allowed,
                    "deviceUnlockValidated": deviceUnlockValidated
                ])
                statusText = allowed ? "Approved" : "Denied"
                await refreshState()
            } catch {
                statusText = "Approval failed"
            }
        }
    }

    func verifyDeviceOwnerApproval(reason: String, command: String, risk: String) async -> (approved: Bool, error: String?) {
        let context = LAContext()
        context.localizedCancelTitle = "Deny"
        context.localizedFallbackTitle = "Use Mac Password"

        var authError: NSError?
        let policy = LAPolicy.deviceOwnerAuthentication
        guard context.canEvaluatePolicy(policy, error: &authError) else {
            return (false, authError?.localizedDescription ?? "Touch ID or Mac password authentication is unavailable.")
        }

        return await withCheckedContinuation { continuation in
            let summary = reason.trimmingCharacters(in: .whitespacesAndNewlines)
            let localizedReason = summary.isEmpty
                ? "Approve this \(risk) risk action: \(command). Confirm with Touch ID or your Mac password."
                : summary
            context.evaluatePolicy(policy, localizedReason: localizedReason) { approved, error in
                continuation.resume(returning: (approved, (error as NSError?)?.localizedDescription))
            }
        }
    }

    private func startPolling() {
        pollTask?.cancel()
        pollTask = Task {
            while !Task.isCancelled {
                await refreshState()
                
                // OPTIMIZATION: Faster polling when thinking/loading to make it feel instant
                let sleepDuration: UInt64 = state.isLoading ? 80_000_000 : 200_000_000
                try? await Task.sleep(nanoseconds: sleepDuration)
            }
        }
    }

    private func refreshState() async {
        do {
            var components = URLComponents(url: url(path: "/native-mac-ui/state"), resolvingAgainstBaseURL: false)!
            components.queryItems = [URLQueryItem(name: "mode", value: configuration.mode.rawValue)]

            var request = URLRequest(url: components.url!)
            request.addValue(configuration.token, forHTTPHeaderField: "X-Comet-Native-Token")

            let (data, _) = try await URLSession.shared.data(for: request)
            let envelope = try decoder.decode(BridgeStateEnvelope.self, from: data)

            if envelope.success, let nextState = envelope.state {
                let didReceiveFreshState = nextState.updatedAt != lastSeenUpdatedAt
                let shouldExpand = didReceiveFreshState || nextState.isLoading
                
                // Only update if something changed to reduce UI re-rendering
                if didReceiveFreshState || nextState.isLoading != state.isLoading {
                    state = nextState
                }
                
                if promptText.isEmpty, !nextState.inputDraft.isEmpty {
                    promptText = nextState.inputDraft
                }
                if shouldExpand {
                    recordInteraction(expandOnly: true)
                }
                updateSidebarPresentation(using: nextState)
                lastSeenUpdatedAt = nextState.updatedAt
                isConnected = true
                statusText = nextState.isLoading ? "Comet is thinking" : "Connected"
            } else {
                isConnected = false
                statusText = envelope.error ?? ""
            }
        } catch {
            isConnected = false
            statusText = ""
        }
    }

    func sendJSONRequest(path: String, body: [String: Any]) async throws -> Data {
        var request = URLRequest(url: url(path: path))
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue(configuration.token, forHTTPHeaderField: "X-Comet-Native-Token")
        request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        let (data, _) = try await URLSession.shared.data(for: request)
        return data
    }

    private func updateLocalState(
        messages: [NativePanelState.Message]? = nil,
        inputDraft: String? = nil,
        isLoading: Bool? = nil
    ) {
        let current = state
        state = NativePanelState(
            mode: current.mode,
            updatedAt: Date().timeIntervalSince1970 * 1000,
            inputDraft: inputDraft ?? current.inputDraft,
            isLoading: isLoading ?? current.isLoading,
            error: current.error,
            themeAppearance: current.themeAppearance,
            messages: messages ?? current.messages,
            actionChain: current.actionChain,
            currentCommandIndex: current.currentCommandIndex,
            activityTags: current.activityTags,
            conversations: current.conversations,
            activeConversationId: current.activeConversationId,
            downloads: current.downloads,
            clipboardItems: current.clipboardItems,
            preferences: current.preferences,
            pendingApproval: current.pendingApproval,
            terminalLogs: current.terminalLogs,
            actionLogs: current.actionLogs
        )
    }

    private func recordInteraction(expandOnly: Bool = false) {
        lastInteractionAt = Date()
        compactSidebar = false
        if !expandOnly {
            statusText = state.isLoading ? "Comet is thinking" : statusText
        }
    }

    private func updateSidebarPresentation(using nextState: NativePanelState) {
        guard configuration.mode == .sidebar else {
            compactSidebar = false
            return
        }

        let autoMinimize = nextState.preferences?.sidebarAutoMinimize ?? false
        let hasDraft = !promptText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty

        guard autoMinimize, !nextState.isLoading, !hasDraft else {
            compactSidebar = false
            return
        }

        let idleTime = Date().timeIntervalSince(lastInteractionAt)
        compactSidebar = idleTime > 14 && !nextState.messages.isEmpty
    }

    private func url(path: String) -> URL {
        let normalizedBase = configuration.bridgeURL.absoluteString.hasSuffix("/") ? configuration.bridgeURL.absoluteString : configuration.bridgeURL.absoluteString + "/"
        let normalizedPath = path.hasPrefix("/") ? String(path.dropFirst()) : path
        return URL(string: normalizedPath, relativeTo: URL(string: normalizedBase))!.absoluteURL
    }

    func noteInteraction() {
        recordInteraction()
    }

    var themeColorScheme: ColorScheme {
        state.themeAppearance == "light" ? .light : .dark
    }
}
