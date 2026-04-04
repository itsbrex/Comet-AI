import SwiftUI
import AppKit
import Foundation
import QuartzCore

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
    struct Message: Codable, Identifiable {
        let id: String
        let role: String
        let content: String
        let timestamp: Double?
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
            sidebarShowActionChainButton: true
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
            pendingApproval: nil
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
        Task {
            isSending = true
            defer { isSending = false }
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/prompt", body: [
                    "prompt": trimmed,
                    "source": "swiftui-sidebar"
                ])
                promptText = ""
                statusText = "Sent to Comet"
            } catch {
                statusText = "Send failed"
            }
        }
    }

    func openPanel(_ mode: PanelMode) {
        recordInteraction()
        Task {
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/panels/open", body: ["mode": mode.rawValue])
            } catch {
                statusText = "Unable to open panel"
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

    func respondToApproval(_ requestId: String, allowed: Bool) {
        recordInteraction()
        Task {
            do {
                _ = try await sendJSONRequest(path: "/native-mac-ui/approval/respond", body: [
                    "requestId": requestId,
                    "allowed": allowed
                ])
                statusText = allowed ? "Approved" : "Denied"
                await refreshState()
            } catch {
                statusText = "Approval failed"
            }
        }
    }

    private func startPolling() {
        pollTask?.cancel()
        pollTask = Task {
            while !Task.isCancelled {
                await refreshState()
                try? await Task.sleep(nanoseconds: 850_000_000)
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
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.isMovableByWindowBackground = true
        window.level = .floating
        window.collectionBehavior = [.fullScreenAuxiliary, .moveToActiveSpace]
        window.backgroundColor = .clear
        window.isOpaque = false
        window.hasShadow = true
        window.styleMask.insert(.fullSizeContentView)
        window.styleMask.insert(.resizable)
        window.toolbarStyle = .unifiedCompact
        window.titlebarSeparatorStyle = .none
        let targetSize = resolvedSize
        window.minSize = NSSize(width: targetSize.width, height: targetSize.height)
        if window.contentLayoutRect.size != NSSize(width: targetSize.width, height: targetSize.height) {
            NSAnimationContext.runAnimationGroup { context in
                context.duration = 0.32
                context.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
                window.animator().setContentSize(NSSize(width: targetSize.width, height: targetSize.height))
            }
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
            .padding(mode == .sidebar ? 0 : 14)
        }
        .background(WindowConfigurator(mode: mode, compactSidebar: viewModel.compactSidebar, iconPath: viewModel.configuration.iconPath))
        .preferredColorScheme(viewModel.themeColorScheme)
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
        let visibleMessages = Array(viewModel.state.messages.suffix(viewModel.compactSidebar ? 4 : 16))
        let activityTags = Array((viewModel.state.activityTags ?? []).prefix(6))
        let conversations = Array((viewModel.state.conversations ?? []).sorted(by: { $0.updatedAt > $1.updatedAt }).prefix(8))
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
                                MessageBubbleView(message: message, appearance: viewModel.state.themeAppearance)
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
        let last = viewModel.state.messages.last
        return "\(last?.id ?? "empty")-\(last?.content.count ?? 0)-\(viewModel.state.isLoading)"
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
        PanelShell(mode: .settings, viewModel: viewModel) {
            VStack(alignment: .leading, spacing: 18) {
                PanelHeader(
                    title: "Native macOS Settings",
                    subtitle: "Choose whether each major Comet surface uses Electron or detached SwiftUI.",
                    symbol: PanelMode.settings.symbol,
                    viewModel: viewModel
                )
                .padding(18)

                ScrollView {
                    VStack(spacing: 14) {
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
                        TogglePreferenceCard(title: "Auto-Minimize Sidebar", subtitle: "Shrink the detached AI sidebar into a compact shell when it has been idle for a while.", value: prefs.sidebarAutoMinimize ?? false, appearance: viewModel.state.themeAppearance) { value in
                            viewModel.setPreference(key: "sidebarAutoMinimize", value: value)
                        }
                        SelectionPreferenceCard(
                            title: "Sidebar Gradient",
                            subtitle: "Tune the native sidebar chrome with a premium gradient preset.",
                            current: prefs.sidebarGradientPreset ?? "graphite",
                            options: [("graphite", "Graphite"), ("ocean", "Ocean"), ("aurora", "Aurora")],
                            appearance: viewModel.state.themeAppearance
                        ) { value in
                            viewModel.setPreference(key: "sidebarGradientPreset", value: value)
                        }
                        TogglePreferenceCard(title: "Show Quick Actions", subtitle: "Display the prompt shortcut pills above the composer.", value: prefs.sidebarShowQuickActions ?? true, appearance: viewModel.state.themeAppearance) { value in
                            viewModel.setPreference(key: "sidebarShowQuickActions", value: value)
                        }
                        TogglePreferenceCard(title: "Show Sessions", subtitle: "Show recent saved chat sessions in the native sidebar.", value: prefs.sidebarShowSessions ?? true, appearance: viewModel.state.themeAppearance) { value in
                            viewModel.setPreference(key: "sidebarShowSessions", value: value)
                        }
                        TogglePreferenceCard(title: "Show Search Tags", subtitle: "Display live context tags like searched pages and read sources.", value: prefs.sidebarShowSearchTags ?? true, appearance: viewModel.state.themeAppearance) { value in
                            viewModel.setPreference(key: "sidebarShowSearchTags", value: value)
                        }
                        TogglePreferenceCard(title: "Show Command Center Button", subtitle: "Keep the Command Center launcher in the native sidebar action row.", value: prefs.sidebarShowCommandCenterButton ?? true, appearance: viewModel.state.themeAppearance) { value in
                            viewModel.setPreference(key: "sidebarShowCommandCenterButton", value: value)
                        }
                        TogglePreferenceCard(title: "Show Action Chain Button", subtitle: "Keep the Action Chain launcher visible in the native sidebar action row.", value: prefs.sidebarShowActionChainButton ?? true, appearance: viewModel.state.themeAppearance) { value in
                            viewModel.setPreference(key: "sidebarShowActionChainButton", value: value)
                        }

                        HStack(spacing: 10) {
                            NativeActionButton(title: "Open Downloads", systemImage: PanelMode.downloads.symbol, appearance: viewModel.state.themeAppearance) {
                                viewModel.openPanel(.downloads)
                            }
                            NativeActionButton(title: "Open Clipboard", systemImage: PanelMode.clipboard.symbol, appearance: viewModel.state.themeAppearance) {
                                viewModel.openPanel(.clipboard)
                            }
                        }
                    }
                    .padding(18)
                }
            }
        }
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
                            ApprovalCard(approval: approval, pinText: $pinText, onAllow: {
                                viewModel.respondToApproval(approval.requestId, allowed: true)
                            }, onDeny: {
                                viewModel.respondToApproval(approval.requestId, allowed: false)
                            })
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

struct ApprovalCard: View {
    let approval: NativePanelState.ApprovalState
    @Binding var pinText: String
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

            HStack(spacing: 10) {
                Button("Deny", action: onDeny)
                    .buttonStyle(.plain)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.8))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color.white.opacity(0.08))
                    .clipShape(Capsule())

                Button("Allow", action: onAllow)
                    .buttonStyle(.plain)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(.black)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(canApprove ? colorForRisk : Color.gray.opacity(0.4))
                    .clipShape(Capsule())
                    .disabled(!canApprove)
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

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 8) {
            Text(message.role == "user" ? "You" : "Comet")
                .font(.system(size: 10, weight: .black, design: .rounded))
                .foregroundStyle(message.role == "user" ? palette.accent : palette.secondaryAccent)
                .textCase(.uppercase)
            MarkdownMessageText(content: message.content, appearance: appearance)
        }
        .padding(14)
        .background(message.role == "user" ? palette.accent.opacity(0.12) : palette.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

struct MarkdownMessageText: View {
    let content: String
    let appearance: String

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        Group {
            if let attributed = markdown {
                Text(attributed)
                    .font(.system(size: 13, design: .rounded))
            } else {
                Text(content)
                    .font(.system(size: 13, design: .rounded))
            }
        }
        .foregroundStyle(palette.primaryText)
        .frame(maxWidth: .infinity, alignment: .leading)
        .textSelection(.enabled)
    }

    private var markdown: AttributedString? {
        try? AttributedString(
            markdown: content,
            options: AttributedString.MarkdownParsingOptions(interpretedSyntax: .full)
        )
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
        scrollView.borderType = .noBorder

        let textView = PromptEditorTextView()
        textView.delegate = context.coordinator
        textView.isRichText = false
        textView.importsGraphics = false
        textView.drawsBackground = false
        textView.font = NSFont.systemFont(ofSize: 13, weight: .medium)
        textView.textContainerInset = NSSize(width: 6, height: 8)
        textView.onSubmit = onSubmit
        textView.onInteraction = onInteraction
        scrollView.documentView = textView
        return scrollView
    }

    func updateNSView(_ nsView: NSScrollView, context: Context) {
        guard let textView = nsView.documentView as? PromptEditorTextView else { return }
        if textView.string != text {
            textView.string = text
        }
        textView.textColor = appearance == "light" ? .labelColor : .white
        textView.insertionPointColor = appearance == "light" ? .labelColor : .white
        textView.onSubmit = onSubmit
        textView.onInteraction = onInteraction
        nsView.backgroundColor = .clear
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
        super.mouseDown(with: event)
    }

    override func becomeFirstResponder() -> Bool {
        onInteraction?()
        return super.becomeFirstResponder()
    }
}

struct RootPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel

    var body: some View {
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
        .windowResizability(.contentSize)
        .defaultSize(configuration.mode.defaultSize)
        .commands {
            CommandGroup(replacing: .newItem) { }
        }
    }
}
