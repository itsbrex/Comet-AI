import SwiftUI
import AppKit
import Foundation
import LocalAuthentication
import QuartzCore
import WebKit

enum PanelMode: String, CaseIterable {
    case sidebar
    case actionChain = "action-chain"
    case menu
    case settings
    case downloads
    case clipboard
    case permissions

    var title: String {
        switch self {
        case .sidebar: return "Comet AI Sidebar"
        case .actionChain: return "Comet Action Chain"
        case .menu: return "Comet Command Center"
        case .settings: return "Comet Settings"
        case .downloads: return "Comet Downloads"
        case .clipboard: return "Comet Clipboard"
        case .permissions: return "Comet Approval"
        }
    }

    var symbol: String {
        switch self {
        case .sidebar: return "sparkles.rectangle.stack"
        case .actionChain: return "point.3.filled.connected.trianglepath.dotted"
        case .menu: return "square.grid.2x2"
        case .settings: return "slider.horizontal.3"
        case .downloads: return "arrow.down.circle"
        case .clipboard: return "doc.on.clipboard"
        case .permissions: return "lock.shield"
        }
    }

    var defaultSize: CGSize {
        switch self {
        case .sidebar: return CGSize(width: 430, height: 840)
        case .actionChain: return CGSize(width: 420, height: 720)
        case .menu: return CGSize(width: 420, height: 520)
        case .settings: return CGSize(width: 500, height: 720)
        case .downloads: return CGSize(width: 480, height: 680)
        case .clipboard: return CGSize(width: 470, height: 700)
        case .permissions: return CGSize(width: 430, height: 620)
        }
    }
}

struct LaunchConfiguration {
    let mode: PanelMode
    let bridgeURL: URL
    let token: String
    let appName: String
    let iconPath: String?

    static func parse() -> LaunchConfiguration {
        let args = CommandLine.arguments

        func value(for key: String) -> String? {
            guard let index = args.firstIndex(of: key), args.indices.contains(index + 1) else {
                return nil
            }
            return args[index + 1]
        }

        let mode = PanelMode(rawValue: value(for: "--mode") ?? "sidebar") ?? .sidebar
        let bridgeURL = URL(string: value(for: "--bridge-url") ?? "http://127.0.0.1:46203")!
        let token = value(for: "--token") ?? ""
        let appName = value(for: "--app-name") ?? "Comet-AI"
        let iconPath = value(for: "--icon-path")

        return LaunchConfiguration(mode: mode, bridgeURL: bridgeURL, token: token, appName: appName, iconPath: iconPath)
    }
}

struct BridgeStateEnvelope: Codable {
    let success: Bool
    let state: NativePanelState?
    let error: String?
}

struct NativePanelState: Codable {
    struct ActionLog: Codable, Identifiable {
        var id: String { "\(type)-\(success)-\(output.prefix(40))" }
        let type: String
        let output: String
        let success: Bool
    }

    struct MediaItem: Codable {
        let id: String?
        let type: String
        let url: String?
        let caption: String?
        let videoUrl: String?
        let title: String?
        let description: String?
        let thumbnailUrl: String?
        let source: String?
        let videoId: String?
        let diagramId: String?
        let code: String?
        let chartId: String?
        let chartDataJSON: String?
        let chartOptionsJSON: String?

        var stableId: String {
            if let id, !id.isEmpty { return id }
            if let diagramId, !diagramId.isEmpty { return diagramId }
            if let chartId, !chartId.isEmpty { return chartId }
            if let videoId, !videoId.isEmpty { return videoId }
            if let videoUrl, !videoUrl.isEmpty { return videoUrl }
            if let url, !url.isEmpty { return url }
            let seed = code ?? chartDataJSON ?? caption ?? title ?? type
            return "\(type)-\(abs(seed.hashValue))"
        }
    }

    struct Message: Codable, Identifiable {
        let id: String
        let role: String
        let content: String
        let timestamp: Double?
        let thinkText: String?
        let isOcr: Bool?
        let ocrLabel: String?
        let ocrText: String?
        let actionLogs: [ActionLog]?
        let mediaItems: [MediaItem]?
    }

    struct Command: Codable, Identifiable {
        let id: String
        let type: String
        let value: String
        let status: String
        let category: String?
        let riskLevel: String?
    }

    struct DownloadItem: Codable, Identifiable {
        var id: String { "\(name)-\(path ?? "")" }
        let name: String
        let status: String
        let progress: Double?
        let path: String?
    }

    struct Preferences: Codable {
        let sidebarMode: String
        let actionChainMode: String
        let utilityMode: String
        let permissionMode: String
        let sidebarAutoMinimize: Bool?
        let sidebarGradientPreset: String?
        let sidebarShowQuickActions: Bool?
        let sidebarShowSessions: Bool?
        let sidebarShowSearchTags: Bool?
        let sidebarShowCommandCenterButton: Bool?
        let sidebarShowActionChainButton: Bool?
        let sidebarActionChainAutoAppear: Bool?

        static let defaults = Preferences(
            sidebarMode: "electron",
            actionChainMode: "electron",
            utilityMode: "electron",
            permissionMode: "electron",
            sidebarAutoMinimize: false,
            sidebarGradientPreset: "graphite",
            sidebarShowQuickActions: true,
            sidebarShowSessions: true,
            sidebarShowSearchTags: true,
            sidebarShowCommandCenterButton: true,
            sidebarShowActionChainButton: true,
            sidebarActionChainAutoAppear: false
        )
    }

    struct ConversationSummary: Codable, Identifiable {
        let id: String
        let title: String
        let updatedAt: Double
    }

    struct ApprovalState: Codable, Identifiable {
        var id: String { requestId }
        let requestId: String
        let command: String
        let risk: String
        let reason: String
        let highRiskQr: String?
        let requiresDeviceUnlock: Bool?
        let mobileApproved: Bool?
        let expectedPin: String?
        let approvedPin: String?
    }

    let mode: String
    let updatedAt: Double
    let inputDraft: String
    let isLoading: Bool
    let error: String?
    let themeAppearance: String
    let messages: [Message]
    let actionChain: [Command]
    let currentCommandIndex: Int
    let activityTags: [String]?
    let conversations: [ConversationSummary]?
    let activeConversationId: String?
    let downloads: [DownloadItem]?
    let clipboardItems: [String]?
    let preferences: Preferences?
    let pendingApproval: ApprovalState?
    let terminalLogs: [TerminalLog]?
    let actionLogs: [ActionLog]?

    struct TerminalLog: Codable, Identifiable {
        var id: String { "\(command)-\(timestamp)" }
        let command: String
        let output: String
        let success: Bool
        let timestamp: Double
    }

    static func empty(mode: PanelMode) -> NativePanelState {
        NativePanelState(
            mode: mode.rawValue,
            updatedAt: Date().timeIntervalSince1970,
            inputDraft: "",
            isLoading: false,
            error: nil,
            themeAppearance: "dark",
            messages: [],
            actionChain: [],
            currentCommandIndex: 0,
            activityTags: [],
            conversations: [],
            activeConversationId: nil,
            downloads: [],
            clipboardItems: [],
            preferences: .defaults,
            pendingApproval: nil,
            terminalLogs: [],
            actionLogs: []
        )
    }
}

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
                try? await Task.sleep(nanoseconds: 250_000_000)
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
                state = nextState
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
                statusText = envelope.error ?? "Bridge unavailable"
            }
        } catch {
            isConnected = false
            statusText = "Bridge unavailable"
        }
    }

    private func sendJSONRequest(path: String, body: [String: Any]) async throws -> Data {
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

final class NativePanelsAppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }
}

enum WindowPlacementCoordinator {
    private static var placedWindowNumbers = Set<Int>()

    static func markPlaced(window: NSWindow) {
        placedWindowNumbers.insert(window.windowNumber)
    }

    static func needsPlacement(for window: NSWindow) -> Bool {
        !placedWindowNumbers.contains(window.windowNumber)
    }
}

struct WindowConfigurator: NSViewRepresentable {
    let mode: PanelMode
    let compactSidebar: Bool
    let iconPath: String?

    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        DispatchQueue.main.async { configure(window: view.window) }
        return view
    }

    func updateNSView(_ nsView: NSView, context: Context) {
        DispatchQueue.main.async { configure(window: nsView.window) }
    }

    private func configure(window: NSWindow?) {
        guard let window else { return }
        var styleMask = window.styleMask
        styleMask.insert([.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView])
        styleMask.remove(.unifiedTitleAndToolbar)
        window.styleMask = styleMask
        window.titleVisibility = .hidden
        window.title = ""
        window.titlebarAppearsTransparent = true
        window.titlebarSeparatorStyle = .none
        window.toolbar = nil
        window.isMovableByWindowBackground = true
        window.level = mode == .sidebar ? .floating : .modalPanel
        window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .moveToActiveSpace, .transient]
        window.backgroundColor = .clear
        window.isOpaque = false
        window.hasShadow = true
        window.hidesOnDeactivate = false
        window.styleMask.insert(.fullSizeContentView)
        window.styleMask.insert(.resizable)
        window.contentView?.wantsLayer = true
        window.contentView?.layer?.backgroundColor = NSColor.clear.cgColor
        window.contentView?.superview?.wantsLayer = true
        window.contentView?.superview?.layer?.backgroundColor = NSColor.clear.cgColor
        window.contentView?.superview?.superview?.wantsLayer = true
        window.contentView?.superview?.superview?.layer?.backgroundColor = NSColor.clear.cgColor
        window.setContentBorderThickness(0, for: .minY)
        window.setContentBorderThickness(0, for: .maxY)
        let targetSize = resolvedSize
        window.minSize = NSSize(width: targetSize.width, height: targetSize.height)
        if window.contentLayoutRect.size != NSSize(width: targetSize.width, height: targetSize.height) {
            NSAnimationContext.runAnimationGroup { context in
                context.duration = 0.32
                context.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
                window.animator().setContentSize(NSSize(width: targetSize.width, height: targetSize.height))
            }
        }
        if WindowPlacementCoordinator.needsPlacement(for: window) {
            let anchoredFrame = resolvedFrame(for: window, targetSize: targetSize)
            window.setFrame(anchoredFrame, display: true)
            WindowPlacementCoordinator.markPlaced(window: window)
        }
        window.standardWindowButton(.closeButton)?.isHidden = false
        window.standardWindowButton(.miniaturizeButton)?.isHidden = false
        window.standardWindowButton(.zoomButton)?.isHidden = false
        positionTrafficLights(in: window)
        if let iconPath, let icon = NSImage(contentsOfFile: iconPath) {
            window.miniwindowImage = icon
            window.representedURL = URL(fileURLWithPath: iconPath)
            NSApp.applicationIconImage = icon
        }
        window.makeKeyAndOrderFront(nil)
        window.orderFrontRegardless()
        NSApp.activate(ignoringOtherApps: true)
    }

    private func positionTrafficLights(in window: NSWindow) {
        guard
            let closeButton = window.standardWindowButton(.closeButton),
            let miniButton = window.standardWindowButton(.miniaturizeButton),
            let zoomButton = window.standardWindowButton(.zoomButton),
            let buttonContainer = closeButton.superview
        else {
            return
        }

        let buttons = [closeButton, miniButton, zoomButton]
        let leadingInset: CGFloat = mode == .sidebar ? 18 : 16
        let topInset: CGFloat = mode == .sidebar ? 14 : 10
        let spacing: CGFloat = 8
        let targetY = buttonContainer.bounds.height - closeButton.frame.height - topInset
        var currentX = leadingInset

        for button in buttons {
            button.setFrameOrigin(NSPoint(x: currentX, y: targetY))
            button.alphaValue = 1
            currentX += button.frame.width + spacing
        }
    }

    private var resolvedSize: CGSize {
        if mode == .sidebar, compactSidebar {
            return CGSize(width: 360, height: 250)
        }
        return mode.defaultSize
    }

    private func resolvedFrame(for window: NSWindow, targetSize: CGSize) -> NSRect {
        let screen = window.screen ?? NSScreen.main ?? NSScreen.screens.first
        let visibleFrame = screen?.visibleFrame ?? NSRect(x: 0, y: 0, width: targetSize.width, height: targetSize.height)
        let margin: CGFloat = mode == .sidebar ? 24 : 28
        let x = max(visibleFrame.minX + 16, visibleFrame.maxX - targetSize.width - margin)
        let y = max(visibleFrame.minY + 16, visibleFrame.maxY - targetSize.height - margin)
        return NSRect(x: x, y: y, width: targetSize.width, height: targetSize.height)
    }
}

struct PanelShell<Content: View>: View {
    let mode: PanelMode
    let viewModel: NativePanelViewModel
    @ViewBuilder let content: Content

    private var shellMaterial: NSVisualEffectView.Material {
        switch mode {
        case .sidebar, .actionChain:
            return .sidebar
        case .menu:
            return .menu
        default:
            return .hudWindow
        }
    }

