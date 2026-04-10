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
        .commands {
            CommandMenu("Comet") {
                Button("New Conversation") {
                    viewModel.conversationAction("new")
                }
                .keyboardShortcut("n", modifiers: [.command])

                Button("Open Sidebar") {
                    viewModel.openPanel(.sidebar)
                }
                .keyboardShortcut("1", modifiers: [.command])

                Button("Open Command Center") {
                    viewModel.openPanel(.menu)
                }
                .keyboardShortcut("k", modifiers: [.command])

                Button("Open Action Chain") {
                    viewModel.openPanel(.actionChain)
                }
                .keyboardShortcut("a", modifiers: [.command, .shift])

                Divider()

                Button("Settings") {
                    viewModel.openPanel(.settings)
                }
                .keyboardShortcut(",", modifiers: [.command])

                Button("Focus Browser") {
                    viewModel.focusBrowser()
                }
                .keyboardShortcut("b", modifiers: [.command, .option])
            }
        }
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
            }
        }
        .frame(minWidth: 100, minHeight: 100)
    }
}

