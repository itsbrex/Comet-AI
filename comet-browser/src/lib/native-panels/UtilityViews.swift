import SwiftUI

struct DownloadsPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel

    var body: some View {
        let palette = PanelPalette(appearance: viewModel.state.themeAppearance)
        PanelShell(mode: .downloads, viewModel: viewModel) {
            VStack(alignment: .leading, spacing: 18) {
                PanelHeader(
                    title: "Downloads",
                    subtitle: "Recent browser downloads.",
                    symbol: PanelMode.downloads.symbol,
                    viewModel: viewModel
                )
                .padding(18)

                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        let downloads = viewModel.state.downloads ?? []
                        if downloads.isEmpty {
                            EmptyStateCard(title: "No downloads", description: "Completed downloads will show up here.", appearance: viewModel.state.themeAppearance)
                        }
                        ForEach(downloads) { item in
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    Text(item.name)
                                        .font(.system(size: 13, weight: .bold, design: .rounded))
                                        .lineLimit(1)
                                    Spacer()
                                    StatusPill(text: item.status.uppercased(), color: .blue.opacity(0.3))
                                }
                                if let progress = item.progress {
                                    ProgressView(value: progress, total: 100)
                                        .tint(palette.accent)
                                }
                                HStack {
                                    Button("Open") { viewModel.openDownload(path: item.path) }
                                        .buttonStyle(.plain)
                                        .padding(.horizontal, 10).padding(.vertical, 5)
                                        .background(palette.accent.opacity(0.2)).clipShape(Capsule())
                                    
                                    Button("Show in Finder") { viewModel.revealDownload(path: item.path) }
                                        .buttonStyle(.plain)
                                        .padding(.horizontal, 10).padding(.vertical, 5)
                                        .background(Color.white.opacity(0.1)).clipShape(Capsule())
                                }
                            }
                            .padding(14)
                            .background(palette.mutedSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
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
                    title: "Clipboard History",
                    subtitle: "Sync across devices and browser.",
                    symbol: PanelMode.clipboard.symbol,
                    viewModel: viewModel
                )
                .padding(18)

                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        let items = viewModel.state.clipboardItems ?? []
                        if items.isEmpty {
                            EmptyStateCard(title: "Clipboard empty", description: "Copied items will appear here.", appearance: viewModel.state.themeAppearance)
                        }
                        ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                            Button {
                                viewModel.copyClipboardItem(item)
                            } label: {
                                Text(item)
                                    .font(.system(size: 11, design: .monospaced))
                                    .padding(12)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(palette.mutedSurface)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                            .buttonStyle(.plain)
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
    
    var body: some View {
        PanelShell(mode: .permissions, viewModel: viewModel) {
            VStack(alignment: .leading, spacing: 18) {
                PanelHeader(
                    title: "Approvals",
                    subtitle: "Review pending shell and system actions.",
                    symbol: PanelMode.permissions.symbol,
                    viewModel: viewModel
                )
                .padding(18)

                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        if let approval = viewModel.state.pendingApproval {
                            VStack(alignment: .leading, spacing: 14) {
                                Text(approval.command)
                                    .font(.system(size: 14, weight: .bold, design: .monospaced))
                                    .padding(12)
                                    .background(Color.red.opacity(0.1))
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                
                                Text(approval.reason)
                                    .font(.system(size: 12))
                                    .foregroundStyle(.secondary)
                                
                                HStack(spacing: 12) {
                                    Button("Allow") { viewModel.respondToApproval(approval.requestId, allowed: true) }
                                        .keyboardShortcut(.defaultAction)
                                    Button("Deny") { viewModel.respondToApproval(approval.requestId, allowed: false) }
                                        .foregroundStyle(.red)
                                }
                            }
                            .padding(18)
                            .background(PanelPalette(appearance: viewModel.state.themeAppearance).mutedSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 20))
                        } else {
                            EmptyStateCard(title: "No pending requests", description: "Safe and secure execution of system commands.", appearance: viewModel.state.themeAppearance)
                        }
                    }
                    .padding(18)
                }
            }
        }
    }
}
