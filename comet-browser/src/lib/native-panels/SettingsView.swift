import SwiftUI

struct NativeSettingsPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel
    
    var body: some View {
        let palette = PanelPalette(appearance: viewModel.state.themeAppearance)
        let prefs = viewModel.state.preferences ?? .defaults
        
        PanelShell(mode: .settings, viewModel: viewModel) {
            VStack(alignment: .leading, spacing: 18) {
                PanelHeader(
                    title: "Native Settings",
                    subtitle: "Configure the detached SwiftUI assistant experience.",
                    symbol: PanelMode.settings.symbol,
                    viewModel: viewModel
                )
                .padding(18)
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        // Section: Core Modes
                        VStack(alignment: .leading, spacing: 12) {
                            Text("INTERFACE PREFERENCES")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(palette.secondaryText)
                                .tracking(1.2)
                            
                            PreferenceCard(title: "AI Sidebar", subtitle: "Detach assistant from browser", current: prefs.sidebarMode, appearance: viewModel.state.themeAppearance) { val in
                                viewModel.setPreference(key: "sidebarMode", value: val)
                            }
                            PreferenceCard(title: "Action Chain", subtitle: "Watch multi-step execution", current: prefs.actionChainMode, appearance: viewModel.state.themeAppearance) { val in
                                viewModel.setPreference(key: "actionChainMode", value: val)
                            }
                        }
                        
                        // Section: Appearance
                        VStack(alignment: .leading, spacing: 12) {
                            Text("SIDEBAR THEME")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(palette.secondaryText)
                                .tracking(1.2)
                            
                            SelectionPreferenceCard(
                                title: "Gradient Preset",
                                subtitle: "Select a premium visual theme.",
                                current: prefs.sidebarGradientPreset ?? "graphite",
                                options: [
                                    ("graphite", "Graphite"), 
                                    ("crystal", "Crystal"), 
                                    ("obsidian", "Obsidian"), 
                                    ("azure", "Azure"), 
                                    ("rose", "Rose Quartz"),
                                    ("liquidGlass", "Glass")
                                ],
                                appearance: viewModel.state.themeAppearance
                            ) { val in
                                viewModel.setPreference(key: "sidebarGradientPreset", value: val)
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("CUSTOM THEMES")
                                    .font(.system(size: 10, weight: .semibold))
                                    .foregroundStyle(palette.secondaryText)
                                    .tracking(1.2)
                                
                                Button {
                                    // Custom theme logic
                                } label: {
                                    HStack {
                                        Image(systemName: "paintpalette.fill")
                                        Text("Create Custom Theme")
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                    }
                                    .font(.system(size: 13, weight: .bold, design: .rounded))
                                    .padding(14)
                                    .background(palette.mutedSurface)
                                    .clipShape(RoundedRectangle(cornerRadius: 14))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(18)
                }
            }
        }
    }
}