    var body: some View {
        let palette = PanelPalette(
            appearance: viewModel.state.themeAppearance,
            gradientPreset: viewModel.state.preferences?.sidebarGradientPreset
        )
        ZStack {
            LinearGradient(colors: palette.backgroundGradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()

            Circle()
                .fill(palette.accent.opacity(0.18))
                .blur(radius: 70)
                .frame(width: 220, height: 220)
                .offset(x: -130, y: -180)

            Circle()
                .fill(palette.secondaryAccent.opacity(0.14))
                .blur(radius: 80)
                .frame(width: 260, height: 260)
                .offset(x: 150, y: 210)

            VStack(spacing: 0) {
                content
            }
            .background(
                ZStack {
                    VisualEffectBackdrop(material: shellMaterial)
                    LinearGradient(colors: palette.surfaceGradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .stroke(palette.stroke, lineWidth: 1)
            )
            .shadow(color: palette.shadow, radius: mode == .sidebar ? 22 : 36, x: 0, y: mode == .sidebar ? 10 : 18)
            .padding(0)
            .ignoresSafeArea()
        }
        .background(WindowConfigurator(mode: mode, compactSidebar: viewModel.compactSidebar, iconPath: viewModel.configuration.iconPath))
        .preferredColorScheme(viewModel.themeColorScheme)
        .background(Color.clear)
        .ignoresSafeArea()
    }
}

struct PanelHeader: View {
    let title: String
    let subtitle: String
    let symbol: String
    let viewModel: NativePanelViewModel
    let trailing: AnyView?
    let showStatus: Bool

    init(title: String, subtitle: String, symbol: String, viewModel: NativePanelViewModel, trailing: AnyView? = nil, showStatus: Bool = true) {
        self.title = title
        self.subtitle = subtitle
        self.symbol = symbol
        self.viewModel = viewModel
        self.trailing = trailing
        self.showStatus = showStatus
    }

    var body: some View {
        let palette = PanelPalette(appearance: viewModel.state.themeAppearance)
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 6) {
                Label(title, systemImage: symbol)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(palette.primaryText)
                if !subtitle.isEmpty {
                    Text(subtitle)
                        .font(.system(size: 12))
                        .foregroundStyle(palette.secondaryText)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 8) {
                if showStatus {
                    ConnectionBadge(isConnected: viewModel.isConnected, text: viewModel.statusText)
                }
                if let trailing {
                    trailing
                }
            }
        }
    }
}

struct PanelPalette {
    let appearance: String
    let gradientPreset: String

    init(appearance: String, gradientPreset: String? = nil) {
        self.appearance = appearance
        self.gradientPreset = gradientPreset ?? "graphite"
    }

    var isLight: Bool { appearance == "light" }
    var backgroundGradient: [Color] {
        switch (gradientPreset, isLight) {
        case ("ocean", true):
            return [Color(red: 0.95, green: 0.98, blue: 1.0), Color(red: 0.88, green: 0.95, blue: 0.99), Color(red: 0.90, green: 0.97, blue: 0.97)]
        case ("ocean", false):
            return [Color(red: 0.03, green: 0.09, blue: 0.14), Color(red: 0.05, green: 0.14, blue: 0.24), Color(red: 0.04, green: 0.11, blue: 0.19)]
        case ("aurora", true):
            return [Color(red: 0.99, green: 0.97, blue: 1.0), Color(red: 0.94, green: 0.93, blue: 1.0), Color(red: 0.92, green: 0.98, blue: 0.97)]
        case ("aurora", false):
            return [Color(red: 0.06, green: 0.05, blue: 0.12), Color(red: 0.09, green: 0.12, blue: 0.22), Color(red: 0.11, green: 0.06, blue: 0.18)]
        case ("liquidGlass", true):
            return [Color.white.opacity(0.15), Color.white.opacity(0.08), Color.white.opacity(0.03)]
        case ("liquidGlass", false):
            return [Color(red: 0.12, green: 0.12, blue: 0.16).opacity(0.85), Color(red: 0.08, green: 0.08, blue: 0.12).opacity(0.90), Color.black.opacity(0.95)]
        case ("custom", true):
            return [Color.white.opacity(0.20), Color.white.opacity(0.12), Color.white.opacity(0.05)]
        case ("custom", false):
            return [Color(red: 0.10, green: 0.10, blue: 0.14).opacity(0.90), Color(red: 0.06, green: 0.06, blue: 0.10).opacity(0.95), Color.black.opacity(0.98)]
        default:
            return isLight
                ? [Color(red: 0.97, green: 0.98, blue: 1.0), Color(red: 0.90, green: 0.95, blue: 0.99), Color(red: 0.96, green: 0.95, blue: 0.99)]
                : [Color(red: 0.04, green: 0.07, blue: 0.12), Color(red: 0.07, green: 0.10, blue: 0.18), Color(red: 0.06, green: 0.05, blue: 0.13)]
        }
    }
    var surfaceGradient: [Color] {
        switch gradientPreset {
        case "ocean":
            return isLight
                ? [Color.white.opacity(0.76), Color(red: 0.90, green: 0.97, blue: 0.99).opacity(0.60)]
                : [Color(red: 0.15, green: 0.30, blue: 0.36).opacity(0.28), Color.white.opacity(0.05)]
        case "aurora":
            return isLight
                ? [Color.white.opacity(0.78), Color(red: 0.95, green: 0.92, blue: 1.0).opacity(0.62)]
                : [Color(red: 0.30, green: 0.16, blue: 0.40).opacity(0.22), Color.white.opacity(0.05)]
        case "liquidGlass":
            return isLight
                ? [Color.white.opacity(0.35), Color.white.opacity(0.20), Color.white.opacity(0.08)]
                : [Color.white.opacity(0.15), Color.white.opacity(0.08), Color.white.opacity(0.03)]
        case "custom":
            return isLight
                ? [Color.white.opacity(0.82), Color.white.opacity(0.65)]
                : [Color.white.opacity(0.14), Color.white.opacity(0.07)]
        default:
            return isLight
                ? [Color.white.opacity(0.74), Color.white.opacity(0.52)]
                : [Color.white.opacity(0.11), Color.white.opacity(0.05)]
        }
    }
    var accent: Color {
        switch gradientPreset {
        case "ocean":
            return isLight ? Color(red: 0.06, green: 0.50, blue: 0.84) : Color(red: 0.24, green: 0.86, blue: 0.96)
        case "aurora":
            return isLight ? Color(red: 0.32, green: 0.48, blue: 0.96) : Color(red: 0.42, green: 0.94, blue: 0.84)
        case "liquidGlass":
            return isLight ? Color(red: 0.10, green: 0.60, blue: 0.90) : Color(red: 0.30, green: 0.85, blue: 1.00)
        case "custom":
            return isLight ? Color(red: 0.55, green: 0.27, blue: 0.98) : Color(red: 0.78, green: 0.52, blue: 1.00)
        default:
            return isLight ? Color(red: 0.08, green: 0.56, blue: 0.94) : Color(red: 0.26, green: 0.80, blue: 1.00)
        }
    }
    var secondaryAccent: Color {
        switch gradientPreset {
        case "ocean":
            return isLight ? Color(red: 0.12, green: 0.73, blue: 0.77) : Color(red: 0.34, green: 0.56, blue: 1.00)
        case "aurora":
            return isLight ? Color(red: 0.72, green: 0.40, blue: 0.98) : Color(red: 0.96, green: 0.48, blue: 0.90)
        case "liquidGlass":
            return isLight ? Color(red: 0.50, green: 0.40, blue: 0.98) : Color(red: 0.80, green: 0.50, blue: 1.00)
        case "custom":
            return isLight ? Color(red: 0.02, green: 0.71, blue: 0.84) : Color(red: 0.02, green: 0.92, blue: 0.95)
        default:
            return isLight ? Color(red: 0.43, green: 0.35, blue: 0.96) : Color(red: 0.76, green: 0.44, blue: 1.00)
        }
    }
    var primaryText: Color { isLight ? Color.black.opacity(0.82) : Color.white.opacity(0.95) }
    var secondaryText: Color { isLight ? Color.black.opacity(0.54) : Color.white.opacity(0.58) }
    var stroke: Color { isLight ? Color.black.opacity(0.08) : Color.white.opacity(0.09) }
    var mutedSurface: Color { isLight ? Color.white.opacity(0.58) : Color.white.opacity(0.06) }
    var shadow: Color { isLight ? Color.black.opacity(0.10) : Color.black.opacity(0.28) }
    var buttonText: Color { isLight ? Color.white : Color.black.opacity(0.86) }
}

struct VisualEffectBackdrop: NSViewRepresentable {
    let material: NSVisualEffectView.Material

    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.state = .active
        view.blendingMode = .behindWindow
        view.material = material
        return view
    }

    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {
        nsView.material = material
    }
}

struct SidebarPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel
    private let quickActions = [
        "Summarize the current tab and tell me what matters",
        "Plan a research workflow for this topic",
        "Generate a PDF report from the current browser context",
    ]

    var body: some View {
        let preferences = viewModel.state.preferences ?? .defaults
        let palette = PanelPalette(
            appearance: viewModel.state.themeAppearance,
            gradientPreset: preferences.sidebarGradientPreset
        )
        let visibleMessages = filteredMessages
        let activityTags = Array((viewModel.state.activityTags ?? []).prefix(6))
        let conversations = Array((viewModel.state.conversations ?? []).sorted(by: { $0.updatedAt > $1.updatedAt }).prefix(8))
        let latestAnimatedMessageId = visibleMessages.last(where: { $0.role != "user" })?.id
        let showQuickActions = preferences.sidebarShowQuickActions ?? true
        let showSessions = preferences.sidebarShowSessions ?? true
        let showSearchTags = preferences.sidebarShowSearchTags ?? true
        let showCommandCenterButton = preferences.sidebarShowCommandCenterButton ?? true
        let showActionChainButton = preferences.sidebarShowActionChainButton ?? true

        PanelShell(mode: .sidebar, viewModel: viewModel) {
            VStack(alignment: .leading, spacing: 16) {
                PanelHeader(
                    title: "Comet",
                    subtitle: viewModel.compactSidebar ? "Minimal mode" : (viewModel.state.isLoading ? "Comet is thinking" : "Native AI workspace"),
                    symbol: PanelMode.sidebar.symbol,
                    viewModel: viewModel,
                    trailing: AnyView(
                        HStack(spacing: 8) {
                            SidebarGlyphButton(systemImage: "plus.bubble", accessibilityLabel: "New chat", appearance: viewModel.state.themeAppearance, gradientPreset: preferences.sidebarGradientPreset) {
                                viewModel.conversationAction("new")
                            }
                            SidebarGlyphButton(systemImage: "text.justify.left", accessibilityLabel: "Export text", appearance: viewModel.state.themeAppearance, gradientPreset: preferences.sidebarGradientPreset) {
                                viewModel.exportSession("text")
                            }
                            SidebarGlyphButton(systemImage: "doc.richtext", accessibilityLabel: "Export PDF", appearance: viewModel.state.themeAppearance, gradientPreset: preferences.sidebarGradientPreset) {
                                viewModel.exportSession("pdf")
                            }
                            SidebarGlyphButton(systemImage: "gearshape", accessibilityLabel: "Customize sidebar", appearance: viewModel.state.themeAppearance, gradientPreset: preferences.sidebarGradientPreset) {
                                viewModel.openPanel(.settings)
                            }
                        }
                    ),
                    showStatus: false
                )
                .padding(.leading, 92)
                .padding(.trailing, 18)
                .padding(.top, 18)
                .padding(.bottom, 8)

                if !viewModel.compactSidebar {
                    HStack(spacing: 10) {
                        NativeActionButton(title: "Focus Browser", systemImage: "macwindow.on.rectangle", appearance: viewModel.state.themeAppearance) {
                            viewModel.focusBrowser()
                        }
                        if showActionChainButton {
                            NativeActionButton(title: "Action Chain", systemImage: PanelMode.actionChain.symbol, appearance: viewModel.state.themeAppearance) {
                                viewModel.openPanel(.actionChain)
                            }
                        }
                        if showCommandCenterButton {
                            NativeActionButton(title: "Command Center", systemImage: PanelMode.menu.symbol, appearance: viewModel.state.themeAppearance) {
                                viewModel.openPanel(.menu)
                            }
                        }
                    }
                    .padding(.horizontal, 18)
                }

                if !viewModel.compactSidebar, showSearchTags, !activityTags.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(activityTags, id: \.self) { tag in
                                SidebarTagChip(text: tag, appearance: viewModel.state.themeAppearance, gradientPreset: preferences.sidebarGradientPreset)
                            }
                        }
                        .padding(.horizontal, 18)
                    }
                }

                if !viewModel.compactSidebar, showSessions {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("Sessions")
                                .font(.system(size: 10, weight: .black, design: .rounded))
                                .foregroundStyle(palette.secondaryText)
                                .textCase(.uppercase)
                            Spacer()
                            Button {
                                viewModel.conversationAction("new")
                            } label: {
                                Label("New", systemImage: "plus")
                                    .font(.system(size: 10, weight: .bold, design: .rounded))
                                    .foregroundStyle(palette.primaryText)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 18)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                if conversations.isEmpty {
                                    EmptyStateCard(title: "No saved sessions yet", description: "Your recent chat sessions will appear here for one-tap recall.", appearance: viewModel.state.themeAppearance)
                                        .frame(width: 260)
                                } else {
                                    ForEach(conversations) { conversation in
                                        Button {
                                            viewModel.conversationAction("load", id: conversation.id)
                                        } label: {
                                            SessionChipView(
                                                title: conversation.title,
                                                updatedAt: conversation.updatedAt,
                                                isActive: viewModel.state.activeConversationId == conversation.id,
                                                appearance: viewModel.state.themeAppearance,
                                                gradientPreset: preferences.sidebarGradientPreset
                                            )
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                            }
                            .padding(.horizontal, 18)
                        }
                    }
                }

                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            if visibleMessages.isEmpty {
                                EmptyStateCard(title: "Ready for prompts", description: "Ask Comet anything, launch action chains, and keep your saved sessions close without breaking browser flow.", appearance: viewModel.state.themeAppearance)
                            }

                            ForEach(visibleMessages) { message in
                                MessageBubbleView(
                                    message: message,
                                    appearance: viewModel.state.themeAppearance,
                                    animateContent: latestAnimatedMessageId == message.id && message.role != "user"
                                )
                            }

                            if viewModel.state.isLoading {
                                AuroraThinkingView(appearance: viewModel.state.themeAppearance)
                            }

                            Color.clear.frame(height: 1).id("chat-bottom")
                        }
                        .padding(18)
                    }
                    .onAppear {
                        proxy.scrollTo("chat-bottom", anchor: .bottom)
                    }
                    .onChange(of: scrollToken) {
                        withAnimation(.spring(response: 0.48, dampingFraction: 0.88)) {
                            proxy.scrollTo("chat-bottom", anchor: .bottom)
                        }
                    }
                }

                if !viewModel.compactSidebar, showQuickActions {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(quickActions, id: \.self) { action in
                                Button {
                                    viewModel.promptText = action
                                } label: {
                                    Text(action)
                                        .padding(.vertical, 10)
                                        .padding(.horizontal, 12)
                                        .background(palette.mutedSurface)
                                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                                        .foregroundStyle(palette.primaryText)
                                        .font(.system(size: 11, weight: .medium, design: .rounded))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, 18)
                    }
                    .padding(.bottom, 2)
                }

                VStack(spacing: 12) {
                    ZStack(alignment: .topLeading) {
                        RoundedRectangle(cornerRadius: 22, style: .continuous)
                            .fill(palette.mutedSurface)
                            .overlay(
                                RoundedRectangle(cornerRadius: 22, style: .continuous)
                                    .stroke(palette.stroke, lineWidth: 1)
                            )

                        if viewModel.promptText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            Text("Ask Comet anything, continue a session, or kick off an action chain...")
                                .font(.system(size: 12, weight: .medium, design: .rounded))
                                .foregroundStyle(palette.secondaryText)
                                .padding(.horizontal, 18)
                                .padding(.top, 18)
                                .allowsHitTesting(false)
                        }

                        PromptComposer(text: $viewModel.promptText, appearance: viewModel.state.themeAppearance) {
                            viewModel.sendPrompt()
                        } onInteraction: {
                            viewModel.noteInteraction()
                        }
                        .frame(minHeight: viewModel.compactSidebar ? 70 : 98, maxHeight: viewModel.compactSidebar ? 88 : 136)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 6)
                    }

                    HStack {
                        Text(viewModel.compactSidebar ? "Enter sends. Shift+Enter adds a new line." : "Enter sends. Shift+Enter adds a new line. Sessions and exports stay synced with the browser sidebar.")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(palette.secondaryText)
                        Spacer()
                        Button {
                            viewModel.sendPrompt()
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: viewModel.isSending ? "arrow.triangle.2.circlepath" : "paperplane.fill")
                                Text(viewModel.isSending ? "Sending" : "Send")
                            }
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundStyle(palette.buttonText)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background(LinearGradient(colors: [palette.accent, palette.secondaryAccent], startPoint: .leading, endPoint: .trailing))
                            .clipShape(Capsule())
                            .shadow(color: palette.accent.opacity(0.28), radius: 12, x: 0, y: 6)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.top, 8)
                .padding(.bottom, 16)
            }
        }
    }

    private var scrollToken: String {
        let last = filteredMessages.last
        return "\(last?.id ?? "empty")-\(last?.content.count ?? 0)-\(viewModel.state.isLoading)"
    }

    private var filteredMessages: [NativePanelState.Message] {
        let recentMessages = Array(viewModel.state.messages.suffix(viewModel.compactSidebar ? 4 : 16))
        return recentMessages.filter { message in
            if message.role == "user" {
                return !message.content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            }

            let cleaned = visibleMessageContent(for: message)
            if cleaned.isEmpty && viewModel.state.isLoading {
                let isLastAssistantMessage = recentMessages.last?.id == message.id
                if isLastAssistantMessage {
                    return false
                }
            }
            return !cleaned.isEmpty
        }
    }

    private func visibleMessageContent(for message: NativePanelState.Message) -> String {
        let parseResult = AICommandParser.parseCommands(from: message.content)
        let baseContent = parseResult.hasCommands ? parseResult.textWithoutCommands : message.content
        return AICommandParser.cleanCustomTags(from: baseContent)
    }
}

