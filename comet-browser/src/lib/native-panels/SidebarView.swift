import SwiftUI

struct SidebarPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel
    @State private var scrollProxy: ScrollViewProxy?
    
    var body: some View {
        let palette = PanelPalette(
            appearance: viewModel.state.themeAppearance,
            gradientPreset: viewModel.state.preferences?.sidebarGradientPreset
        )
        
        PanelShell(mode: .sidebar, viewModel: viewModel) {
            VStack(spacing: 0) {
                // Header
                headerView(palette: palette)
                    .padding(.horizontal, 18)
                    .padding(.top, 10)
                    .padding(.bottom, 14)
                
                if viewModel.compactSidebar {
                    compactStateView(palette: palette)
                } else {
                    fullContentView(palette: palette)
                }
            }
        }
    }
    
    @ViewBuilder
    private func headerView(palette: PanelPalette) -> some View {
        HStack {
            HStack(spacing: 12) {
                Image(systemName: "sparkles")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(palette.accent)
                
                VStack(alignment: .leading, spacing: 1) {
                    Text("Comet Assistant")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(palette.primaryText)
                    
                    HStack(spacing: 4) {
                        Circle()
                            .fill(viewModel.isConnected ? Color.green : Color.orange)
                            .frame(width: 6, height: 6)
                        Text(viewModel.statusText)
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(palette.secondaryText)
                    }
                }
            }
            
            Spacer()
            
            HStack(spacing: 8) {
                if viewModel.state.preferences?.sidebarShowActionChainButton ?? true {
                    SidebarGlyphButton(
                        systemImage: PanelMode.actionChain.symbol,
                        accessibilityLabel: "Action Chain",
                        appearance: viewModel.state.themeAppearance,
                        gradientPreset: viewModel.state.preferences?.sidebarGradientPreset
                    ) {
                        viewModel.openPanel(.actionChain)
                    }
                }
                
                if viewModel.state.preferences?.sidebarShowCommandCenterButton ?? true {
                    SidebarGlyphButton(
                        systemImage: PanelMode.menu.symbol,
                        accessibilityLabel: "Command Center",
                        appearance: viewModel.state.themeAppearance,
                        gradientPreset: viewModel.state.preferences?.sidebarGradientPreset
                    ) {
                        viewModel.openPanel(.menu)
                    }
                }
            }
        }
    }
    
    @ViewBuilder
    private func compactStateView(palette: PanelPalette) -> some View {
        Button {
            withAnimation(.spring()) {
                viewModel.compactSidebar = false
            }
        } label: {
            HStack {
                Text("Comet is idle. Click to expand.")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(palette.secondaryText)
                Spacer()
                Image(systemName: "arrow.up.left.and.arrow.down.right")
                    .font(.system(size: 12))
                    .foregroundStyle(palette.accent)
            }
            .padding(16)
            .background(palette.mutedSurface)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .padding(18)
        }
        .buttonStyle(.plain)
    }
    
    @ViewBuilder
    private func fullContentView(palette: PanelPalette) -> some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if let tags = viewModel.state.activityTags, !tags.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(tags, id: \.self) { tag in
                                    SidebarTagChip(text: tag, appearance: viewModel.state.themeAppearance, gradientPreset: viewModel.state.preferences?.sidebarGradientPreset)
                                }
                            }
                            .padding(.horizontal, 18)
                        }
                    }
                    
                    if viewModel.state.messages.isEmpty {
                        EmptyStateCard(
                            title: "How can Comet help you today?",
                            description: "Ask about current page content, run automations, or generate files using AI directly from your Mac.",
                            appearance: viewModel.state.themeAppearance
                        )
                        .padding(.horizontal, 18)
                    }
                    
                    LazyVStack(spacing: 16) {
                        ForEach(viewModel.state.messages) { message in
                            MessageBubbleView(
                                message: message,
                                appearance: viewModel.state.themeAppearance,
                                animateContent: message.id == viewModel.state.messages.last?.id && viewModel.state.isLoading
                            )
                            .id(message.id)
                        }
                    }
                    .padding(.horizontal, 14)
                    
                    if let conversations = viewModel.state.conversations, !conversations.isEmpty, viewModel.state.preferences?.sidebarShowSessions ?? true {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Recent Conversations")
                                .font(.system(size: 11, weight: .bold, design: .rounded))
                                .foregroundStyle(palette.secondaryText)
                                .padding(.horizontal, 18)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(conversations) { session in
                                        Button {
                                            viewModel.conversationAction("switch", id: session.id)
                                        } label: {
                                            SessionChipView(
                                                title: session.title,
                                                updatedAt: session.updatedAt,
                                                isActive: session.id == viewModel.state.activeConversationId,
                                                appearance: viewModel.state.themeAppearance,
                                                gradientPreset: viewModel.state.preferences?.sidebarGradientPreset
                                            )
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                                .padding(.horizontal, 18)
                            }
                        }
                        .padding(.top, 10)
                    }
                }
                .padding(.vertical, 10)
            }
            .onAppear { scrollProxy = proxy }
            .onChange(of: viewModel.state.messages.count) { _ in
                if let lastId = viewModel.state.messages.last?.id {
                    withAnimation {
                        proxy.scrollTo(lastId, anchor: .bottom)
                    }
                }
            }
        }
        
        // Composer
        composerView(palette: palette)
            .padding(14)
            .background(
                palette.mutedSurface.opacity(0.8)
                    .background(.ultraThinMaterial)
            )
    }
    
    @ViewBuilder
    private func composerView(palette: PanelPalette) -> some View {
        VStack(spacing: 12) {
            TextField("Ask Comet anything...", text: $viewModel.promptText)
                .textFieldStyle(.plain)
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .padding(14)
                .background(palette.isDark ? Color.white.opacity(0.05) : Color.black.opacity(0.03))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(palette.border, lineWidth: 1)
                )
                .onSubmit { viewModel.sendPrompt() }
            
            HStack {
                Button {
                    viewModel.conversationAction("new")
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(palette.secondaryText)
                }
                .buttonStyle(.plain)
                .help("New Chat")
                
                Spacer()
                
                Button {
                    viewModel.openPanel(.menu)
                } label: {
                    Image(systemName: "square.grid.2x2.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(palette.secondaryText)
                }
                .buttonStyle(.plain)
                .help("Command Center")
                
                Spacer()
                
                Button {
                    viewModel.sendPrompt()
                } label: {
                    HStack(spacing: 8) {
                        Text("Send")
                        Image(systemName: "paperplane.fill")
                    }
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(palette.accent)
                    .clipShape(Capsule())
                    .shadow(color: palette.accent.opacity(0.3), radius: 8, x: 0, y: 4)
                }
                .buttonStyle(.plain)
                .disabled(viewModel.promptText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
    }
}
