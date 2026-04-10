import SwiftUI

struct CommandCenterPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel

    var body: some View {
        let palette = PanelPalette(appearance: viewModel.state.themeAppearance)
        PanelShell(mode: .menu, viewModel: viewModel) {
            VStack(alignment: .leading, spacing: 20) {
                PanelHeader(
                    title: "Command Center",
                    subtitle: "Launch native tools and system automations.",
                    symbol: PanelMode.menu.symbol,
                    viewModel: viewModel
                )
                .padding(18)

                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("QUICK TOOLS")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(palette.secondaryText)
                                .tracking(1.2)
                            
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                                MainToolButton(title: "AI Sidebar", subtitle: "Floating Assistant", systemImage: "sparkles.rectangle.stack", appearance: viewModel.state.themeAppearance) {
                                    viewModel.openPanel(.sidebar)
                                }
                                MainToolButton(title: "Action Chain", subtitle: "Automation Feed", systemImage: "point.3.filled.connected.trianglepath.dotted", appearance: viewModel.state.themeAppearance) {
                                    viewModel.openPanel(.actionChain)
                                }
                                MainToolButton(title: "Downloads", subtitle: "Native File List", systemImage: "arrow.down.circle", appearance: viewModel.state.themeAppearance) {
                                    viewModel.openPanel(.downloads)
                                }
                                MainToolButton(title: "Clipboard", subtitle: "Copy History", systemImage: "doc.on.clipboard", appearance: viewModel.state.themeAppearance) {
                                    viewModel.openPanel(.clipboard)
                                }
                            }
                        }

                        VStack(alignment: .leading, spacing: 12) {
                            Text("INTELLIGENCE HUB")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(palette.secondaryText)
                                .tracking(1.2)
                            
                            HStack(spacing: 12) {
                                MainToolButton(title: "Smart Summary", subtitle: "Apple Intelligence", systemImage: "text.badge.checkmark", appearance: viewModel.state.themeAppearance) {
                                    viewModel.openPanel(.appleSummary)
                                }
                                MainToolButton(title: "Image Playground", subtitle: "Generative AI", systemImage: "wand.and.stars", appearance: viewModel.state.themeAppearance) {
                                    viewModel.openPanel(.appleImage)
                                }
                            }
                        }
                    }
                    .padding(18)
                }
            }
        }
    }
}

struct MainToolButton: View {
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
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(palette.accent)
                    .frame(width: 36, height: 36)
                    .background(palette.accent.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                
                Text(title)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(palette.primaryText)
                
                Text(subtitle)
                    .font(.system(size: 10))
                    .foregroundStyle(palette.secondaryText)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(palette.mutedSurface)
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(palette.border, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}