struct ActionChainPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel

    var body: some View {
        let palette = PanelPalette(appearance: viewModel.state.themeAppearance)
        PanelShell(mode: .actionChain, viewModel: viewModel) {
            VStack(alignment: .leading, spacing: 18) {
                PanelHeader(
                    title: "Native Action Chain",
                    subtitle: "Live execution feed for the same Action Chain the Electron sidebar is running.",
                    symbol: PanelMode.actionChain.symbol,
                    viewModel: viewModel
                )
                .padding(18)

                HStack(spacing: 10) {
                    NativeActionButton(title: "Open Sidebar", systemImage: PanelMode.sidebar.symbol, appearance: viewModel.state.themeAppearance) {
                        viewModel.openPanel(.sidebar)
                    }
                    NativeActionButton(title: "Permissions", systemImage: PanelMode.permissions.symbol, appearance: viewModel.state.themeAppearance) {
                        viewModel.openPanel(.permissions)
                    }
                }
                .padding(.horizontal, 18)

                Divider().overlay(palette.stroke)

                if let terminalLogs = viewModel.state.terminalLogs, !terminalLogs.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "terminal").font(.system(size: 11, weight: .bold))
                            Text("TERMINAL OUTPUT")
                                .font(.system(size: 10, weight: .black, design: .rounded))
                                .foregroundStyle(palette.secondaryText)
                            Spacer()
                            Text("\(terminalLogs.count)")
                                .font(.system(size: 9, weight: .bold, design: .rounded))
                                .foregroundStyle(Color.secondary)
                        }
                        .foregroundStyle(palette.secondaryText)
                        .padding(.horizontal, 18)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(terminalLogs.suffix(6)) { log in
                                    VStack(alignment: .leading, spacing: 4) {
                                        HStack(spacing: 4) {
                                            Circle()
                                                .fill(log.success ? Color.green : Color.red)
                                                .frame(width: 6, height: 6)
                                            Text(log.command)
                                                .font(.system(size: 9, weight: .bold, design: .rounded))
                                                .foregroundStyle(palette.primaryText)
                                                .lineLimit(1)
                                        }
                                        Text(log.output.prefix(30))
                                            .font(.system(size: 8, design: .rounded))
                                            .foregroundStyle(palette.secondaryText)
                                            .lineLimit(1)
                                    }
                                    .padding(8)
                                    .background(palette.mutedSurface)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                }
                            }
                            .padding(.horizontal, 18)
                        }
                    }
                    .padding(.vertical, 12)
                }

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        if viewModel.state.actionChain.isEmpty {
                            EmptyStateCard(title: "No active chain", description: "When Comet starts executing a multi-step plan, the pending and running steps will appear here in real time.", appearance: viewModel.state.themeAppearance)
                        }
                        ForEach(Array(viewModel.state.actionChain.enumerated()), id: \.element.id) { index, command in
                            HStack(alignment: .top, spacing: 12) {
                                Circle().fill(statusColor(command.status)).frame(width: 12, height: 12)
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Text(command.type.replacingOccurrences(of: "_", with: " "))
                                            .font(.system(size: 12, weight: .bold, design: .rounded))
                                            .foregroundStyle(palette.primaryText)
                                        Spacer()
                                        Text(command.status.uppercased())
                                            .font(.system(size: 9, weight: .black, design: .rounded))
                                            .foregroundStyle(statusColor(command.status))
                                    }
                                    Text(command.value.isEmpty ? "No payload" : command.value)
                                        .font(.system(size: 11, design: .rounded))
                                        .foregroundStyle(palette.secondaryText)
                                        .lineLimit(4)
                                    HStack(spacing: 8) {
                                        if let category = command.category {
                                            StatusPill(text: category.uppercased(), color: palette.mutedSurface)
                                        }
                                        if let riskLevel = command.riskLevel, !riskLevel.isEmpty, riskLevel != "low" {
                                            StatusPill(text: riskLevel.uppercased(), color: Color.orange.opacity(0.18))
                                        }
                                        if index == viewModel.state.currentCommandIndex {
                                            StatusPill(text: "CURRENT", color: palette.accent.opacity(0.25))
                                        }
                                    }
                                }
                            }
                            .padding(14)
                            .background(palette.mutedSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        }
                    }
                    .padding(18)
                }
            }
        }
    }

    private func statusColor(_ status: String) -> Color {
        switch status {
        case "completed": return .green
        case "failed": return .red
        case "executing", "awaiting_permission": return .orange
        default: return .white.opacity(0.4)
        }
    }
}

struct UtilityMenuPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel

    var body: some View {
        let palette = PanelPalette(appearance: viewModel.state.themeAppearance)
        PanelShell(mode: .menu, viewModel: viewModel) {
            VStack(alignment: .leading, spacing: 18) {
                PanelHeader(
                    title: "SwiftUI Command Center",
                    subtitle: "Launch the detached native macOS panels from one place.",
                    symbol: PanelMode.menu.symbol,
                    viewModel: viewModel
                )
                .padding(18)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach([PanelMode.sidebar, .actionChain, .settings, .downloads, .clipboard, .permissions], id: \.rawValue) { panel in
                        Button {
                            viewModel.openPanel(panel)
                        } label: {
                            VStack(alignment: .leading, spacing: 10) {
                                Image(systemName: panel.symbol)
                                    .font(.system(size: 20, weight: .semibold))
                                Text(panel.title)
                                    .font(.system(size: 13, weight: .bold, design: .rounded))
                                Text("Open native \(panel.rawValue) panel")
                                    .font(.system(size: 10, design: .rounded))
                                    .foregroundStyle(palette.secondaryText)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(16)
                            .background(palette.mutedSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(palette.primaryText)
                    }
                }
                .padding(.horizontal, 18)

                Spacer()

                HStack(spacing: 10) {
                    NativeActionButton(title: "Focus Browser", systemImage: "macwindow.on.rectangle", appearance: viewModel.state.themeAppearance) {
                        viewModel.focusBrowser()
                    }
                    NativeActionButton(title: "Reload State", systemImage: "arrow.clockwise", appearance: viewModel.state.themeAppearance) {
                        viewModel.openPanel(.menu)
                    }
                }
                .padding(18)
            }
        }
    }
}

struct NativeSettingsPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel

    var body: some View {
        let prefs = viewModel.state.preferences ?? .defaults
        let palette = PanelPalette(appearance: viewModel.state.themeAppearance)
        let launchColumns = [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())]
        
        PanelShell(mode: .settings, viewModel: viewModel) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(alignment: .top) {
                            Image(systemName: PanelMode.settings.symbol)
                                .font(.system(size: 20, weight: .semibold))
                                .foregroundStyle(palette.accent)
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Comet Settings")
                                    .font(.system(size: 22, weight: .bold, design: .rounded))
                                    .foregroundStyle(palette.primaryText)
                                HStack(spacing: 8) {
                                    ConnectionBadge(isConnected: viewModel.isConnected, text: viewModel.statusText)
                                    StatusPill(text: prefs.sidebarMode.uppercased(), color: (prefs.sidebarMode == "swiftui" ? palette.accent : palette.mutedSurface))
                                    StatusPill(text: prefs.permissionMode.uppercased(), color: (prefs.permissionMode == "swiftui" ? Color.orange.opacity(0.22) : palette.mutedSurface))
                                }
                            }
                            Spacer()
                        }
                        Text("Configure Electron and native macOS settings")
                            .font(.system(size: 13))
                            .foregroundStyle(palette.secondaryText)
                    }
                    .padding(18)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(LinearGradient(colors: palette.surfaceGradient, startPoint: .topLeading, endPoint: .bottomTrailing))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(palette.stroke, lineWidth: 1)
                            )
                    )

                    VStack(alignment: .leading, spacing: 12) {
                        Text("QUICK LAUNCH")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(palette.secondaryText)
                            .tracking(1.2)

                        LazyVGrid(columns: launchColumns, spacing: 10) {
                            NativeQuickActionCard(title: "AI Sidebar", subtitle: "Open the detached assistant", systemImage: PanelMode.sidebar.symbol, appearance: viewModel.state.themeAppearance) {
                                viewModel.openPanel(.sidebar)
                            }
                            NativeQuickActionCard(title: "Action Chain", subtitle: "View current execution", systemImage: PanelMode.actionChain.symbol, appearance: viewModel.state.themeAppearance) {
                                viewModel.openPanel(.actionChain)
                            }
                            NativeQuickActionCard(title: "Command Center", subtitle: "Launch native tools", systemImage: PanelMode.menu.symbol, appearance: viewModel.state.themeAppearance) {
                                viewModel.openPanel(.menu)
                            }
                            NativeQuickActionCard(title: "Permissions", subtitle: "Review approvals", systemImage: PanelMode.permissions.symbol, appearance: viewModel.state.themeAppearance) {
                                viewModel.openPanel(.permissions)
                            }
                            NativeQuickActionCard(title: "Downloads", subtitle: "Open file downloads", systemImage: PanelMode.downloads.symbol, appearance: viewModel.state.themeAppearance) {
                                viewModel.openPanel(.downloads)
                            }
                            NativeQuickActionCard(title: "Clipboard", subtitle: "Open clipboard history", systemImage: PanelMode.clipboard.symbol, appearance: viewModel.state.themeAppearance) {
                                viewModel.openPanel(.clipboard)
                            }
                        }
                    }
                    .padding(18)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(LinearGradient(colors: palette.surfaceGradient, startPoint: .topLeading, endPoint: .bottomTrailing))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(palette.stroke, lineWidth: 1)
                            )
                    )

                    VStack(alignment: .leading, spacing: 12) {
                        Text("SESSION TOOLS")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(palette.secondaryText)
                            .tracking(1.2)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                NativeActionButton(title: "Focus Browser", systemImage: "macwindow.on.rectangle", appearance: viewModel.state.themeAppearance) {
                                    viewModel.focusBrowser()
                                }
                                NativeActionButton(title: "New Chat", systemImage: "plus.bubble", appearance: viewModel.state.themeAppearance) {
                                    viewModel.conversationAction("new")
                                }
                                NativeActionButton(title: "Export Text", systemImage: "text.justify.left", appearance: viewModel.state.themeAppearance) {
                                    viewModel.exportSession("text")
                                }
                                NativeActionButton(title: "Export PDF", systemImage: "doc.richtext", appearance: viewModel.state.themeAppearance) {
                                    viewModel.exportSession("pdf")
                                }
                            }
                        }
                    }
                    .padding(18)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(LinearGradient(colors: palette.surfaceGradient, startPoint: .topLeading, endPoint: .bottomTrailing))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(palette.stroke, lineWidth: 1)
                            )
                    )

                    VStack(alignment: .leading, spacing: 12) {
                        Text("OPEN ELECTRON SETTINGS")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(palette.secondaryText)
                            .tracking(1.2)
                        
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                            ElectronSettingsButton(
                                title: "API Keys",
                                subtitle: "OpenAI, Anthropic, Gemini",
                                systemImage: "key.fill",
                                appearance: viewModel.state.themeAppearance
                            ) {
                                viewModel.openSettings(target: "api-keys")
                            }
                            ElectronSettingsButton(
                                title: "Appearance",
                                subtitle: "Theme, colors, layout",
                                systemImage: "paintpalette.fill",
                                appearance: viewModel.state.themeAppearance
                            ) {
                                viewModel.openSettings(target: "appearance")
                            }
                            ElectronSettingsButton(
                                title: "Automation",
                                subtitle: "Scheduled tasks, workflows",
                                systemImage: "bolt.fill",
                                appearance: viewModel.state.themeAppearance
                            ) {
                                viewModel.openSettings(target: "automation")
                            }
                            ElectronSettingsButton(
                                title: "Permissions",
                                subtitle: "Shell commands, safety",
                                systemImage: "shield.fill",
                                appearance: viewModel.state.themeAppearance
                            ) {
                                viewModel.openSettings(target: "permissions")
                            }
                            ElectronSettingsButton(
                                title: "WiFi Sync",
                                subtitle: "Mobile connect, pairing",
                                systemImage: "wifi",
                                appearance: viewModel.state.themeAppearance
                            ) {
                                viewModel.openSettings(target: "sync")
                            }
                            ElectronSettingsButton(
                                title: "Privacy",
                                subtitle: "Security, history, data",
                                systemImage: "lock.fill",
                                appearance: viewModel.state.themeAppearance
                            ) {
                                viewModel.openSettings(target: "privacy")
                            }
                            ElectronSettingsButton(
                                title: "Extensions",
                                subtitle: "Add-ons, MCP servers",
                                systemImage: "puzzlepiece.fill",
                                appearance: viewModel.state.themeAppearance
                            ) {
                                viewModel.openSettings(target: "extensions")
                            }
                            ElectronSettingsButton(
                                title: "All Settings",
                                subtitle: "Full settings panel",
                                systemImage: "gearshape.fill",
                                appearance: viewModel.state.themeAppearance
                            ) {
                                viewModel.openSettings(target: "all")
                            }
                        }
                    }
                    .padding(18)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(LinearGradient(colors: palette.surfaceGradient, startPoint: .topLeading, endPoint: .bottomTrailing))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(palette.stroke, lineWidth: 1)
                            )
                    )

                    VStack(alignment: .leading, spacing: 12) {
                        Text("NATIVE MACOS SETTINGS")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(palette.secondaryText)
                            .tracking(1.2)
                        
                        VStack(spacing: 10) {
                            PreferenceCard(title: "AI Sidebar", subtitle: "Browser sidebar vs detached SwiftUI assistant", current: prefs.sidebarMode, appearance: viewModel.state.themeAppearance) { value in
                                viewModel.setPreference(key: "sidebarMode", value: value)
                            }
                            PreferenceCard(title: "Action Chain", subtitle: "Execution feed and planning panel", current: prefs.actionChainMode, appearance: viewModel.state.themeAppearance) { value in
                                viewModel.setPreference(key: "actionChainMode", value: value)
                            }
                            PreferenceCard(title: "Utility Panels", subtitle: "Settings, downloads, clipboard, and command center", current: prefs.utilityMode, appearance: viewModel.state.themeAppearance) { value in
                                viewModel.setPreference(key: "utilityMode", value: value)
                            }
                            PreferenceCard(title: "Permission Prompts", subtitle: "Low, medium, and high-risk shell approvals", current: prefs.permissionMode, appearance: viewModel.state.themeAppearance) { value in
                                viewModel.setPreference(key: "permissionMode", value: value)
                            }
                        }
                    }
                    .padding(18)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(LinearGradient(colors: palette.surfaceGradient, startPoint: .topLeading, endPoint: .bottomTrailing))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(palette.stroke, lineWidth: 1)
                            )
                    )

                    VStack(alignment: .leading, spacing: 12) {
                        Text("SIDEBAR APPEARANCE")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(palette.secondaryText)
                            .tracking(1.2)
                        
                        VStack(spacing: 10) {
                            SelectionPreferenceCard(
                                title: "Gradient Theme",
                                subtitle: "Tune the native sidebar chrome with a premium gradient preset.",
                                current: prefs.sidebarGradientPreset ?? "graphite",
                                options: [("graphite", "Graphite"), ("ocean", "Ocean"), ("aurora", "Aurora"), ("liquidGlass", "Liquid Glass"), ("custom", "Custom")],
                                appearance: viewModel.state.themeAppearance
                            ) { value in
                                viewModel.setPreference(key: "sidebarGradientPreset", value: value)
                            }
                            
                            if prefs.sidebarGradientPreset == "custom" {
                                CustomThemeEditor(
                                    preferences: prefs,
                                    appearance: viewModel.state.themeAppearance,
                                    onUpdate: { key, value in
                                        if let stringValue = value as? String {
                                            viewModel.setPreference(key: key, value: stringValue)
                                        }
                                    }
                                )
                            }
                            TogglePreferenceCard(title: "Auto-Minimize Sidebar", subtitle: "Shrink the detached AI sidebar when idle.", value: prefs.sidebarAutoMinimize ?? false, appearance: viewModel.state.themeAppearance) { value in
                                viewModel.setPreference(key: "sidebarAutoMinimize", value: value)
                            }
                            TogglePreferenceCard(title: "Show Quick Actions", subtitle: "Display prompt shortcut pills above the composer.", value: prefs.sidebarShowQuickActions ?? true, appearance: viewModel.state.themeAppearance) { value in
                                viewModel.setPreference(key: "sidebarShowQuickActions", value: value)
                            }
                            TogglePreferenceCard(title: "Show Sessions", subtitle: "Show recent saved chat sessions.", value: prefs.sidebarShowSessions ?? true, appearance: viewModel.state.themeAppearance) { value in
                                viewModel.setPreference(key: "sidebarShowSessions", value: value)
                            }
                            TogglePreferenceCard(title: "Show Search Tags", subtitle: "Display live context tags.", value: prefs.sidebarShowSearchTags ?? true, appearance: viewModel.state.themeAppearance) { value in
                                viewModel.setPreference(key: "sidebarShowSearchTags", value: value)
                            }
                            TogglePreferenceCard(title: "Show Command Center Button", subtitle: "Keep the Command Center launcher visible in the native sidebar header.", value: prefs.sidebarShowCommandCenterButton ?? true, appearance: viewModel.state.themeAppearance) { value in
                                viewModel.setPreference(key: "sidebarShowCommandCenterButton", value: value)
                            }
                            TogglePreferenceCard(title: "Show Action Chain Button", subtitle: "Keep the Action Chain shortcut visible in the native sidebar header.", value: prefs.sidebarShowActionChainButton ?? true, appearance: viewModel.state.themeAppearance) { value in
                                viewModel.setPreference(key: "sidebarShowActionChainButton", value: value)
                            }
                            TogglePreferenceCard(title: "Action Chain Auto Appear", subtitle: "Auto-open Action Chain for multi-step plans.", value: prefs.sidebarActionChainAutoAppear ?? false, appearance: viewModel.state.themeAppearance) { value in
                                viewModel.setPreference(key: "sidebarActionChainAutoAppear", value: value)
                            }
                        }
                    }
                    .padding(18)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(LinearGradient(colors: palette.surfaceGradient, startPoint: .topLeading, endPoint: .bottomTrailing))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(palette.stroke, lineWidth: 1)
                            )
                    )

                    HStack(spacing: 10) {
                        NativeActionButton(title: "Open Downloads", systemImage: PanelMode.downloads.symbol, appearance: viewModel.state.themeAppearance) {
                            viewModel.openPanel(.downloads)
                        }
                        NativeActionButton(title: "Open Clipboard", systemImage: PanelMode.clipboard.symbol, appearance: viewModel.state.themeAppearance) {
                            viewModel.openPanel(.clipboard)
                        }
                    }
                    .padding(.bottom, 20)
                }
                .padding(16)
            }
        }
    }
}

