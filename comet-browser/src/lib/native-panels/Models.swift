import SwiftUI
import Foundation

enum PanelMode: String, CaseIterable {
    case sidebar
    case actionChain = "action-chain"
    case menu
    case settings
    case downloads
    case clipboard
    case permissions
    case appleIntelligence = "apple-intelligence"
    case appleSummary = "apple-summary"
    case appleImage = "apple-image"

    var title: String {
        switch self {
        case .sidebar: return "Comet AI Sidebar"
        case .actionChain: return "Comet Action Chain"
        case .menu: return "Comet Command Center"
        case .settings: return "Comet Settings"
        case .downloads: return "Comet Downloads"
        case .clipboard: return "Comet Clipboard"
        case .permissions: return "Comet Approval"
        case .appleIntelligence: return "Apple Intelligence"
        case .appleSummary: return "Apple Summary"
        case .appleImage: return "Apple Image Playground"
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
        case .appleIntelligence: return "apple.intelligence"
        case .appleSummary: return "text.badge.checkmark"
        case .appleImage: return "wand.and.stars"
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
        case .appleIntelligence: return CGSize(width: 440, height: 650)
        case .appleSummary: return CGSize(width: 500, height: 400)
        case .appleImage: return CGSize(width: 400, height: 500)
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
