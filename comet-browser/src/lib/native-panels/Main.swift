import SwiftUI
import AppKit

@main
struct CometNativePanelsApp: App {
    @NSApplicationDelegateAdaptor(NativePanelsAppDelegate.self) var appDelegate
    @StateObject private var viewModel: NativePanelViewModel
    let configuration: LaunchConfiguration

    init() {
        let config = LaunchConfiguration.parse()
        self.configuration = config
        self._viewModel = StateObject(wrappedValue: NativePanelViewModel(configuration: config))
    }

    var body: some Scene {
        WindowGroup {
            RootPanelView(viewModel: viewModel)
                .background(WindowConfigurator(
                    mode: configuration.mode,
                    compactSidebar: viewModel.compactSidebar,
                    iconPath: configuration.iconPath
                ))
        }
        .windowStyle(.hiddenTitleBar)
    }
}

struct RootPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel

    var body: some View {
        Group {
            switch viewModel.configuration.mode {
            case .sidebar:
                SidebarPanelView(viewModel: viewModel)
            case .actionChain:
                ActionChainPanelView(viewModel: viewModel)
            case .menu:
                CommandCenterPanelView(viewModel: viewModel)
            case .settings:
                NativeSettingsPanelView(viewModel: viewModel)
            case .downloads:
                DownloadsPanelView(viewModel: viewModel)
            case .clipboard:
                ClipboardPanelView(viewModel: viewModel)
            case .permissions:
                PermissionsPanelView(viewModel: viewModel)
            case .appleIntelligence:
                AppleIntelligencePanelView(viewModel: viewModel)
            case .appleSummary:
                AppleSummaryPanelView(viewModel: viewModel)
            case .appleImage:
                AppleImagePanelView(viewModel: viewModel)
            }
        }
        .frame(minWidth: 100, minHeight: 100)
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
        window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .transient]
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