struct NativeQuickActionCard: View {
    let title: String
    let subtitle: String
    let systemImage: String
    let appearance: String
    let action: () -> Void

    var body: some View {
        let palette = PanelPalette(appearance: appearance)

        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: systemImage)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(palette.accent)
                    .frame(width: 30, height: 30)
                    .background(palette.accent.opacity(0.14))
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                Text(title)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(palette.primaryText)

                Text(subtitle)
                    .font(.system(size: 10, design: .rounded))
                    .foregroundStyle(palette.secondaryText)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, minHeight: 106, alignment: .topLeading)
            .padding(12)
            .background(palette.mutedSurface)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(palette.stroke, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

struct ElectronSettingsButton: View {
    let title: String
    let subtitle: String
    let systemImage: String
    let appearance: String
    let action: () -> Void
    
    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: systemImage)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(palette.accent)
                    .frame(width: 32, height: 32)
                    .background(palette.accent.opacity(0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                
                Text(title)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(palette.primaryText)
                
                Text(subtitle)
                    .font(.system(size: 10))
                    .foregroundStyle(palette.secondaryText)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(palette.mutedSurface)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(palette.stroke, lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

struct DownloadsPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel

    var body: some View {
        let palette = PanelPalette(appearance: viewModel.state.themeAppearance)
        PanelShell(mode: .downloads, viewModel: viewModel) {
            VStack(alignment: .leading, spacing: 18) {
                PanelHeader(
                    title: "Native Downloads",
                    subtitle: "Monitor downloads and open files without opening the Electron overlay.",
                    symbol: PanelMode.downloads.symbol,
                    viewModel: viewModel
                )
                .padding(18)

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        let downloads = viewModel.state.downloads ?? []
                        if downloads.isEmpty {
                            EmptyStateCard(title: "No downloads yet", description: "Completed and active downloads from Comet will appear here.", appearance: viewModel.state.themeAppearance)
                        }
                        ForEach(downloads) { item in
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    Text(item.name)
                                        .font(.system(size: 13, weight: .bold, design: .rounded))
                                        .foregroundStyle(palette.primaryText)
                                        .lineLimit(1)
                                    Spacer()
                                    StatusPill(text: item.status.uppercased(), color: item.status == "completed" ? .green.opacity(0.2) : palette.mutedSurface)
                                }
                                ProgressView(value: item.progress ?? 0, total: 100)
                                    .tint(palette.accent)
                                Text(item.path ?? "Waiting for file path")
                                    .font(.system(size: 10, design: .rounded))
                                    .foregroundStyle(palette.secondaryText)
                                    .lineLimit(2)
                                HStack(spacing: 10) {
                                    NativeActionButton(title: "Open", systemImage: "arrow.up.forward.app", appearance: viewModel.state.themeAppearance) {
                                        viewModel.openDownload(path: item.path)
                                    }
                                    NativeActionButton(title: "Reveal", systemImage: "folder", appearance: viewModel.state.themeAppearance) {
                                        viewModel.revealDownload(path: item.path)
                                    }
                                }
                            }
                            .padding(14)
                            .background(palette.mutedSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        }
                    }
                    .padding(18)
                }
            }
        }
    }
}

struct ClipboardPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel

    var body: some View {
        let palette = PanelPalette(appearance: viewModel.state.themeAppearance)
        PanelShell(mode: .clipboard, viewModel: viewModel) {
            VStack(alignment: .leading, spacing: 18) {
                PanelHeader(
                    title: "Native Clipboard",
                    subtitle: "Browse clipboard history and copy items back instantly.",
                    symbol: PanelMode.clipboard.symbol,
                    viewModel: viewModel
                )
                .padding(18)

                HStack(spacing: 10) {
                    NativeActionButton(title: "Clear History", systemImage: "trash", appearance: viewModel.state.themeAppearance) {
                        viewModel.clearClipboardHistory()
                    }
                    NativeActionButton(title: "Open Settings", systemImage: PanelMode.settings.symbol, appearance: viewModel.state.themeAppearance) {
                        viewModel.openPanel(.settings)
                    }
                }
                .padding(.horizontal, 18)

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        let items = viewModel.state.clipboardItems ?? []
                        if items.isEmpty {
                            EmptyStateCard(title: "Clipboard is empty", description: "Copied text from Comet and synced devices will show up here.", appearance: viewModel.state.themeAppearance)
                        }
                        ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                            VStack(alignment: .leading, spacing: 10) {
                                Text(item)
                                    .font(.system(size: 12, design: .rounded))
                                    .foregroundStyle(palette.primaryText)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .lineLimit(4)
                                NativeActionButton(title: "Copy Again", systemImage: "doc.on.doc", appearance: viewModel.state.themeAppearance) {
                                    viewModel.copyClipboardItem(item)
                                }
                            }
                            .padding(14)
                            .background(palette.mutedSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        }
                    }
                    .padding(18)
                }
            }
        }
    }
}

struct PermissionsPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel
    @State private var pinText = ""
    @State private var isUnlockingApproval = false
    @State private var approvalError: String?

    var body: some View {
        PanelShell(mode: .permissions, viewModel: viewModel) {
            VStack(alignment: .leading, spacing: 18) {
                PanelHeader(
                    title: "Native Approval Prompt",
                    subtitle: "Approve low, medium, and high-risk actions as native macOS prompts.",
                    symbol: PanelMode.permissions.symbol,
                    viewModel: viewModel
                )
                .padding(18)

                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        if let approval = viewModel.state.pendingApproval {
                            ApprovalCard(
                                approval: approval,
                                pinText: $pinText,
                                isUnlocking: isUnlockingApproval,
                                errorMessage: approvalError,
                                onAllow: {
                                    approvalError = nil
                                    Task {
                                        var deviceUnlockValidated = false
                                        if approval.requiresDeviceUnlock == true {
                                            isUnlockingApproval = true
                                            let verification = await viewModel.verifyDeviceOwnerApproval(
                                                reason: approval.reason,
                                                command: approval.command,
                                                risk: approval.risk
                                            )
                                            isUnlockingApproval = false
                                            guard verification.approved else {
                                                approvalError = verification.error ?? "Touch ID or Mac password verification was cancelled."
                                                return
                                            }
                                            deviceUnlockValidated = true
                                        }
                                        viewModel.respondToApproval(
                                            approval.requestId,
                                            allowed: true,
                                            deviceUnlockValidated: deviceUnlockValidated
                                        )
                                    }
                                },
                                onDeny: {
                                    approvalError = nil
                                    viewModel.respondToApproval(approval.requestId, allowed: false)
                                }
                            )
                        } else {
                            EmptyStateCard(title: "No active approval", description: "When Comet needs approval for a shell or automation action, the live request will appear here.", appearance: viewModel.state.themeAppearance)
                        }
                    }
                    .padding(18)
                }
            }
        }
    }
}

struct PreferenceCard: View {
    let title: String
    let subtitle: String
    let current: String
    let appearance: String
    let onChange: (String) -> Void

    init(title: String, subtitle: String, current: String, appearance: String = "dark", onChange: @escaping (String) -> Void) {
        self.title = title
        self.subtitle = subtitle
        self.current = current
        self.appearance = appearance
        self.onChange = onChange
    }

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(palette.primaryText)
            Text(subtitle)
                .font(.system(size: 11, design: .rounded))
                .foregroundStyle(palette.secondaryText)
            HStack(spacing: 10) {
                ForEach(["electron", "swiftui"], id: \.self) { option in
                    Button(option.capitalized) { onChange(option) }
                        .buttonStyle(.plain)
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .foregroundStyle(current == option ? palette.buttonText : palette.primaryText.opacity(0.78))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(current == option ? palette.accent : palette.mutedSurface)
                        .clipShape(Capsule())
                }
            }
        }
        .padding(16)
        .background(palette.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

struct TogglePreferenceCard: View {
    let title: String
    let subtitle: String
    let value: Bool
    let appearance: String
    let onChange: (Bool) -> Void

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        HStack(alignment: .center, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(palette.primaryText)
                Text(subtitle)
                    .font(.system(size: 11, design: .rounded))
                    .foregroundStyle(palette.secondaryText)
            }
            Spacer()
            Toggle("", isOn: Binding(get: { value }, set: { onChange($0) }))
                .toggleStyle(.switch)
                .labelsHidden()
        }
        .padding(16)
        .background(palette.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

struct SelectionPreferenceCard: View {
    let title: String
    let subtitle: String
    let current: String
    let options: [(String, String)]
    let appearance: String
    let onChange: (String) -> Void

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(palette.primaryText)
            Text(subtitle)
                .font(.system(size: 11, design: .rounded))
                .foregroundStyle(palette.secondaryText)
            HStack(spacing: 10) {
                ForEach(options, id: \.0) { option in
                    Button(option.1) { onChange(option.0) }
                        .buttonStyle(.plain)
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .foregroundStyle(current == option.0 ? palette.buttonText : palette.primaryText.opacity(0.78))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(current == option.0 ? palette.accent : palette.mutedSurface)
                        .clipShape(Capsule())
                }
            }
        }
        .padding(16)
        .background(palette.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

struct CustomThemeEditor: View {
    let preferences: NativePanelState.Preferences
    let appearance: String
    let onUpdate: (String, Any) -> Void
    
    private let presetColors: [(String, String, Color)] = [
        ("Violet", "violet", Color(red: 0.55, green: 0.27, blue: 0.98)),
        ("Sky", "sky", Color(red: 0.02, green: 0.71, blue: 0.84)),
        ("Rose", "rose", Color(red: 0.95, green: 0.36, blue: 0.47)),
        ("Emerald", "emerald", Color(red: 0.16, green: 0.78, blue: 0.47)),
        ("Amber", "amber", Color(red: 0.98, green: 0.72, blue: 0.12)),
        ("Cyan", "cyan", Color(red: 0.02, green: 0.92, blue: 0.95)),
    ]
    
    private let secondaryColors: [(String, String, Color)] = [
        ("Purple", "purple", Color(red: 0.78, green: 0.52, blue: 1.00)),
        ("Blue", "blue", Color(red: 0.30, green: 0.85, blue: 1.00)),
        ("Pink", "pink", Color(red: 0.98, green: 0.48, blue: 0.72)),
        ("Green", "green", Color(red: 0.20, green: 0.90, blue: 0.60)),
        ("Orange", "orange", Color(red: 0.98, green: 0.62, blue: 0.20)),
        ("Teal", "teal", Color(red: 0.20, green: 0.85, blue: 0.85)),
    ]
    
    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        
        VStack(alignment: .leading, spacing: 16) {
            Text("Primary Accent Color")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(palette.secondaryText)
            
            HStack(spacing: 10) {
                ForEach(presetColors, id: \.0) { name, key, color in
                    Button(action: { onUpdate("customPrimaryAccent", key) }) {
                        Circle()
                            .fill(color)
                            .frame(width: 32, height: 32)
                            .overlay(
                                Circle()
                                    .stroke(palette.primaryText.opacity(0.2), lineWidth: 1)
                            )
                            .shadow(color: color.opacity(0.5), radius: 4, x: 0, y: 2)
                    }
                    .buttonStyle(.plain)
                    .help(name)
                }
            }
            
            Text("Secondary Accent Color")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(palette.secondaryText)
            
            HStack(spacing: 10) {
                ForEach(secondaryColors, id: \.0) { name, key, color in
                    Button(action: { onUpdate("customSecondaryAccent", key) }) {
                        Circle()
                            .fill(color)
                            .frame(width: 32, height: 32)
                            .overlay(
                                Circle()
                                    .stroke(palette.primaryText.opacity(0.2), lineWidth: 1)
                            )
                            .shadow(color: color.opacity(0.5), radius: 4, x: 0, y: 2)
                    }
                    .buttonStyle(.plain)
                    .help(name)
                }
            }
            
            Button(action: { onUpdate("sidebarGradientPreset", "graphite") }) {
                Text("Reset to Default")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.red.opacity(0.8))
                    .padding(.vertical, 10)
                    .padding(.horizontal, 16)
                    .background(Color.red.opacity(0.1))
                    .clipShape(Capsule())
                    .overlay(
                        Capsule()
                            .stroke(Color.red.opacity(0.3), lineWidth: 1)
                    )
            }
            .buttonStyle(.plain)
        }
        .padding(16)
        .background(palette.mutedSurface.opacity(0.5))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

struct ApprovalCard: View {
    let approval: NativePanelState.ApprovalState
    @Binding var pinText: String
    let isUnlocking: Bool
    let errorMessage: String?
    let onAllow: () -> Void
    let onDeny: () -> Void

    private var qrImage: NSImage? {
        guard
            let qrString = approval.highRiskQr,
            let data = qrString.data(using: .utf8),
            let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let imageString = payload["qrImage"] as? String
        else { return nil }
        return decodeDataURLImage(imageString)
    }

    private var requiresPin: Bool {
        approval.risk == "high"
    }

    private var canApprove: Bool {
        guard requiresPin else { return true }
        guard approval.mobileApproved == true else { return false }
        let expected = approval.approvedPin ?? approval.expectedPin ?? ""
        return expected.isEmpty || pinText == expected
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Risk: \(approval.risk.uppercased())")
                    .font(.system(size: 10, weight: .black, design: .rounded))
                    .foregroundStyle(colorForRisk.opacity(0.95))
                Spacer()
                if approval.requiresDeviceUnlock == true {
                    StatusPill(text: "DEVICE UNLOCK", color: .cyan.opacity(0.18))
                }
            }

            Text(approval.command)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(.white)

            Text(approval.reason)
                .font(.system(size: 12, design: .rounded))
                .foregroundStyle(.white.opacity(0.65))

            if approval.risk == "high", let qrImage {
                HStack {
                    Image(nsImage: qrImage)
                        .resizable()
                        .interpolation(.none)
                        .frame(width: 128, height: 128)
                        .padding(10)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    VStack(alignment: .leading, spacing: 10) {
                        Text(approval.mobileApproved == true ? "Mobile approval received" : "Awaiting mobile approval")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundStyle((approval.mobileApproved == true ? Color.green : Color.orange).opacity(0.9))
                        Text("Scan from Comet Mobile to unlock this high-risk command, then confirm the matching PIN here.")
                            .font(.system(size: 11, design: .rounded))
                            .foregroundStyle(.white.opacity(0.55))
                    }
                }

                TextField("Enter matching PIN", text: $pinText)
                    .textFieldStyle(.plain)
                    .padding(12)
                    .background(Color.white.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .foregroundStyle(.white)
            }

            if approval.requiresDeviceUnlock == true {
                HStack(spacing: 8) {
                    Image(systemName: "touchid")
                        .font(.system(size: 14, weight: .bold))
                    Text(isUnlocking ? "Waiting for Touch ID or Mac password…" : "This approval will verify with Touch ID or your Mac password before the command runs.")
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                }
                .foregroundStyle(Color.cyan.opacity(0.9))
            }

            if let errorMessage, !errorMessage.isEmpty {
                Text(errorMessage)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(Color.red.opacity(0.92))
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.red.opacity(0.10))
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }

            HStack(spacing: 10) {
                Button("Deny", action: onDeny)
                    .buttonStyle(.plain)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.8))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color.white.opacity(0.08))
                    .clipShape(Capsule())

                Button(approval.requiresDeviceUnlock == true ? (isUnlocking ? "Unlocking…" : "Allow with Touch ID") : "Allow", action: onAllow)
                    .buttonStyle(.plain)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(.black)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(canApprove ? colorForRisk : Color.gray.opacity(0.4))
                    .clipShape(Capsule())
                    .disabled(!canApprove || isUnlocking)
            }
        }
        .padding(16)
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private var colorForRisk: Color {
        switch approval.risk {
        case "high": return .red
        case "medium": return .orange
        default: return .green
        }
    }

    private func decodeDataURLImage(_ dataURLString: String) -> NSImage? {
        guard let commaIndex = dataURLString.firstIndex(of: ",") else { return nil }
        let encoded = String(dataURLString[dataURLString.index(after: commaIndex)...])
        guard let imageData = Data(base64Encoded: encoded) else { return nil }
        return NSImage(data: imageData)
    }
}

struct ConnectionBadge: View {
    let isConnected: Bool
    let text: String

    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(isConnected ? Color.green : Color.orange)
                .frame(width: 8, height: 8)
            Text(text)
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(.white.opacity(0.8))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(Color.white.opacity(0.06))
        .clipShape(Capsule())
    }
}

struct NativeActionButton: View {
    let title: String
    let systemImage: String
    let appearance: String
    let action: () -> Void

    init(title: String, systemImage: String, appearance: String = "dark", action: @escaping () -> Void) {
        self.title = title
        self.systemImage = systemImage
        self.appearance = appearance
        self.action = action
    }

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(palette.primaryText)
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(palette.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

struct SidebarGlyphButton: View {
    let systemImage: String
    let accessibilityLabel: String
    let appearance: String
    let gradientPreset: String?
    let action: () -> Void

    var body: some View {
        let palette = PanelPalette(appearance: appearance, gradientPreset: gradientPreset)
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(palette.primaryText)
                .frame(width: 34, height: 34)
                .background(palette.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(palette.stroke, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
        .help(accessibilityLabel)
    }
}

struct SidebarTagChip: View {
    let text: String
    let appearance: String
    let gradientPreset: String?

    var body: some View {
        let palette = PanelPalette(appearance: appearance, gradientPreset: gradientPreset)
        Text(text)
            .font(.system(size: 10, weight: .bold, design: .rounded))
            .foregroundStyle(palette.primaryText)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(palette.mutedSurface)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(palette.stroke, lineWidth: 1)
            )
    }
}

struct SessionChipView: View {
    let title: String
    let updatedAt: Double
    let isActive: Bool
    let appearance: String
    let gradientPreset: String?

    var body: some View {
        let palette = PanelPalette(appearance: appearance, gradientPreset: gradientPreset)
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(isActive ? palette.buttonText : palette.primaryText)
                .lineLimit(1)
            Text(relativeTimestamp)
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundStyle(isActive ? palette.buttonText.opacity(0.76) : palette.secondaryText)
        }
        .frame(width: 180, alignment: .leading)
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            Group {
                if isActive {
                    LinearGradient(colors: [palette.accent, palette.secondaryAccent], startPoint: .leading, endPoint: .trailing)
                } else {
                    palette.mutedSurface
                }
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(isActive ? Color.white.opacity(0.18) : palette.stroke, lineWidth: 1)
        )
    }

    private var relativeTimestamp: String {
        let date = Date(timeIntervalSince1970: updatedAt / 1000)
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

struct EmptyStateCard: View {
    let title: String
    let description: String
    let appearance: String

    init(title: String, description: String, appearance: String = "dark") {
        self.title = title
        self.description = description
        self.appearance = appearance
    }

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(palette.primaryText)
            Text(description)
                .font(.system(size: 12, design: .rounded))
                .foregroundStyle(palette.secondaryText)
        }
        .padding(16)
        .background(palette.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

struct StatusPill: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.system(size: 9, weight: .black, design: .rounded))
            .foregroundStyle(.white.opacity(0.82))
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(color)
            .clipShape(Capsule())
    }
}

struct MessageBubbleView: View {
    let message: NativePanelState.Message
    let appearance: String
    let animateContent: Bool

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        let parseResult = AICommandParser.parseCommands(from: message.content)
        let visibleContent = AICommandParser.cleanCustomTags(from: parseResult.hasCommands ? parseResult.textWithoutCommands : message.content)
        let reasoningBlocks = resolvedReasoning
        let ocrText = AICommandParser.extractOCRText(from: message)
        let actionLogs = AICommandParser.extractActionLogs(from: message)
        let mediaItems = AICommandParser.extractMediaItems(from: message)

        VStack(alignment: .leading, spacing: 8) {
            Text(message.role == "user" ? "You" : "Comet")
                .font(.system(size: 10, weight: .black, design: .rounded))
                .foregroundStyle(message.role == "user" ? palette.accent : palette.secondaryAccent)
                .textCase(.uppercase)

            if message.role != "user" {
                ForEach(reasoningBlocks, id: \.self) { reasoning in
                    ThinkingIndicatorView(appearance: appearance, thought: reasoning)
                }
            }

            if parseResult.hasCommands && message.role != "user" {
                ForEach(parseResult.commands) { command in
                    CommandTagView(command: command, appearance: appearance)
                }
            }

            if !visibleContent.isEmpty {
                AnimatedMarkdownMessageText(
                    content: visibleContent,
                    appearance: appearance,
                    animate: animateContent
                )
            }

            if let ocrText, !ocrText.isEmpty {
                OCRResultCard(label: message.ocrLabel ?? "OCR_RESULT", content: ocrText, appearance: appearance)
            }

            if !actionLogs.isEmpty {
                ActionLogCard(actionLogs: actionLogs, appearance: appearance)
            }

            if !mediaItems.isEmpty {
                MediaAttachmentGroup(items: mediaItems, appearance: appearance)
            }
        }
        .padding(14)
        .background(message.role == "user" ? palette.accent.opacity(0.12) : palette.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var resolvedReasoning: [String] {
        var values: [String] = []
        if let thinkText = message.thinkText?.trimmingCharacters(in: .whitespacesAndNewlines), !thinkText.isEmpty {
            values.append(thinkText)
        }
        values.append(contentsOf: AICommandParser.extractReasoning(from: message.content))
        var seen = Set<String>()
        return values.filter { value in
            guard !value.isEmpty, !seen.contains(value) else { return false }
            seen.insert(value)
            return true
        }
    }
}

struct AnimatedMarkdownMessageText: View {
    let content: String
    let appearance: String
    let animate: Bool

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var visibleLength = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            MarkdownMessageText(content: visibleContent, appearance: appearance)

            if showCaret {
                HStack(spacing: 6) {
                    Capsule()
                        .fill(PanelPalette(appearance: appearance).accent)
                        .frame(width: 10, height: 18)
                    Text("Comet is writing")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundStyle(PanelPalette(appearance: appearance).secondaryText)
                }
                .transition(.opacity)
            }
        }
        .task(id: animationKey) {
            await animateToLatestContent()
        }
    }

    private var animationKey: String {
        "\(content.count)-\(animate)-\(reduceMotion)"
    }

    private var visibleContent: String {
        if !animate || reduceMotion {
            return content
        }
        return String(content.prefix(visibleLength))
    }

    private var showCaret: Bool {
        animate && !reduceMotion && visibleLength < content.count
    }

    @MainActor
    private func animateToLatestContent() async {
        if !animate || reduceMotion {
            visibleLength = content.count
            return
        }

        if visibleLength > content.count {
            visibleLength = content.count
        }

        while visibleLength < content.count {
            let remaining = content.count - visibleLength
            let step: Int
            switch remaining {
            case 321...:
                step = 28
            case 161...320:
                step = 14
            case 61...160:
                step = 6
            default:
                step = 2
            }

            visibleLength = min(content.count, visibleLength + step)
            try? await Task.sleep(nanoseconds: 18_000_000)
        }
    }
}

struct CommandTagView: View {
    let command: CommandInfo
    let appearance: String

    var body: some View {
        if command.type == "THINK" {
            ThinkingIndicatorView(appearance: appearance, thought: command.value.isEmpty ? nil : command.value)
        } else {
            standardTagView
        }
    }

    @ViewBuilder
    private var standardTagView: some View {
        let palette = PanelPalette(appearance: appearance)
        HStack(spacing: 8) {
            Image(systemName: iconForCategory(command.category))
                .font(.system(size: 10, weight: .bold))
            Text(command.type.replacingOccurrences(of: "_", with: " "))
                .font(.system(size: 10, weight: .bold, design: .rounded))
            if !command.value.isEmpty {
                Text(command.value.prefix(30) + (command.value.count > 30 ? "..." : ""))
                    .font(.system(size: 9, design: .rounded))
                    .foregroundStyle(palette.secondaryText)
                    .lineLimit(1)
            }
        }
        .foregroundStyle(colorForRisk(command.riskLevel))
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(colorForRisk(command.riskLevel).opacity(0.15))
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(colorForRisk(command.riskLevel).opacity(0.3), lineWidth: 1)
        )
    }

    private func iconForCategory(_ category: String) -> String {
        switch category {
        case "navigation": return "globe"
        case "browser": return "safari"
        case "automation": return "gearshape.2"
        case "system": return "terminal"
        case "pdf": return "doc.richtext"
        case "utility": return "wrench.and.screwdriver"
        case "media": return "photo"
        case "meta": return "brain"
        default: return "command"
        }
    }

    private func colorForRisk(_ risk: String) -> Color {
        switch risk {
        case "high": return .red
        case "medium": return .orange
        default: return .green
        }
    }
}

struct OCRResultCard: View {
    let label: String
    let content: String
    let appearance: String

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label(label.replacingOccurrences(of: "_", with: " "), systemImage: "viewfinder")
                    .font(.system(size: 10, weight: .black, design: .rounded))
                    .foregroundStyle(Color.orange.opacity(0.95))
                Spacer()
                Text("\(content.count) chars")
                    .font(.system(size: 9, weight: .bold, design: .rounded))
                    .foregroundStyle(palette.secondaryText)
            }

            ScrollView(.vertical, showsIndicators: true) {
                Text(content)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(palette.primaryText)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .textSelection(.enabled)
            }
            .frame(maxHeight: 180)
        }
        .padding(12)
        .background(Color.orange.opacity(0.10))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(Color.orange.opacity(0.25), lineWidth: 1)
        )
    }
}

struct ActionLogCard: View {
    let actionLogs: [NativePanelState.ActionLog]
    let appearance: String

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 8) {
            Label("Action Chain", systemImage: "point.3.filled.connected.trianglepath.dotted")
                .font(.system(size: 10, weight: .black, design: .rounded))
                .foregroundStyle(palette.secondaryAccent)

            ForEach(Array(actionLogs.prefix(8).enumerated()), id: \.offset) { index, log in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("\(index + 1). \(log.type.replacingOccurrences(of: "_", with: " "))")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundStyle(palette.primaryText)
                        Spacer()
                        StatusPill(text: log.success ? "DONE" : "FAILED", color: log.success ? Color.green.opacity(0.25) : Color.red.opacity(0.25))
                    }
                    Text(log.output)
                        .font(.system(size: 10, design: .rounded))
                        .foregroundStyle(palette.secondaryText)
                        .lineLimit(4)
                        .textSelection(.enabled)
                }
                .padding(10)
                .background(Color.white.opacity(appearance == "light" ? 0.45 : 0.04))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
        }
        .padding(12)
        .background(palette.mutedSurface.opacity(0.7))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

struct MediaAttachmentGroup: View {
    let items: [NativePanelState.MediaItem]
    let appearance: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Media", systemImage: "photo.on.rectangle.angled")
                .font(.system(size: 10, weight: .black, design: .rounded))
                .foregroundStyle(PanelPalette(appearance: appearance).secondaryAccent)

            ForEach(items, id: \.stableId) { item in
                MediaAttachmentCard(item: item, appearance: appearance)
            }
        }
    }
}

struct MediaAttachmentCard: View {
    let item: NativePanelState.MediaItem
    let appearance: String

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label(titleText, systemImage: systemImage)
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(palette.primaryText)
                Spacer()
                if let actionURL {
                    Link("Open", destination: actionURL)
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundStyle(palette.accent)
                }
            }

            if let subtitleText, !subtitleText.isEmpty {
                Text(subtitleText)
                    .font(.system(size: 10, design: .rounded))
                    .foregroundStyle(palette.secondaryText)
            }

            mediaBody
        }
        .padding(12)
        .background(palette.mutedSurface.opacity(0.75))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    @ViewBuilder
    private var mediaBody: some View {
        switch item.type {
        case "mermaid":
            if let code = item.code, !code.isEmpty {
                MermaidView(diagram: code, appearance: appearance)
                    .frame(height: 220)
            }
        case "flowchart":
            if let code = item.code, !code.isEmpty {
                if looksLikeMermaid(code) {
                    MermaidView(diagram: code, appearance: appearance)
                        .frame(height: 220)
                } else {
                    MarkdownMessageText(content: "```text\n\(code)\n```", appearance: appearance)
                }
            }
        case "chart":
            ChartSummaryView(dataJSON: item.chartDataJSON, optionsJSON: item.chartOptionsJSON, appearance: appearance)
        default:
            EmptyView()
        }
    }

    private var titleText: String {
        switch item.type {
        case "image": return item.caption ?? "Image"
        case "video": return item.title ?? "Video"
        case "mermaid": return item.caption ?? "Mermaid Diagram"
        case "flowchart": return item.caption ?? "Flowchart"
        case "chart": return item.title ?? "Chart"
        default: return item.type.capitalized
        }
    }

    private var subtitleText: String? {
        switch item.type {
        case "image":
            return item.url
        case "video":
            return item.description ?? item.videoUrl ?? item.thumbnailUrl
        case "chart":
            return chartSubtitle
        default:
            return nil
        }
    }

    private var systemImage: String {
        switch item.type {
        case "image": return "photo"
        case "video": return "play.rectangle"
        case "mermaid", "flowchart": return "point.3.filled.connected.trianglepath.dotted"
        case "chart": return "chart.xyaxis.line"
        default: return "paperclip"
        }
    }

    private var actionURL: URL? {
        let candidate = item.videoUrl ?? item.url ?? item.thumbnailUrl
        guard let candidate, let url = URL(string: candidate) else { return nil }
        return url
    }

    private var chartSubtitle: String? {
        guard
            let dataJSON = item.chartDataJSON,
            let data = dataJSON.data(using: .utf8),
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return nil
        }
        let labelsCount = (json["labels"] as? [Any])?.count ?? 0
        let datasetCount = (json["datasets"] as? [Any])?.count ?? 0
        return "\(datasetCount) dataset(s) • \(labelsCount) label(s)"
    }

    private func looksLikeMermaid(_ code: String) -> Bool {
        let trimmed = code.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return trimmed.hasPrefix("graph ")
            || trimmed.hasPrefix("flowchart ")
            || trimmed.hasPrefix("sequencediagram")
            || trimmed.hasPrefix("statediagram")
            || trimmed.hasPrefix("classdiagram")
    }
}

struct ChartSummaryView: View {
    let dataJSON: String?
    let optionsJSON: String?
    let appearance: String

    var body: some View {
        if let dataJSON, !dataJSON.isEmpty {
            MarkdownMessageText(content: "```json\n\(prettyPrinted(dataJSON) ?? dataJSON)\n```", appearance: appearance)
        }
    }

    private func prettyPrinted(_ text: String) -> String? {
        guard
            let data = text.data(using: .utf8),
            let json = try? JSONSerialization.jsonObject(with: data),
            let prettyData = try? JSONSerialization.data(withJSONObject: json, options: [.prettyPrinted]),
            let pretty = String(data: prettyData, encoding: .utf8)
        else {
            return nil
        }
        return pretty
    }
}

struct MarkdownMessageText: View {
    let content: String
    let appearance: String

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        let processedContent = preprocessMarkdown(content)
        
        Group {
            if containsComplexElements(processedContent) {
                RichMarkdownView(content: processedContent, appearance: appearance)
            } else if let attributed = try? AttributedString(markdown: processedContent, options: AttributedString.MarkdownParsingOptions(interpretedSyntax: .inlineOnlyPreservingWhitespace)) {
                Text(attributed)
                    .font(.system(size: 13, design: .rounded))
            } else {
                Text(verbatim: processedContent)
                    .font(.system(size: 13, design: .rounded))
            }
        }
        .foregroundStyle(palette.primaryText)
        .frame(maxWidth: .infinity, alignment: .leading)
        .fixedSize(horizontal: false, vertical: true)
        .textSelection(.enabled)
    }
    
    private func preprocessMarkdown(_ text: String) -> String {
        var result = text
        result = result.replacingOccurrences(of: "\r\n", with: "\n")
        result = result.replacingOccurrences(of: "\r", with: "\n")
        result = result.replacingOccurrences(of: "<br\\s*/?>", with: "\n", options: .regularExpression)
        result = result.replacingOccurrences(of: "<\\\\?br\\\\?>", with: "\n", options: .regularExpression)
        result = result.replacingOccurrences(of: "(?<=[.!?])\\h*(?=(?:\\d+\\.|[-*•])\\h)", with: "\n\n", options: .regularExpression)
        result = result.replacingOccurrences(of: "(?<!\\n)(#{1,6}\\h)", with: "\n$1", options: .regularExpression)
        result = result.replacingOccurrences(of: "\\n{3,}", with: "\n\n", options: .regularExpression)
        return result
    }
    
    private func containsComplexElements(_ text: String) -> Bool {
        let patterns = [
            "\\$\\$",
            "\\$[^$]+\\$",
            "\\\\\\[",
            "\\\\\\(",
            "\\\\begin\\{",
            "\\\\frac\\{",
            "\\\\sum\\{",
            "\\\\int\\{",
            "```",
            "<[a-zA-Z][^>]*>",
            "\\|\\s*[-:]+\\s*\\|",
            "(?m)^\\s*(?:[-*•]|\\d+\\.)\\s+.+$"
        ]
        for pattern in patterns {
            if text.range(of: pattern, options: .regularExpression) != nil {
                return true
            }
        }
        return false
    }
}

struct RichMarkdownView: NSViewRepresentable {
    let content: String
    let appearance: String
    
    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.javaScriptEnabled = true
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.setValue(false, forKey: "drawsBackground")
        return webView
    }
    
    func updateNSView(_ nsView: WKWebView, context: Context) {
        let isDark = appearance != "light"
        let html = generateHTML(content: content, isDark: isDark)
        nsView.loadHTMLString(html, baseURL: nil)
    }
    
    private func generateHTML(content: String, isDark: Bool) -> String {
        let escapedContent = content
            .replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\n", with: "\\n")
        
        let textColor = isDark ? "#ffffff" : "#1a1a1a"
        let codeBg = isDark ? "#2d2d3d" : "#f5f5f5"
        let accentColor = "#6366f1"
        
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
            <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Rounded', 'Segoe UI', sans-serif;
                    font-size: 13px;
                    line-height: 1.6;
                    color: \(textColor);
                    background: transparent;
                    padding: 4px;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    white-space: pre-wrap;
                }
                h1, h2, h3, h4, h5, h6 { margin: 12px 0 8px 0; font-weight: 600; }
                h1 { font-size: 18px; }
                h2 { font-size: 16px; }
                h3 { font-size: 14px; }
                p { margin: 8px 0; }
                strong, b { font-weight: 600; }
                em, i { font-style: italic; }
                code {
                    font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
                    font-size: 12px;
                    background: \(codeBg);
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                pre {
                    background: \(codeBg);
                    padding: 12px;
                    border-radius: 8px;
                    overflow-x: auto;
                    margin: 10px 0;
                }
                pre code { background: none; padding: 0; }
                blockquote {
                    border-left: 3px solid \(accentColor);
                    padding-left: 12px;
                    margin: 10px 0;
                    opacity: 0.9;
                }
                ul, ol { margin: 8px 0; padding-left: 20px; }
                li { margin: 4px 0; }
                a { color: \(accentColor); text-decoration: none; }
                hr { border: none; border-top: 1px solid rgba(128,128,128,0.3); margin: 16px 0; }
                table { border-collapse: collapse; width: 100%; margin: 10px 0; }
                th, td { border: 1px solid rgba(128,128,128,0.3); padding: 8px; text-align: left; }
                th { background: \(codeBg); font-weight: 600; }
                .katex-display { margin: 12px 0; overflow-x: auto; }
                .katex { font-size: 13px; }
            </style>
        </head>
        <body>
            <div id="content"></div>
            <script>
                function renderMarkdown(text) {
                    text = text.replace(/```(\\w+)?\\n([\\s\\S]*?)```/g, '<pre><code>$2</code></pre>');
                    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
                    text = text.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
                    text = text.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');
                    text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
                    text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
                    text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
                    text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
                    text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');
                    text = text.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
                    text = text.replace(/(?:^|\\n)([-*•])\\s+(.+?)(?=\\n|$)/g, '<li>$2</li>');
                    text = text.replace(/(?:^|\\n)(\\d+)\\.\\s+(.+?)(?=\\n|$)/g, '<li>$1. $2</li>');
                    text = text.replace(/(<li>[\\s\\S]*?<\\/li>)/g, '<ul>$1</ul>');
                    text = text.replace(/<\\/ul>\\s*<ul>/g, '');
                    text = text.replace(/\\n/g, '<br>');
                    return text;
                }
                
                let raw = `\(escapedContent)`;
                let processed = renderMarkdown(raw);
                document.getElementById('content').innerHTML = processed;
                
                if (typeof renderMathInElement !== 'undefined') {
                    renderMathInElement(document.body, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false},
                            {left: '\\\\[', right: '\\\\]', display: true},
                            {left: '\\\\(', right: '\\\\)', display: false}
                        ],
                        throwOnError: false
                    });
                } else {
                    try {
                        document.querySelectorAll('code').forEach(block => {
                            if (block.textContent.includes('\\\\') || block.textContent.includes('\\$')) {
                                katex.render(block.textContent, block, { throwOnError: false, displayMode: false });
                            }
                        });
                    } catch(e) {}
                }
            </script>
        </body>
        </html>
        """
    }
}

struct MermaidView: NSViewRepresentable {
    let diagram: String
    let appearance: String
    
    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.javaScriptEnabled = true
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.setValue(false, forKey: "drawsBackground")
        return webView
    }
    
    func updateNSView(_ nsView: WKWebView, context: Context) {
        let isDark = appearance != "light"
        let html = generateMermaidHTML(diagram: diagram, isDark: isDark)
        nsView.loadHTMLString(html, baseURL: nil)
    }
    
    private func generateMermaidHTML(diagram: String, isDark: Bool) -> String {
        let escapedDiagram = diagram
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "`", with: "\\`")
            .replacingOccurrences(of: "$", with: "\\$")
        
        let bgColor = isDark ? "#1e1e2e" : "#ffffff"
        let textColor = isDark ? "#ffffff" : "#1a1a1a"
        let primaryColor = "#6366f1"
        let secondaryColor = "#8b5cf6"
        let lineColor = isDark ? "#4a4a6a" : "#d1d5db"
        
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Rounded', sans-serif;
                    background: transparent;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100px;
                    padding: 16px;
                }
                .mermaid {
                    color-scheme: \(isDark ? "dark" : "light");
                }
            </style>
        </head>
        <body>
            <pre class="mermaid">
            \(escapedDiagram)
            </pre>
            <script>
                mermaid.initialize({
                    startOnLoad: true,
                    theme: '\(isDark ? "dark" : "default")',
                    themeVariables: {
                        primaryColor: '\(primaryColor)',
                        primaryTextColor: '\(textColor)',
                        primaryBorderColor: '\(lineColor)',
                        lineColor: '\(lineColor)',
                        secondaryColor: '\(secondaryColor)',
                        tertiaryColor: '\(isDark ? "#2d2d3d" : "#f5f5f5")'
                    },
                    flowchart: {
                        useMaxWidth: true,
                        htmlLabels: true,
                        curve: 'basis'
                    },
                    securityLevel: 'loose'
                });
            </script>
        </body>
        </html>
        """
    }
}

struct AuroraThinkingView: View {
    let appearance: String
    @State private var spin = false

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .stroke(AngularGradient(colors: [palette.accent, palette.secondaryAccent, palette.accent], center: .center), lineWidth: 3)
                    .frame(width: 30, height: 30)
                    .rotationEffect(.degrees(spin ? 360 : 0))
                Circle()
                    .fill(palette.accent.opacity(0.26))
                    .frame(width: 12, height: 12)
                    .blur(radius: 1)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Comet is writing")
                    .font(.system(size: 11, weight: .black, design: .rounded))
                    .foregroundStyle(palette.primaryText)
                HStack(spacing: 6) {
                    ForEach(0..<4, id: \.self) { index in
                        Capsule()
                            .fill(index.isMultiple(of: 2) ? palette.accent : palette.secondaryAccent)
                            .frame(width: 10, height: 4)
                            .scaleEffect(x: 1, y: spin ? 1.4 : 0.65, anchor: .center)
                            .animation(.easeInOut(duration: 0.75).repeatForever().delay(Double(index) * 0.1), value: spin)
                    }
                }
            }

            Spacer()
        }
        .padding(14)
        .background(palette.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .onAppear {
            spin = true
        }
    }
}

struct ThinkingIndicatorView: View {
    let appearance: String
    let thought: String?
    @State private var pulse = false
    @State private var dots = ""

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                ZStack {
                    Circle()
                        .fill(palette.accent.opacity(0.2))
                        .frame(width: 28, height: 28)
                        .scaleEffect(pulse ? 1.2 : 1.0)
                        .animation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true), value: pulse)
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(palette.accent)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text("Reasoning")
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .foregroundStyle(palette.primaryText)
                    Text("Processing thought\(dots)")
                        .font(.system(size: 10, design: .rounded))
                        .foregroundStyle(palette.secondaryText)
                }

                Spacer()

                HStack(spacing: 4) {
                    ForEach(0..<3, id: \.self) { index in
                        Circle()
                            .fill(palette.accent.opacity(0.6))
                            .frame(width: 5, height: 5)
                            .scaleEffect(pulse ? 1.3 : 0.8)
                            .animation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true).delay(Double(index) * 0.15), value: pulse)
                    }
                }
            }

            if let thought = thought, !thought.isEmpty {
                Text(thought)
                    .font(.system(size: 11, design: .rounded))
                    .foregroundStyle(palette.secondaryText)
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(palette.accent.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(palette.mutedSurface)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(palette.accent.opacity(0.3), lineWidth: 1)
                )
        )
        .onAppear {
            pulse = true
            animateDots()
        }
    }

    private func animateDots() {
        Timer.scheduledTimer(withTimeInterval: 0.4, repeats: true) { _ in
            switch dots.count {
            case 0: dots = "."
            case 1: dots = ".."
            case 2: dots = "..."
            default: dots = ""
            }
        }
    }
}

struct PromptComposer: NSViewRepresentable {
    @Binding var text: String
    let appearance: String
    let onSubmit: () -> Void
    let onInteraction: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(text: $text)
    }

    func makeNSView(context: Context) -> NSScrollView {
        let scrollView = NSScrollView()
        scrollView.drawsBackground = false
        scrollView.hasVerticalScroller = true
        scrollView.autohidesScrollers = true
        scrollView.borderType = .noBorder
        scrollView.contentInsets = NSEdgeInsetsZero

        let textView = PromptEditorTextView()
        textView.delegate = context.coordinator
        textView.isRichText = false
        textView.importsGraphics = false
        textView.drawsBackground = false
        textView.font = NSFont.systemFont(ofSize: 13, weight: .medium)
        textView.textContainerInset = NSSize(width: 6, height: 8)
        textView.isEditable = true
        textView.isSelectable = true
        textView.isHorizontallyResizable = false
        textView.isVerticallyResizable = true
        textView.minSize = NSSize(width: 0, height: 0)
        textView.maxSize = NSSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)
        textView.autoresizingMask = [.width]
        textView.textContainer?.widthTracksTextView = true
        textView.textContainer?.containerSize = NSSize(width: 0, height: CGFloat.greatestFiniteMagnitude)
        textView.allowsUndo = true
        textView.onSubmit = onSubmit
        textView.onInteraction = onInteraction
        textView.backgroundColor = .clear
        textView.frame = NSRect(origin: .zero, size: NSSize(width: scrollView.contentSize.width, height: scrollView.contentSize.height))
        scrollView.documentView = textView
        applyAppearance(to: textView, appearance: appearance)
        DispatchQueue.main.async {
            scrollView.window?.makeFirstResponder(textView)
        }
        return scrollView
    }

    func updateNSView(_ nsView: NSScrollView, context: Context) {
        guard let textView = nsView.documentView as? PromptEditorTextView else { return }
        if textView.string != text {
            textView.string = text
        }
        applyAppearance(to: textView, appearance: appearance)
        textView.onSubmit = onSubmit
        textView.onInteraction = onInteraction
        nsView.backgroundColor = .clear
    }

    private func applyAppearance(to textView: PromptEditorTextView, appearance: String) {
        let isLight = appearance == "light"
        let textColor: NSColor = isLight ? .labelColor : .white
        textView.textColor = textColor
        textView.insertionPointColor = isLight ? .labelColor : .white
        textView.backgroundColor = .clear
        textView.font = NSFont.systemFont(ofSize: 13, weight: .medium)
    }

    final class Coordinator: NSObject, NSTextViewDelegate {
        @Binding var text: String

        init(text: Binding<String>) {
            self._text = text
        }

        func textDidChange(_ notification: Notification) {
            guard let textView = notification.object as? NSTextView else { return }
            text = textView.string
        }
    }
}

final class PromptEditorTextView: NSTextView {
    var onSubmit: (() -> Void)?
    var onInteraction: (() -> Void)?

    override var acceptsFirstResponder: Bool {
        true
    }

    override func acceptsFirstMouse(for event: NSEvent?) -> Bool {
        true
    }

    override func keyDown(with event: NSEvent) {
        onInteraction?()
        if event.keyCode == 36 || event.keyCode == 76 {
            if event.modifierFlags.contains(.shift) {
                insertNewline(nil)
            } else {
                onSubmit?()
            }
            return
        }
        super.keyDown(with: event)
    }

    override func mouseDown(with event: NSEvent) {
        onInteraction?()
        window?.makeFirstResponder(self)
        super.mouseDown(with: event)
    }

    override func becomeFirstResponder() -> Bool {
        onInteraction?()
        return super.becomeFirstResponder()
    }

    override func viewDidMoveToWindow() {
        super.viewDidMoveToWindow()
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.window?.makeFirstResponder(self)
        }
    }
}

struct CommandInfo: Identifiable {
    let id: String
    let type: String
    let value: String
    let category: String
    let riskLevel: String
    let reason: String?
    let originalMatch: String
    let index: Int

    init(type: String, value: String, category: String, riskLevel: String, reason: String? = nil, originalMatch: String, index: Int) {
        self.type = type
        self.value = value
        self.category = category
        self.riskLevel = riskLevel
        self.reason = reason
        self.originalMatch = originalMatch
        self.index = index
        self.id = "\(type)-\(index)-\(value.prefix(48))"
    }
}

struct CommandParseResult {
    let commands: [CommandInfo]
    let textWithoutCommands: String
    let hasCommands: Bool
}

enum AICommandType: String, CaseIterable {
    case NAVIGATE, SEARCH, WEB_SEARCH, READ_PAGE_CONTENT, LIST_OPEN_TABS
    case CREATE_PDF_JSON, CREATE_FILE_JSON, GENERATE_PDF
    case SHELL_COMMAND, SET_THEME, SET_VOLUME, SET_BRIGHTNESS, OPEN_APP
    case SCREENSHOT_AND_ANALYZE, CLICK_ELEMENT, CLICK_AT, FIND_AND_CLICK, FILL_FORM, SCROLL_TO
    case GENERATE_DIAGRAM, GENERATE_FLOWCHART, GENERATE_CHART, OPEN_VIEW, RELOAD, GO_BACK, GO_FORWARD
    case WAIT, THINK, PLAN, EXPLAIN_CAPABILITIES
    case SHOW_IMAGE, SHOW_VIDEO, OCR_COORDINATES, OCR_SCREEN, EXTRACT_DATA
    case DOM_SEARCH, DOM_READ_FILTERED
    case OPEN_MCP_SETTINGS, OPEN_AUTOMATION_SETTINGS, LIST_AUTOMATIONS, DELETE_AUTOMATION
    case OPEN_SCHEDULING_MODAL, SCHEDULE_TASK, OPEN_PDF, PLUGIN_COMMAND
    case ORGANIZE_TABS, CLOSE_TAB

    var category: String {
        switch self {
        case .NAVIGATE, .SEARCH, .WEB_SEARCH: return "navigation"
        case .READ_PAGE_CONTENT, .LIST_OPEN_TABS, .CLOSE_TAB: return "browser"
        case .CLICK_ELEMENT, .CLICK_AT, .FIND_AND_CLICK, .FILL_FORM, .SCROLL_TO, .ORGANIZE_TABS: return "automation"
        case .SHELL_COMMAND, .OPEN_APP, .SET_VOLUME, .SET_BRIGHTNESS: return "system"
        case .CREATE_PDF_JSON, .CREATE_FILE_JSON, .GENERATE_PDF, .GENERATE_DIAGRAM, .GENERATE_FLOWCHART, .GENERATE_CHART, .OPEN_PDF: return "pdf"
        case .SHOW_IMAGE, .SHOW_VIDEO, .SCREENSHOT_AND_ANALYZE, .OCR_COORDINATES, .OCR_SCREEN: return "media"
        case .WAIT, .OPEN_VIEW, .OPEN_MCP_SETTINGS, .OPEN_AUTOMATION_SETTINGS, .LIST_AUTOMATIONS, .DELETE_AUTOMATION, .OPEN_SCHEDULING_MODAL, .SCHEDULE_TASK, .PLUGIN_COMMAND: return "utility"
        case .THINK, .PLAN, .EXPLAIN_CAPABILITIES: return "meta"
        case .DOM_SEARCH, .DOM_READ_FILTERED, .EXTRACT_DATA: return "browser"
        case .SET_THEME, .RELOAD, .GO_BACK, .GO_FORWARD: return "utility"
        }
    }

    var defaultRisk: String {
        switch category {
        case "navigation", "browser", "meta":
            return "low"
        case "system", "automation", "media", "pdf", "utility":
            return "medium"
        default:
            return "medium"
        }
    }

    var description: String {
        switch self {
        case .NAVIGATE: return "Go to URL"
        case .SEARCH: return "Search engine"
        case .WEB_SEARCH: return "Web search"
        case .READ_PAGE_CONTENT: return "Read page"
        case .LIST_OPEN_TABS: return "List tabs"
        case .CREATE_PDF_JSON: return "Create PDF (JSON)"
        case .CREATE_FILE_JSON: return "Create file (JSON)"
        case .GENERATE_PDF: return "Create PDF"
        case .SHELL_COMMAND: return "Terminal command"
        case .SET_THEME: return "Set theme"
        case .SET_VOLUME: return "Set volume"
        case .SET_BRIGHTNESS: return "Set brightness"
        case .OPEN_APP: return "Open app"
        case .SCREENSHOT_AND_ANALYZE: return "Screenshot"
        case .CLICK_ELEMENT: return "Click element"
        case .CLICK_AT: return "Click coordinates"
        case .FIND_AND_CLICK: return "Find and click"
        case .FILL_FORM: return "Fill form"
        case .SCROLL_TO: return "Scroll"
        case .GENERATE_DIAGRAM: return "Generate diagram"
        case .GENERATE_FLOWCHART: return "Generate flowchart"
        case .GENERATE_CHART: return "Generate chart"
        case .OPEN_VIEW: return "Open view"
        case .RELOAD: return "Reload"
        case .GO_BACK: return "Go back"
        case .GO_FORWARD: return "Go forward"
        case .WAIT: return "Wait"
        case .THINK: return "Think"
        case .PLAN: return "Plan"
        case .EXPLAIN_CAPABILITIES: return "Capabilities"
        case .SHOW_IMAGE: return "Show image"
        case .SHOW_VIDEO: return "Show video"
        case .OCR_COORDINATES: return "OCR region"
        case .OCR_SCREEN: return "OCR screen"
        case .EXTRACT_DATA: return "Extract data"
        case .DOM_SEARCH: return "Search DOM"
        case .DOM_READ_FILTERED: return "Read DOM"
        case .OPEN_MCP_SETTINGS: return "MCP settings"
        case .OPEN_AUTOMATION_SETTINGS: return "Automation settings"
        case .LIST_AUTOMATIONS: return "List automations"
        case .DELETE_AUTOMATION: return "Delete automation"
        case .OPEN_SCHEDULING_MODAL: return "Schedule modal"
        case .SCHEDULE_TASK: return "Schedule task"
        case .OPEN_PDF: return "Open PDF"
        case .PLUGIN_COMMAND: return "Plugin command"
        case .ORGANIZE_TABS: return "Organize tabs"
        case .CLOSE_TAB: return "Close tab"
        }
    }
}

struct AICommandParser {
    private static let rawValueCommands: Set<String> = [
        AICommandType.GENERATE_PDF.rawValue,
        AICommandType.CREATE_PDF_JSON.rawValue,
        AICommandType.CREATE_FILE_JSON.rawValue,
        AICommandType.SCHEDULE_TASK.rawValue,
        AICommandType.OPEN_SCHEDULING_MODAL.rawValue,
    ]

    private static let jsonCommandPatterns = [
        #"(?s)\{[\s\S]*?"commands"\s*:\s*\[[\s\S]*?\][\s\S]*?\}"#,
        #"(?s)```json\s*\{[\s\S]*?"commands"\s*:\s*\[[\s\S]*?\][\s\S]*?\}\s*```"#,
        #"(?s)```\s*\{[\s\S]*?"commands"\s*:\s*\[[\s\S]*?\][\s\S]*?\}\s*```"#,
    ]

    static func parseCommands(from content: String) -> CommandParseResult {
        let jsonCommands = extractJSONCommands(from: content)
        if !jsonCommands.isEmpty {
            var cleaned = content
            for pattern in jsonCommandPatterns {
                cleaned = cleaned.replacingOccurrences(of: pattern, with: "", options: .regularExpression)
            }
            return CommandParseResult(
                commands: deduplicated(jsonCommands),
                textWithoutCommands: cleaned.trimmingCharacters(in: .whitespacesAndNewlines),
                hasCommands: true
            )
        }

        var parsedCommands: [CommandInfo] = []
        var seen = Set<String>()
        var rangesToRemove: [NSRange] = []

        func addUnique(_ command: CommandInfo) {
            let signature = "\(command.type):\(command.value)"
            guard !seen.contains(signature) else { return }
            seen.insert(signature)
            parsedCommands.append(command)
        }

        if let htmlCommentRegex = try? NSRegularExpression(pattern: #"(?is)<!--\s*AI_COMMANDS_START\s*-->[\s\S]*?<!--\s*AI_COMMANDS_END\s*-->"#) {
            let nsRange = NSRange(content.startIndex..., in: content)
            for match in htmlCommentRegex.matches(in: content, range: nsRange) {
                guard let matchRange = Range(match.range, in: content) else { continue }
                let block = String(content[matchRange])
                    .replacingOccurrences(of: #"<!--\s*AI_COMMANDS_START\s*-->"#, with: "", options: .regularExpression)
                    .replacingOccurrences(of: #"<!--\s*AI_COMMANDS_END\s*-->"#, with: "", options: .regularExpression)
                for line in block.components(separatedBy: .newlines) {
                    let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !trimmed.isEmpty else { continue }
                    guard
                        let lineRegex = try? NSRegularExpression(pattern: #"^\[([A-Z_]+)\]:(.*)$"#),
                        let lineMatch = lineRegex.firstMatch(in: trimmed, range: NSRange(trimmed.startIndex..., in: trimmed)),
                        let typeRange = Range(lineMatch.range(at: 1), in: trimmed),
                        let valueRange = Range(lineMatch.range(at: 2), in: trimmed)
                    else { continue }

                    let type = String(trimmed[typeRange]).uppercased()
                    let value = String(trimmed[valueRange]).trimmingCharacters(in: .whitespacesAndNewlines)
                    if let command = buildCommand(type: type, value: value, reason: nil, risk: nil, originalMatch: trimmed, index: match.range.location) {
                        addUnique(command)
                    }
                }
            }
        }

        let maskedContent = maskedContent(from: content)
        let commandPattern = AICommandType.allCases.map { $0.rawValue }.joined(separator: "|")
        let regexPattern = #"(?i)\[\s*(\#(commandPattern))\s*(?::\s*([^\]]+?))?\s*\]"#
            .replacingOccurrences(of: #"\#(commandPattern)"#, with: commandPattern)

        guard let regex = try? NSRegularExpression(pattern: regexPattern) else {
            return CommandParseResult(commands: parsedCommands, textWithoutCommands: content.trimmingCharacters(in: .whitespacesAndNewlines), hasCommands: !parsedCommands.isEmpty)
        }

        let nsRange = NSRange(maskedContent.startIndex..., in: maskedContent)
        for match in regex.matches(in: maskedContent, options: [], range: nsRange) {
            guard let typeRange = Range(match.range(at: 1), in: maskedContent) else { continue }
            let type = String(maskedContent[typeRange]).uppercased()
            var rawValue = ""
            if match.range(at: 2).location != NSNotFound, let valueRange = Range(match.range(at: 2), in: maskedContent) {
                rawValue = String(maskedContent[valueRange]).trimmingCharacters(in: .whitespacesAndNewlines)
            }

            if (rawValue.hasPrefix("\"") && rawValue.hasSuffix("\"")) || (rawValue.hasPrefix("'") && rawValue.hasSuffix("'")) {
                rawValue = String(rawValue.dropFirst().dropLast()).trimmingCharacters(in: .whitespacesAndNewlines)
            }

            let normalized = normalizeValue(type: type, rawValue: rawValue)
            guard let originalRange = Range(match.range, in: content) else { continue }
            let originalMatch = String(content[originalRange])
            if let command = buildCommand(type: type, value: normalized.value, reason: normalized.reason, risk: normalized.risk, originalMatch: originalMatch, index: match.range.location) {
                addUnique(command)
                rangesToRemove.append(match.range)
            }
        }

        var cleanedText = content
        for range in rangesToRemove.sorted(by: { $0.location > $1.location }) {
            guard let stringRange = Range(range, in: cleanedText) else { continue }
            cleanedText.replaceSubrange(stringRange, with: "")
        }

        return CommandParseResult(
            commands: parsedCommands,
            textWithoutCommands: cleanedText.trimmingCharacters(in: .whitespacesAndNewlines),
            hasCommands: !parsedCommands.isEmpty
        )
    }

    static func cleanCustomTags(from text: String) -> String {
        var result = text
        let patterns = [
            #"\[\s*AI REASONING\s*\][\s\S]*?\[\s*/AI REASONING\s*\]"#,
            #"\[\s*OCR_RESULT\s*\][\s\S]*?\[\s*/OCR_RESULT\s*\]"#,
            #"\[\s*ACTION_CHAIN_JSON\s*\][\s\S]*?\[\s*/ACTION_CHAIN_JSON\s*\]"#,
            #"\[\s*MEDIA_ATTACHMENTS_JSON\s*\][\s\S]*?\[\s*/MEDIA_ATTACHMENTS_JSON\s*\]"#,
            #"(?is)<(think|thinking|thought)>[\s\S]*?</\1>"#,
        ]
        for pattern in patterns {
            result = result.replacingOccurrences(of: pattern, with: "", options: .regularExpression)
        }
        return result.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func extractReasoning(from text: String) -> [String] {
        let tagged = extractAllTagContents(in: text, tagName: "AI REASONING")
        if !tagged.isEmpty {
            return tagged
        }
        return extractRegexCaptureGroups(in: text, pattern: #"(?is)<(?:think|thinking|thought)>\s*([\s\S]*?)\s*</(?:think|thinking|thought)>"#)
    }

    static func extractOCRText(from message: NativePanelState.Message) -> String? {
        if let ocrText = message.ocrText, !ocrText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return ocrText
        }
        guard let content = extractFirstTagContent(in: message.content, tagName: "OCR_RESULT") else { return nil }
        if
            let json = robustJSONParse(content) as? [String: Any],
            let extracted = json["content"] as? String,
            !extracted.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        {
            return extracted
        }
        return content
    }

    static func extractActionLogs(from message: NativePanelState.Message) -> [NativePanelState.ActionLog] {
        if let actionLogs = message.actionLogs, !actionLogs.isEmpty {
            return actionLogs
        }
        guard let content = extractFirstTagContent(in: message.content, tagName: "ACTION_CHAIN_JSON") else { return [] }
        guard
            let json = robustJSONParse(content) as? [String: Any],
            let actions = json["actions"] as? [[String: Any]]
        else { return [] }
        return actions.map { item in
            NativePanelState.ActionLog(
                type: (item["type"] as? String) ?? "ACTION",
                output: (item["output"] as? String) ?? "",
                success: (item["success"] as? Bool) ?? false
            )
        }
    }

    static func extractMediaItems(from message: NativePanelState.Message) -> [NativePanelState.MediaItem] {
        if let mediaItems = message.mediaItems, !mediaItems.isEmpty {
            return mediaItems
        }
        guard let content = extractFirstTagContent(in: message.content, tagName: "MEDIA_ATTACHMENTS_JSON") else { return [] }
        guard
            let json = robustJSONParse(content) as? [String: Any],
            let attachments = json["attachments"] as? [[String: Any]]
        else { return [] }
        return attachments.enumerated().map { index, item in
            NativePanelState.MediaItem(
                id: "tag-media-\(index)",
                type: (item["type"] as? String) ?? "unknown",
                url: item["url"] as? String,
                caption: item["caption"] as? String,
                videoUrl: item["videoUrl"] as? String,
                title: item["title"] as? String,
                description: item["description"] as? String,
                thumbnailUrl: item["thumbnailUrl"] as? String,
                source: item["source"] as? String,
                videoId: item["videoId"] as? String,
                diagramId: item["diagramId"] as? String,
                code: item["code"] as? String,
                chartId: item["chartId"] as? String,
                chartDataJSON: item["chartDataJSON"] as? String,
                chartOptionsJSON: item["chartOptionsJSON"] as? String
            )
        }
    }

    private static func deduplicated(_ commands: [CommandInfo]) -> [CommandInfo] {
        var seen = Set<String>()
        var unique: [CommandInfo] = []
        for command in commands {
            let signature = "\(command.type):\(command.value)"
            guard !seen.contains(signature) else { continue }
            seen.insert(signature)
            unique.append(command)
        }
        return unique
    }

    private static func buildCommand(type: String, value: String, reason: String?, risk: String?, originalMatch: String, index: Int) -> CommandInfo? {
        guard let commandType = AICommandType(rawValue: type.uppercased()) else { return nil }
        return CommandInfo(
            type: commandType.rawValue,
            value: value,
            category: commandType.category,
            riskLevel: (risk?.isEmpty == false ? risk! : commandType.defaultRisk),
            reason: reason,
            originalMatch: originalMatch,
            index: index
        )
    }

    private static func extractJSONCommands(from content: String) -> [CommandInfo] {
        var commands: [CommandInfo] = []

        for pattern in jsonCommandPatterns {
            guard let regex = try? NSRegularExpression(pattern: pattern) else { continue }
            let nsRange = NSRange(content.startIndex..., in: content)
            for match in regex.matches(in: content, range: nsRange) {
                guard let matchRange = Range(match.range, in: content) else { continue }
                let rawMatch = String(content[matchRange])
                let jsonText = stripMarkdownFences(rawMatch)
                if let parsed = robustJSONParse(jsonText) {
                    commands.append(contentsOf: buildCommands(from: parsed, originalMatch: rawMatch, index: match.range.location))
                } else if let fallbackRegex = try? NSRegularExpression(pattern: #"(?is)"type"\s*:\s*"([^"]+)"\s*,\s*"value"\s*:\s*"([\s\S]*?)"(?=\s*\})"#) {
                    let fallbackRange = NSRange(rawMatch.startIndex..., in: rawMatch)
                    for fallbackMatch in fallbackRegex.matches(in: rawMatch, range: fallbackRange) {
                        guard
                            let typeRange = Range(fallbackMatch.range(at: 1), in: rawMatch),
                            let valueRange = Range(fallbackMatch.range(at: 2), in: rawMatch)
                        else { continue }

                        let type = String(rawMatch[typeRange]).uppercased()
                        let value = String(rawMatch[valueRange])
                            .replacingOccurrences(of: #"\\n"#, with: "\n", options: .regularExpression)
                            .replacingOccurrences(of: #"\""#, with: "\"")
                        if let command = buildCommand(type: type, value: value, reason: nil, risk: nil, originalMatch: rawMatch, index: match.range.location) {
                            commands.append(command)
                        }
                    }
                }
            }
        }

        return deduplicated(commands)
    }

    private static func buildCommands(from parsed: Any, originalMatch: String, index: Int) -> [CommandInfo] {
        guard
            let json = parsed as? [String: Any],
            let commandArray = json["commands"] as? [[String: Any]]
        else { return [] }

        return commandArray.compactMap { item in
            let type = ((item["type"] as? String) ?? (item["command"] as? String) ?? "").uppercased()
            let rawValue = item["value"] ?? item["url"] ?? item["query"] ?? ""
            let value: String
            if let stringValue = rawValue as? String {
                value = stringValue
            } else if JSONSerialization.isValidJSONObject(rawValue) {
                let data = try? JSONSerialization.data(withJSONObject: rawValue, options: [])
                value = data.flatMap { String(data: $0, encoding: .utf8) } ?? "\(rawValue)"
            } else {
                value = "\(rawValue)"
            }
            let reason = item["reason"] as? String
            let risk = item["risk"] as? String
            return buildCommand(type: type, value: value, reason: reason, risk: risk, originalMatch: originalMatch, index: index)
        }
    }

    private static func normalizeValue(type: String, rawValue: String) -> (value: String, reason: String?, risk: String?) {
        if rawValueCommands.contains(type) {
            return (rawValue, nil, nil)
        }

        let parts = rawValue
            .split(separator: "|", omittingEmptySubsequences: false)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        let value = parts.first ?? ""
        let reason = parts.first(where: { $0.lowercased().hasPrefix("reason:") })?
            .split(separator: ":", maxSplits: 1, omittingEmptySubsequences: false)
            .dropFirst()
            .first
            .map { String($0).trimmingCharacters(in: .whitespacesAndNewlines) }
            ?? (parts.count > 1 ? parts[1] : nil)
        let risk = parts.first(where: { $0.lowercased().hasPrefix("risk:") })?
            .split(separator: ":", maxSplits: 1, omittingEmptySubsequences: false)
            .dropFirst()
            .first
            .map { String($0).trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
        return (value, reason, risk)
    }

    private static func maskedContent(from text: String) -> String {
        var result = text
        let patterns = [
            #"(?s)```[\s\S]*?```"#,
            #"`.*?`"#,
            #"(?is)<(think|thinking|thought)>[\s\S]*?</\1>"#,
        ]
        for pattern in patterns {
            result = replaceMatchesWithSpaces(in: result, pattern: pattern)
        }

        result = result
            .components(separatedBy: .newlines)
            .map { line in
                let pipeCount = line.filter { $0 == "|" }.count
                return pipeCount >= 3 ? String(repeating: " ", count: line.count) : line
            }
            .joined(separator: "\n")
        return result
    }

    private static func replaceMatchesWithSpaces(in text: String, pattern: String) -> String {
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return text }
        let mutable = NSMutableString(string: text)
        let matches = regex.matches(in: text, range: NSRange(text.startIndex..., in: text))
        for match in matches.reversed() {
            let replacement = String(repeating: " ", count: match.range.length)
            mutable.replaceCharacters(in: match.range, with: replacement)
        }
        return mutable as String
    }

    private static func robustJSONParse(_ text: String) -> Any? {
        let strategies = [
            text,
            stripMarkdownFences(text),
            stripLLMPrefixes(text),
            stripLLMPrefixes(stripMarkdownFences(text)),
        ]

        for candidate in strategies {
            if let parsed = tryParseJSON(candidate) {
                return parsed
            }
        }

        if let codeBlock = extractJSONFromMarkdown(text), let parsed = tryParseJSON(codeBlock) {
            return parsed
        }

        return nil
    }

    private static func tryParseJSON(_ text: String) -> Any? {
        guard let data = text.data(using: .utf8) else { return nil }
        return try? JSONSerialization.jsonObject(with: data)
    }

    private static func stripMarkdownFences(_ text: String) -> String {
        text
            .replacingOccurrences(of: #"^```(?:json)?\s*\n?"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: #"\n?```\s*$"#, with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func stripLLMPrefixes(_ text: String) -> String {
        let prefixes = [
            #"^(?:here(?:'s| is) the(?: JSON)?:?\s*)"#,
            #"^(?:here(?:'s| is) (?:your |the )?(?:response|result|data):?\s*)"#,
            #"^(?:sure[,]?\s*(?:here(?:'s| is))?)\s*"#,
            #"^(?:of course[,]?\s*(?:here(?:'s| is))?)\s*"#,
            #"^(?:here you go[,]?\s*)"#,
            #"^(?:as requested[,]?\s*)"#,
            #"^(?:✅\s*)*"#,
        ]
        var result = text
        for prefix in prefixes {
            result = result.replacingOccurrences(of: prefix, with: "", options: [.regularExpression, .caseInsensitive])
        }
        return result.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func extractJSONFromMarkdown(_ text: String) -> String? {
        guard let regex = try? NSRegularExpression(pattern: #"(?is)```(?:json)?\s*([\s\S]*?)```"#),
              let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
              let range = Range(match.range(at: 1), in: text) else {
            return nil
        }
        return String(text[range])
    }

    private static func extractAllTagContents(in text: String, tagName: String) -> [String] {
        let pattern = #"(?is)\[?\s*"# + NSRegularExpression.escapedPattern(for: tagName) + #"\s*\]?\s*([\s\S]*?)\[?\s*/"# + NSRegularExpression.escapedPattern(for: tagName) + #"\s*\]?"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return [] }
        return regex.matches(in: text, range: NSRange(text.startIndex..., in: text)).compactMap { match in
            guard let range = Range(match.range(at: 1), in: text) else { return nil }
            return String(text[range]).trimmingCharacters(in: .whitespacesAndNewlines)
        }
    }

    private static func extractFirstTagContent(in text: String, tagName: String) -> String? {
        extractAllTagContents(in: text, tagName: tagName).first
    }

    private static func extractRegexCaptureGroups(in text: String, pattern: String) -> [String] {
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return [] }
        return regex.matches(in: text, range: NSRange(text.startIndex..., in: text)).compactMap { match in
            guard let range = Range(match.range(at: 1), in: text) else { return nil }
            return String(text[range]).trimmingCharacters(in: .whitespacesAndNewlines)
        }
    }
}

struct RootPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel

    var body: some View {
        mainContent
            .animation(.spring(response: 0.35, dampingFraction: 0.75), value: viewModel.configuration.mode)
    }
    
    @ViewBuilder
    var mainContent: some View {
        switch viewModel.configuration.mode {
        case .sidebar:
            SidebarPanelView(viewModel: viewModel)
        case .actionChain:
            ActionChainPanelView(viewModel: viewModel)
        case .menu:
            UtilityMenuPanelView(viewModel: viewModel)
        case .settings:
            NativeSettingsPanelView(viewModel: viewModel)
        case .downloads:
            DownloadsPanelView(viewModel: viewModel)
        case .clipboard:
            ClipboardPanelView(viewModel: viewModel)
        case .permissions:
            PermissionsPanelView(viewModel: viewModel)
        }
    }
}

enum ContextMenuAction: String, CaseIterable {
    case copy = "Copy"
    case cut = "Cut"
    case paste = "Paste"
    case selectAll = "Select All"
    case inspect = "Inspect Element"
    case searchWithAI = "Search with AI"
    case translate = "Translate"
    case lookUp = "Look Up"
    case share = "Share"
    case openLink = "Open Link"
    case copyLink = "Copy Link"
    case saveImage = "Save Image"
    case copyImage = "Copy Image"
    
    var icon: String {
        switch self {
        case .copy: return "doc.on.doc"
        case .cut: return "scissors"
        case .paste: return "doc.on.clipboard"
        case .selectAll: return "checkmark.circle"
        case .inspect: return "magnifyingglass"
        case .searchWithAI: return "sparkles"
        case .translate: return "globe"
        case .lookUp: return "book"
        case .share: return "square.and.arrow.up"
        case .openLink: return "link"
        case .copyLink: return "link"
        case .saveImage: return "arrow.down.to.line"
        case .copyImage: return "photo"
        }
    }
    
    var shortcut: String? {
        switch self {
        case .copy: return "⌘C"
        case .cut: return "⌘X"
        case .paste: return "⌘V"
        case .selectAll: return "⌘A"
        case .inspect: return "⌥⌘I"
        case .searchWithAI: return nil
        case .translate: return nil
        case .lookUp: return nil
        case .share: return nil
        case .openLink: return nil
        case .copyLink: return nil
        case .saveImage: return nil
        case .copyImage: return nil
        }
    }
}

struct ContextMenuState {
    var selectedText: String = ""
    var selectedURL: String?
    var selectedImageURL: String?
    var isVisible: Bool = false
    var position: CGPoint = .zero
    var contextType: ContextType = .text
    
    enum ContextType {
        case text
        case link
        case image
        case selection
    }
}

@MainActor
final class ContextMenuViewModel: ObservableObject {
    @Published var state = ContextMenuState()
    
    func updateSelection(text: String, url: String? = nil, imageURL: String? = nil) {
        state.selectedText = text
        state.selectedURL = url
        state.selectedImageURL = imageURL
        
        if url != nil {
            state.contextType = .link
        } else if imageURL != nil {
            state.contextType = .image
        } else if !text.isEmpty {
            state.contextType = .selection
        } else {
            state.contextType = .text
        }
    }
    
    func show(at position: CGPoint) {
        state.isVisible = true
        state.position = position
    }
    
    func hide() {
        state.isVisible = false
    }
    
    var availableActions: [ContextMenuAction] {
        switch state.contextType {
        case .text:
            return [.copy, .cut, .paste, .selectAll]
        case .selection:
            return [.copy, .cut, .inspect, .searchWithAI, .translate, .lookUp, .share]
        case .link:
            return [.openLink, .copyLink, .inspect, .searchWithAI, .share]
        case .image:
            return [.saveImage, .copyImage, .searchWithAI, .inspect]
        }
    }
}

struct NativeContextMenuView: View {
    @ObservedObject var viewModel: ContextMenuViewModel
    let onAction: (ContextMenuAction) -> Void
    
    var body: some View {
        if viewModel.state.isVisible {
            VStack(spacing: 0) {
                ForEach(viewModel.availableActions, id: \.rawValue) { action in
                    Button {
                        onAction(action)
                        viewModel.hide()
                    } label: {
                        HStack {
                            Image(systemName: action.icon)
                                .font(.system(size: 13, weight: .medium))
                                .frame(width: 20)
                            
                            Text(action.rawValue)
                                .font(.system(size: 13, weight: .regular))
                            
                            if let shortcut = action.shortcut {
                                Spacer()
                                Text(shortcut)
                                    .font(.system(size: 11, weight: .regular))
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .buttonStyle(.plain)
                    
                    if action != viewModel.availableActions.last {
                        Divider()
                            .padding(.horizontal, 8)
                    }
                }
            }
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(nsColor: .controlBackgroundColor))
                    .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color(nsColor: .separatorColor), lineWidth: 0.5)
            )
            .fixedSize()
            .position(viewModel.state.position)
        }
    }
}

struct WebContentContextMenu: NSViewRepresentable {
    let selectedText: String
    let selectedURL: String?
    let selectedImageURL: String?
    let onAction: (ContextMenuAction) -> Void
    
    func makeNSView(context: Context) -> ContextMenuNSView {
        let view = ContextMenuNSView()
        view.onAction = onAction
        view.onSelectionChange = { text, url, imageURL in
            context.coordinator.updateSelection(text: text, url: url, imageURL: imageURL)
        }
        return view
    }
    
    func updateNSView(_ nsView: ContextMenuNSView, context: Context) {
        nsView.selectedText = selectedText
        nsView.selectedURL = selectedURL
        nsView.selectedImageURL = selectedImageURL
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject {
        var parent: WebContentContextMenu
        
        init(_ parent: WebContentContextMenu) {
            self.parent = parent
        }
        
        func updateSelection(text: String, url: String?, imageURL: String?) {
        }
    }
}

final class ContextMenuNSView: NSView {
    var onAction: ((ContextMenuAction) -> Void)?
    var onSelectionChange: ((String, String?, String?) -> Void)?
    var selectedText: String = ""
    var selectedURL: String?
    var selectedImageURL: String?
    
    override func rightMouseDown(with event: NSEvent) {
        updateSelectionInfo()
        showContextMenu(with: event)
    }
    
    private func updateSelectionInfo() {
        if let webView = window?.contentView?.findWebView() {
            webView.evaluateJavaScript("window.getSelection().toString()") { result, _ in
                if let text = result as? String {
                    self.selectedText = text
                }
            }
        }
    }
    
    private func showContextMenu(with event: NSEvent) {
        let menu = NSMenu()
        
        let actions: [ContextMenuAction] = selectedText.isEmpty 
            ? [.copy, .cut, .paste, .selectAll]
            : [.copy, .cut, .searchWithAI, .translate, .inspect]
        
        for action in actions {
            let item = NSMenuItem(title: action.rawValue, action: #selector(handleMenuAction(_:)), keyEquivalent: "")
            item.representedObject = action
            item.target = self
            
            if let shortcut = action.shortcut {
                item.keyEquivalentModifierMask = []
                item.keyEquivalent = shortcut
            }
            
            menu.addItem(item)
        }
        
        if !selectedText.isEmpty {
            menu.addItem(NSMenuItem.separator())
            
            let lookUpItem = NSMenuItem(title: "Look Up", action: #selector(lookUpSelection), keyEquivalent: "")
            lookUpItem.target = self
            menu.addItem(lookUpItem)
            
            let shareItem = NSMenuItem(title: "Share", action: #selector(shareSelection), keyEquivalent: "")
            shareItem.target = self
            menu.addItem(shareItem)
        }
        
        let location = event.locationInWindow
        menu.popUp(positioning: nil, at: location, in: self)
    }
    
    @objc private func handleMenuAction(_ sender: NSMenuItem) {
        guard let action = sender.representedObject as? ContextMenuAction else { return }
        onAction?(action)
    }
    
    @objc private func lookUpSelection() {
        guard !selectedText.isEmpty else { return }
        NSWorkspace.shared.open(URL(string: "dictionary://lookup/\(selectedText.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")")!)
    }
    
    @objc private func shareSelection() {
        guard !selectedText.isEmpty else { return }
        let picker = NSSharingServicePicker(items: [selectedText])
        picker.show(relativeTo: bounds, of: self, preferredEdge: .minY)
    }
}

extension NSView {
    func findWebView() -> WKWebView? {
        if let webView = self as? WKWebView {
            return webView
        }
        for subview in subviews {
            if let found = subview.findWebView() {
                return found
            }
        }
        return nil
    }
}

struct TranslationMenuView: View {
    let text: String
    let onTranslate: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    
    private let languages = [
        ("English", "en"),
        ("Spanish", "es"),
        ("French", "fr"),
        ("German", "de"),
        ("Italian", "it"),
        ("Portuguese", "pt"),
        ("Chinese", "zh"),
        ("Japanese", "ja"),
        ("Korean", "ko"),
        ("Arabic", "ar"),
        ("Russian", "ru"),
        ("Hindi", "hi")
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Translate to...")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.primary)
            
            ScrollView {
                VStack(spacing: 2) {
                    ForEach(0..<languages.count, id: \.self) { index in
                        Button {
                            onTranslate(languages[index].1)
                            dismiss()
                        } label: {
                            Text(languages[index].0)
                                .font(.system(size: 12, weight: .regular))
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .frame(maxHeight: 300)
        }
        .padding(12)
        .frame(width: 180)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color(nsColor: .controlBackgroundColor))
                .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)
        )
    }
}

struct AISearchMenuView: View {
    let searchText: String
    let onSearch: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    
    private let searchOptions = [
        ("Quick Search", "Quick AI-powered search of the selected text", "bolt"),
        ("Deep Analysis", "Get an in-depth analysis of the content", "brain"),
        ("Summarize", "Get a concise summary", "text.badge.checkmark"),
        ("Explain", "Explain the concept or term", "lightbulb"),
        ("Compare", "Compare with related topics", "arrow.left.arrow.right"),
        ("Research", "Conduct comprehensive research", "magnifyingglass")
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Search with AI")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.primary)
            
            Text("Selected: \"\(searchText.prefix(30))\(searchText.count > 30 ? "..." : "")\"")
                .font(.system(size: 10, weight: .regular))
                .foregroundStyle(.secondary)
                .lineLimit(1)
            
            Divider()
            
            ForEach(0..<searchOptions.count, id: \.self) { index in
                let option = searchOptions[index]
                Button {
                    onSearch(option.0)
                    dismiss()
                } label: {
                    HStack {
                        Image(systemName: option.2)
                            .font(.system(size: 12, weight: .medium))
                            .frame(width: 16)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(option.0)
                                .font(.system(size: 12, weight: .medium))
                            Text(option.1)
                                .font(.system(size: 10, weight: .regular))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(12)
        .frame(width: 260)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color(nsColor: .controlBackgroundColor))
                .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)
        )
    }
}

@main
struct CometNativePanelsApp: App {
    @NSApplicationDelegateAdaptor(NativePanelsAppDelegate.self) private var appDelegate
    private let configuration: LaunchConfiguration
    @StateObject private var viewModel: NativePanelViewModel

    init() {
        let configuration = LaunchConfiguration.parse()
        self.configuration = configuration
        _viewModel = StateObject(wrappedValue: NativePanelViewModel(configuration: configuration))
    }

    var body: some Scene {
        WindowGroup(configuration.mode.title) {
            RootPanelView(viewModel: viewModel)
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
        .defaultSize(configuration.mode.defaultSize)
        .commands {
            CommandGroup(replacing: .newItem) { }
            CommandGroup(after: .appInfo) {
                Menu("Comet Settings") {
                    Section("AI Providers") {
                        Button("OpenAI API Key") {
                            viewModel.openSettings(target: "openai")
                        }
                        Button("Anthropic API Key") {
                            viewModel.openSettings(target: "anthropic")
                        }
                        Button("Google Gemini API Key") {
                            viewModel.openSettings(target: "gemini")
                        }
                        Button("Ollama Models") {
                            viewModel.openSettings(target: "ollama")
                        }
                    }
                    Section("Appearance") {
                        Button("Theme & Colors") {
                            viewModel.openSettings(target: "appearance")
                        }
                        Button("Sidebar Layout") {
                            viewModel.openSettings(target: "layout")
                        }
                    }
                    Section("Automation") {
                        Button("Permissions & Safety") {
                            viewModel.openSettings(target: "permissions")
                        }
                        Button("Scheduled Tasks") {
                            viewModel.openSettings(target: "automation")
                        }
                    }
                    Section("Sync & Connect") {
                        Button("WiFi Sync Settings") {
                            viewModel.openSettings(target: "sync")
                        }
                        Button("Mobile App Setup") {
                            viewModel.openSettings(target: "mobile")
                        }
                    }
                    Divider()
                    Button("All Settings...") {
                        viewModel.openSettings(target: "all")
                    }
                }
                .keyboardShortcut(",", modifiers: .command)
            }
        }
    }
}
